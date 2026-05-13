import { Request, Response } from "express";
import {
  Prisma,
  PrismaClient,
  HalalApplicationStatus,
  HalalBusinessStatus,
  HalalBusinessCategory,
  HalalCertificateStatus,
  HalalAuditAction,
  HalalPaymentMethod,
  HalalPaymentStatus,
  DocumentTemplateStatus,
  HalalInspectionExpertRole,
} from "@prisma/client";
import { generateHalalCertificatePDF } from "./halal-certificate-generator.js";
import {
  CreateHalalBusinessDto,
  UpdateHalalBusinessDto,
  CreateHalalApplicationDto,
  UpdateHalalApplicationDto,
  AssignInspectionDto,
  CompleteInspectionDto,
  UpdateInspectionAssignmentDto,
  ApproveApplicationDto,
  CreateRenewalDto,
  CreateViolationDto,
  ManualPaymentDto,
  ListHalalBusinessesQuery,
  ListHalalApplicationsQuery,
  ListHalalInspectionsQuery,
  ListHalalViolationsQuery,
} from "./halal.dto.js";
import { paginate } from "../../lib/paginate.js";
import fetch from "node-fetch";
import { sendBusinessApprovedSms, sendCertificateReadySms } from "./halal-sms.js";

const prisma = new PrismaClient();
const REQUIRED_FIXED_REGISTRATION_DOCUMENTS = [
  "Health Certificate",
  "ISO 22000 Certificate",
  "TIN Certificate",
] as const;

function resolveOwnerFullNamesForDocuments(
  body: { ownersManagers?: { fullName: string }[]; contactName?: string | null },
  existing: { ownersManagers?: unknown; contactName?: string | null } | null
): string[] {
  if (body.ownersManagers && body.ownersManagers.length > 0) {
    return body.ownersManagers.map((o) => o.fullName.trim()).filter(Boolean);
  }
  const raw = existing?.ownersManagers;
  if (raw && Array.isArray(raw)) {
    const names = (raw as { fullName?: string }[])
      .map((o) => (o.fullName || "").trim())
      .filter(Boolean);
    if (names.length > 0) return names;
  }
  const c = (body.contactName ?? existing?.contactName ?? "").trim();
  return c ? [c] : [];
}

function validateRequiredRegistrationDocuments(
  docs: { name: string; url: string; type?: string }[] | undefined,
  requireAll: boolean,
  ownerFullNames: string[]
): string | null {
  if (!requireAll) return null;
  if (!docs || docs.length === 0) {
    return "Missing required documents: Health Certificate, ISO 22000 Certificate, TIN Certificate, Owner ID/Passport.";
  }
  const names = new Set(docs.map((d) => d.name?.trim()));
  const missing: string[] = [];
  for (const n of REQUIRED_FIXED_REGISTRATION_DOCUMENTS) {
    if (!names.has(n)) missing.push(n);
  }

  const owners = ownerFullNames.map((n) => n.trim()).filter(Boolean);
  if (owners.length === 0) {
    if (!names.has("Owner ID/Passport")) missing.push("Owner ID/Passport");
  } else if (owners.length === 1) {
    const fn = owners[0];
    const suffixed = `Owner ID/Passport - ${fn}`;
    const ok = names.has("Owner ID/Passport") || names.has(suffixed);
    if (!ok) missing.push("Owner ID/Passport");
  } else {
    for (const fn of owners) {
      const label = `Owner ID/Passport - ${fn}`;
      if (!names.has(label)) missing.push(label);
    }
  }

  if (missing.length > 0) {
    return `Missing required documents: ${missing.join(", ")}.`;
  }
  return null;
}

function getUserId(req: Request): string {
  return (req as any).user?.id;
}

function normalizeBaseUrl(value: string | undefined, fallback: string): string {
  const raw = (value ?? "").trim();
  if (!raw) return fallback;
  const candidate = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
  try {
    return new URL(candidate).origin;
  } catch {
    return fallback;
  }
}

/** One Halal certificate per business: 3-year cycle with up to 2 annual renewals, then full recertification. */
const HALAL_CERT_CYCLE_YEARS = 3;
const MAX_ANNUAL_RENEWALS_PER_CYCLE = 2;

function cycleEndDate(certificationCycleStartedAt: Date): Date {
  const d = new Date(certificationCycleStartedAt);
  d.setFullYear(d.getFullYear() + HALAL_CERT_CYCLE_YEARS);
  return d;
}

function buildCertificateLifecycle(cert: {
  certificationCycleStartedAt: Date;
  annualRenewalCount: number;
  expiresAt: Date;
  status: HalalCertificateStatus;
}) {
  const now = new Date();
  const cycleEndsAt = cycleEndDate(cert.certificationCycleStartedAt);
  const annualRenewalsRemaining = Math.max(0, MAX_ANNUAL_RENEWALS_PER_CYCLE - cert.annualRenewalCount);
  const withinCycle = now < cycleEndsAt;
  const fullRecertificationRequired =
    cert.status === HalalCertificateStatus.VALID &&
    (now >= cycleEndsAt || (cert.annualRenewalCount >= MAX_ANNUAL_RENEWALS_PER_CYCLE && now >= new Date(cert.expiresAt)));
  return {
    certificationCycleStartedAt: cert.certificationCycleStartedAt.toISOString(),
    cycleEndsAt: cycleEndsAt.toISOString(),
    annualRenewalsUsed: cert.annualRenewalCount,
    annualRenewalsRemaining,
    maxAnnualRenewalsPerCycle: MAX_ANNUAL_RENEWALS_PER_CYCLE,
    cycleYears: HALAL_CERT_CYCLE_YEARS,
    withinCycle,
    fullRecertificationRequired,
    canRecordAnnualRenewal:
      cert.status === HalalCertificateStatus.VALID && withinCycle && annualRenewalsRemaining > 0 && now < cycleEndsAt,
  };
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

async function generateCertificateForApplication(
  applicationId: string,
  actorId: string,
  ip?: string,
  ua?: string
) {
  const existing = await prisma.halalCertificate.findUnique({
    where: { applicationId },
  });
  if (existing) return existing;

  const app = await prisma.halalApplication.findUnique({
    where: { id: applicationId },
    include: { business: true },
  });
  if (!app) throw new Error("Application not found for certificate generation");

  const businessId = app.businessId;
  const now = new Date();

  const othersValid = await prisma.halalCertificate.findMany({
    where: {
      businessId,
      applicationId: { not: applicationId },
      status: HalalCertificateStatus.VALID,
    },
  });
  for (const o of othersValid) {
    await prisma.halalCertificate.update({
      where: { id: o.id },
      data: {
        status: HalalCertificateStatus.REVOKED,
        revokedAt: now,
        revokedReason: "Superseded by full recertification (new Halal certificate issued)",
      },
    });
  }

  const certId = await generateCertificateId();
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  const cycleStart = new Date();

  let pdfUrl: string | null = null;
  let qrCode: string | null = null;
  try {
    const { pdfUrl: url, qrDataUrl } = await generateHalalCertificatePDF({
      certificateId: certId,
      businessName: app.business?.name ?? "Business",
      category: app.business?.category ?? "FOOD",
      issuedAt: new Date(),
      expiresAt,
    });
    pdfUrl = url;
    qrCode = qrDataUrl;
  } catch (err) {
    console.error("Halal certificate PDF generation failed:", err);
  }

  const certificate = await prisma.halalCertificate.create({
    data: {
      applicationId,
      businessId,
      certificateId: certId,
      pdfUrl,
      qrCode,
      expiresAt,
      status: HalalCertificateStatus.VALID,
      certificationCycleStartedAt: cycleStart,
      annualRenewalCount: 0,
    },
  });

  await createAuditLog(
    HalalAuditAction.CERTIFICATE_ISSUED,
    actorId,
    "HalalCertificate",
    certId,
    applicationId,
    undefined,
    { certificateId: certId },
    ip,
    ua
  );

  if (app.business?.contactPhone) {
    sendCertificateReadySms(app.business.contactPhone, certId).catch(() => {});
  }

  return certificate;
}

type BusinessApprovalRole = "ADMIN";

async function getBusinessApprovalProgress(businessId: string) {
  const logs = await prisma.halalAuditLog.findMany({
    where: {
      entityType: "HalalBusiness",
      entityId: businessId,
      action: HalalAuditAction.BUSINESS_APPROVED,
    },
    include: { actor: { select: { id: true, firstName: true, lastName: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });
  const admin = logs.find((l) => (l.newValue as any)?.approvalRole === "ADMIN");
  return {
    adminApproved: !!admin,
    supervisorApproved: false,
    approvedBySupervisor: null,
    approvedByAdmin: admin
      ? {
          userId: admin.actor.id,
          name: `${admin.actor.firstName} ${admin.actor.lastName}`.trim(),
          email: admin.actor.email,
          at: admin.createdAt,
        }
      : null,
    logs: logs.map((l) => ({
      id: l.id,
      role: (l.newValue as any)?.approvalRole as BusinessApprovalRole | undefined,
      checklist: (l.newValue as any)?.checklist ?? {},
      note: (l.newValue as any)?.note ?? "",
      at: l.createdAt,
      actor: {
        id: l.actor.id,
        name: `${l.actor.firstName} ${l.actor.lastName}`.trim(),
        email: l.actor.email,
      },
    })),
  };
}

// ========== Business ==========
export async function registerBusiness(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const data = CreateHalalBusinessDto.parse(req.body);
    const ownerNames = resolveOwnerFullNamesForDocuments(data, null);
    const docsError = validateRequiredRegistrationDocuments(data.documents, true, ownerNames);
    if (docsError) return res.status(400).json({ message: docsError });
    const primary = data.ownersManagers?.[0];
    const contactName = primary?.fullName ?? data.contactName!;
    const contactEmail = primary?.email ?? data.contactEmail!;
    const contactPhone = primary?.phone ?? data.contactPhone!;
    const biz = await prisma.halalBusiness.create({
      data: {
        name: data.name,
        category: data.category,
        categoryOther:
          data.category === HalalBusinessCategory.OTHER
            ? data.categoryOther?.trim() || null
            : null,
        contactName,
        contactEmail,
        contactPhone,
        regionId: data.regionId || undefined,
        zoneId: data.zoneId || undefined,
        woredaId: data.woredaId || undefined,
        kebeleName: data.kebeleName || undefined,
        latitude: data.latitude ?? undefined,
        longitude: data.longitude ?? undefined,
        address: data.address || undefined,
        ownerNationalId: (primary?.nationalId ?? data.ownerNationalId) || undefined,
        ownerGender: (primary?.gender ?? data.ownerGender) || undefined,
        ownerDateOfBirth: (() => {
          const dobStr = (primary?.dateOfBirth || data.ownerDateOfBirth || "").trim();
          return dobStr ? new Date(dobStr) : undefined;
        })(),
        ownerHomeAddress: (primary?.homeAddress ?? data.ownerHomeAddress) || undefined,
        ownerRole: (primary?.role ?? data.ownerRole) || undefined,
        ownersManagers:
          data.ownersManagers && data.ownersManagers.length > 0
            ? (data.ownersManagers as unknown as Prisma.InputJsonValue)
            : undefined,
        businessPhone: data.businessPhone?.trim() || undefined,
        businessEmail: data.businessEmail?.trim() || undefined,
        businessWebsite: data.businessWebsite?.trim() || undefined,
        brandName: data.brandName || undefined,
        yearEstablished: data.yearEstablished ?? undefined,
        businessType: data.businessType || undefined,
        tinNumber: data.tinNumber || undefined,
        productionSystem: data.productionSystem ?? undefined,
        declarationSignature: data.declarationSignature || undefined,
        declarationSignedAt: data.declarationSignature ? new Date() : undefined,
        declarationChecklist: data.declarationChecklist ?? undefined,
        productList: data.productList && data.productList.length > 0 ? data.productList : undefined,
        documents: data.documents && data.documents.length > 0 ? data.documents : undefined,
        userId,
        status: HalalBusinessStatus.PENDING_APPROVAL,
      },
      include: { region: true, zone: true, woreda: true },
    });
    await createAuditLog(HalalAuditAction.BUSINESS_REGISTERED, userId, "HalalBusiness", biz.id, undefined, undefined, biz, req.ip, req.get("user-agent"));
    res.status(201).json(biz);
  } catch (e: any) {
    const msg = e?.message || "Failed to register business";
    if (
      typeof msg === "string" &&
      msg.includes("Unknown argument") &&
      msg.includes("productionSystem")
    ) {
      return res.status(500).json({
        message:
          "The Prisma client on this server is out of date relative to the database (field: productionSystem). Stop the backend, run `npx prisma generate` in the backend folder, then restart. On Windows, if generate fails with EPERM, stop all Node processes using this project first.",
      });
    }
    res.status(400).json({ message: msg });
  }
}

export async function listBusinesses(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const perms = (req as any).user?.permissions as string[] | undefined;
    const isPrivileged =
      perms?.includes("halal.admin") ||
      perms?.includes("halal.supervisor") ||
      perms?.includes("halal.inspector") ||
      perms?.includes("halal.audit") ||
      perms?.includes("halal.committee");
    const q = ListHalalBusinessesQuery.parse(req.query);
    const where: any = {};
    if (!isPrivileged) where.userId = userId;
    if (q.category) where.category = q.category;
    if (q.regionId) where.regionId = q.regionId;
    if (q.status) where.status = q.status;
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
    const userId = getUserId(req);
    const perms = (req as any).user?.permissions as string[] | undefined;
    const isPrivileged =
      perms?.includes("halal.admin") ||
      perms?.includes("halal.supervisor") ||
      perms?.includes("halal.inspector") ||
      perms?.includes("halal.audit") ||
      perms?.includes("halal.committee");
    const { id } = req.params;
    const biz = await prisma.halalBusiness.findUnique({
      where: { id },
      include: { region: true, zone: true, woreda: true, applications: true },
    });
    if (!biz) return res.status(404).json({ message: "Business not found" });
    if (!isPrivileged && biz.userId !== userId) return res.status(403).json({ message: "Access denied" });
    const approvalProgress = await getBusinessApprovalProgress(id);
    const payload: Record<string, unknown> = { ...biz, approvalProgress };

    const now = new Date();
    const inProgressApp = await prisma.halalApplication.findFirst({
      where: {
        businessId: id,
        status: {
          in: [
            HalalApplicationStatus.DRAFT,
            HalalApplicationStatus.SUBMITTED,
            HalalApplicationStatus.INSPECTION,
            HalalApplicationStatus.REVIEW,
          ],
        },
      },
    });
    const blockingCert = await prisma.halalCertificate.findFirst({
      where: { businessId: id, status: HalalCertificateStatus.VALID },
    });
    const certBlocksNewApplication =
      blockingCert != null && now < cycleEndDate(blockingCert.certificationCycleStartedAt);
    payload.canStartNewCertificationApplication =
      biz.status === HalalBusinessStatus.APPROVED && !inProgressApp && !certBlocksNewApplication;

    if (perms?.includes("halal.admin")) {
      const validCert = await prisma.halalCertificate.findFirst({
        where: { businessId: id, status: HalalCertificateStatus.VALID },
        orderBy: { issuedAt: "desc" },
        include: { renewals: { orderBy: { renewedAt: "desc" } } },
      });
      if (validCert) {
        payload.halalCertificateLifecycle = {
          certificate: validCert,
          lifecycle: buildCertificateLifecycle(validCert),
        };
      }
    }
    res.json(payload);
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to get business" });
  }
}

export async function updateBusiness(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const perms = (req as any).user?.permissions as string[] | undefined;
    const isPrivileged = perms?.includes("halal.admin") || perms?.includes("halal.supervisor");
    const { id } = req.params;
    const data = UpdateHalalBusinessDto.parse(req.body);
    const old = await prisma.halalBusiness.findUnique({ where: { id } });
    if (!old) return res.status(404).json({ message: "Business not found" });
    if (!isPrivileged && old.userId !== userId) return res.status(403).json({ message: "Access denied" });
    const docsError = validateRequiredRegistrationDocuments(
      (data.documents as { name: string; url: string; type?: string }[] | undefined) ??
        (old.documents as { name: string; url: string; type?: string }[] | undefined),
      true,
      resolveOwnerFullNamesForDocuments(data, old)
    );
    if (docsError) return res.status(400).json({ message: docsError });
    const mergedCategory = data.category ?? old.category;
    const mergedCategoryOther =
      data.categoryOther !== undefined
        ? data.categoryOther
        : (old as { categoryOther?: string | null }).categoryOther;
    if (mergedCategory === HalalBusinessCategory.OTHER && !String(mergedCategoryOther ?? "").trim()) {
      return res.status(400).json({
        message: 'Please describe the business category when category is "OTHER".',
      });
    }
    const updateData: Record<string, unknown> = {};
    if (data.name != null) updateData.name = data.name;
    if (data.category != null) {
      updateData.category = data.category;
      if (data.category !== HalalBusinessCategory.OTHER) {
        updateData.categoryOther = null;
      }
    }
    if (data.categoryOther !== undefined) {
      updateData.categoryOther =
        (data.category ?? old.category) === HalalBusinessCategory.OTHER
          ? data.categoryOther?.trim() || null
          : null;
    }
    if (data.contactName != null) updateData.contactName = data.contactName;
    if (data.contactEmail != null) updateData.contactEmail = data.contactEmail;
    if (data.contactPhone != null) updateData.contactPhone = data.contactPhone;
    if (data.regionId !== undefined) updateData.regionId = data.regionId || null;
    if (data.zoneId !== undefined) updateData.zoneId = data.zoneId || null;
    if (data.woredaId !== undefined) updateData.woredaId = data.woredaId || null;
    if (data.kebeleName !== undefined) updateData.kebeleName = data.kebeleName || null;
    if (data.latitude !== undefined) updateData.latitude = data.latitude;
    if (data.longitude !== undefined) updateData.longitude = data.longitude;
    if (data.address !== undefined) updateData.address = data.address || null;
    if (data.ownerNationalId !== undefined) updateData.ownerNationalId = data.ownerNationalId || null;
    if (data.ownerGender !== undefined) updateData.ownerGender = data.ownerGender || null;
    if (data.ownerDateOfBirth !== undefined) updateData.ownerDateOfBirth = data.ownerDateOfBirth ? new Date(data.ownerDateOfBirth) : null;
    if (data.ownerHomeAddress !== undefined) updateData.ownerHomeAddress = data.ownerHomeAddress || null;
    if (data.ownerRole !== undefined) updateData.ownerRole = data.ownerRole || null;
    if (data.brandName !== undefined) updateData.brandName = data.brandName || null;
    if (data.yearEstablished !== undefined) updateData.yearEstablished = data.yearEstablished ?? null;
    if (data.businessType !== undefined) updateData.businessType = data.businessType || null;
    if (data.tinNumber !== undefined) updateData.tinNumber = data.tinNumber || null;
    if (data.productionSystem !== undefined) updateData.productionSystem = data.productionSystem ?? null;
    if (data.declarationSignature !== undefined) {
      updateData.declarationSignature = data.declarationSignature || null;
      updateData.declarationSignedAt = data.declarationSignature ? new Date() : null;
    }
    if (data.declarationChecklist !== undefined) updateData.declarationChecklist = data.declarationChecklist ?? null;
    if (data.productList !== undefined) updateData.productList = data.productList ?? null;
    if (data.documents !== undefined) updateData.documents = data.documents ?? null;
    if (data.ownersManagers !== undefined) {
      updateData.ownersManagers =
        data.ownersManagers && data.ownersManagers.length > 0
          ? (data.ownersManagers as unknown as Prisma.InputJsonValue)
          : null;
      const p = data.ownersManagers?.[0];
      if (p) {
        updateData.contactName = p.fullName;
        updateData.contactEmail = p.email;
        updateData.contactPhone = p.phone;
        updateData.ownerNationalId = p.nationalId || null;
        updateData.ownerGender = p.gender || null;
        updateData.ownerDateOfBirth = p.dateOfBirth ? new Date(p.dateOfBirth) : null;
        updateData.ownerHomeAddress = p.homeAddress || null;
        updateData.ownerRole = p.role || null;
      }
    }
    if (data.businessPhone !== undefined) updateData.businessPhone = data.businessPhone?.trim() || null;
    if (data.businessEmail !== undefined) updateData.businessEmail = data.businessEmail?.trim() || null;
    if (data.businessWebsite !== undefined) updateData.businessWebsite = data.businessWebsite?.trim() || null;
    const updated = await prisma.halalBusiness.update({
      where: { id },
      data: updateData as any,
      include: { region: true, zone: true, woreda: true },
    });
    res.json(updated);
  } catch (e: any) {
    const msg = e?.message || "Failed to update business";
    if (
      typeof msg === "string" &&
      msg.includes("Unknown argument") &&
      msg.includes("productionSystem")
    ) {
      return res.status(500).json({
        message:
          "The Prisma client on this server is out of date relative to the database (field: productionSystem). Stop the backend, run `npx prisma generate` in the backend folder, then restart. On Windows, if generate fails with EPERM, stop all Node processes using this project first.",
      });
    }
    res.status(400).json({ message: msg });
  }
}

export async function uploadHalalDocument(req: Request, res: Response) {
  try {
    const file = (req as any).file;
    if (!file) return res.status(400).json({ message: "No file uploaded" });
    const url = `/uploads/halal/${file.filename}`;
    res.json({ url });
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to upload document" });
  }
}

export async function uploadBusinessLicense(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const perms = (req as any).user?.permissions as string[] | undefined;
    const isPrivileged = perms?.includes("halal.admin") || perms?.includes("halal.supervisor");
    const { id } = req.params;
    const file = (req as any).file;
    if (!file) return res.status(400).json({ message: "No file uploaded" });
    const biz = await prisma.halalBusiness.findUnique({ where: { id } });
    if (!biz) return res.status(404).json({ message: "Business not found" });
    if (!isPrivileged && biz.userId !== userId) return res.status(403).json({ message: "Access denied" });
    const licenseUrl = `/uploads/halal/${file.filename}`;
    const updatedBiz = await prisma.halalBusiness.update({
      where: { id },
      data: { licenseUrl },
    });
    res.json(updatedBiz);
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to upload license" });
  }
}

export async function deleteBusiness(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const biz = await prisma.halalBusiness.findUnique({
      where: { id },
      include: { _count: { select: { applications: true } } },
    });
    if (!biz) return res.status(404).json({ message: "Business not found" });
    const perms = (req as any).user?.permissions as string[] | undefined;
    const isAdmin = perms?.includes("halal.admin") || perms?.includes("halal.supervisor");
    const isOwner = biz.userId === userId;
    if (!isOwner && !isAdmin) return res.status(403).json({ message: "Access denied" });
    if (biz._count.applications > 0) {
      return res.status(400).json({
        message: "Cannot delete a business that has applications. Withdraw or complete all applications first.",
      });
    }
    await prisma.halalBusiness.delete({ where: { id } });
    res.status(204).send();
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to delete business" });
  }
}

export async function approveBusiness(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const perms = (req as any).user?.permissions as string[] | undefined;
    const canAdmin = perms?.includes("halal.admin") ?? false;
    if (!canAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }
    const body = (req.body ?? {}) as {
      role?: BusinessApprovalRole;
      checklist?: Record<string, boolean>;
      note?: string;
      detailsConfirmed?: boolean;
    };
    const approvalRole: BusinessApprovalRole = "ADMIN";
    const biz = await prisma.halalBusiness.findUnique({ where: { id }, include: { region: true, zone: true, woreda: true } });
    if (!biz) return res.status(404).json({ message: "Business not found" });
    if (biz.status === HalalBusinessStatus.REJECTED) {
      return res.status(400).json({ message: "Rejected businesses cannot be approved." });
    }
    const progress = await getBusinessApprovalProgress(id);
    if (approvalRole === "ADMIN" && progress.adminApproved) {
      return res.status(400).json({ message: "Admin approval is already completed for this business." });
    }

    const nextStatus = HalalBusinessStatus.APPROVED;

    const updated = await prisma.halalBusiness.update({
      where: { id },
      data: { status: nextStatus },
      include: { region: true, zone: true, woreda: true },
    });
    await createAuditLog(
      HalalAuditAction.BUSINESS_APPROVED,
      userId,
      "HalalBusiness",
      id,
      undefined,
      { status: biz.status },
      {
        status: updated.status,
        approvalRole,
        checklist: body.checklist ?? {},
        note: body.note ?? "",
        detailsConfirmed: !!body.detailsConfirmed,
      },
      req.ip,
      req.get("user-agent")
    );
    if (nextStatus === HalalBusinessStatus.APPROVED && biz.status !== HalalBusinessStatus.APPROVED) {
      sendBusinessApprovedSms(updated.contactPhone, updated.name).catch(() => {});
    }
    const approvalProgress = await getBusinessApprovalProgress(id);
    res.json({ ...updated, approvalProgress });
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to approve business" });
  }
}

// ========== Applications ==========
export async function createApplication(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const data = CreateHalalApplicationDto.parse(req.body);
    const business = await prisma.halalBusiness.findUnique({ where: { id: data.businessId } });
    if (!business) return res.status(404).json({ message: "Business not found" });
    if (business.userId !== userId) return res.status(403).json({ message: "Access denied" });
    if (business.status !== HalalBusinessStatus.APPROVED) {
      return res.status(400).json({
        message: "This business is pending admin approval. You can apply for Halal certification only after your business has been approved.",
      });
    }
    const now = new Date();
    const inProgress = await prisma.halalApplication.findFirst({
      where: {
        businessId: data.businessId,
        status: {
          in: [
            HalalApplicationStatus.DRAFT,
            HalalApplicationStatus.SUBMITTED,
            HalalApplicationStatus.INSPECTION,
            HalalApplicationStatus.REVIEW,
          ],
        },
      },
    });
    if (inProgress) {
      return res.status(400).json({
        message:
          "This business already has an application in progress. Complete or withdraw it before starting a new one.",
      });
    }

    const activeCert = await prisma.halalCertificate.findFirst({
      where: {
        businessId: data.businessId,
        status: HalalCertificateStatus.VALID,
      },
    });
    if (activeCert) {
      const cycleEnd = cycleEndDate(activeCert.certificationCycleStartedAt);
      if (now < cycleEnd) {
        return res.status(400).json({
          message:
            "This business already has an active Halal certificate. A new certification application is only allowed after the current 3-year cycle ends (full recertification) or once the certificate is no longer valid.",
        });
      }
    }
    const createData: Prisma.HalalApplicationCreateInput = {
      business: { connect: { id: data.businessId } },
      status: HalalApplicationStatus.DRAFT,
      feeAmount: new Prisma.Decimal(DEFAULT_CERTIFICATION_FEE),
      productList: data.productList && data.productList.length > 0 ? data.productList : undefined,
      ingredients: data.ingredients && data.ingredients.length > 0 ? data.ingredients : undefined,
      supplierInfo: data.supplierInfo && data.supplierInfo.length > 0 ? data.supplierInfo : undefined,
      documents: data.documents && data.documents.length > 0 ? data.documents : undefined,
    };
    const app = await prisma.halalApplication.create({
      data: createData,
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
    const isAdmin = perms?.includes("halal.admin") || perms?.includes("halal.supervisor") || perms?.includes("halal.inspector");
    const q = ListHalalApplicationsQuery.parse(req.query);
    const where: any = {};
    if (!isAdmin) where.business = { userId };
    // Staff never see DRAFT applications (only visible to the owner)
    if (isAdmin) {
      where.status = q.status && q.status !== HalalApplicationStatus.DRAFT
        ? q.status
        : { not: HalalApplicationStatus.DRAFT };
    } else if (q.status) {
      where.status = q.status;
    }
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

const DEFAULT_CERTIFICATION_FEE = 20000;

/**
 * Blank agreement file from Document Templates (uploaded PDF/DOC path).
 * Uses ACTIVE or DRAFT so newly uploaded agreements work before an admin flips status to ACTIVE.
 */
async function getHalalAgreementBlankSourceUrlFromTemplate(): Promise<string | null> {
  const code = process.env.HALAL_AGREEMENT_TEMPLATE_CODE?.trim() || "HALAL_CERTIFICATION_AGREEMENT";
  const tpl = await prisma.documentTemplate.findFirst({
    where: {
      code,
      active: true,
      status: { in: [DocumentTemplateStatus.ACTIVE, DocumentTemplateStatus.DRAFT] },
      sourceFileUrl: { not: null },
    },
    orderBy: { updatedAt: "desc" },
    select: { sourceFileUrl: true },
  });
  return tpl?.sourceFileUrl?.trim() || null;
}

/** Resolve blank agreement URL: explicit per-app URL → document template upload → env (or legacy snapshot). */
async function attachAgreementTemplateResolvedUrl<T extends Record<string, unknown>>(
  app: T
): Promise<T & { agreementTemplateResolvedUrl: string | null }> {
  const envUrl = process.env.HALAL_AGREEMENT_TEMPLATE_URL?.trim() || "";
  const rawStored = typeof app.agreementTemplateUrl === "string" ? app.agreementTemplateUrl.trim() : "";
  const fromDoc = await getHalalAgreementBlankSourceUrlFromTemplate();

  const storedIsExplicitOverride = Boolean(rawStored && rawStored !== envUrl);
  if (storedIsExplicitOverride) {
    return { ...app, agreementTemplateResolvedUrl: rawStored };
  }
  if (fromDoc) {
    return { ...app, agreementTemplateResolvedUrl: fromDoc };
  }
  if (rawStored) {
    return { ...app, agreementTemplateResolvedUrl: rawStored };
  }
  if (envUrl) {
    return { ...app, agreementTemplateResolvedUrl: envUrl };
  }
  return { ...app, agreementTemplateResolvedUrl: null };
}

export async function getApplication(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const perms = (req as any).user?.permissions as string[] | undefined;
    const isAdmin = perms?.includes("halal.admin") || perms?.includes("halal.supervisor") || perms?.includes("halal.inspector");
    const isHalalAdmin = perms?.includes("halal.admin");
    const { id } = req.params;
    const app = await prisma.halalApplication.findUnique({
      where: { id },
      include: {
        business: { include: { region: true, zone: true, woreda: true } },
        inspections: { include: { inspector: true } },
        certificate: isHalalAdmin
          ? { include: { renewals: { orderBy: { renewedAt: "desc" } } } }
          : true,
      },
    });
    if (!app) return res.status(404).json({ message: "Application not found" });
    if (!isAdmin && app.business.userId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    // Staff cannot access DRAFT applications (only visible to the owner)
    if (isAdmin && app.status === HalalApplicationStatus.DRAFT) {
      return res.status(404).json({ message: "Application not found" });
    }

    const sanitizeHalalApplicationPayload = (payload: Record<string, unknown>) => {
      if (isHalalAdmin) return payload;
      const isOwner = Boolean(userId && app.business.userId === userId);
      const next = { ...payload };
      delete next.committeeNotes;
      delete next.meetingMinutesUrl;
      if (isOwner) delete next.rejectionReason;
      return next;
    };

    if (isHalalAdmin && app.certificate) {
      const withLifecycle = {
        ...app,
        certificateLifecycle: buildCertificateLifecycle(app.certificate),
      } as any;
      return res.json(
        sanitizeHalalApplicationPayload((await attachAgreementTemplateResolvedUrl(withLifecycle)) as any) as any
      );
    }
    res.json(sanitizeHalalApplicationPayload((await attachAgreementTemplateResolvedUrl(app as any)) as any) as any);
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

export async function deleteApplication(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const perms = (req as any).user?.permissions as string[] | undefined;
    const isAdmin = perms?.includes("halal.admin") || perms?.includes("halal.supervisor");
    const app = await prisma.halalApplication.findUnique({
      where: { id },
      include: { business: true },
    });
    if (!app) return res.status(404).json({ message: "Application not found" });
    const isOwner = app.business.userId === userId;
    if (!isAdmin && !isOwner) return res.status(403).json({ message: "Access denied" });

    const agreementRow = app as typeof app & {
      agreementOwnerSubmittedAt?: Date | null;
      agreementMajlisApprovedAt?: Date | null;
      agreementOwnerSignedUrl?: string | null;
    };
    const agreementCommitted =
      !!agreementRow.agreementOwnerSubmittedAt ||
      !!agreementRow.agreementMajlisApprovedAt ||
      (typeof agreementRow.agreementOwnerSignedUrl === "string" && agreementRow.agreementOwnerSignedUrl.trim() !== "");
    if (agreementCommitted) {
      return res.status(400).json({
        message:
          "This application cannot be withdrawn after the certification agreement has been signed and uploaded.",
      });
    }

    if (!isAdmin) {
      // Owner: can withdraw before payment is confirmed.
      const withdrawableWhileUnpaid: HalalApplicationStatus[] = [
        HalalApplicationStatus.SUBMITTED,
        HalalApplicationStatus.INSPECTION,
        HalalApplicationStatus.REVIEW,
      ];
      const canWithdraw =
        app.status === HalalApplicationStatus.DRAFT ||
        (withdrawableWhileUnpaid.includes(app.status) && !app.feePaidAt);
      if (!canWithdraw) {
        return res.status(400).json({
          message: "Only unpaid applications can be withdrawn. Once payment is confirmed, withdrawal is not allowed.",
        });
      }
    }
    await prisma.halalApplication.delete({ where: { id } });
    res.status(204).send();
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to delete application" });
  }
}

export async function confirmPayment(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const app = await prisma.halalApplication.findUnique({
      where: { id },
      include: { business: true },
    });
    if (!app) return res.status(404).json({ message: "Application not found" });
    if (app.business.userId !== userId) return res.status(403).json({ message: "Access denied" });
    if (app.status !== HalalApplicationStatus.REVIEW) {
      return res.status(400).json({ message: "Payment can only be confirmed after committee approval" });
    }
    if (app.feePaidAt) return res.status(400).json({ message: "Payment already confirmed" });
    const updated = await prisma.halalApplication.update({
      where: { id },
      data: { feePaidAt: new Date(), status: HalalApplicationStatus.APPROVED },
      include: { business: true },
    });
    await createAuditLog(HalalAuditAction.APPLICATION_APPROVED, userId, "HalalApplication", id, id, app, updated, req.ip, req.get("user-agent"));
    await generateCertificateForApplication(id, userId, req.ip, req.get("user-agent"));
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to confirm payment" });
  }
}

// Initialize Chapa payment - returns checkout URL for redirect
export async function initChapaPayment(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const perms = (req as any).user?.permissions as string[] | undefined;
    const isAdmin = perms?.includes("halal.admin") || perms?.includes("halal.supervisor");
    const { id } = req.params;
    const app = await prisma.halalApplication.findUnique({
      where: { id },
      include: { business: true },
    });
    if (!app) return res.status(404).json({ message: "Application not found" });
    if (app.business.userId !== userId && !isAdmin) return res.status(403).json({ message: "Access denied" });
    if (app.status !== HalalApplicationStatus.REVIEW) {
      return res.status(400).json({ message: "Payment can only be initiated after committee approval" });
    }
    if (app.feePaidAt) return res.status(400).json({ message: "Payment already confirmed" });
    const secretKey = process.env.CHAPA_SECRET_KEY;
    if (!secretKey) return res.status(500).json({ message: "Chapa payment is not configured" });
    // Use the fixed certification fee for Chapa checkout.
    const amount = DEFAULT_CERTIFICATION_FEE;
    const apiBase = normalizeBaseUrl(process.env.APP_BASE_URL, "http://localhost:4000");
    const frontendUrl = normalizeBaseUrl(process.env.FRONTEND_URL, "http://localhost:8080");
    const txRef = `halal-${id}-${Date.now()}`;
    const names = (app.business.contactName || "Customer").trim().split(" ");
    const firstName = names[0] || "Customer";
    const lastName = names.slice(1).join(" ") || ".";
    const callbackUrl = new URL(`/api/v1/halal/applications/${id}/payment/chapa-callback`, apiBase).toString();
    const returnUrl = new URL(`/halal/applications/${id}?payment=chapa`, frontendUrl).toString();
    const rawCustomizationDescription = `Halal certification payment ${amount} ETB`;
    const customizationDescription = rawCustomizationDescription
      .replace(/[^A-Za-z0-9._\-\s]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 50);
    const payload = {
      amount: String(amount),
      currency: "ETB",
      email: app.business.contactEmail,
      first_name: firstName,
      last_name: lastName,
      phone_number: (app.business.contactPhone || "").replace(/\D/g, "").slice(-9) ? `0${(app.business.contactPhone || "").replace(/\D/g, "").slice(-9)}` : undefined,
      tx_ref: txRef,
      callback_url: callbackUrl,
      return_url: returnUrl,
      customization: {
        title: "Halal Cert Fee", // Chapa limit: 16 chars
        description: customizationDescription,
      },
    };
    const resp = await fetch("https://api.chapa.co/v1/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = (await resp.json()) as any;
    if (!data.status || data.status !== "success" || !data.data?.checkout_url) {
      const errMsg = typeof data.message === "string"
        ? data.message
        : (data.message && typeof data.message === "object")
          ? (data.message.customization?.title || data.message.message || JSON.stringify(data.message))
          : "Failed to initialize Chapa payment";
      return res.status(400).json({ message: errMsg });
    }
    await prisma.halalPayment.create({
      data: {
        applicationId: id,
        amount: new Prisma.Decimal(DEFAULT_CERTIFICATION_FEE),
        currency: "ETB",
        method: HalalPaymentMethod.CHAPA,
        status: HalalPaymentStatus.PENDING,
        chapaTxRef: txRef,
      },
    });
    await prisma.halalApplication.update({
      where: { id },
      data: { chapaTxRef: txRef },
    });
    res.json({ checkoutUrl: data.data.checkout_url, txRef });
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to initialize payment" });
  }
}

// Chapa callback - called by Chapa after payment (no auth)
export async function chapaCallback(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { trx_ref, ref_id, status } = req.query as { trx_ref?: string; ref_id?: string; status?: string };
    if (!id || !trx_ref || status !== "success") {
      return res.status(400).send("Invalid callback");
    }
    const app = await prisma.halalApplication.findUnique({
      where: { id },
      include: { business: true },
    });
    if (!app || app.chapaTxRef !== trx_ref) {
      return res.status(404).send("Application not found");
    }
    if (app.feePaidAt) {
      return res.status(200).send("OK"); // Already processed
    }
    const secretKey = process.env.CHAPA_SECRET_KEY;
    if (!secretKey) return res.status(500).send("Config error");
    const verifyResp = await fetch(`https://api.chapa.co/v1/transaction/verify/${ref_id}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    const verifyData = (await verifyResp.json()) as any;
    if (verifyData.status !== "success" || verifyData.data?.status !== "success") {
      return res.status(400).send("Verification failed");
    }
    const updatedApp = await prisma.halalApplication.update({
      where: { id },
      data: {
        feePaidAt: new Date(),
        status: HalalApplicationStatus.APPROVED,
        paymentMethod: "CHAPA",
        chapaTxRef: trx_ref,
        chapaRefId: ref_id || null,
      },
      include: { business: true },
    });
    await prisma.halalPayment.updateMany({
      where: {
        applicationId: id,
        method: HalalPaymentMethod.CHAPA,
        chapaTxRef: trx_ref,
        status: HalalPaymentStatus.PENDING,
      },
      data: {
        status: HalalPaymentStatus.COMPLETED,
        paidAt: new Date(),
        chapaRefId: ref_id || null,
      },
    });
    await generateCertificateForApplication(id, updatedApp.business.userId, req.ip, req.get("user-agent"));
    res.status(200).send("OK");
  } catch (e: any) {
    res.status(500).send("Error");
  }
}

// Manual payment - bank transfer with receipt upload
export async function confirmManualPayment(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const body = ManualPaymentDto.parse(req.body);
    const file = (req as any).file;
    if (!file) return res.status(400).json({ message: "Receipt file is required" });
    const app = await prisma.halalApplication.findUnique({
      where: { id },
      include: { business: true },
    });
    if (!app) return res.status(404).json({ message: "Application not found" });
    if (app.business.userId !== userId) return res.status(403).json({ message: "Access denied" });
    if (app.status !== HalalApplicationStatus.REVIEW) {
      return res.status(400).json({ message: "Payment can only be submitted after committee approval" });
    }
    if (app.feePaidAt) return res.status(400).json({ message: "Payment already confirmed" });
    const receiptUrl = `/uploads/halal/${file.filename}`;
    await prisma.halalPayment.create({
      data: {
        applicationId: id,
        amount: new Prisma.Decimal(DEFAULT_CERTIFICATION_FEE),
        currency: "ETB",
        method: HalalPaymentMethod.MANUAL,
        status: HalalPaymentStatus.PENDING,
        bankName: body.bankName,
        receiptUrl,
      },
    });
    const updated = await prisma.halalApplication.update({
      where: { id },
      data: {
        paymentMethod: "MANUAL",
        paymentBankName: body.bankName,
        paymentReceiptUrl: receiptUrl,
      },
      include: { business: true },
    });
    await createAuditLog(
      HalalAuditAction.APPLICATION_REVIEWED,
      userId,
      "HalalApplication",
      id,
      id,
      app,
      { ...updated, manualPaymentPending: true },
      req.ip,
      req.get("user-agent")
    );
    res.json(updated);
  } catch (e: any) {
    res.status(400).json({ message: e.message || "Failed to confirm manual payment" });
  }
}

export async function approveManualPayment(req: Request, res: Response) {
  try {
    const actorId = getUserId(req);
    const { id } = req.params;
    const app = await prisma.halalApplication.findUnique({ where: { id } });
    if (!app) return res.status(404).json({ message: "Application not found" });
    if (app.status !== HalalApplicationStatus.REVIEW) {
      return res.status(400).json({ message: "Manual payment can only be approved in the payment stage" });
    }
    if (app.feePaidAt) return res.status(400).json({ message: "Payment already confirmed" });
    if (app.paymentMethod !== "MANUAL" || !app.paymentReceiptUrl) {
      return res.status(400).json({ message: "No manual payment receipt submitted for this application" });
    }

    const pending = await prisma.halalPayment.findFirst({
      where: {
        applicationId: id,
        method: HalalPaymentMethod.MANUAL,
        status: HalalPaymentStatus.PENDING,
      },
      orderBy: { createdAt: "desc" },
    });
    if (!pending) {
      return res.status(400).json({ message: "No pending manual payment found for this application" });
    }

    await prisma.halalPayment.update({
      where: { id: pending.id },
      data: {
        status: HalalPaymentStatus.COMPLETED,
        paidAt: new Date(),
        processedById: actorId,
      },
    });

    const updated = await prisma.halalApplication.update({
      where: { id },
      data: { feePaidAt: new Date(), status: HalalApplicationStatus.APPROVED },
      include: { business: true },
    });
    await createAuditLog(HalalAuditAction.APPLICATION_APPROVED, actorId, "HalalApplication", id, id, app, updated, req.ip, req.get("user-agent"));
    await generateCertificateForApplication(id, actorId, req.ip, req.get("user-agent"));
    res.json(updated);
  } catch (e: any) {
    res.status(400).json({ message: e.message || "Failed to approve manual payment" });
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
      data: {
        status: HalalApplicationStatus.SUBMITTED,
        submittedAt: new Date(),
      },
      include: { business: true },
    });
    await createAuditLog(HalalAuditAction.APPLICATION_SUBMITTED, userId, "HalalApplication", id, id, old, app, req.ip, req.get("user-agent"));
    res.json(await attachAgreementTemplateResolvedUrl(app as any));
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to submit application" });
  }
}

/** Owner uploads signed/stamped certification agreement (PDF or scan). */
export async function uploadApplicationAgreementOwner(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const file = (req as any).file;
    if (!file) return res.status(400).json({ message: "No file uploaded" });
    const app = await prisma.halalApplication.findUnique({
      where: { id },
      include: { business: true },
    });
    if (!app) return res.status(404).json({ message: "Application not found" });
    if (app.business.userId !== userId) {
      return res.status(403).json({ message: "Only the business owner can upload the signed agreement" });
    }
    if (app.status !== HalalApplicationStatus.SUBMITTED) {
      return res.status(400).json({ message: "Agreement upload is only allowed for submitted applications." });
    }
    const appRow = app as typeof app & {
      agreementMajlisApprovedAt?: Date | null;
      agreementOwnerSubmittedAt?: Date | null;
      agreementOwnerSignedUrl?: string | null;
    };
    if (appRow.agreementMajlisApprovedAt) {
      return res.status(400).json({ message: "The agreement has already been finalized by Majlis." });
    }
    const url = `/uploads/halal/${file.filename}`;
    const updated = await prisma.halalApplication.update({
      where: { id },
      data: {
        agreementOwnerSignedUrl: url,
        agreementOwnerSubmittedAt: new Date(),
      } as Prisma.HalalApplicationUpdateInput,
      include: {
        business: { include: { region: true, zone: true, woreda: true } },
        inspections: { include: { inspector: true } },
        certificate: true,
      },
    });
    res.json(await attachAgreementTemplateResolvedUrl(updated as any));
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to upload agreement" });
  }
}

/** Majlis staff uploads fully executed agreement and marks bilateral workflow complete. */
export async function uploadApplicationAgreementMajlis(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const perms = (req as any).user?.permissions as string[] | undefined;
    const canAct =
      perms?.includes("halal.admin") || perms?.includes("halal.supervisor") || perms?.includes("halal.committee");
    if (!canAct) return res.status(403).json({ message: "Access denied" });
    const { id } = req.params;
    const file = (req as any).file;
    if (!file) return res.status(400).json({ message: "No file uploaded" });
    const app = await prisma.halalApplication.findUnique({
      where: { id },
      include: { business: true },
    });
    if (!app) return res.status(404).json({ message: "Application not found" });
    if (app.status !== HalalApplicationStatus.SUBMITTED) {
      return res.status(400).json({ message: "Agreement can only be finalized while the application is in the agreement stage." });
    }
    const appRow = app as typeof app & {
      agreementMajlisApprovedAt?: Date | null;
      agreementOwnerSubmittedAt?: Date | null;
      agreementOwnerSignedUrl?: string | null;
    };
    if (!appRow.agreementOwnerSubmittedAt || !appRow.agreementOwnerSignedUrl) {
      return res.status(400).json({
        message: "The business owner must upload their signed agreement before Majlis can sign and finalize.",
      });
    }
    if (appRow.agreementMajlisApprovedAt) {
      return res.status(400).json({ message: "Agreement has already been finalized." });
    }
    const url = `/uploads/halal/${file.filename}`;
    const updated = await prisma.halalApplication.update({
      where: { id },
      data: {
        agreementMajlisSignedUrl: url,
        agreementMajlisApprovedAt: new Date(),
      } as Prisma.HalalApplicationUpdateInput,
      include: {
        business: { include: { region: true, zone: true, woreda: true } },
        inspections: { include: { inspector: true } },
        certificate: true,
      },
    });
    await createAuditLog(
      HalalAuditAction.APPLICATION_REVIEWED,
      userId,
      "HalalApplication",
      id,
      id,
      app,
      { agreementMajlisSignedUrl: url, agreementMajlisApprovedAt: (updated as { agreementMajlisApprovedAt?: Date }).agreementMajlisApprovedAt },
      req.ip,
      req.get("user-agent")
    );
    res.json(await attachAgreementTemplateResolvedUrl(updated as any));
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to upload Majlis agreement" });
  }
}

export async function approveApplication(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const body = ApproveApplicationDto.parse(req.body);
    const old = await prisma.halalApplication.findUnique({ where: { id }, include: { inspections: true } });
    if (!old) return res.status(404).json({ message: "Application not found" });
    if (old.status !== HalalApplicationStatus.INSPECTION) {
      return res.status(400).json({ message: "Application must be in Committee Review to approve/reject" });
    }
    const completed = old.inspections.some((i) => i.completedAt != null);
    if (!completed && body.approved) {
      return res.status(400).json({ message: "At least one inspection must be completed before approval" });
    }
    const app = await prisma.halalApplication.update({
      where: { id },
      data: {
        status: body.approved ? HalalApplicationStatus.REVIEW : HalalApplicationStatus.REJECTED,
        approvedById: body.approved ? userId : null,
        approvedAt: body.approved ? new Date() : null,
        rejectionReason: body.approved ? null : body.rejectionReason || "Rejected",
        ...(body.approved
          ? {
              committeeNotes: body.notes?.trim() ? body.notes.trim() : null,
              meetingMinutesUrl: body.meetingMinutesUrl?.trim() ? body.meetingMinutesUrl.trim() : null,
            }
          : {
              committeeNotes: null,
              meetingMinutesUrl: null,
            }),
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
      body.approved
        ? {
            ...app,
            committeeNotes: body.notes ?? null,
            meetingMinutesUrl: body.meetingMinutesUrl ?? null,
          }
        : app,
      req.ip,
      req.get("user-agent")
    );
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
        OR: [
          {
            userRoles: {
              some: {
                role: {
                  permissions: {
                    some: {
                      permission: {
                        name: "halal.inspector",
                      },
                    },
                  },
                },
              },
            },
          },
          {
            userPermissions: {
              some: {
                allowed: true,
                permission: {
                  name: "halal.inspector",
                },
              },
            },
          },
        ],
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
    const body = req.body as {
      applicationId?: string;
      inspectorId?: string;
      inspectorIds?: string[];
      assignments?: { inspectorId: string; expertRole: "TECHNICAL_EXPERT" | "SHARIA_EXPERT" }[];
      scheduledAt?: string;
    };
    const applicationId = body.applicationId || (req.params as any).applicationId;
    const parsed = AssignInspectionDto.parse({ ...body, applicationId });
    const { inspectorId, inspectorIds, scheduledAt, assignments } = parsed;

    let assignmentRows: { inspectorId: string; expertRole: HalalInspectionExpertRole }[] = [];
    if (assignments && assignments.length > 0) {
      assignmentRows = assignments.map((a) => ({
        inspectorId: a.inspectorId,
        expertRole: a.expertRole as HalalInspectionExpertRole,
      }));
    } else {
      const legacyIds = Array.from(
        new Set([...(inspectorIds ?? []), ...(inspectorId ? [inspectorId] : [])])
      );
      assignmentRows = legacyIds.map((id) => ({
        inspectorId: id,
        expertRole: HalalInspectionExpertRole.TECHNICAL_EXPERT,
      }));
    }

    const selectedInspectorIds = assignmentRows.map((r) => r.inspectorId);
    if (!applicationId) return res.status(400).json({ message: "applicationId is required" });
    if (selectedInspectorIds.length === 0) {
      return res.status(400).json({ message: "At least one inspector is required" });
    }
    const app = await prisma.halalApplication.findUnique({
      where: { id: applicationId },
      include: { inspections: true },
    });
    if (!app) return res.status(404).json({ message: "Application not found" });
    if (
      app.status !== HalalApplicationStatus.SUBMITTED &&
      app.status !== HalalApplicationStatus.INSPECTION
    ) {
      return res.status(400).json({ message: "Application must be in inspection workflow" });
    }
    if (app.status === HalalApplicationStatus.SUBMITTED && !(app as { agreementMajlisApprovedAt?: Date | null }).agreementMajlisApprovedAt) {
      return res.status(400).json({
        message:
          "The certification agreement must be signed by the business owner and finalized by Majlis before inspectors can be assigned.",
      });
    }
    const hasCompletedInspection = app.inspections.some((i) => i.completedAt != null);
    if (hasCompletedInspection) {
      return res.status(400).json({ message: "Inspection already completed for this application; cannot assign or reassign." });
    }

    // Eligibility: only users with halal.inspector effective permission can be assigned.
    const eligibleInspectors = await prisma.user.findMany({
      where: {
        id: { in: selectedInspectorIds },
        status: "ACTIVE",
        OR: [
          {
            userRoles: {
              some: {
                role: {
                  permissions: {
                    some: {
                      permission: { name: "halal.inspector" },
                    },
                  },
                },
              },
            },
          },
          {
            userPermissions: {
              some: {
                allowed: true,
                permission: { name: "halal.inspector" },
              },
            },
          },
        ],
      },
      select: { id: true },
    });
    const eligibleInspectorIds = new Set(eligibleInspectors.map((u) => u.id));
    const ineligibleInspectorIds = selectedInspectorIds.filter((id) => !eligibleInspectorIds.has(id));
    if (ineligibleInspectorIds.length > 0) {
      return res.status(400).json({
        message: "Only users with halal.inspector permission can be assigned.",
        ineligibleInspectorIds,
      });
    }

    const existingAssignments = await prisma.halalInspection.findMany({
      where: {
        applicationId,
        inspectorId: { in: selectedInspectorIds },
      },
      select: { inspectorId: true },
    });
    const alreadyAssignedInspectorIds = new Set(existingAssignments.map((a) => a.inspectorId));
    const newRows = assignmentRows.filter((row) => !alreadyAssignedInspectorIds.has(row.inspectorId));
    if (newRows.length === 0) {
      return res.status(400).json({ message: "Selected inspectors are already assigned to this application." });
    }

    const createdInspections = [];
    for (const row of newRows) {
      const ins = await prisma.halalInspection.create({
        data: {
          applicationId,
          inspectorId: row.inspectorId,
          expertRole: row.expertRole,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        },
        include: { application: { include: { business: true } }, inspector: true },
      });
      createdInspections.push(ins);
      await createAuditLog(HalalAuditAction.INSPECTION_ASSIGNED, userId, "HalalInspection", ins.id, applicationId, undefined, ins, req.ip, req.get("user-agent"));
    }

    res.status(201).json({
      items: createdInspections,
      assignedCount: createdInspections.length,
      skippedInspectorIds: Array.from(alreadyAssignedInspectorIds),
    });
  } catch (e: any) {
    res.status(400).json({ message: e.message || "Failed to assign inspection" });
  }
}

export async function listInspections(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const perms = (req as any).user?.permissions as string[] | undefined;
    const canViewAll = perms?.includes("halal.admin") || perms?.includes("halal.supervisor");
    const q = ListHalalInspectionsQuery.parse(req.query);
    const where: any = {};
    if (!canViewAll) where.inspectorId = userId;
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
    const userId = getUserId(req);
    const perms = (req as any).user?.permissions as string[] | undefined;
    const canViewAll = perms?.includes("halal.admin") || perms?.includes("halal.supervisor");
    const { id } = req.params;
    const ins = await prisma.halalInspection.findUnique({
      where: { id },
      include: { application: { include: { business: { include: { region: true } } } }, inspector: true },
    });
    if (!ins) return res.status(404).json({ message: "Inspection not found" });
    if (!canViewAll && ins.inspectorId !== userId) return res.status(403).json({ message: "Access denied" });
    res.json(ins);
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to get inspection" });
  }
}

export async function updateInspection(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const perms = (req as any).user?.permissions as string[] | undefined;
    const canManageAll =
      perms?.includes("halal.admin") ||
      perms?.includes("halal.supervisor") ||
      perms?.includes("halal.committee");
    const { id } = req.params;
    const body = typeof req.body === "object" && req.body !== null ? req.body : {};
    const data = UpdateInspectionAssignmentDto.parse(body);

    const old = await prisma.halalInspection.findUnique({ where: { id } });
    if (!old) return res.status(404).json({ message: "Inspection not found" });
    if (!canManageAll && old.inspectorId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    if (old.completedAt) {
      return res.status(400).json({ message: "Completed inspections cannot be edited" });
    }

    if (data.inspectorId && data.inspectorId !== old.inspectorId) {
      const eligibleInspector = await prisma.user.findFirst({
        where: {
          id: data.inspectorId,
          status: "ACTIVE",
          OR: [
            {
              userRoles: {
                some: {
                  role: {
                    permissions: {
                      some: { permission: { name: "halal.inspector" } },
                    },
                  },
                },
              },
            },
            {
              userPermissions: {
                some: {
                  allowed: true,
                  permission: { name: "halal.inspector" },
                },
              },
            },
          ],
        },
        select: { id: true },
      });
      if (!eligibleInspector) {
        return res.status(400).json({ message: "Only users with halal.inspector permission can be assigned." });
      }
    }

    const updated = await prisma.halalInspection.update({
      where: { id },
      data: {
        inspectorId: data.inspectorId ?? old.inspectorId,
        scheduledAt:
          data.scheduledAt !== undefined
            ? (data.scheduledAt ? new Date(data.scheduledAt) : null)
            : old.scheduledAt,
      },
      include: { application: { include: { business: true } }, inspector: true },
    });
    await createAuditLog(
      HalalAuditAction.INSPECTION_ASSIGNED,
      userId,
      "HalalInspection",
      id,
      old.applicationId,
      old,
      updated,
      req.ip,
      req.get("user-agent")
    );
    res.json(updated);
  } catch (e: any) {
    res.status(400).json({ message: e.message || "Failed to update inspection" });
  }
}

export async function deleteInspection(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const perms = (req as any).user?.permissions as string[] | undefined;
    const canManageAll =
      perms?.includes("halal.admin") ||
      perms?.includes("halal.supervisor") ||
      perms?.includes("halal.committee");
    const { id } = req.params;
    const old = await prisma.halalInspection.findUnique({ where: { id } });
    if (!old) return res.status(404).json({ message: "Inspection not found" });
    if (!canManageAll && old.inspectorId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    if (old.completedAt) {
      return res.status(400).json({ message: "Completed inspections cannot be deleted" });
    }

    await prisma.halalInspection.delete({ where: { id } });
    await createAuditLog(
      HalalAuditAction.INSPECTION_ASSIGNED,
      userId,
      "HalalInspection",
      id,
      old.applicationId,
      old,
      { deleted: true },
      req.ip,
      req.get("user-agent")
    );
    res.status(204).send();
  } catch (e: any) {
    res.status(400).json({ message: e.message || "Failed to delete inspection" });
  }
}

export async function completeInspection(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const body = typeof req.body === "object" && req.body !== null ? req.body : {};
    const data = CompleteInspectionDto.parse(body);
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
    await prisma.halalApplication.update({
      where: { id: old.applicationId },
      data: { status: HalalApplicationStatus.INSPECTION },
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
    const userId = getUserId(req);
    const perms = (req as any).user?.permissions as string[] | undefined;
    const canViewAll =
      perms?.includes("halal.admin") ||
      perms?.includes("halal.supervisor") ||
      perms?.includes("halal.inspector") ||
      perms?.includes("halal.audit") ||
      perms?.includes("halal.committee");
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const status = req.query.status as string | undefined;
    const where: any = {};
    if (status) where.status = status;
    if (!canViewAll) {
      where.application = { business: { userId } };
    }
    const isHalalAdmin = perms?.includes("halal.admin");
    const [rawItems, total] = await Promise.all([
      prisma.halalCertificate.findMany({
        where,
        include: {
          application: { include: { business: true } },
          ...(isHalalAdmin ? { renewals: { orderBy: { renewedAt: "desc" } } } : {}),
        },
        ...paginate(page, limit),
        orderBy: { issuedAt: "desc" },
      }),
      prisma.halalCertificate.count({ where }),
    ]);
    const items = isHalalAdmin
      ? rawItems.map((c) => ({
          ...c,
          lifecycle: buildCertificateLifecycle(c),
        }))
      : rawItems;
    res.json({ items, total, page, limit });
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to list certificates" });
  }
}

export async function getCertificate(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const perms = (req as any).user?.permissions as string[] | undefined;
    const canViewAll =
      perms?.includes("halal.admin") ||
      perms?.includes("halal.supervisor") ||
      perms?.includes("halal.inspector") ||
      perms?.includes("halal.audit") ||
      perms?.includes("halal.committee");
    const isHalalAdmin = perms?.includes("halal.admin");
    const { id } = req.params;
    const cert = await prisma.halalCertificate.findFirst({
      where: { OR: [{ id }, { certificateId: id }] },
      include: {
        application: { include: { business: { include: { region: true } } } },
        ...(isHalalAdmin ? { renewals: { orderBy: { renewedAt: "desc" } } } : {}),
      },
    });
    if (!cert) return res.status(404).json({ message: "Certificate not found" });
    if (!canViewAll && cert.application.business.userId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    res.json(
      isHalalAdmin
        ? {
            ...cert,
            lifecycle: buildCertificateLifecycle(cert),
          }
        : cert
    );
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to get certificate" });
  }
}

export async function getCertificateLifecycle(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const cert = await prisma.halalCertificate.findFirst({
      where: { OR: [{ id }, { certificateId: id }] },
      include: {
        application: { include: { business: true } },
        renewals: { orderBy: { renewedAt: "desc" } },
      },
    });
    if (!cert) return res.status(404).json({ message: "Certificate not found" });
    res.json({
      certificate: cert,
      lifecycle: buildCertificateLifecycle(cert),
      rules: {
        oneCertificatePerBusiness: true,
        cycleYears: HALAL_CERT_CYCLE_YEARS,
        maxAnnualRenewalsPerCycle: MAX_ANNUAL_RENEWALS_PER_CYCLE,
      },
    });
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to load certificate lifecycle" });
  }
}

export async function downloadCertificate(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const perms = (req as any).user?.permissions as string[] | undefined;
    const canViewAll =
      perms?.includes("halal.admin") ||
      perms?.includes("halal.supervisor") ||
      perms?.includes("halal.inspector") ||
      perms?.includes("halal.audit") ||
      perms?.includes("halal.committee");
    const { id } = req.params;
    const cert = await prisma.halalCertificate.findFirst({
      where: { OR: [{ id }, { certificateId: id }] },
      include: { application: { include: { business: true } } },
    });
    if (!cert) return res.status(404).json({ message: "Certificate not found" });
    if (!canViewAll && cert.application.business.userId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
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

// ========== Renewals (annual extensions within 3-year cycle; halal.admin only) ==========
export async function createRenewal(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const { certificateId, newExpiry } = CreateRenewalDto.parse(req.body);
    const cert = await prisma.halalCertificate.findFirst({
      where: { OR: [{ id: certificateId }, { certificateId }] },
    });
    if (!cert) return res.status(404).json({ message: "Certificate not found" });
    if (cert.status !== HalalCertificateStatus.VALID) {
      return res.status(400).json({ message: "Only valid certificates can receive an annual renewal" });
    }
    if (cert.annualRenewalCount >= MAX_ANNUAL_RENEWALS_PER_CYCLE) {
      return res.status(400).json({
        message: `Annual renewals for this cycle are exhausted (${MAX_ANNUAL_RENEWALS_PER_CYCLE} per ${HALAL_CERT_CYCLE_YEARS}-year cycle). Full recertification is required.`,
      });
    }
    const newExpiryDate = new Date(newExpiry);
    const cycleEnd = cycleEndDate(cert.certificationCycleStartedAt);
    if (newExpiryDate > cycleEnd) {
      return res.status(400).json({
        message:
          "New expiry cannot exceed the end of the current 3-year certification cycle. The business must complete full recertification instead.",
      });
    }
    if (newExpiryDate <= cert.expiresAt) {
      return res.status(400).json({ message: "New expiry must be after the current certificate expiry date" });
    }

    const renewal = await prisma.halalRenewal.create({
      data: {
        certificateId: cert.id,
        previousExpiry: cert.expiresAt,
        newExpiry: newExpiryDate,
        status: "APPROVED",
        renewalKind: "ANNUAL",
      },
    });
    await prisma.halalCertificate.update({
      where: { id: cert.id },
      data: {
        expiresAt: newExpiryDate,
        annualRenewalCount: cert.annualRenewalCount + 1,
      },
    });
    await createAuditLog(
      HalalAuditAction.CERTIFICATE_RENEWED,
      userId,
      "HalalRenewal",
      renewal.id,
      cert.applicationId,
      undefined,
      renewal,
      req.ip,
      req.get("user-agent")
    );
    res.status(201).json(renewal);
  } catch (e: any) {
    res.status(400).json({ message: e.message || "Failed to create renewal" });
  }
}

// ========== Violations ==========
export async function listViolations(req: Request, res: Response) {
  try {
    const q = ListHalalViolationsQuery.parse(req.query);
    const where: any = {};
    if (q.certificateId) {
      const cert = await prisma.halalCertificate.findFirst({
        where: { OR: [{ id: q.certificateId }, { certificateId: q.certificateId }] },
      });
      if (cert) where.certificateId = cert.id;
    }
    const [items, total] = await Promise.all([
      prisma.halalViolation.findMany({
        where,
        include: { certificate: { include: { application: { include: { business: true } } } } },
        ...paginate(q.page, q.limit),
        orderBy: { recordedAt: "desc" },
      }),
      prisma.halalViolation.count({ where }),
    ]);
    res.json({ items, total, page: q.page, limit: q.limit });
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to list violations" });
  }
}

export async function createViolation(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const { certificateId, description, severity, action } = CreateViolationDto.parse(req.body);
    const cert = await prisma.halalCertificate.findFirst({
      where: { OR: [{ id: certificateId }, { certificateId }] },
    });
    if (!cert) return res.status(404).json({ message: "Certificate not found" });
    const v = await prisma.halalViolation.create({
      data: { certificateId: cert.id, description, severity, action: action || undefined },
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
