import { Request, Response } from "express";
import { Prisma, PrismaClient, HalalApplicationStatus, HalalBusinessStatus, HalalCertificateStatus, HalalAuditAction } from "@prisma/client";
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
  ManualPaymentDto,
  ListHalalBusinessesQuery,
  ListHalalApplicationsQuery,
  ListHalalInspectionsQuery,
  ListHalalViolationsQuery,
} from "./halal.dto.js";
import { paginate } from "../../lib/paginate.js";
import fetch from "node-fetch";

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
        name: data.name,
        category: data.category,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        regionId: data.regionId || undefined,
        zoneId: data.zoneId || undefined,
        woredaId: data.woredaId || undefined,
        kebeleName: data.kebeleName || undefined,
        latitude: data.latitude ?? undefined,
        longitude: data.longitude ?? undefined,
        address: data.address || undefined,
        ownerNationalId: data.ownerNationalId || undefined,
        ownerGender: data.ownerGender || undefined,
        ownerDateOfBirth: data.ownerDateOfBirth ? new Date(data.ownerDateOfBirth) : undefined,
        ownerHomeAddress: data.ownerHomeAddress || undefined,
        ownerRole: data.ownerRole || undefined,
        brandName: data.brandName || undefined,
        yearEstablished: data.yearEstablished ?? undefined,
        businessType: data.businessType || undefined,
        tinNumber: data.tinNumber || undefined,
        declarationSignature: data.declarationSignature || undefined,
        declarationSignedAt: data.declarationSignature ? new Date() : undefined,
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
    const updateData: Record<string, unknown> = {};
    if (data.name != null) updateData.name = data.name;
    if (data.category != null) updateData.category = data.category;
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
    if (data.declarationSignature !== undefined) {
      updateData.declarationSignature = data.declarationSignature || null;
      updateData.declarationSignedAt = data.declarationSignature ? new Date() : null;
    }
    if (data.productList !== undefined) updateData.productList = data.productList ?? null;
    if (data.documents !== undefined) updateData.documents = data.documents ?? null;
    const updated = await prisma.halalBusiness.update({
      where: { id },
      data: updateData as any,
      include: { region: true, zone: true, woreda: true },
    });
    res.json(updated);
  } catch (e: any) {
    res.status(400).json({ message: e.message || "Failed to update business" });
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

export async function deleteBusiness(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const biz = await prisma.halalBusiness.findUnique({
      where: { id },
      include: { _count: { select: { applications: true } } },
    });
    if (!biz) return res.status(404).json({ message: "Business not found" });
    if (biz.userId !== userId) return res.status(403).json({ message: "Access denied" });
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
    const biz = await prisma.halalBusiness.findUnique({ where: { id }, include: { region: true, zone: true, woreda: true } });
    if (!biz) return res.status(404).json({ message: "Business not found" });
    if (biz.status !== HalalBusinessStatus.PENDING_APPROVAL) {
      return res.status(400).json({ message: `Business is already ${biz.status}. Only pending businesses can be approved.` });
    }
    const updated = await prisma.halalBusiness.update({
      where: { id },
      data: { status: HalalBusinessStatus.APPROVED },
      include: { region: true, zone: true, woreda: true },
    });
    await createAuditLog(HalalAuditAction.BUSINESS_APPROVED, userId, "HalalBusiness", id, undefined, { status: biz.status }, { status: updated.status }, req.ip, req.get("user-agent"));
    res.json(updated);
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
    // One active application per business (exclude REJECTED - they can reapply)
    const existing = await prisma.halalApplication.findFirst({
      where: {
        businessId: data.businessId,
        status: { not: HalalApplicationStatus.REJECTED },
      },
    });
    if (existing) {
      return res.status(400).json({
        message: "This business already has an active Halal certification application. Complete or withdraw the existing application before submitting a new one.",
      });
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
    const isAdmin = perms?.includes("halal.admin") || perms?.includes("halal.review") || perms?.includes("halal.inspector");
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

const DEFAULT_CERTIFICATION_FEE = 500;

export async function getApplication(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const perms = (req as any).user?.permissions as string[] | undefined;
    const isAdmin = perms?.includes("halal.admin") || perms?.includes("halal.review") || perms?.includes("halal.inspector");
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
    if (!isAdmin && app.business.userId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    // Staff cannot access DRAFT applications (only visible to the owner)
    if (isAdmin && app.status === HalalApplicationStatus.DRAFT) {
      return res.status(404).json({ message: "Application not found" });
    }
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

export async function deleteApplication(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const app = await prisma.halalApplication.findUnique({
      where: { id },
      include: { business: true },
    });
    if (!app) return res.status(404).json({ message: "Application not found" });
    if (app.business.userId !== userId) return res.status(403).json({ message: "Access denied" });
    // Withdraw: DRAFT or SUBMITTED (only before payment)
    const canWithdraw =
      app.status === HalalApplicationStatus.DRAFT ||
      (app.status === HalalApplicationStatus.SUBMITTED && !app.feePaidAt);
    if (!canWithdraw) {
      return res.status(400).json({
        message: "Only draft or unpaid submitted applications can be withdrawn. Once payment is confirmed, withdrawal is not allowed.",
      });
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
    if (app.status !== HalalApplicationStatus.SUBMITTED) {
      return res.status(400).json({ message: "Payment can only be confirmed for submitted applications" });
    }
    if (app.feePaidAt) return res.status(400).json({ message: "Payment already confirmed" });
    const updated = await prisma.halalApplication.update({
      where: { id },
      data: { feePaidAt: new Date() },
      include: { business: true },
    });
    await createAuditLog(HalalAuditAction.APPLICATION_SUBMITTED, userId, "HalalApplication", id, id, app, updated, req.ip, req.get("user-agent"));
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
    const isAdmin = perms?.includes("halal.admin") || perms?.includes("halal.review");
    const { id } = req.params;
    const app = await prisma.halalApplication.findUnique({
      where: { id },
      include: { business: true },
    });
    if (!app) return res.status(404).json({ message: "Application not found" });
    if (app.business.userId !== userId && !isAdmin) return res.status(403).json({ message: "Access denied" });
    if (app.status !== HalalApplicationStatus.SUBMITTED) {
      return res.status(400).json({ message: "Payment can only be initiated for submitted applications" });
    }
    if (app.feePaidAt) return res.status(400).json({ message: "Payment already confirmed" });
    const secretKey = process.env.CHAPA_SECRET_KEY;
    if (!secretKey) return res.status(500).json({ message: "Chapa payment is not configured" });
    const amount = Number(app.feeAmount ?? 500);
    const apiBase = process.env.APP_BASE_URL || "http://localhost:4000";
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8080";
    const txRef = `halal-${id}-${Date.now()}`;
    const names = (app.business.contactName || "Customer").trim().split(" ");
    const firstName = names[0] || "Customer";
    const lastName = names.slice(1).join(" ") || ".";
    const payload = {
      amount: String(amount),
      currency: "ETB",
      email: app.business.contactEmail,
      first_name: firstName,
      last_name: lastName,
      phone_number: (app.business.contactPhone || "").replace(/\D/g, "").slice(-9) ? `0${(app.business.contactPhone || "").replace(/\D/g, "").slice(-9)}` : undefined,
      tx_ref: txRef,
      callback_url: `${apiBase}/api/v1/halal/applications/${id}/payment/chapa-callback`,
      return_url: `${frontendUrl}/halal/applications/${id}?payment=chapa`,
      customization: {
        title: "Halal Cert Fee", // Chapa limit: 16 chars
        description: `Payment for ${app.business.name} - Halal certification`,
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
    await prisma.halalApplication.update({
      where: { id },
      data: {
        feePaidAt: new Date(),
        paymentMethod: "CHAPA",
        chapaTxRef: trx_ref,
        chapaRefId: ref_id || null,
      },
      include: { business: true },
    });
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
    if (app.status !== HalalApplicationStatus.SUBMITTED) {
      return res.status(400).json({ message: "Payment can only be confirmed for submitted applications" });
    }
    if (app.feePaidAt) return res.status(400).json({ message: "Payment already confirmed" });
    const receiptUrl = `/uploads/halal/${file.filename}`;
    const updated = await prisma.halalApplication.update({
      where: { id },
      data: {
        feePaidAt: new Date(),
        paymentMethod: "MANUAL",
        paymentBankName: body.bankName,
        paymentReceiptUrl: receiptUrl,
      },
      include: { business: true },
    });
    await createAuditLog(HalalAuditAction.APPLICATION_SUBMITTED, userId, "HalalApplication", id, id, app, updated, req.ip, req.get("user-agent"));
    res.json(updated);
  } catch (e: any) {
    res.status(400).json({ message: e.message || "Failed to confirm manual payment" });
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
              permissions: {
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
