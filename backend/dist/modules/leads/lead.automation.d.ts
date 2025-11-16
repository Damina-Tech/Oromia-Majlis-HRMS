import { Lead, LeadStage, LeadHistoryAction } from "@prisma/client";
export declare class LeadAutomationService {
    static recordHistory(params: {
        leadId: string;
        action: LeadHistoryAction;
        actorId?: string;
        fromStage?: LeadStage | null;
        toStage?: LeadStage | null;
        note?: string;
        metadata?: Record<string, unknown>;
    }): Promise<void>;
    static nextFollowUp(stage: LeadStage): Date | null;
    static handleStageChange(params: {
        lead: Lead;
        actorId?: string;
        nextStage: LeadStage;
        note?: string;
    }): Promise<void>;
    static createFollowUpTask(params: {
        leadId: string;
        dueDate: Date;
        actorId: string;
        stage: LeadStage;
    }): Promise<void>;
    static sendAssignmentNotification(params: {
        leadId: string;
        assignedToUserId?: string | null;
        actorId?: string;
    }): Promise<void>;
    static flagOverdueFollowUps(): Promise<void>;
    static refreshMetrics(): Promise<void>;
    static groupByStage<T extends {
        stage: LeadStage;
    }>(leads: T[]): Record<import(".prisma/client").$Enums.LeadStage, T[]>;
}
//# sourceMappingURL=lead.automation.d.ts.map