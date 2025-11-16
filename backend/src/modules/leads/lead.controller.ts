import { Request, Response } from "express";
import path from "path";
import fs from "fs/promises";
import { parse } from "csv-parse/sync";
import * as XLSX from "xlsx";
import {
  LeadStage,
  LeadHistoryAction,
  LeadStatus,
  LeadPriority,
  NotificationModule,
  NotificationType,
  Prisma,
} from "@prisma/client";
import prisma from "../../db/client.js";
import {
  CreateLeadDto,
  UpdateLeadDto,
  LeadFilterDto,
  LeadStageChangeDto,
  LeadAssignDto,
  LeadNoteDto,
  LeadDispositionDto,
  LeadKanbanQueryDto,
} from "./lead.dto.js";
import { LeadAutomationService } from "./lead.automation.js";
import { NotificationService } from "../notifications/notification.service.js";

const leadListInclude = {
  assignedToUser: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
    },
  },
  assignedDepartment: {
    select: { id: true, name: true },
  },
  disposition: true,
};

const leadDetailInclude = {
  assignedToUser: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      avatarUrl: true,
      employee: { select: { id: true, department: { select: { name: true } } } },
    },
  },
  assignedDepartment: {
    select: { id: true, name: true, managerId: true },
  },
  disposition: true,
  histories: {
    orderBy: { createdAt: "desc" as const },
    take: 25,
    include: {
      actor: { select: { id: true, firstName: true, lastName: true } },
    },
  },
  notes: {
    orderBy: { createdAt: "desc" as const },
    take: 20,
    include: {
      author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    },
  },
  taskLinks: {
    include: {
      task: {
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
        },
      },
    },
  },
} satisfies Prisma.LeadInclude;

const stageOrder: LeadStage[] = [
  LeadStage.NEW,
  LeadStage.CONTACTED,
  LeadStage.QUALIFIED,
  LeadStage.ENGAGED,
  LeadStage.PROPOSAL_SENT,
  LeadStage.NEGOTIATION,
  LeadStage.READY_TO_CONVERT,
  LeadStage.CONVERTED,
  LeadStage.ARCHIVED,
];

const CSV_HEADERS = [
  "fullName",
  "phone",
  "email",
  "location",
  "interest",
  "source",
  "companyName",
  "priority",
  "stage",
  "assignedDepartmentId",
  "assignedToUserId",
];

function getActorId(req: Request): string {
  return (req as any).user?.id;
}

function buildLeadWhere(filters: ReturnType<typeof LeadFilterDto.parse>) {
  const where: any = {};
  if (filters.search) {
    where.OR = [
      { fullName: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
      { phone: { contains: filters.search, mode: "insensitive" } },
      { companyName: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  if (filters.stage) {
    where.stage = filters.stage;
  }
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.priority) {
    where.priority = filters.priority;
  }
  if (filters.assignedToUserId) {
    where.assignedToUserId = filters.assignedToUserId;
  }
  if (filters.assignedDepartmentId) {
    where.assignedDepartmentId = filters.assignedDepartmentId;
  }
  if (filters.source) {
    where.source = { equals: filters.source };
  }
  if (filters.createdFrom || filters.createdTo) {
    where.createdAt = {};
    if (filters.createdFrom) {
      where.createdAt.gte = new Date(filters.createdFrom);
    }
    if (filters.createdTo) {
      where.createdAt.lte = new Date(filters.createdTo);
    }
  }
  if (filters.tags?.length) {
    where.tags = { hasSome: filters.tags };
  }
  return where;
}

async function findDuplicates(email?: string | null, phone?: string | null) {
  if (!email && !phone) return [];
  return prisma.lead.findMany({
    where: {
      OR: [
        email ? { email: { equals: email, mode: "insensitive" } } : undefined,
        phone ? { phone: { equals: phone } } : undefined,
      ].filter(Boolean) as any,
      status: { in: [LeadStatus.ACTIVE, LeadStatus.CONVERTED] },
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      stage: true,
      status: true,
      assignedToUserId: true,
    },
  });
}

export async function listLeads(req: Request, res: Response) {
  try {
    await LeadAutomationService.flagOverdueFollowUps();
    const filters = LeadFilterDto.parse(req.query);
    const where = buildLeadWhere(filters);
    const skip = (filters.page - 1) * filters.pageSize;
    const [items, total, stageCounts, sourceCounts] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: leadListInclude,
        orderBy: [{ stage: "asc" }, { updatedAt: "desc" }],
        skip,
        take: filters.pageSize,
      }),
      prisma.lead.count({ where }),
      prisma.lead.groupBy({
        by: ["stage"],
        where,
        _count: { _all: true },
      }),
      prisma.lead.groupBy({
        by: ["source"],
        where: { ...where, source: { not: null } },
        _count: { _all: true },
      }),
    ]);

    res.json({
      page: filters.page,
      pageSize: filters.pageSize,
      total,
      items,
      summary: {
        stageCounts: stageCounts.map((row) => ({ stage: row.stage, count: row._count._all })),
        topSources: sourceCounts
          .filter((row) => row.source)
          .sort((a, b) => b._count._all - a._count._all)
          .slice(0, 5)
          .map((row) => ({ source: row.source, count: row._count._all })),
      },
    });
  } catch (error: any) {
    console.error("Failed to list leads", error);
    res.status(500).json({ message: "Failed to load leads", error: error.message });
  }
}

export async function getLead(req: Request, res: Response) {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: req.params.id },
      include: leadDetailInclude,
    });
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }
    res.json(lead);
  } catch (error: any) {
    console.error("Failed to fetch lead", error);
    res.status(500).json({ message: "Failed to fetch lead", error: error.message });
  }
}

export async function createLead(req: Request, res: Response) {
  try {
    const actorId = getActorId(req);
    if (!actorId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const dto = CreateLeadDto.parse(req.body);

    const duplicates = await findDuplicates(dto.email, dto.phone);
    if (duplicates.length && !dto.allowDuplicate) {
      return res.status(409).json({
        message: "Possible duplicate lead detected",
        duplicates,
      });
    }

    const lead = await prisma.lead.create({
      data: {
        fullName: dto.fullName,
        phone: dto.phone,
        email: dto.email,
        location: dto.location,
        interest: dto.interest,
        source: dto.source,
        companyName: dto.companyName,
        website: dto.website,
        assignedDepartmentId: dto.assignedDepartmentId,
        assignedToUserId: dto.assignedToUserId,
        priority: dto.priority,
        stage: dto.stage,
        status: dto.status,
        tags: dto.tags ?? [],
        timezone: dto.timezone,
        potentialValue: dto.potentialValue,
        createdBy: actorId,
      },
      include: leadDetailInclude,
    });

    await LeadAutomationService.recordHistory({
      leadId: lead.id,
      action: LeadHistoryAction.CREATED,
      actorId,
      note: "Lead created manually",
    });

    if (dto.stage && dto.stage !== LeadStage.NEW) {
      await LeadAutomationService.handleStageChange({
        lead,
        actorId,
        nextStage: dto.stage,
      });
    } else {
      await LeadAutomationService.refreshMetrics();
    }

    if (lead.assignedToUserId) {
      await LeadAutomationService.sendAssignmentNotification({
        leadId: lead.id,
        assignedToUserId: lead.assignedToUserId,
        actorId,
      });
    }

    res.status(201).json(lead);
  } catch (error: any) {
    console.error("Failed to create lead", error);
    res.status(500).json({ message: "Failed to create lead", error: error.message });
  }
}

export async function updateLead(req: Request, res: Response) {
  try {
    const actorId = getActorId(req);
    if (!actorId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const dto = UpdateLeadDto.parse(req.body);
    const lead = await prisma.lead.findUnique({ where: { id: req.params.id } });
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    const data: any = {
      fullName: dto.fullName ?? undefined,
      phone: dto.phone ?? undefined,
      email: dto.email ?? undefined,
      location: dto.location ?? undefined,
      interest: dto.interest ?? undefined,
      source: dto.source ?? undefined,
      companyName: dto.companyName ?? undefined,
      website: dto.website ?? undefined,
      assignedDepartmentId: dto.assignedDepartmentId ?? undefined,
      assignedToUserId: dto.assignedToUserId ?? undefined,
      priority: dto.priority ?? undefined,
      status: dto.status ?? undefined,
      tags: dto.tags ?? undefined,
      timezone: dto.timezone ?? undefined,
      potentialValue: dto.potentialValue ?? undefined,
      lastContactedAt: dto.lastContactedAt ? new Date(dto.lastContactedAt) : undefined,
      nextFollowUpAt: dto.nextFollowUpAt ? new Date(dto.nextFollowUpAt) : undefined,
    };

    const stageChanged = dto.stage && dto.stage !== lead.stage;

    if (!stageChanged && dto.stage) {
      data.stage = dto.stage;
    }

    const updated = await prisma.lead.update({
      where: { id: lead.id },
      data,
      include: leadDetailInclude,
    });

    await LeadAutomationService.recordHistory({
      leadId: lead.id,
      action: LeadHistoryAction.UPDATED,
      actorId,
      note: "Lead details updated",
    });

    if (stageChanged && dto.stage) {
      await LeadAutomationService.handleStageChange({
        lead,
        actorId,
        nextStage: dto.stage,
      });
      const fresh = await prisma.lead.findUnique({
        where: { id: lead.id },
        include: leadDetailInclude,
      });
      return res.json(fresh);
    }

    await LeadAutomationService.refreshMetrics();
    res.json(updated);
  } catch (error: any) {
    console.error("Failed to update lead", error);
    res.status(500).json({ message: "Failed to update lead", error: error.message });
  }
}

export async function changeLeadStage(req: Request, res: Response) {
  try {
    const actorId = getActorId(req);
    if (!actorId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const dto = LeadStageChangeDto.parse(req.body);
    const lead = await prisma.lead.findUnique({ where: { id: req.params.id } });
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }
    if (lead.stage === dto.stage) {
      return res.status(200).json(lead);
    }
    await LeadAutomationService.handleStageChange({
      lead,
      actorId,
      nextStage: dto.stage,
      note: dto.note,
    });
    const refreshed = await prisma.lead.findUnique({
      where: { id: lead.id },
      include: leadDetailInclude,
    });
    res.json(refreshed);
  } catch (error: any) {
    console.error("Failed to change stage", error);
    res.status(500).json({ message: "Failed to change lead stage", error: error.message });
  }
}

export async function assignLead(req: Request, res: Response) {
  try {
    const actorId = getActorId(req);
    if (!actorId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const dto = LeadAssignDto.parse(req.body);
    const lead = await prisma.lead.findUnique({ where: { id: req.params.id } });
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    const updated = await prisma.lead.update({
      where: { id: lead.id },
      data: {
        assignedToUserId: dto.assignedToUserId,
        assignedDepartmentId: dto.assignedDepartmentId ?? lead.assignedDepartmentId,
        priority: dto.priority ?? lead.priority,
      },
      include: leadDetailInclude,
    });

    await LeadAutomationService.recordHistory({
      leadId: lead.id,
      action: LeadHistoryAction.ASSIGNED,
      actorId,
      note: `Lead assigned to user ${dto.assignedToUserId}`,
    });
    await LeadAutomationService.sendAssignmentNotification({
      leadId: lead.id,
      assignedToUserId: dto.assignedToUserId,
      actorId,
    });
    res.json(updated);
  } catch (error: any) {
    console.error("Failed to assign lead", error);
    res.status(500).json({ message: "Failed to assign lead", error: error.message });
  }
}

export async function addLeadNote(req: Request, res: Response) {
  try {
    const actorId = getActorId(req);
    if (!actorId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const dto = LeadNoteDto.parse(req.body);
    const lead = await prisma.lead.findUnique({ where: { id: req.params.id } });
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    const note = await prisma.leadNote.create({
      data: {
        leadId: lead.id,
        authorId: actorId,
        content: dto.content,
        attachments: dto.attachments,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });

    await LeadAutomationService.recordHistory({
      leadId: lead.id,
      action: LeadHistoryAction.NOTE_ADDED,
      actorId,
      note: dto.content,
    });

    if (lead.assignedToUserId && lead.assignedToUserId !== actorId) {
      await NotificationService.sendNotification({
        module: NotificationModule.LEAD,
        type: NotificationType.INFO,
        title: `New note on ${lead.fullName}`,
        message: dto.content,
        resourceId: lead.id,
        resourceType: "lead",
        actorId,
        targets: {
          userIds: [lead.assignedToUserId],
        },
      });
    }

    res.status(201).json(note);
  } catch (error: any) {
    console.error("Failed to add lead note", error);
    res.status(500).json({ message: "Failed to add lead note", error: error.message });
  }
}

export async function dispositionLead(req: Request, res: Response) {
  try {
    const actorId = getActorId(req);
    if (!actorId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const dto = LeadDispositionDto.parse(req.body);
    const lead = await prisma.lead.findUnique({ where: { id: req.params.id } });
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    await prisma.$transaction([
      prisma.leadDisposition.upsert({
        where: { leadId: lead.id },
        update: { reason: dto.reason, note: dto.note, actorId },
        create: { leadId: lead.id, reason: dto.reason, note: dto.note, actorId },
      }),
      prisma.lead.update({
        where: { id: lead.id },
        data: {
          stage: LeadStage.ARCHIVED,
          status: LeadStatus.ARCHIVED,
          archivedAt: new Date(),
        },
      }),
    ]);

    await LeadAutomationService.recordHistory({
      leadId: lead.id,
      action: LeadHistoryAction.DISPOSITIONED,
      actorId,
      note: dto.note,
      metadata: { reason: dto.reason },
    });

    await LeadAutomationService.refreshMetrics();

    res.json({ message: "Lead archived with disposition" });
  } catch (error: any) {
    console.error("Failed to disposition lead", error);
    res.status(500).json({ message: "Failed to archive lead", error: error.message });
  }
}

async function parseImportRows(file: Express.Multer.File) {
  const buffer = await fs.readFile(file.path);
  const extension = path.extname(file.originalname).toLowerCase();
  if (extension === ".csv") {
    return parse(buffer, { columns: true, skip_empty_lines: true, trim: true });
  }
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet);
}

function normalizeRow(row: Record<string, any>) {
  const normalized: Record<string, any> = {};
  for (const header of CSV_HEADERS) {
    if (row[header] !== undefined) {
      normalized[header] = row[header];
      continue;
    }
    const camelKey = header.replace(/([A-Z])/g, (g) => ` ${g}`).toLowerCase();
    const matchingKey = Object.keys(row).find(
      (key) => key.toLowerCase().replace(/\s+/g, "") === camelKey.replace(/\s+/g, "")
    );
    if (matchingKey) {
      normalized[header] = row[matchingKey];
    }
  }
  return normalized;
}

export async function importLeads(req: Request, res: Response) {
  const actorId = getActorId(req);
  if (!actorId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const file = (req as any).file as Express.Multer.File | undefined;
  if (!file) {
    return res.status(400).json({ message: "Import file is required" });
  }

  try {
    const rows = await parseImportRows(file);
    const job = await prisma.leadImportJob.create({
      data: {
        uploadedBy: actorId,
        fileUrl: `/uploads/employee-imports/${path.basename(file.path)}`,
        status: "PROCESSING",
        summary: {
          total: rows.length,
        },
      },
    });

    let created = 0;
    let duplicates = 0;
    let failed = 0;

    for (const rawRow of rows) {
      const row = normalizeRow(rawRow);
      if (!row.fullName) {
        failed++;
        continue;
      }

      const existing = await findDuplicates(row.email, row.phone);
      if (existing.length) {
        duplicates++;
        continue;
      }

      const priorityValue =
        typeof row.priority === "string"
          ? row.priority.toUpperCase().replace(/[\s-]+/g, "_")
          : undefined;
      const stageValue =
        typeof row.stage === "string" ? row.stage.toUpperCase().replace(/[\s-]+/g, "_") : undefined;
      let priority: LeadPriority | undefined;
      if (priorityValue && Object.values(LeadPriority).includes(priorityValue as LeadPriority)) {
        priority = priorityValue as LeadPriority;
      }
      let stage: LeadStage | undefined;
      if (stageValue && stageOrder.includes(stageValue as LeadStage)) {
        stage = stageValue as LeadStage;
      }
      const assignedDepartmentId =
        typeof row.assignedDepartmentId === "string" && row.assignedDepartmentId.trim().length > 0
          ? row.assignedDepartmentId.trim()
          : undefined;
      const assignedToUserId =
        typeof row.assignedToUserId === "string" && row.assignedToUserId.trim().length > 0
          ? row.assignedToUserId.trim()
          : undefined;

      try {
        await prisma.lead.create({
          data: {
            fullName: row.fullName,
            phone: row.phone,
            email: row.email,
            location: row.location,
            interest: row.interest,
            source: row.source,
            companyName: row.companyName,
            assignedDepartmentId,
            assignedToUserId,
            priority,
            stage,
            createdBy: actorId,
            importJobId: job.id,
          },
        });
        created++;
      } catch (importError) {
        console.warn("Failed to import lead row", importError);
        failed++;
      }
    }

    await prisma.leadImportJob.update({
      where: { id: job.id },
      data: {
        status: "COMPLETED",
        summary: {
          total: rows.length,
          created,
          duplicates,
          failed,
        },
        completedAt: new Date(),
      },
    });

    await LeadAutomationService.refreshMetrics();

    res.json({
      message: "Import completed",
      summary: { total: rows.length, created, duplicates, failed },
    });
  } catch (error: any) {
    console.error("Failed to import leads", error);
    res.status(500).json({ message: "Failed to import leads", error: error.message });
  }
}

export async function getLeadKanban(req: Request, res: Response) {
  try {
    const filters = LeadKanbanQueryDto.parse(req.query);
    const where: any = {
      status: { not: LeadStatus.ARCHIVED },
    };
    if (filters.assignedToUserId) {
      where.assignedToUserId = filters.assignedToUserId;
    }
    if (filters.priority) {
      where.priority = filters.priority;
    }
    const leads = await prisma.lead.findMany({
      where,
      include: leadListInclude,
      orderBy: [{ stage: "asc" }, { priority: "desc" }, { updatedAt: "desc" }],
    });
    const grouped = stageOrder.reduce<Record<string, any[]>>((acc, stage) => {
      acc[stage] = [];
      return acc;
    }, {});
    leads.forEach((lead) => {
      grouped[lead.stage].push(lead);
    });
    res.json(grouped);
  } catch (error: any) {
    console.error("Failed to load kanban", error);
    res.status(500).json({ message: "Failed to load kanban board", error: error.message });
  }
}

export async function getLeadDashboard(req: Request, res: Response) {
  try {
    await LeadAutomationService.flagOverdueFollowUps();
    const latestMetrics = await prisma.leadMetrics.findFirst({
      where: { scope: "GLOBAL" },
      orderBy: { refreshedAt: "desc" },
    });
    if (!latestMetrics) {
      await LeadAutomationService.refreshMetrics();
    }
    const metrics = latestMetrics
      ? latestMetrics
      : await prisma.leadMetrics.findFirst({
          where: { scope: "GLOBAL" },
          orderBy: { refreshedAt: "desc" },
        });
    const hotLeads = await prisma.lead.findMany({
      where: {
        status: LeadStatus.ACTIVE,
        priority: "HIGH",
      },
      include: leadListInclude,
      orderBy: { updatedAt: "desc" },
      take: 10,
    });

    res.json({
      metrics,
      hotLeads,
    });
  } catch (error: any) {
    console.error("Failed to load lead dashboard", error);
    res.status(500).json({ message: "Failed to load lead metrics", error: error.message });
  }
}

