import { Request, Response } from "express";
import { Prisma, PrismaClient, HalalCompetencyStatus, HalalCompetencyRenewalStatus } from "@prisma/client";
import fetch from "node-fetch";
import { generateHalalCompetencyCertificatePDF } from "./halal-competency-pdf-generator.js";
import {
  CreateHalalCompetencyDto,
  UpdateHalalCompetencyDto,
  ScheduleHalalCompetencyInterviewDto,
  RecordHalalCompetencyInterviewDto,
  ListHalalCompetencyQuery,
  ManualPaymentDto,
  HALAL_COMPETENCY_FEE,
} from "./halal.dto.js";
import { paginate } from "../../lib/paginate.js";

const prisma = new PrismaClient();

const RENEWAL_WINDOW_MS = 90 * 24 * 60 * 60 * 1000;

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

function isCompetencyStaff(req: Request): boolean {
  const perms = (req as any).user?.permissions as string[] | undefined;
  return !!(
    perms?.includes("halal.admin") ||
    perms?.includes("halal.supervisor") ||
    perms?.includes("halal.committee") ||
    perms?.includes("halal.review")
  );
}

function canAccessCompetency(req: Request, ownerUserId: string): { ok: boolean; isStaff: boolean } {
  const uid = getUserId(req);
  if (isCompetencyStaff(req)) return { ok: true, isStaff: true };
  if (uid === ownerUserId) return { ok: true, isStaff: false };
  return { ok: false, isStaff: false };
}

async function generateCompetencyCertificateNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.halalCompetencyCertificate.count({
    where: { certificateNumber: { startsWith: `HAL-COMP-${year}-` } },
  });
  return `HAL-COMP-${year}-${(count + 1).toString().padStart(5, "0")}`;
}

async function finalizeCompetencyIssuanceWithBusinessAutoLink(
  id: string,
  paymentMethod: string,
  extra: { chapaRefId?: string | null; manualApprovedById?: string | null },
  ip?: string,
  userAgent?: string
) {
  const row = await finalizeCompetencyIssuance(id, paymentMethod, extra);
  try {
    const { tryAutoFinalizeBusinessApplicationFromWorkerPayments } = await import("./halal.controller.js");
    await tryAutoFinalizeBusinessApplicationFromWorkerPayments(id, ip, userAgent);
  } catch (err) {
    console.error("Auto business Halal certificate after worker competency payment failed:", err);
  }
  return row;
}

async function finalizeCompetencyIssuance(
  id: string,
  paymentMethod: string,
  extra: { chapaRefId?: string | null; manualApprovedById?: string | null }
) {
  const row = await prisma.halalCompetencyCertificate.findUnique({ where: { id } });
  if (!row) throw new Error("Competency application not found");
  if (row.status === HalalCompetencyStatus.ISSUED && row.certificateNumber) return row;
  if (row.status !== HalalCompetencyStatus.PAYMENT_PENDING) {
    throw new Error("Invalid status for issuance");
  }

  const certNum = await generateCompetencyCertificateNumber();
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt);
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  let pdfUrl: string | null = null;
  try {
    const { pdfUrl: url } = await generateHalalCompetencyCertificatePDF({
      certificateNumber: certNum,
      holderName: row.fullName,
      employerName: row.employerName,
      jobTitle: row.jobTitle,
      issuedAt,
      expiresAt,
    });
    pdfUrl = url;
  } catch (err) {
    console.error("Halal competency PDF generation failed:", err);
  }

  return prisma.halalCompetencyCertificate.update({
    where: { id },
    data: {
      certificateNumber: certNum,
      status: HalalCompetencyStatus.ISSUED,
      feePaidAt: issuedAt,
      paymentMethod,
      chapaRefId: extra.chapaRefId ?? undefined,
      manualPaymentApprovedById: extra.manualApprovedById ?? undefined,
      pdfUrl,
      issuedAt,
      expiresAt,
    },
    include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
  });
}

async function finalizeCompetencyRenewal(
  renewalId: string,
  paymentMethod: string,
  extra: { chapaRefId?: string | null; manualApprovedById?: string | null }
) {
  const r = await prisma.halalCompetencyRenewal.findUnique({
    where: { id: renewalId },
    include: { competency: true },
  });
  if (!r) throw new Error("Renewal not found");
  if (r.status === HalalCompetencyRenewalStatus.COMPLETED && r.feePaidAt) return r;
  if (r.status !== HalalCompetencyRenewalStatus.PAYMENT_PENDING) {
    throw new Error("Invalid renewal status");
  }

  const now = new Date();
  const currentExpiry = r.competency.expiresAt ? new Date(r.competency.expiresAt) : now;
  const base = currentExpiry > now ? currentExpiry : now;
  const newExpiry = new Date(base);
  newExpiry.setFullYear(newExpiry.getFullYear() + 1);
  const paidAt = new Date();

  await prisma.$transaction([
    prisma.halalCompetencyRenewal.update({
      where: { id: renewalId },
      data: {
        status: HalalCompetencyRenewalStatus.COMPLETED,
        feePaidAt: paidAt,
        paymentMethod,
        chapaRefId: extra.chapaRefId ?? undefined,
        manualPaymentApprovedById: extra.manualApprovedById ?? undefined,
        newExpiry,
      },
    }),
    prisma.halalCompetencyCertificate.update({
      where: { id: r.competencyId },
      data: { expiresAt: newExpiry },
    }),
  ]);

  return prisma.halalCompetencyRenewal.findUnique({
    where: { id: renewalId },
    include: { competency: true },
  });
}

function parseDateOfBirth(isoDate: string): Date {
  const raw = isoDate.trim();
  const d = new Date(raw.includes("T") ? raw : `${raw}T12:00:00.000Z`);
  if (Number.isNaN(d.getTime())) throw new Error("Invalid date of birth");
  return d;
}

function renewalEligible(cert: { status: HalalCompetencyStatus; expiresAt: Date | null }): boolean {
  if (cert.status !== HalalCompetencyStatus.ISSUED || !cert.expiresAt) return false;
  const exp = new Date(cert.expiresAt).getTime();
  return exp <= Date.now() + RENEWAL_WINDOW_MS;
}

export async function createCompetencyCertificate(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const body = CreateHalalCompetencyDto.parse(req.body);
    const row = await prisma.halalCompetencyCertificate.create({
      data: {
        userId,
        fullName: body.fullName.trim(),
        dateOfBirth: parseDateOfBirth(body.dateOfBirth),
        phone: body.phone.trim(),
        email: body.email.trim(),
        employerName: body.employerName.trim(),
        jobTitle: body.jobTitle?.trim() || null,
        religiousAnswers: body.religiousAnswers as object,
        ...(body.supportLetterUrl?.trim() && { supportLetterUrl: body.supportLetterUrl.trim() }),
        feeAmount: new Prisma.Decimal(HALAL_COMPETENCY_FEE),
      },
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
    });
    res.status(201).json(row);
  } catch (e: any) {
    res.status(400).json({ message: e.message || "Failed to create application" });
  }
}

export async function updateCompetencyCertificate(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const body = UpdateHalalCompetencyDto.parse(req.body);
    const existing = await prisma.halalCompetencyCertificate.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "Not found" });
    if (existing.userId !== userId) return res.status(403).json({ message: "Access denied" });
    if (existing.status !== HalalCompetencyStatus.DRAFT) {
      return res.status(400).json({ message: "Only draft applications can be edited" });
    }
    const row = await prisma.halalCompetencyCertificate.update({
      where: { id },
      data: {
        ...(body.fullName != null && { fullName: body.fullName.trim() }),
        ...(body.dateOfBirth != null && { dateOfBirth: parseDateOfBirth(body.dateOfBirth) }),
        ...(body.phone !== undefined && { phone: body.phone.trim() }),
        ...(body.email !== undefined && { email: body.email.trim() }),
        ...(body.employerName != null && { employerName: body.employerName.trim() }),
        ...(body.jobTitle !== undefined && { jobTitle: body.jobTitle?.trim() || null }),
        ...(body.religiousAnswers != null && { religiousAnswers: body.religiousAnswers as object }),
        ...(body.supportLetterUrl != null && { supportLetterUrl: body.supportLetterUrl.trim() }),
      },
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
    });
    res.json(row);
  } catch (e: any) {
    res.status(400).json({ message: e.message || "Failed to update" });
  }
}

export async function submitCompetencyCertificate(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const existing = await prisma.halalCompetencyCertificate.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "Not found" });
    if (existing.userId !== userId) return res.status(403).json({ message: "Access denied" });
    if (existing.status !== HalalCompetencyStatus.DRAFT) {
      return res.status(400).json({ message: "Only drafts can be submitted" });
    }
    if (!existing.supportLetterUrl?.trim()) {
      return res.status(400).json({ message: "Employer support letter is required before submission" });
    }
    const row = await prisma.halalCompetencyCertificate.update({
      where: { id },
      data: { status: HalalCompetencyStatus.SUBMITTED },
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
    });
    res.json(row);
  } catch (e: any) {
    res.status(400).json({ message: e.message || "Failed to submit" });
  }
}

export async function listCompetencyCertificates(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const staff = isCompetencyStaff(req);
    const q = ListHalalCompetencyQuery.parse(req.query);
    const where: Prisma.HalalCompetencyCertificateWhereInput = {};
    if (!staff) {
      where.userId = userId;
    }
    if (q.status) {
      where.status = q.status;
    }
    const [items, total] = await Promise.all([
      prisma.halalCompetencyCertificate.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          renewals: { where: { status: HalalCompetencyRenewalStatus.PAYMENT_PENDING }, take: 1 },
        },
        ...paginate(q.page, q.limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.halalCompetencyCertificate.count({ where }),
    ]);
    res.json({ items, total, page: q.page, limit: q.limit });
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to list" });
  }
}

export async function getCompetencyCertificate(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const row = await prisma.halalCompetencyCertificate.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        renewals: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    });
    if (!row) return res.status(404).json({ message: "Not found" });
    const { ok } = canAccessCompetency(req, row.userId);
    if (!ok) return res.status(403).json({ message: "Access denied" });
    const pendingRenewal = row.renewals.find((r) => r.status === HalalCompetencyRenewalStatus.PAYMENT_PENDING);
    res.json({
      ...row,
      renewalEligible: renewalEligible(row),
      pendingRenewalId: pendingRenewal?.id ?? null,
    });
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to load" });
  }
}

export async function scheduleCompetencyTheoretical(req: Request, res: Response) {
  try {
    if (!isCompetencyStaff(req)) return res.status(403).json({ message: "Access denied" });
    const { id } = req.params;
    const body = ScheduleHalalCompetencyInterviewDto.parse(req.body);
    const scheduledAt = new Date(body.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) {
      return res.status(400).json({ message: "Invalid scheduled date" });
    }
    const existing = await prisma.halalCompetencyCertificate.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "Not found" });
    if (existing.status !== HalalCompetencyStatus.SUBMITTED) {
      return res.status(400).json({ message: "Application must be submitted first" });
    }
    const row = await prisma.halalCompetencyCertificate.update({
      where: { id },
      data: {
        status: HalalCompetencyStatus.THEORETICAL_SCHEDULED,
        theoreticalScheduledAt: scheduledAt,
        theoreticalPassed: null,
        theoreticalNotes: null,
        theoreticalRecordedAt: null,
        theoreticalRecordedById: null,
      },
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
    });
    res.json(row);
  } catch (e: any) {
    res.status(400).json({ message: e.message || "Failed to schedule" });
  }
}

export async function recordCompetencyTheoretical(req: Request, res: Response) {
  try {
    if (!isCompetencyStaff(req)) return res.status(403).json({ message: "Access denied" });
    const actorId = getUserId(req);
    const { id } = req.params;
    const body = RecordHalalCompetencyInterviewDto.parse(req.body);
    const existing = await prisma.halalCompetencyCertificate.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "Not found" });
    if (existing.status !== HalalCompetencyStatus.THEORETICAL_SCHEDULED) {
      return res.status(400).json({ message: "Theoretical interview is not in scheduled state" });
    }
    const now = new Date();
    const row = await prisma.halalCompetencyCertificate.update({
      where: { id },
      data: {
        theoreticalPassed: body.passed,
        theoreticalNotes: body.notes?.trim() || null,
        theoreticalRecordedAt: now,
        theoreticalRecordedById: actorId,
        status: body.passed ? HalalCompetencyStatus.THEORETICAL_PASSED : HalalCompetencyStatus.THEORETICAL_FAILED,
      },
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
    });
    res.json(row);
  } catch (e: any) {
    res.status(400).json({ message: e.message || "Failed to record result" });
  }
}

export async function scheduleCompetencyTechnical(req: Request, res: Response) {
  try {
    if (!isCompetencyStaff(req)) return res.status(403).json({ message: "Access denied" });
    const { id } = req.params;
    const body = ScheduleHalalCompetencyInterviewDto.parse(req.body);
    const scheduledAt = new Date(body.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) {
      return res.status(400).json({ message: "Invalid scheduled date" });
    }
    const existing = await prisma.halalCompetencyCertificate.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "Not found" });
    if (existing.status !== HalalCompetencyStatus.THEORETICAL_PASSED) {
      return res.status(400).json({ message: "Theoretical stage must be passed first" });
    }
    const row = await prisma.halalCompetencyCertificate.update({
      where: { id },
      data: {
        status: HalalCompetencyStatus.TECHNICAL_SCHEDULED,
        technicalScheduledAt: scheduledAt,
        technicalPassed: null,
        technicalNotes: null,
        technicalRecordedAt: null,
        technicalRecordedById: null,
      },
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
    });
    res.json(row);
  } catch (e: any) {
    res.status(400).json({ message: e.message || "Failed to schedule" });
  }
}

export async function recordCompetencyTechnical(req: Request, res: Response) {
  try {
    if (!isCompetencyStaff(req)) return res.status(403).json({ message: "Access denied" });
    const actorId = getUserId(req);
    const { id } = req.params;
    const body = RecordHalalCompetencyInterviewDto.parse(req.body);
    const existing = await prisma.halalCompetencyCertificate.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "Not found" });
    if (existing.status !== HalalCompetencyStatus.TECHNICAL_SCHEDULED) {
      return res.status(400).json({ message: "Technical interview is not in scheduled state" });
    }
    const now = new Date();
    const row = await prisma.halalCompetencyCertificate.update({
      where: { id },
      data: {
        technicalPassed: body.passed,
        technicalNotes: body.notes?.trim() || null,
        technicalRecordedAt: now,
        technicalRecordedById: actorId,
        status: body.passed ? HalalCompetencyStatus.PAYMENT_PENDING : HalalCompetencyStatus.TECHNICAL_FAILED,
      },
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
    });
    res.json(row);
  } catch (e: any) {
    res.status(400).json({ message: e.message || "Failed to record result" });
  }
}

function chapaPayloadForCompetency(row: {
  fullName: string;
  email: string | null;
  phone: string | null;
  user: { email: string; firstName: string; lastName: string };
  id: string;
}) {
  const secretKey = process.env.CHAPA_SECRET_KEY;
  if (!secretKey) throw new Error("Chapa payment is not configured");
  const amount = HALAL_COMPETENCY_FEE;
  const apiBase = normalizeBaseUrl(process.env.APP_BASE_URL, "http://localhost:4000");
  const frontendUrl = normalizeBaseUrl(process.env.FRONTEND_URL, "http://localhost:8080");
  const txRef = `halalcomp-${row.id}-${Date.now()}`;
  const names = (row.fullName || `${row.user.firstName} ${row.user.lastName}`).trim().split(" ");
  const firstName = names[0] || "Applicant";
  const lastName = names.slice(1).join(" ") || ".";
  const email = row.email?.trim() || row.user.email;
  const callbackUrl = new URL(`/api/v1/halal/competency-certificates/${row.id}/payment/chapa-callback`, apiBase).toString();
  const returnUrl = new URL(`/halal/competency/${row.id}?payment=chapa`, frontendUrl).toString();
  const rawDesc = `Halal competency cert ${amount} ETB`;
  const customizationDescription = rawDesc
    .replace(/[^A-Za-z0-9._\-\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 50);
  return {
    secretKey,
    payload: {
      amount: String(amount),
      currency: "ETB",
      email,
      first_name: firstName,
      last_name: lastName,
      phone_number: (row.phone || "").replace(/\D/g, "").slice(-9)
        ? `0${(row.phone || "").replace(/\D/g, "").slice(-9)}`
        : undefined,
      tx_ref: txRef,
      callback_url: callbackUrl,
      return_url: returnUrl,
      customization: {
        title: "Halal competency",
        description: customizationDescription,
      },
    },
    txRef,
  };
}

export async function initCompetencyChapaPayment(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const perms = (req as any).user?.permissions as string[] | undefined;
    const isAdmin = perms?.includes("halal.admin") || perms?.includes("halal.supervisor");
    const { id } = req.params;
    const row = await prisma.halalCompetencyCertificate.findUnique({
      where: { id },
      include: { user: { select: { email: true, firstName: true, lastName: true } } },
    });
    if (!row) return res.status(404).json({ message: "Not found" });
    if (row.userId !== userId && !isAdmin) return res.status(403).json({ message: "Access denied" });
    if (row.status !== HalalCompetencyStatus.PAYMENT_PENDING) {
      return res.status(400).json({ message: "Payment is not pending for this application" });
    }
    if (row.feePaidAt) return res.status(400).json({ message: "Already paid" });

    const { secretKey, payload, txRef } = chapaPayloadForCompetency(row);

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
      const errMsg =
        typeof data.message === "string"
          ? data.message
          : data.message && typeof data.message === "object"
            ? (data.message.customization?.title || data.message.message || JSON.stringify(data.message))
            : "Failed to initialize Chapa payment";
      return res.status(400).json({ message: errMsg });
    }
    await prisma.halalCompetencyCertificate.update({
      where: { id },
      data: { chapaTxRef: txRef },
    });
    res.json({ checkoutUrl: data.data.checkout_url, txRef });
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to initialize payment" });
  }
}

export async function competencyChapaCallback(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { trx_ref, ref_id, status } = req.query as { trx_ref?: string; ref_id?: string; status?: string };
    if (!id || !trx_ref || status !== "success") {
      return res.status(400).send("Invalid callback");
    }
    const row = await prisma.halalCompetencyCertificate.findUnique({ where: { id } });
    if (!row || row.chapaTxRef !== trx_ref) {
      return res.status(404).send("Not found");
    }
    if (row.status === HalalCompetencyStatus.ISSUED || row.feePaidAt) {
      return res.status(200).send("OK");
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
    await finalizeCompetencyIssuanceWithBusinessAutoLink(id, "CHAPA", { chapaRefId: ref_id || null }, req.ip, req.get("user-agent"));
    res.status(200).send("OK");
  } catch (e: any) {
    res.status(500).send("Error");
  }
}

export async function confirmCompetencyManualPayment(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const body = ManualPaymentDto.parse(req.body);
    const file = (req as any).file;
    if (!file) return res.status(400).json({ message: "Receipt file is required" });
    const row = await prisma.halalCompetencyCertificate.findUnique({ where: { id } });
    if (!row) return res.status(404).json({ message: "Not found" });
    if (row.userId !== userId) return res.status(403).json({ message: "Access denied" });
    if (row.status !== HalalCompetencyStatus.PAYMENT_PENDING || row.feePaidAt) {
      return res.status(400).json({ message: "Invalid state for manual payment" });
    }
    const receiptUrl = `/uploads/halal/${file.filename}`;
    const updated = await prisma.halalCompetencyCertificate.update({
      where: { id },
      data: {
        paymentMethod: "MANUAL",
        paymentBankName: body.bankName,
        paymentReceiptUrl: receiptUrl,
      },
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
    });
    res.json(updated);
  } catch (e: any) {
    res.status(400).json({ message: e.message || "Failed to submit receipt" });
  }
}

export async function approveCompetencyManualPayment(req: Request, res: Response) {
  try {
    const actorId = getUserId(req);
    const { id } = req.params;
    const row = await prisma.halalCompetencyCertificate.findUnique({ where: { id } });
    if (!row) return res.status(404).json({ message: "Not found" });
    if (row.status !== HalalCompetencyStatus.PAYMENT_PENDING || row.feePaidAt) {
      return res.status(400).json({ message: "No pending manual payment" });
    }
    if (row.paymentMethod !== "MANUAL" || !row.paymentReceiptUrl) {
      return res.status(400).json({ message: "No manual receipt on file" });
    }
    await finalizeCompetencyIssuanceWithBusinessAutoLink(id, "MANUAL", { manualApprovedById: actorId }, req.ip, req.get("user-agent"));
    const full = await prisma.halalCompetencyCertificate.findUnique({
      where: { id },
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
    });
    res.json(full);
  } catch (e: any) {
    res.status(400).json({ message: e.message || "Failed to approve payment" });
  }
}

export async function downloadCompetencyCertificate(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const row = await prisma.halalCompetencyCertificate.findUnique({ where: { id } });
    if (!row) return res.status(404).json({ message: "Not found" });
    const { ok } = canAccessCompetency(req, row.userId);
    if (!ok) return res.status(403).json({ message: "Access denied" });
    if (row.status !== HalalCompetencyStatus.ISSUED || !row.pdfUrl) {
      return res.status(404).json({ message: "Certificate PDF not available" });
    }
    const pathModule = (await import("path")).default;
    const fs = await import("fs");
    const relPath = row.pdfUrl.startsWith("/") ? row.pdfUrl.slice(1) : row.pdfUrl;
    const fullPath = pathModule.join(process.cwd(), relPath);
    if (!fs.existsSync(fullPath)) return res.status(404).json({ message: "File not found" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="halal-competency-${row.certificateNumber ?? id}.pdf"`
    );
    res.sendFile(pathModule.resolve(fullPath));
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Download failed" });
  }
}

export async function verifyCompetencyCertificatePublic(req: Request, res: Response) {
  try {
    const { certificateNumber } = req.params;
    const row = await prisma.halalCompetencyCertificate.findUnique({
      where: { certificateNumber },
      include: { user: { select: { firstName: true, lastName: true } } },
    });
    if (!row || row.status !== HalalCompetencyStatus.ISSUED) {
      return res.json({ valid: false, message: "Certificate not found" });
    }
    const expiresAt = row.expiresAt ? new Date(row.expiresAt) : null;
    const notExpired = expiresAt ? expiresAt.getTime() >= Date.now() : false;
    res.json({
      valid: true,
      certificateNumber: row.certificateNumber,
      holderName: row.fullName,
      employerName: row.employerName,
      jobTitle: row.jobTitle,
      issuedAt: row.issuedAt,
      expiresAt: row.expiresAt,
      currentlyValid: notExpired,
    });
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Verification failed", valid: false });
  }
}

export async function createCompetencyRenewal(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const cert = await prisma.halalCompetencyCertificate.findUnique({
      where: { id },
      include: { renewals: true },
    });
    if (!cert) return res.status(404).json({ message: "Not found" });
    if (cert.userId !== userId) return res.status(403).json({ message: "Access denied" });
    if (!renewalEligible(cert)) {
      return res.status(400).json({
        message: "Renewal opens within 90 days before expiry, or after expiry, while the certificate is issued.",
      });
    }
    const pending = cert.renewals.some((r) => r.status === HalalCompetencyRenewalStatus.PAYMENT_PENDING);
    if (pending) {
      return res.status(400).json({ message: "A renewal payment is already in progress" });
    }
    if (!cert.expiresAt) {
      return res.status(400).json({ message: "Certificate has no expiry date" });
    }
    const renewal = await prisma.halalCompetencyRenewal.create({
      data: {
        competencyId: id,
        previousExpiry: cert.expiresAt,
        feeAmount: new Prisma.Decimal(HALAL_COMPETENCY_FEE),
        status: HalalCompetencyRenewalStatus.PAYMENT_PENDING,
      },
    });
    res.status(201).json(renewal);
  } catch (e: any) {
    res.status(400).json({ message: e.message || "Failed to start renewal" });
  }
}

export async function initCompetencyRenewalChapaPayment(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const perms = (req as any).user?.permissions as string[] | undefined;
    const isAdmin = perms?.includes("halal.admin") || perms?.includes("halal.supervisor");
    const { renewalId } = req.params;
    const renewal = await prisma.halalCompetencyRenewal.findUnique({
      where: { id: renewalId },
      include: {
        competency: {
          include: { user: { select: { email: true, firstName: true, lastName: true } } },
        },
      },
    });
    if (!renewal) return res.status(404).json({ message: "Not found" });
    if (renewal.competency.userId !== userId && !isAdmin) return res.status(403).json({ message: "Access denied" });
    if (renewal.status !== HalalCompetencyRenewalStatus.PAYMENT_PENDING || renewal.feePaidAt) {
      return res.status(400).json({ message: "Renewal payment not pending" });
    }

    const c = renewal.competency;
    const apiBase = normalizeBaseUrl(process.env.APP_BASE_URL, "http://localhost:4000");
    const frontendUrl = normalizeBaseUrl(process.env.FRONTEND_URL, "http://localhost:8080");
    const secretKey = process.env.CHAPA_SECRET_KEY;
    if (!secretKey) return res.status(500).json({ message: "Chapa payment is not configured" });
    const amount = HALAL_COMPETENCY_FEE;
    const txRef = `halalcompr-${renewalId}-${Date.now()}`;
    const names = (c.fullName || `${c.user.firstName} ${c.user.lastName}`).trim().split(" ");
    const firstName = names[0] || "Applicant";
    const lastName = names.slice(1).join(" ") || ".";
    const email = c.email?.trim() || c.user.email;
    const callbackUrl = new URL(`/api/v1/halal/competency-renewals/${renewalId}/payment/chapa-callback`, apiBase).toString();
    const returnUrl = new URL(`/halal/competency/${c.id}?renewalPayment=chapa`, frontendUrl).toString();
    const rawDesc = `Halal competency renewal ${amount} ETB`;
    const customizationDescription = rawDesc
      .replace(/[^A-Za-z0-9._\-\s]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 50);
    const payload = {
      amount: String(amount),
      currency: "ETB",
      email,
      first_name: firstName,
      last_name: lastName,
      phone_number: (c.phone || "").replace(/\D/g, "").slice(-9)
        ? `0${(c.phone || "").replace(/\D/g, "").slice(-9)}`
        : undefined,
      tx_ref: txRef,
      callback_url: callbackUrl,
      return_url: returnUrl,
      customization: {
        title: "Halal comp renew",
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
      const errMsg =
        typeof data.message === "string"
          ? data.message
          : data.message && typeof data.message === "object"
            ? (data.message.customization?.title || data.message.message || JSON.stringify(data.message))
            : "Failed to initialize Chapa payment";
      return res.status(400).json({ message: errMsg });
    }
    await prisma.halalCompetencyRenewal.update({
      where: { id: renewalId },
      data: { chapaTxRef: txRef },
    });
    res.json({ checkoutUrl: data.data.checkout_url, txRef });
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to initialize payment" });
  }
}

export async function competencyRenewalChapaCallback(req: Request, res: Response) {
  try {
    const { renewalId } = req.params;
    const { trx_ref, ref_id, status } = req.query as { trx_ref?: string; ref_id?: string; status?: string };
    if (!renewalId || !trx_ref || status !== "success") {
      return res.status(400).send("Invalid callback");
    }
    const renewal = await prisma.halalCompetencyRenewal.findUnique({ where: { id: renewalId } });
    if (!renewal || renewal.chapaTxRef !== trx_ref) {
      return res.status(404).send("Not found");
    }
    if (renewal.status === HalalCompetencyRenewalStatus.COMPLETED || renewal.feePaidAt) {
      return res.status(200).send("OK");
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
    await finalizeCompetencyRenewal(renewalId, "CHAPA", { chapaRefId: ref_id || null });
    res.status(200).send("OK");
  } catch (e: any) {
    res.status(500).send("Error");
  }
}

export async function confirmCompetencyRenewalManualPayment(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const { renewalId } = req.params;
    const body = ManualPaymentDto.parse(req.body);
    const file = (req as any).file;
    if (!file) return res.status(400).json({ message: "Receipt file is required" });
    const renewal = await prisma.halalCompetencyRenewal.findUnique({
      where: { id: renewalId },
      include: { competency: true },
    });
    if (!renewal) return res.status(404).json({ message: "Not found" });
    if (renewal.competency.userId !== userId) return res.status(403).json({ message: "Access denied" });
    if (renewal.status !== HalalCompetencyRenewalStatus.PAYMENT_PENDING || renewal.feePaidAt) {
      return res.status(400).json({ message: "Invalid state" });
    }
    const receiptUrl = `/uploads/halal/${file.filename}`;
    const updated = await prisma.halalCompetencyRenewal.update({
      where: { id: renewalId },
      data: {
        paymentMethod: "MANUAL",
        paymentBankName: body.bankName,
        paymentReceiptUrl: receiptUrl,
      },
    });
    res.json(updated);
  } catch (e: any) {
    res.status(400).json({ message: e.message || "Failed to submit receipt" });
  }
}

export async function approveCompetencyRenewalManualPayment(req: Request, res: Response) {
  try {
    const actorId = getUserId(req);
    const { renewalId } = req.params;
    const renewal = await prisma.halalCompetencyRenewal.findUnique({ where: { id: renewalId } });
    if (!renewal) return res.status(404).json({ message: "Not found" });
    if (renewal.status !== HalalCompetencyRenewalStatus.PAYMENT_PENDING || renewal.feePaidAt) {
      return res.status(400).json({ message: "No pending manual renewal payment" });
    }
    if (renewal.paymentMethod !== "MANUAL" || !renewal.paymentReceiptUrl) {
      return res.status(400).json({ message: "No manual receipt on file" });
    }
    await finalizeCompetencyRenewal(renewalId, "MANUAL", { manualApprovedById: actorId });
    const full = await prisma.halalCompetencyRenewal.findUnique({
      where: { id: renewalId },
      include: { competency: true },
    });
    res.json(full);
  } catch (e: any) {
    res.status(400).json({ message: e.message || "Failed to approve" });
  }
}
