import { addHours } from "date-fns";
import { LeadStage, LeadHistoryAction, LeadStatus, NotificationModule, NotificationType, TaskPriority, TaskStatus, } from "@prisma/client";
import prisma from "../../db/client.js";
import { NotificationService } from "../notifications/notification.service.js";
const FOLLOW_UP_WINDOWS = {
    NEW: 6,
    CONTACTED: 12,
    QUALIFIED: 24,
    ENGAGED: 24,
    PROPOSAL_SENT: 48,
    NEGOTIATION: 24,
    READY_TO_CONVERT: 12,
    CONVERTED: 0,
    ARCHIVED: 0,
};
const PRIORITY_MAP = {
    LOW: TaskPriority.LOW,
    MEDIUM: TaskPriority.MEDIUM,
    HIGH: TaskPriority.HIGH,
};
export class LeadAutomationService {
    static async recordHistory(params) {
        const { leadId, action, actorId, fromStage, toStage, note, metadata } = params;
        await prisma.leadHistory.create({
            data: {
                leadId,
                action,
                fromStage,
                toStage,
                actorId,
                note,
                metadata: metadata ? metadata : undefined,
            },
        });
    }
    static nextFollowUp(stage) {
        const hours = FOLLOW_UP_WINDOWS[stage] ?? 24;
        if (!hours) {
            return null;
        }
        return addHours(new Date(), hours);
    }
    static async handleStageChange(params) {
        const { lead, actorId, nextStage, note } = params;
        const followUpAt = this.nextFollowUp(nextStage);
        await this.recordHistory({
            leadId: lead.id,
            action: LeadHistoryAction.STAGE_CHANGED,
            actorId,
            fromStage: lead.stage,
            toStage: nextStage,
            note,
        });
        const updateData = {
            where: { id: lead.id },
            data: {
                stage: nextStage,
                nextFollowUpAt: followUpAt ?? null,
                status: nextStage === LeadStage.CONVERTED
                    ? LeadStatus.CONVERTED
                    : nextStage === LeadStage.ARCHIVED
                        ? LeadStatus.ARCHIVED
                        : LeadStatus.ACTIVE,
            },
        };
        if (nextStage === LeadStage.CONVERTED) {
            updateData.data.convertedAt = new Date();
        }
        if (nextStage === LeadStage.ARCHIVED) {
            updateData.data.archivedAt = new Date();
        }
        await prisma.lead.update(updateData);
        if (followUpAt && lead.assignedToUserId) {
            await this.createFollowUpTask({
                leadId: lead.id,
                dueDate: followUpAt,
                actorId: actorId ?? lead.createdBy,
                stage: nextStage,
            });
        }
        await NotificationService.sendNotification({
            module: NotificationModule.LEAD,
            type: NotificationType.INFO,
            title: `Lead "${lead.fullName}" moved to ${nextStage.replaceAll("_", " ")}`,
            message: `Stage updated by ${actorId ? "a team member" : "system"}.`,
            resourceId: lead.id,
            resourceType: "lead",
            targets: {
                userIds: lead.assignedToUserId ? [lead.assignedToUserId] : undefined,
                roleNames: ["MANAGER"],
            },
        });
        await this.refreshMetrics();
    }
    static async createFollowUpTask(params) {
        const { leadId, dueDate, actorId, stage } = params;
        const lead = await prisma.lead.findUnique({
            where: { id: leadId },
            include: {
                assignedToUser: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        employee: { select: { id: true } },
                    },
                },
            },
        });
        if (!lead)
            return;
        const createdBy = actorId ?? lead.createdBy;
        const task = await prisma.task.create({
            data: {
                title: `Follow up: ${lead.fullName}`,
                description: `Automated follow-up for lead currently in ${stage.replaceAll("_", " ").toLowerCase()} stage.`,
                priority: PRIORITY_MAP[lead.priority] ?? TaskPriority.MEDIUM,
                status: TaskStatus.TODO,
                dueDate,
                createdBy,
                tags: ["lead", stage.toLowerCase(), lead.priority.toLowerCase()],
            },
        });
        if (lead.assignedToUser?.employee?.id) {
            await prisma.taskAssignment.create({
                data: {
                    taskId: task.id,
                    employeeId: lead.assignedToUser.employee.id,
                    assignedBy: createdBy,
                },
            });
        }
        await prisma.leadTask.create({
            data: {
                leadId: lead.id,
                taskId: task.id,
            },
        });
        if (lead.assignedToUserId) {
            await NotificationService.sendNotification({
                module: NotificationModule.LEAD,
                type: NotificationType.INFO,
                title: `Follow-up task created`,
                message: `A follow-up task for ${lead.fullName} is due ${dueDate.toLocaleString()}.`,
                resourceId: lead.id,
                resourceType: "lead",
                targets: {
                    userIds: [lead.assignedToUserId],
                },
            });
        }
    }
    static async sendAssignmentNotification(params) {
        const { leadId, assignedToUserId, actorId } = params;
        if (!assignedToUserId) {
            return;
        }
        const lead = await prisma.lead.findUnique({ where: { id: leadId } });
        if (!lead)
            return;
        await NotificationService.sendNotification({
            module: NotificationModule.LEAD,
            type: NotificationType.INFO,
            title: `New lead assigned`,
            message: `${lead.fullName} has been assigned to you${actorId ? " for follow-up" : ""}.`,
            resourceId: lead.id,
            resourceType: "lead",
            targets: {
                userIds: [assignedToUserId],
            },
            actorId,
        });
    }
    static async flagOverdueFollowUps() {
        const now = new Date();
        const overdueLeads = await prisma.lead.findMany({
            where: {
                status: LeadStatus.ACTIVE,
                nextFollowUpAt: { not: null, lt: now },
                assignedToUserId: { not: null },
            },
            take: 50,
        });
        for (const lead of overdueLeads) {
            const alreadyEscalated = await prisma.leadHistory.findFirst({
                where: {
                    leadId: lead.id,
                    action: "CONTACT_ATTEMPT",
                    createdAt: {
                        gte: lead.nextFollowUpAt ?? lead.updatedAt,
                    },
                },
            });
            if (alreadyEscalated)
                continue;
            await this.recordHistory({
                leadId: lead.id,
                action: LeadHistoryAction.CONTACT_ATTEMPT,
                note: "Escalation triggered because follow-up window elapsed",
            });
            await NotificationService.sendNotification({
                module: NotificationModule.LEAD,
                type: NotificationType.WARNING,
                title: `Follow-up overdue`,
                message: `${lead.fullName} has not been contacted on time.`,
                resourceId: lead.id,
                resourceType: "lead",
                targets: {
                    userIds: [lead.assignedToUserId],
                    roleNames: ["MANAGER"],
                },
            });
        }
    }
    static async refreshMetrics() {
        const [stageCounts, sourceCounts, totalLeads, convertedLeads] = await Promise.all([
            prisma.lead.groupBy({
                by: ["stage"],
                _count: { _all: true },
            }),
            prisma.lead.groupBy({
                by: ["source"],
                _count: { _all: true },
                where: { source: { not: null } },
            }),
            prisma.lead.count(),
            prisma.lead.count({ where: { status: LeadStatus.CONVERTED } }),
        ]);
        await prisma.leadMetrics.deleteMany({ where: { scope: "GLOBAL" } });
        await prisma.leadMetrics.create({
            data: {
                scope: "GLOBAL",
                funnel: stageCounts.map((row) => ({ stage: row.stage, count: row._count._all })),
                sources: sourceCounts.map((row) => ({ source: row.source, count: row._count._all })),
                totals: {
                    total: totalLeads,
                    converted: convertedLeads,
                    conversionRate: totalLeads ? convertedLeads / totalLeads : 0,
                },
                refreshedAt: new Date(),
            },
        });
    }
    static groupByStage(leads) {
        return Object.values(LeadStage).reduce((acc, stage) => {
            acc[stage] = leads.filter((lead) => lead.stage === stage);
            return acc;
        }, {});
    }
}
//# sourceMappingURL=lead.automation.js.map