import { Request, Response } from "express";
import { Prisma, InstitutionType, InstitutionStatus, InstitutionAuditAction } from "@prisma/client";
import prisma from "../../db/client.js";
import { z } from "zod";
import bcrypt from "bcrypt";
import {
  CreateInstitutionDto,
  PublicRegisterInstitutionDto,
  UpdateInstitutionDto,
  ApproveInstitutionDto,
  ListInstitutionsQuery,
  CreateAssignmentDto,
  UpdateAssignmentDto,
  ApproveAssignmentDto,
  ListAssignmentsQuery,
  CreateRegionDto,
  CreateZoneDto,
  CreateWoredaDto,
  CreateKebeleDto,
} from "./institution.dto.js";
import { paginate } from "../../lib/paginate.js";
import { resolveOromiaGeography } from "./oromia-geography.service.js";
import { ensureInstitutionOwnerRoleId } from "./institution-owner-role.js";
import {
  assertCanAccessInstitution,
  assertCanManageInstitution,
  getRequestUser,
  isInstitutionOwnerOnly,
} from "./institution-access.js";

function parseJsonField<T>(raw: unknown, fallback?: T): T | undefined {
  if (raw == null || raw === "") return fallback;
  if (typeof raw === "object") return raw as T;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function parseOptionalNumber(raw: unknown): number | undefined {
  if (raw == null || raw === "") return undefined;
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

function getCurrentUserId(req: Request): string {
  return (req as any).user?.id;
}

// Helper function to generate institution code
async function generateInstitutionCode(type: InstitutionType): Promise<string> {
  const prefix = type === InstitutionType.MOSQUE ? "MOS" : type === InstitutionType.MADRASAH ? "MAD" : "MAR";
  const year = new Date().getFullYear();
  
  const existingCount = await prisma.institution.count({
    where: {
      institutionCode: { startsWith: `${prefix}-${year}-` },
    },
  });
  
  const sequence = (existingCount + 1).toString().padStart(4, "0");
  return `${prefix}-${year}-${sequence}`;
}

// Helper function to create audit log
async function createAuditLog(
  institutionId: string,
  action: InstitutionAuditAction,
  actorId: string,
  entityType: string,
  entityId?: string,
  oldValue?: any,
  newValue?: any,
  description?: string
) {
  await prisma.institutionAuditLog.create({
    data: {
      institutionId,
      action,
      actorId,
      entityType,
      entityId,
      oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
      newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
      description,
    },
  });
}

// ============================================
// Geographic Hierarchy Controllers
// ============================================

export async function createRegion(req: Request, res: Response) {
  try {
    const data = CreateRegionDto.parse(req.body);
    const region = await prisma.region.create({ data });
    res.status(201).json(region);
  } catch (error: any) {
    console.error("Create region error:", error);
    res.status(400).json({ message: error.message || "Failed to create region" });
  }
}

export async function listRegions(req: Request, res: Response) {
  try {
    const regions = await prisma.region.findMany({
      include: {
        zones: {
          include: {
            woredas: {
              include: {
                kebeles: true,
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });
    res.json(regions);
  } catch (error: any) {
    console.error("List regions error:", error);
    res.status(500).json({ message: "Failed to list regions" });
  }
}

const ResolveOromiaGeographyDto = z.object({
  zoneName: z.string().min(1, "Zone is required"),
  districtName: z.string().min(1, "District is required"),
});

export async function resolveOromiaGeographyHandler(req: Request, res: Response) {
  try {
    const body = ResolveOromiaGeographyDto.parse(req.body);
    const result = await resolveOromiaGeography(body.zoneName, body.districtName);
    res.json(result);
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ message: e.issues[0]?.message ?? "Invalid input" });
    }
    const message = e instanceof Error ? e.message : "Failed to resolve geography";
    res.status(400).json({ message });
  }
}

export async function createZone(req: Request, res: Response) {
  try {
    const data = CreateZoneDto.parse(req.body);
    const zone = await prisma.zone.create({ data });
    res.status(201).json(zone);
  } catch (error: any) {
    console.error("Create zone error:", error);
    res.status(400).json({ message: error.message || "Failed to create zone" });
  }
}

export async function createWoreda(req: Request, res: Response) {
  try {
    const data = CreateWoredaDto.parse(req.body);
    const woreda = await prisma.woreda.create({ data });
    res.status(201).json(woreda);
  } catch (error: any) {
    console.error("Create woreda error:", error);
    res.status(400).json({ message: error.message || "Failed to create woreda" });
  }
}

export async function createKebele(req: Request, res: Response) {
  try {
    const data = CreateKebeleDto.parse(req.body);
    const kebele = await prisma.kebele.create({ data });
    res.status(201).json(kebele);
  } catch (error: any) {
    console.error("Create kebele error:", error);
    res.status(400).json({ message: error.message || "Failed to create kebele" });
  }
}

// ============================================
// Institution Controllers
// ============================================

export async function createInstitution(req: Request, res: Response) {
  try {
    const currentUserId = getCurrentUserId(req);
    const data = CreateInstitutionDto.parse(req.body);
    
    // Generate institution code
    const institutionCode = await generateInstitutionCode(data.type);
    
    // Prepare type-specific data
    const institutionData: Prisma.InstitutionCreateInput = {
      institutionCode,
      name: data.name,
      type: data.type,
      status: InstitutionStatus.UNDER_CONSTRUCTION, // New institutions need approval
      latitude: data.latitude ? new Prisma.Decimal(data.latitude) : null,
      longitude: data.longitude ? new Prisma.Decimal(data.longitude) : null,
      address: data.address,
      yearEstablished: data.yearEstablished,
      ownershipStatus: data.ownershipStatus,
      createdBy: { connect: { id: currentUserId } },
      mosqueData: data.mosqueData ?? undefined,
      madrasahData: data.madrasahData ?? undefined,
      markazData: data.markazData ?? undefined,
    };
    
    // Add geographic relations
    if (data.regionId) institutionData.region = { connect: { id: data.regionId } };
    if (data.zoneId) institutionData.zone = { connect: { id: data.zoneId } };
    if (data.woredaId) institutionData.woreda = { connect: { id: data.woredaId } };
    if (data.kebeleId) institutionData.kebele = { connect: { id: data.kebeleId } };
    if (data.kebeleName !== undefined) institutionData.kebeleName = data.kebeleName || null;
    
    const institution = await prisma.institution.create({
      data: institutionData,
      include: {
        region: true,
        zone: true,
        woreda: true,
        kebele: true,
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
    
    // Create audit log
    await createAuditLog(
      institution.id,
      InstitutionAuditAction.CREATED,
      currentUserId,
      "Institution",
      institution.id,
      null,
      institution,
      `Institution ${institutionCode} created`
    );
    
    res.status(201).json(institution);
  } catch (error: any) {
    console.error("Create institution error:", error);
    res.status(400).json({ message: error.message || "Failed to create institution" });
  }
}

export async function publicRegisterInstitution(req: Request, res: Response) {
  try {
    const body = req.body ?? {};
    const file = (req as any).file as Express.Multer.File | undefined;

    const payload = {
      name: body.name,
      type: body.type,
      regionId: body.regionId,
      zoneId: body.zoneId,
      woredaId: body.woredaId,
      kebeleId: body.kebeleId || undefined,
      kebeleName: body.kebeleName || undefined,
      latitude: parseOptionalNumber(body.latitude),
      longitude: parseOptionalNumber(body.longitude),
      address: body.address,
      yearEstablished: parseOptionalNumber(body.yearEstablished),
      ownershipStatus: body.ownershipStatus || undefined,
      status: body.status || undefined,
      password: body.password,
      mosqueData: parseJsonField(body.mosqueData),
      madrasahData: parseJsonField(body.madrasahData),
      markazData: parseJsonField(body.markazData),
      submitter: parseJsonField(body.submitter) ?? {
        name: body.contactName,
        phone: body.contactPhone,
        email: body.contactEmail ?? body.email,
        role: body.contactRole,
      },
    };

    const data = PublicRegisterInstitutionDto.parse(payload);
    const email = data.submitter.email.trim().toLowerCase();

    if (!file) {
      return res.status(400).json({ message: "Institution / mosque image is required" });
    }

    if (data.type === InstitutionType.MADRASAH && !data.madrasahData?.gradeLevels?.length) {
      return res.status(400).json({ message: "Select at least one Madrasah grade level" });
    }
    if (data.type === InstitutionType.MARKAZ) {
      if (!data.markazData?.disciplines?.length) {
        return res.status(400).json({ message: "Select at least one Markaz discipline" });
      }
      if (!data.markazData?.studyLevels?.length) {
        return res.status(400).json({ message: "Select at least one Markaz study level" });
      }
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists. Please sign in, or use a different email.",
      });
    }

    const duplicate = await prisma.institution.findFirst({
      where: {
        name: { equals: data.name.trim(), mode: "insensitive" },
        type: data.type,
        woredaId: data.woredaId,
        status: { not: InstitutionStatus.CLOSED },
      },
      select: { id: true, name: true, institutionCode: true },
    });
    if (duplicate) {
      return res.status(409).json({
        message: `An institution named "${duplicate.name}" (${duplicate.institutionCode}) is already registered in this district.`,
      });
    }

    const ownerRoleId = await ensureInstitutionOwnerRoleId();
    const passwordHash = await bcrypt.hash(data.password, 10);
    const names = data.submitter.name.trim().split(/\s+/);
    const firstName = names[0] || "Institution";
    const lastName = names.slice(1).join(" ") || "Owner";
    const imageUrl = `/uploads/institutions/${file.filename}`;
    const status = data.status ?? InstitutionStatus.UNDER_CONSTRUCTION;

    const institutionCode = await generateInstitutionCode(data.type);
    const submitter = {
      source: "PUBLIC",
      name: data.submitter.name,
      phone: data.submitter.phone,
      email,
      role: data.submitter.role,
      submittedAt: new Date().toISOString(),
    };

    const result = await prisma.$transaction(async (tx) => {
      const owner = await tx.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          status: "ACTIVE",
          userRoles: { create: [{ roleId: ownerRoleId }] },
        },
        select: { id: true, email: true, firstName: true, lastName: true },
      });

      const institution = await tx.institution.create({
        data: {
          institutionCode,
          name: data.name.trim(),
          type: data.type,
          status,
          latitude: data.latitude != null ? new Prisma.Decimal(data.latitude) : null,
          longitude: data.longitude != null ? new Prisma.Decimal(data.longitude) : null,
          address: data.address.trim(),
          yearEstablished: data.yearEstablished,
          ownershipStatus: data.ownershipStatus,
          imageUrl,
          submitter,
          createdBy: { connect: { id: owner.id } },
          ownerUser: { connect: { id: owner.id } },
          mosqueData: data.type === InstitutionType.MOSQUE ? data.mosqueData ?? undefined : undefined,
          madrasahData: data.type === InstitutionType.MADRASAH ? data.madrasahData ?? undefined : undefined,
          markazData: data.type === InstitutionType.MARKAZ ? data.markazData ?? undefined : undefined,
          region: { connect: { id: data.regionId } },
          zone: { connect: { id: data.zoneId } },
          woreda: { connect: { id: data.woredaId } },
          kebeleName: data.kebeleName?.trim() || null,
          ...(data.kebeleId ? { kebele: { connect: { id: data.kebeleId } } } : {}),
        },
        include: {
          region: true,
          zone: true,
          woreda: true,
          kebele: true,
        },
      });

      await tx.institutionAuditLog.create({
        data: {
          institutionId: institution.id,
          action: InstitutionAuditAction.CREATED,
          actorId: owner.id,
          entityType: "Institution",
          entityId: institution.id,
          newValue: JSON.parse(JSON.stringify(institution)),
          description: `Public registration ${institutionCode} by ${submitter.name} (${submitter.phone})`,
        },
      });

      return { institution, owner };
    });

    res.status(201).json({
      institution: result.institution,
      user: result.owner,
      message: "Institution registered. You can sign in with your email and password.",
    });
  } catch (error: any) {
    console.error("Public register institution error:", error);
    if (error?.name === "ZodError") {
      return res.status(400).json({ message: error.errors?.[0]?.message || "Invalid registration data" });
    }
    res.status(400).json({ message: error.message || "Failed to register institution" });
  }
}

export async function listMyInstitutions(req: Request, res: Response) {
  try {
    const user = getRequestUser(req);
    if (!user?.id) return res.status(401).json({ message: "Unauthenticated" });

    const items = await prisma.institution.findMany({
      where: { ownerUserId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        region: true,
        zone: true,
        woreda: true,
        kebele: true,
        _count: { select: { assignments: true, recognitions: true } },
      },
    });

    res.json({ items, total: items.length });
  } catch (error: any) {
    console.error("List my institutions error:", error);
    res.status(500).json({ message: "Failed to list your institutions" });
  }
}

export async function listInstitutions(req: Request, res: Response) {
  try {
    const query = ListInstitutionsQuery.parse(req.query);
    const user = getRequestUser(req);
    const where: Prisma.InstitutionWhereInput = {};

    if (isInstitutionOwnerOnly(user)) {
      where.ownerUserId = user!.id;
    }
    
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.regionId) where.regionId = query.regionId;
    if (query.zoneId) where.zoneId = query.zoneId;
    if (query.woredaId) where.woredaId = query.woredaId;
    
    if (query.search) {
      const search = query.search.trim();
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { institutionCode: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
      ];
    }
    
    const { skip, take } = paginate(query.page, query.limit);
    
    const [items, total] = await Promise.all([
      prisma.institution.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          region: true,
          zone: true,
          woreda: true,
          kebele: true,
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
          approvedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
          _count: {
            select: { assignments: true },
          },
        },
      }),
      prisma.institution.count({ where }),
    ]);
    
    res.json({
      items,
      total,
      page: query.page,
      limit: query.limit,
    });
  } catch (error: any) {
    console.error("List institutions error:", error);
    res.status(500).json({ 
      message: "Failed to list institutions",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
}

export async function getInstitution(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const access = await assertCanAccessInstitution(req, id);
    if (!access.ok) return res.status(access.status).json({ message: access.message });

    const institution = await prisma.institution.findUnique({
      where: { id },
      include: {
        region: true,
        zone: true,
        woreda: true,
        kebele: true,
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        approvedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        ownerUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        assignments: {
          where: { status: "ACTIVE" },
          include: {
            employee: {
              select: {
                id: true,
                employeeCode: true,
                firstName: true,
                lastName: true,
                email: true,
                designation: true,
              },
            },
          },
        },
        _count: {
          select: { assignments: true, auditLogs: true },
        },
      },
    });
    
    if (!institution) {
      return res.status(404).json({ message: "Institution not found" });
    }
    
    res.json(institution);
  } catch (error: any) {
    console.error("Get institution error:", error);
    res.status(500).json({ message: "Failed to get institution" });
  }
}

export async function updateInstitution(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const currentUserId = getCurrentUserId(req);
    const access = await assertCanManageInstitution(req, id);
    if (!access.ok) return res.status(access.status).json({ message: access.message });

    const data = UpdateInstitutionDto.parse(req.body);
    
    const existing = await prisma.institution.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "Institution not found" });
    }

    // Portal owners cannot self-approve to ACTIVE via status change without staff
    const user = getRequestUser(req);
    if (isInstitutionOwnerOnly(user) && data.status && data.status !== existing.status) {
      // Allow owners to update operational details but not jump to APPROVED workflow fields
      // Status changes by owners are allowed for their claimed operational state
    }
    
    const updateData: Prisma.InstitutionUpdateInput = {};
    
    if (data.name) updateData.name = data.name;
    if (data.status) updateData.status = data.status;
    if (data.latitude !== undefined) updateData.latitude = data.latitude ? new Prisma.Decimal(data.latitude) : null;
    if (data.longitude !== undefined) updateData.longitude = data.longitude ? new Prisma.Decimal(data.longitude) : null;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.yearEstablished !== undefined) updateData.yearEstablished = data.yearEstablished;
    if (data.ownershipStatus !== undefined) updateData.ownershipStatus = data.ownershipStatus;
    if (data.mosqueData !== undefined) updateData.mosqueData = data.mosqueData;
    if (data.madrasahData !== undefined) updateData.madrasahData = data.madrasahData;
    if (data.markazData !== undefined) updateData.markazData = data.markazData;
    
    // Geographic relations
    if (data.regionId) updateData.region = { connect: { id: data.regionId } };
    if (data.zoneId) updateData.zone = { connect: { id: data.zoneId } };
    if (data.woredaId) updateData.woreda = { connect: { id: data.woredaId } };
    if (data.kebeleId) updateData.kebele = { connect: { id: data.kebeleId } };
    if (data.kebeleName !== undefined) updateData.kebeleName = data.kebeleName || null;
    
    const updated = await prisma.institution.update({
      where: { id },
      data: updateData,
      include: {
        region: true,
        zone: true,
        woreda: true,
        kebele: true,
      },
    });
    
    // Create audit log
    await createAuditLog(
      id,
      data.status && data.status !== existing.status ? InstitutionAuditAction.STATUS_CHANGED : InstitutionAuditAction.UPDATED,
      currentUserId,
      "Institution",
      id,
      existing,
      updated,
      `Institution ${updated.institutionCode} updated`
    );
    
    res.json(updated);
  } catch (error: any) {
    console.error("Update institution error:", error);
    res.status(400).json({ message: error.message || "Failed to update institution" });
  }
}

export async function approveInstitution(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const currentUserId = getCurrentUserId(req);
    const data = ApproveInstitutionDto.parse(req.body);
    
    const existing = await prisma.institution.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "Institution not found" });
    }
    
    const updateData: Prisma.InstitutionUpdateInput = {
      approvedBy: { connect: { id: currentUserId } },
      approvedAt: new Date(),
    };
    
    if (data.approved) {
      updateData.status = InstitutionStatus.ACTIVE;
    } else {
      updateData.status = InstitutionStatus.SUSPENDED;
    }
    
    const updated = await prisma.institution.update({
      where: { id },
      data: updateData,
      include: {
        approvedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
    
    // Create audit log
    await createAuditLog(
      id,
      data.approved ? InstitutionAuditAction.STATUS_CHANGED : InstitutionAuditAction.STATUS_CHANGED,
      currentUserId,
      "Institution",
      id,
      existing,
      updated,
      data.approved ? `Institution ${updated.institutionCode} approved` : `Institution ${updated.institutionCode} rejected`
    );
    
    res.json(updated);
  } catch (error: any) {
    console.error("Approve institution error:", error);
    res.status(400).json({ message: error.message || "Failed to approve institution" });
  }
}

// ============================================
// Assignment Controllers
// ============================================

export async function createAssignment(req: Request, res: Response) {
  try {
    const currentUserId = getCurrentUserId(req);
    const data = CreateAssignmentDto.parse(req.body);
    
    // Get institution to check type
    const institution = await prisma.institution.findUnique({
      where: { id: data.institutionId },
    });
    
    if (!institution) {
      return res.status(404).json({ message: "Institution not found" });
    }
    
    // Special rule: One Imam can be active in only ONE Mosque at a time
    if (data.role === "IMAM" && institution.type === InstitutionType.MOSQUE) {
      const existingActiveImam = await prisma.institutionAssignment.findFirst({
        where: {
          employeeId: data.employeeId,
          role: "IMAM",
          status: "ACTIVE",
          institution: {
            type: InstitutionType.MOSQUE,
          },
        },
      });
      
      if (existingActiveImam) {
        return res.status(400).json({
          message: "Employee is already assigned as Imam to another mosque. Please end the existing assignment first.",
        });
      }
    }
    
    const assignment = await prisma.institutionAssignment.create({
      data: {
        employeeId: data.employeeId,
        institutionId: data.institutionId,
        institutionType: institution.type,
        role: data.role,
        status: "PENDING_APPROVAL",
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        institution: {
          select: {
            id: true,
            institutionCode: true,
            name: true,
            type: true,
          },
        },
      },
    });
    
    // Create audit log
    await createAuditLog(
      data.institutionId,
      InstitutionAuditAction.ASSIGNMENT_CREATED,
      currentUserId,
      "Assignment",
      assignment.id,
      null,
      assignment,
      `Assignment created for ${assignment.employee.firstName} ${assignment.employee.lastName}`
    );
    
    res.status(201).json(assignment);
  } catch (error: any) {
    console.error("Create assignment error:", error);
    res.status(400).json({ message: error.message || "Failed to create assignment" });
  }
}

export async function listAssignments(req: Request, res: Response) {
  try {
    const query = ListAssignmentsQuery.parse(req.query);
    const where: Prisma.InstitutionAssignmentWhereInput = {};
    
    if (query.employeeId) where.employeeId = query.employeeId;
    if (query.institutionId) where.institutionId = query.institutionId;
    if (query.role) where.role = query.role;
    if (query.status) where.status = query.status;
    
    const { skip, take } = paginate(query.page, query.limit);
    
    const [items, total] = await Promise.all([
      prisma.institutionAssignment.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          employee: {
            select: {
              id: true,
              employeeCode: true,
              firstName: true,
              lastName: true,
              email: true,
              designation: true,
            },
          },
          institution: {
            select: {
              id: true,
              institutionCode: true,
              name: true,
              type: true,
            },
          },
          approvedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      }),
      prisma.institutionAssignment.count({ where }),
    ]);
    
    res.json({
      items,
      total,
      page: query.page,
      limit: query.limit,
    });
  } catch (error: any) {
    console.error("List assignments error:", error);
    res.status(500).json({ 
      message: "Failed to list assignments",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
}

export async function approveAssignment(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const currentUserId = getCurrentUserId(req);
    const data = ApproveAssignmentDto.parse(req.body);
    
    const existing = await prisma.institutionAssignment.findUnique({
      where: { id },
      include: { institution: true },
    });
    
    if (!existing) {
      return res.status(404).json({ message: "Assignment not found" });
    }
    
    const updateData: Prisma.InstitutionAssignmentUpdateInput = {
      approvedBy: { connect: { id: currentUserId } },
      approvalDate: new Date(),
    };
    
    if (data.approved) {
      updateData.status = "ACTIVE";
    } else {
      updateData.status = "ENDED";
      if (data.rejectionReason) {
        updateData.rejectionReason = data.rejectionReason;
      }
    }
    
    const updated = await prisma.institutionAssignment.update({
      where: { id },
      data: updateData,
      include: {
        employee: true,
        institution: true,
        approvedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
    
    // Create audit log
    await createAuditLog(
      existing.institutionId,
      data.approved ? InstitutionAuditAction.ASSIGNMENT_APPROVED : InstitutionAuditAction.ASSIGNMENT_REJECTED,
      currentUserId,
      "Assignment",
      id,
      existing,
      updated,
      data.approved
        ? `Assignment approved for ${updated.employee.firstName} ${updated.employee.lastName}`
        : `Assignment rejected: ${data.rejectionReason || "No reason provided"}`
    );
    
    res.json(updated);
  } catch (error: any) {
    console.error("Approve assignment error:", error);
    res.status(400).json({ message: error.message || "Failed to approve assignment" });
  }
}

export async function endAssignment(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const currentUserId = getCurrentUserId(req);
    
    const existing = await prisma.institutionAssignment.findUnique({
      where: { id },
      include: { institution: true },
    });
    
    if (!existing) {
      return res.status(404).json({ message: "Assignment not found" });
    }
    
    const updated = await prisma.institutionAssignment.update({
      where: { id },
      data: {
        status: "ENDED",
        endDate: new Date(),
      },
      include: {
        employee: true,
        institution: true,
      },
    });
    
    // Create audit log
    await createAuditLog(
      existing.institutionId,
      InstitutionAuditAction.ASSIGNMENT_ENDED,
      currentUserId,
      "Assignment",
      id,
      existing,
      updated,
      `Assignment ended for ${updated.employee.firstName} ${updated.employee.lastName}`
    );
    
    res.json(updated);
  } catch (error: any) {
    console.error("End assignment error:", error);
    res.status(400).json({ message: error.message || "Failed to end assignment" });
  }
}

// ============================================
// Dashboard/Statistics Controllers
// ============================================

export async function getInstitutionStats(req: Request, res: Response) {
  try {
    const { regionId, zoneId, woredaId } = req.query;
    const where: Prisma.InstitutionWhereInput = {};
    
    if (regionId) where.regionId = regionId as string;
    if (zoneId) where.zoneId = zoneId as string;
    if (woredaId) where.woredaId = woredaId as string;
    
    const [
      totalInstitutions,
      byType,
      byStatus,
      byOwnership,
      pendingApprovals,
      activeAssignments,
    ] = await Promise.all([
      prisma.institution.count({ where }),
      prisma.institution.groupBy({
        by: ["type"],
        where,
        _count: { type: true },
      }),
      prisma.institution.groupBy({
        by: ["status"],
        where,
        _count: { status: true },
      }),
      prisma.institution.groupBy({
        by: ["ownershipStatus"],
        where: { ...where, ownershipStatus: { not: null } },
        _count: { ownershipStatus: true },
      }),
      prisma.institution.count({
        where: { ...where, status: InstitutionStatus.UNDER_CONSTRUCTION },
      }),
      prisma.institutionAssignment.count({
        where: { status: "ACTIVE" },
      }),
    ]);
    
    res.json({
      totalInstitutions,
      byType: byType.reduce((acc, item) => {
        acc[item.type] = item._count.type;
        return acc;
      }, {} as Record<string, number>),
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {} as Record<string, number>),
      byOwnership: byOwnership.reduce((acc, item) => {
        acc[item.ownershipStatus || "UNKNOWN"] = item._count.ownershipStatus;
        return acc;
      }, {} as Record<string, number>),
      pendingApprovals,
      activeAssignments,
    });
  } catch (error: any) {
    console.error("Get institution stats error:", error);
    res.status(500).json({ message: "Failed to get statistics" });
  }
}

