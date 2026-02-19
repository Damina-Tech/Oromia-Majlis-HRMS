import { Request, Response } from "express";
import { PrismaClient, HalalApplicationStatus, HalalCertificateStatus, HalalAuditAction } from "@prisma/client";
import { generateHalalCertificatePDF } from "./halal-certificate-generator.js";
import {
  CreateHalalBusinessDto,
  UpdateHalalBusinessDto,
  CreateHalalApplicationDto,
  UpdateHalalApplicationDto,
  AssignInspectionDto,
  CompleteInspectionDto,
  ApproveApplicationDto,
  CreateRenewalDto,
  CreateViolationDto,
  ListHalalBusinessesQuery,
  ListHalalApplicationsQuery,
  ListHalalInspectionsQuery,
} from "./halal.dto.js";
import { paginate } from "../../lib/paginate.js";

const prisma = new PrismaClient();

function getUserId(req: Request): string {
  return (req as any).user?.id;
}

async function createAuditLog(
  action: HalalAuditAction,
  actorId: string,
  entityType: string,
  entityId?: string,
  applicationId?: string,
  oldVal?: unknown,
  newVal?: unknown,
  ip?: string,
  ua?: string
) {
  await prisma.halalAuditLog.create({
    data: {
      action,
      actorId,
      entityType,
      entityId,
      applicationId,
      oldValue: oldVal ? JSON.parse(JSON.stringify(oldVal)) : null,
      newValue: newVal ? JSON.parse(JSON.stringify(newVal)) : null,
      ipAddress: ip,
      userAgent: ua,
    },
  });
}

async function generateCertificateId(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.halalCertificate.count({
    where: { certificateId: { startsWith: `HAL-${year}-` } },
  });
  return `HAL-${year}-${(count + 1).toString().padStart(4, "0")}`;
}

// ========== Business ==========
export async function registerBusiness(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const data = CreateHalalBusinessDto.parse(req.body);
    const biz = await prisma.halalBusiness.create({
      data: {
        ...data,
        latitude: data.latitude != null ? data.latitude : undefined,
        longitude: data.longitude != null ? data.longitude : undefined,
        userId,
      },
      include: { region: true, zone: true, woreda: true },
    });
    await createAuditLog(HalalAuditAction.BUSINESS_REGISTERED, userId, "HalalBusiness", biz.id, undefined, undefined, biz, req.ip, req.get("user-agent"));
    res.status(201).json(biz);
  } catch (e: any) {
    res.status(400).json({ message: e.message || "Failed to register business" });
  }
}

export async function listBusinesses(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const perms = (req as any).user?.permissions as string[] | undefined;
    const isAdmin = perms?.includes("halal.admin");
    const q = ListHalalBusinessesQuery.parse(req.query);
    const where: any = {};
    if (!isAdmin) where.userId = userId;
    if (q.category) where.category = q.category;
    if (q.regionId) where.regionId = q.regionId;
    if (q.search) {
      where.OR = [
        { name: { contains: q.search, mode: "insensitive" } },
        { contactName: { contains: q.search, mode: "insensitive" } },
      ];
    }
    const [items, total] = await Promise.all([
      prisma.halalBusiness.findMany({
        where,
        include: { region: true, zone: true, woreda: true },
        ...paginate(q.page, q.limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.halalBusiness.count({ where }),
    ]);
    res.json({ items, total, page: q.page, limit: q.limit });
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to list businesses" });
  }
}

export async function getBusiness(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const biz = await prisma.halalBusiness.findUnique({
      where: { id },
      include: { region: true, zone: true, woreda: true, applications: true },
    });
    if (!biz) return res.status(404).json({ message: "Business not found" });
    res.json(biz);
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to get business" });
  }
}

export async function updateBusiness(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = UpdateHalalBusinessDto.parse(req.body);
    const old = await prisma.halalBusiness.findUnique({ where: { id } });
    if (!old) return res.status(404).json({ message: "Business not found" });
    const updated = await prisma.halalBusiness.update({
      where: { id },
      data: {
        ...data,
        latitude: data.latitude != null ? data.latitude : undefined,
        longitude: data.longitude != null ? data.longitude : undefined,
      },
      include: { region: true, zone: true, woreda: true },
    });
    res.json(updated);
  } catch (e: any) {
    res.status(400).json({ message: e.message || "Failed to update business" });
  }
}

export async function uploadBusinessLicense(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const file = (req as any).file;
    if (!file) return res.status(400).json({ message: "No file uploaded" });
    const licenseUrl = `/uploads/halal/${file.filename}`;
    const biz = await prisma.halalBusiness.update({
      where: { id },
      data: { licenseUrl },
    });
    res.json(biz);
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to upload license" });
  }
}

// ========== Applications ==========
export async function createApplication(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const data = CreateHalalApplicationDto.parse(req.body);
    const app = await prisma.halalApplication.create({
      data: { ...data, status: HalalApplicationStatus.DRAFT },
      include: { business: { include: { region: true, zone: true, woreda: true } } },
    });
    await createAuditLog(HalalAuditAction.APPLICATION_CREATED, userId, "HalalApplication", app.id, app.id, undefined, app, req.ip, req.get("user-agent"));
    res.status(201).json(app);
  } catch (e: any) {
    res.status(400).json({ message: e.message || "Failed to create application" });
  }
}

export async function listApplications(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const perms = (req as any).user?.permissions as string[] | undefined;
    const isAdmin = perms?.includes("halal.admin") || perms?.includes("halal.review") || perms?.includes("halal.inspector");
    const q = ListHalalApplicationsQuery.parse(req.query);
    const where: any = {};
    if (!isAdmin) where.business = { userId };
    if (q.status) where.status = q.status;
    if (q.businessId) where.businessId = q.businessId;
    if (q.search) {
      where.business = { name: { contains: q.search, mode: "insensitive" } };
    }
    const [items, total] = await Promise.all([
      prisma.halalApplication.findMany({
        where,
        include: { business: { include: { region: true } } },
        ...paginate(q.page, q.limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.halalApplication.count({ where }),
    ]);
    res.json({ items, total, page: q.page, limit: q.limit });
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to list applications" });
  }
}

export async function getApplication(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const app = await prisma.halalApplication.findUnique({
      where: { id },
      include: {
        business: { include: { region: true, zone: true, woreda: true } },
        inspections: { include: { inspector: true } },
        certificate: true,
      },
    });
    if (!app) return res.status(404).json({ message: "Application not found" });
    res.json(app);
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to get application" });
  }
}

export async function updateApplication(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = UpdateHalalApplicationDto.parse(req.body);
    const app = await prisma.halalApplication.update({
      where: { id },
      data,
      include: { business: true },
    });
    res.json(app);
  } catch (e: any) {
    res.status(400).json({ message: e.message || "Failed to update application" });
  }
}

export async function submitApplication(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const old = await prisma.halalApplication.findUnique({ where: { id } });
    if (!old) return res.status(404).json({ message: "Application not found" });
    if (old.status !== HalalApplicationStatus.DRAFT) {
      return res.status(400).json({ message: "Only draft applications can be submitted" });
    }
    const app = await prisma.halalApplication.update({
      where: { id },
      data: { status: HalalApplicationStatus.SUBMITTED, submittedAt: new Date() },
      include: { business: true },
    });
    await createAuditLog(HalalAuditAction.APPLICATION_SUBMITTED, userId, "HalalApplication", id, id, old, app, req.ip, req.get("user-agent"));
    res.json(app);
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to submit application" });
  }
}

export async function approveApplication(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const body = ApproveApplicationDto.parse(req.body);
    const old = await prisma.halalApplication.findUnique({ where: { id }, include: { inspections: true } });
    if (!old) return res.status(404).json({ message: "Application not found" });
    if (old.status !== HalalApplicationStatus.INSPECTION && old.status !== HalalApplicationStatus.REVIEW) {
      return res.status(400).json({ message: "Application must be in Review or Inspection to approve/reject" });
    }
    const completed = old.inspections.some((i) => i.completedAt != null);
    if (!completed && body.approved) {
      return res.status(400).json({ message: "Inspection must be completed before approval" });
    }
    const app = await prisma.halalApplication.update({
      where: { id },
      data: {
        status: body.approved ? HalalApplicationStatus.APPROVED : HalalApplicationStatus.REJECTED,
        approvedById: body.approved ? userId : null,
        approvedAt: body.approved ? new Date() : null,
        rejectionReason: body.approved ? null : (body.rejectionReason || "Rejected"),
      },
      include: { business: true },
    });
    await createAuditLog(
      body.approved ? HalalAuditAction.APPLICATION_APPROVED : HalalAuditAction.APPLICATION_REJECTED,
      userId,
      "HalalApplication",
      id,
      id,
      old,
      app,
      req.ip,
      req.get("user-agent")
    );
    if (body.approved) {
      const certId = await generateCertificateId();
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      const business = await prisma.halalBusiness.findUnique({ where: { id: old.businessId } });
      let pdfUrl: string | null = null;
      let qrCode: string | null = null;
      try {
        const { pdfUrl: url, qrDataUrl } = await generateHalalCertificatePDF({
          certificateId: certId,
          businessName: business?.name ?? "Business",
          category: business?.category ?? "FOOD",
          issuedAt: new Date(),
          expiresAt,
        });
        pdfUrl = url;
        qrCode = qrDataUrl;
      } catch (err) {
        console.error("Halal certificate PDF generation failed:", err);
      }
      await prisma.halalCertificate.create({
        data: {
          applicationId: id,
          certificateId: certId,
          pdfUrl,
          qrCode,
          expiresAt,
          status: HalalCertificateStatus.VALID,
        },
      });
      await createAuditLog(HalalAuditAction.CERTIFICATE_ISSUED, userId, "HalalCertificate", certId, id, undefined, { certificateId: certId }, req.ip, req.get("user-agent"));
    }
    const updated = await prisma.halalApplication.findUnique({
      where: { id },
      include: { business: true, certificate: true },
    });
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to approve application" });
  }
}

// ========== Inspectors ==========
export async function listInspectors(req: Request, res: Response) {
  try {
    const users = await prisma.user.findMany({
      where: {
        userRoles: {
          some: {
            role: {
              rolePermissions: {
                some: {
                  permission: {
                    name: { in: ["halal.inspector", "halal.admin"] },
                  },
                },
              },
            },
          },
        },
        status: "ACTIVE",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });
    res.json(users);
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to list inspectors" });
  }
}

// ========== Inspections ==========
export async function assignInspection(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const body = req.body as { applicationId?: string; inspectorId: string; scheduledAt?: string };
    const applicationId = body.applicationId || (req.params as any).applicationId;
    const { inspectorId, scheduledAt } = AssignInspectionDto.parse({ ...body, applicationId });
    if (!applicationId) return res.status(400).json({ message: "applicationId is required" });
    const app = await prisma.halalApplication.findUnique({ where: { id: applicationId } });
    if (!app) return res.status(404).json({ message: "Application not found" });
    if (app.status !== HalalApplicationStatus.SUBMITTED && app.status !== HalalApplicationStatus.REVIEW) {
      return res.status(400).json({ message: "Application must be Submitted or in Review" });
    }
    const ins = await prisma.halalInspection.create({
      data: {
        applicationId,
        inspectorId,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      },
      include: { application: { include: { business: true } }, inspector: true },
    });
    await prisma.halalApplication.update({
      where: { id: applicationId },
      data: { status: HalalApplicationStatus.INSPECTION },
    });
    await createAuditLog(HalalAuditAction.INSPECTION_ASSIGNED, userId, "HalalInspection", ins.id, applicationId, undefined, ins, req.ip, req.get("user-agent"));
    res.status(201).json(ins);
  } catch (e: any) {
    res.status(400).json({ message: e.message || "Failed to assign inspection" });
  }
}

export async function listInspections(req: Request, res: Response) {
  try {
    const q = ListHalalInspectionsQuery.parse(req.query);
    const where: any = {};
    if (q.inspectorId) where.inspectorId = q.inspectorId;
    if (q.applicationId) where.applicationId = q.applicationId;
    if (q.completed === "true") where.completedAt = { not: null };
    if (q.completed === "false") where.completedAt = null;
    const [items, total] = await Promise.all([
      prisma.halalInspection.findMany({
        where,
        include: { application: { include: { business: true } }, inspector: true },
        ...paginate(q.page, q.limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.halalInspection.count({ where }),
    ]);
    res.json({ items, total, page: q.page, limit: q.limit });
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to list inspections" });
  }
}

export async function getInspection(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const ins = await prisma.halalInspection.findUnique({
      where: { id },
      include: { application: { include: { business: { include: { region: true } } } }, inspector: true },
    });
    if (!ins) return res.status(404).json({ message: "Inspection not found" });
    res.json(ins);
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to get inspection" });
  }
}

export async function completeInspection(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const data = CompleteInspectionDto.parse(req.body);
    const old = await prisma.halalInspection.findUnique({ where: { id } });
    if (!old) return res.status(404).json({ message: "Inspection not found" });
    if (old.inspectorId !== userId) return res.status(403).json({ message: "Only assigned inspector can complete" });
    const ins = await prisma.halalInspection.update({
      where: { id },
      data: {
        completedAt: new Date(),
        checklistData: data.checklistData as any,
        evidence: data.evidence as any,
        gpsLat: data.gpsLat,
        gpsLng: data.gpsLng,
        digitalSignature: data.digitalSignature,
        notes: data.notes,
      },
      include: { application: { include: { business: true } }, inspector: true },
    });
    await createAuditLog(HalalAuditAction.INSPECTION_COMPLETED, userId, "HalalInspection", id, old.applicationId, old, ins, req.ip, req.get("user-agent"));
    res.json(ins);
  } catch (e: any) {
    res.status(400).json({ message: e.message || "Failed to complete inspection" });
  }
}

// ========== Certificates ==========
export async function listCertificates(req: Request, res: Response) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const status = req.query.status as string | undefined;
    const where: any = {};
    if (status) where.status = status;
    const [items, total] = await Promise.all([
      prisma.halalCertificate.findMany({
        where,
        include: { application: { include: { business: true } } },
        ...paginate(page, limit),
        orderBy: { issuedAt: "desc" },
      }),
      prisma.halalCertificate.count({ where }),
    ]);
    res.json({ items, total, page, limit });
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to list certificates" });
  }
}

export async function getCertificate(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const cert = await prisma.halalCertificate.findFirst({
      where: { OR: [{ id }, { certificateId: id }] },
      include: { application: { include: { business: { include: { region: true } } } } },
    });
    if (!cert) return res.status(404).json({ message: "Certificate not found" });
    res.json(cert);
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to get certificate" });
  }
}

export async function downloadCertificate(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const cert = await prisma.halalCertificate.findFirst({
      where: { OR: [{ id }, { certificateId: id }] },
    });
    if (!cert) return res.status(404).json({ message: "Certificate not found" });
    if (!cert.pdfUrl) return res.status(404).json({ message: "PDF not generated yet" });
    const pathModule = (await import("path")).default;
    const fs = await import("fs");
    const relPath = cert.pdfUrl.startsWith("/") ? cert.pdfUrl.slice(1) : cert.pdfUrl;
    const fullPath = pathModule.join(process.cwd(), relPath);
    if (!fs.existsSync(fullPath)) return res.status(404).json({ message: "PDF file not found" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="halal-certificate-${cert.certificateId}.pdf"`);
    res.sendFile(pathModule.resolve(fullPath));
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Download failed" });
  }
}

// ========== Public Verification (no auth) ==========
export async function verifyCertificate(req: Request, res: Response) {
  try {
    const { certificateId } = req.params;
    const cert = await prisma.halalCertificate.findUnique({
      where: { certificateId },
      include: { application: { include: { business: true } } },
    });
    if (!cert) return res.status(404).json({ message: "Certificate not found", valid: false });
    const valid = cert.status === HalalCertificateStatus.VALID && new Date() < cert.expiresAt;
    res.json({
      valid,
      status: cert.status,
      expiresAt: cert.expiresAt,
      businessName: cert.application.business.name,
      certificateId: cert.certificateId,
    });
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to verify", valid: false });
  }
}

// ========== Renewals ==========
export async function createRenewal(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const { certificateId, newExpiry } = CreateRenewalDto.parse(req.body);
    const cert = await prisma.halalCertificate.findFirst({
      where: { OR: [{ id: certificateId }, { certificateId }] },
    });
    if (!cert) return res.status(404).json({ message: "Certificate not found" });
    const renewal = await prisma.halalRenewal.create({
      data: {
        certificateId: cert.id,
        previousExpiry: cert.expiresAt,
        newExpiry: new Date(newExpiry),
        status: "PENDING",
      },
    });
    await prisma.halalCertificate.update({
      where: { id: cert.id },
      data: { expiresAt: new Date(newExpiry) },
    });
    await createAuditLog(HalalAuditAction.CERTIFICATE_RENEWED, userId, "HalalRenewal", renewal.id, cert.applicationId, undefined, renewal, req.ip, req.get("user-agent"));
    res.status(201).json(renewal);
  } catch (e: any) {
    res.status(400).json({ message: e.message || "Failed to create renewal" });
  }
}

// ========== Violations ==========
export async function createViolation(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const { certificateId, description, severity, action } = CreateViolationDto.parse(req.body);
    const cert = await prisma.halalCertificate.findFirst({
      where: { OR: [{ id: certificateId }, { certificateId }] },
    });
    if (!cert) return res.status(404).json({ message: "Certificate not found" });
    const v = await prisma.halalViolation.create({
      data: { certificateId: cert.id, description, severity, action: action || "WARNING" },
    });
    if (action === "REVOCATION") {
      await prisma.halalCertificate.update({
        where: { id: cert.id },
        data: { status: HalalCertificateStatus.REVOKED, revokedAt: new Date(), revokedReason: description },
      });
      await createAuditLog(HalalAuditAction.CERTIFICATE_REVOKED, userId, "HalalViolation", v.id, cert.applicationId, undefined, v, req.ip, req.get("user-agent"));
    } else if (action === "SUSPENSION") {
      await prisma.halalCertificate.update({
        where: { id: cert.id },
        data: { status: HalalCertificateStatus.SUSPENDED },
      });
    }
    await createAuditLog(HalalAuditAction.VIOLATION_RECORDED, userId, "HalalViolation", v.id, cert.applicationId, undefined, v, req.ip, req.get("user-agent"));
    res.status(201).json(v);
  } catch (e: any) {
    res.status(400).json({ message: e.message || "Failed to record violation" });
  }
}
