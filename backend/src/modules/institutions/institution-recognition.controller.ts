import { Request, Response } from "express";
import * as fs from "fs";
import * as path from "path";
import { z } from "zod";
import { InstitutionRecognitionStatus, InstitutionRecognitionPaymentMethod, InstitutionAuditAction } from "@prisma/client";
import prisma from "../../db/client.js";
import { CreateInstitutionRecognitionDto, PreviewInstitutionRecognitionDto } from "./institution-recognition.dto.js";
import {
  generateInstitutionRecognitionPdf,
  renderMosqueRecognitionCertificateBuffer,
} from "./institution-recognition-pdf-generator.js";

export const INSTITUTION_RECOGNITION_FEE_ETB = 10_000;

function getUserId(req: Request): string | undefined {
  return (req as any).user?.id;
}

function normalizeBaseUrl(raw: string | undefined, fallback: string): string {
  const candidate = (raw || fallback).trim();
  const withProtocol = /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`;
  try {
    const u = new URL(withProtocol);
    return u.origin;
  } catch {
    return fallback;
  }
}

/** Chapa: title ≤16 chars; description ≤50, only [A-Za-z0-9. _-] and spaces */
function chapaCustomizationTitle(): string {
  return "Inst recognition".slice(0, 16);
}

function chapaCustomizationDescription(institutionName: string): string {
  const cleaned = institutionName
    .replace(/[\u2013\u2014\u2212]/g, "-")
    .replace(/[^a-zA-Z0-9.\-_ ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 50);
  if (cleaned.length > 0) return cleaned;
  return "Institution recognition fee".slice(0, 50);
}

/** Chapa rejects many synthetic/local domains; prefer real staff email or env fallback */
function chapaPayerEmail(userEmail: string | null | undefined, recognitionId: string): string {
  const fromEnv = process.env.CHAPA_DEFAULT_PAYER_EMAIL?.trim();
  const envOk = fromEnv && /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(fromEnv);
  const tag = recognitionId.replace(/[^a-z0-9]/gi, "").slice(0, 24);
  const defaultFallback = tag ? `billing+ir${tag}@oromiamajlis.org` : "billing@oromiamajlis.org";
  const fallback = envOk ? fromEnv! : defaultFallback;

  const raw = userEmail?.trim();
  if (!raw) return fallback;
  const lower = raw.toLowerCase();
  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(lower)) return fallback;
  if (lower.endsWith(".local") || lower.includes("@majlis.local")) return fallback;
  return lower;
}

async function nextRecognitionCertificateNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `IRR-${year}-`;
  const all = await prisma.institutionRecognition.findMany({
    where: { certificateNumber: { startsWith: prefix } },
    select: { certificateNumber: true },
  });
  let maxNum = 0;
  for (const row of all) {
    if (!row.certificateNumber) continue;
    const num = parseInt(row.certificateNumber.replace(prefix, ""), 10);
    if (!Number.isNaN(num) && num > maxNum) maxNum = num;
  }
  const nextNum = maxNum + 1;
  return `${prefix}${String(nextNum).padStart(5, "0")}`;
}

async function hasPendingRecognition(institutionId: string): Promise<boolean> {
  const n = await prisma.institutionRecognition.count({
    where: {
      institutionId,
      status: { in: [InstitutionRecognitionStatus.PENDING_PAYMENT, InstitutionRecognitionStatus.MANUAL_PENDING_APPROVAL] },
    },
  });
  return n > 0;
}

async function finalizeRecognitionIssuance(
  recognitionId: string,
  paymentMethod: InstitutionRecognitionPaymentMethod,
  chapaRefId?: string | null
) {
  const rec = await prisma.institutionRecognition.findUnique({
    where: { id: recognitionId },
    include: { institution: true },
  });
  if (!rec) throw new Error("Recognition not found");
  if (rec.status === InstitutionRecognitionStatus.COMPLETED && rec.pdfUrl && rec.certificateNumber) {
    return rec;
  }

  if (paymentMethod === InstitutionRecognitionPaymentMethod.MANUAL) {
    if (rec.status !== InstitutionRecognitionStatus.MANUAL_PENDING_APPROVAL) {
      throw new Error("Manual payment is not pending approval");
    }
  } else if (rec.status !== InstitutionRecognitionStatus.PENDING_PAYMENT) {
    throw new Error("Recognition is not pending payment");
  }

  const certificateNumber = await nextRecognitionCertificateNumber();
  const { pdfUrl } = await generateInstitutionRecognitionPdf({
    certificateNumber,
    institutionNameOnCert: rec.institutionNameOnCert,
    institutionType: rec.institution.type,
    zoneCityAdmin: rec.zoneCityAdmin,
    districtSubcity: rec.districtSubcity,
    gandaKebele: rec.gandaKebele,
    issueDate: rec.issueDate,
  });

  const updated = await prisma.institutionRecognition.update({
    where: { id: recognitionId },
    data: {
      status: InstitutionRecognitionStatus.COMPLETED,
      certificateNumber,
      pdfUrl,
      issuedAt: new Date(),
      paymentMethod,
      chapaRefId: chapaRefId ?? undefined,
    },
    include: { institution: true },
  });

  await prisma.institutionAuditLog.create({
    data: {
      institutionId: rec.institutionId,
      action: InstitutionAuditAction.INSTITUTION_RECOGNITION_ISSUED,
      actorId: rec.createdById,
      entityType: "InstitutionRecognition",
      entityId: recognitionId,
      description: `Recognition certificate ${certificateNumber} issued`,
    },
  });

  return updated;
}

// ---------- Public ----------
export async function verifyRecognitionCertificate(req: Request, res: Response) {
  try {
    const { certificateNumber } = req.params;
    const rec = await prisma.institutionRecognition.findFirst({
      where: { certificateNumber, status: InstitutionRecognitionStatus.COMPLETED },
      include: {
        institution: {
          include: {
            region: { select: { name: true } },
            zone: { select: { name: true } },
            woreda: { select: { name: true } },
            kebele: { select: { name: true } },
          },
        },
      },
    });
    if (!rec || !rec.certificateNumber) {
      return res.status(404).json({ valid: false, message: "Certificate not found" });
    }
    const now = new Date();
    res.json({
      valid: true,
      certificateNumber: rec.certificateNumber,
      institution: {
        id: rec.institution.id,
        name: rec.institution.name,
        institutionCode: rec.institution.institutionCode,
        type: rec.institution.type,
        status: rec.institution.status,
        region: rec.institution.region?.name ?? null,
        zone: rec.institution.zone?.name ?? null,
        woreda: rec.institution.woreda?.name ?? null,
        kebele: rec.institution.kebele?.name ?? rec.institution.kebeleName ?? null,
      },
      recognition: {
        institutionNameOnCert: rec.institutionNameOnCert,
        zoneCityAdmin: rec.zoneCityAdmin,
        districtSubcity: rec.districtSubcity,
        gandaKebele: rec.gandaKebele,
        issueDate: rec.issueDate,
        issuedAt: rec.issuedAt,
        paymentMethod: rec.paymentMethod,
        amountEtb: rec.amountEtb.toString(),
      },
      verifiedAt: now.toISOString(),
    });
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Verification failed" });
  }
}

export async function chapaCallback(req: Request, res: Response) {
  try {
    const { recognitionId } = req.params;
    const { trx_ref, ref_id, status } = req.query as { trx_ref?: string; ref_id?: string; status?: string };
    if (!recognitionId || !trx_ref || status !== "success") {
      return res.status(400).send("Invalid callback");
    }
    const rec = await prisma.institutionRecognition.findUnique({ where: { id: recognitionId } });
    if (!rec || rec.chapaTxRef !== trx_ref) {
      return res.status(404).send("Recognition not found");
    }
    if (rec.status === InstitutionRecognitionStatus.COMPLETED) {
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

    await finalizeRecognitionIssuance(recognitionId, InstitutionRecognitionPaymentMethod.CHAPA, ref_id ?? null);
    res.status(200).send("OK");
  } catch (e: any) {
    console.error("Institution recognition Chapa callback error:", e);
    res.status(500).send("Error");
  }
}

// ---------- Protected ----------
export async function createRecognition(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthenticated" });

    const { institutionId } = req.params;
    const body = CreateInstitutionRecognitionDto.parse(req.body);

    const institution = await prisma.institution.findUnique({ where: { id: institutionId } });
    if (!institution) return res.status(404).json({ message: "Institution not found" });

    if (await hasPendingRecognition(institutionId)) {
      return res.status(400).json({ message: "This institution already has a recognition request awaiting payment" });
    }

    const recognition = await prisma.institutionRecognition.create({
      data: {
        institutionId,
        createdById: userId,
        institutionNameOnCert: body.institutionNameOnCert.trim(),
        zoneCityAdmin: body.zoneCityAdmin.trim(),
        districtSubcity: body.districtSubcity.trim(),
        gandaKebele: body.gandaKebele.trim(),
        issueDate: body.issueDate,
        questionnaire: body.questionnaire as object,
        amountEtb: INSTITUTION_RECOGNITION_FEE_ETB,
        status: InstitutionRecognitionStatus.PENDING_PAYMENT,
      },
      include: { institution: { select: { id: true, name: true, institutionCode: true, type: true } } },
    });

    await prisma.institutionAuditLog.create({
      data: {
        institutionId,
        action: InstitutionAuditAction.INSTITUTION_RECOGNITION_CREATED,
        actorId: userId,
        entityType: "InstitutionRecognition",
        entityId: recognition.id,
        description: "Institution recognition request created",
      },
    });

    res.status(201).json(recognition);
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ message: e.issues[0]?.message ?? "Invalid input" });
    }
    const message = e instanceof Error ? e.message : "Failed to create recognition";
    res.status(400).json({ message });
  }
}

export async function listRecognitionsForInstitution(req: Request, res: Response) {
  try {
    const { institutionId } = req.params;
    const items = await prisma.institutionRecognition.findMany({
      where: { institutionId },
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        manualPaymentApprovedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    res.json({ items });
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to list recognitions" });
  }
}

export async function getRecognition(req: Request, res: Response) {
  try {
    const { recognitionId } = req.params;
    const rec = await prisma.institutionRecognition.findUnique({
      where: { id: recognitionId },
      include: {
        institution: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        manualPaymentApprovedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!rec) return res.status(404).json({ message: "Not found" });
    res.json(rec);
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to get recognition" });
  }
}

export async function initChapaPayment(req: Request, res: Response) {
  try {
    const { recognitionId } = req.params;
    const rec = await prisma.institutionRecognition.findUnique({
      where: { id: recognitionId },
      include: { institution: true, createdBy: true },
    });
    if (!rec) return res.status(404).json({ message: "Recognition not found" });
    if (rec.status !== InstitutionRecognitionStatus.PENDING_PAYMENT) {
      return res.status(400).json({ message: "Recognition is not awaiting payment" });
    }

    const secretKey = process.env.CHAPA_SECRET_KEY;
    if (!secretKey) return res.status(500).json({ message: "Chapa payment is not configured" });

    const amount = Number(rec.amountEtb);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const apiBase = normalizeBaseUrl(process.env.APP_BASE_URL, "http://localhost:4000");
    const frontendUrl = normalizeBaseUrl(process.env.FRONTEND_URL, "http://localhost:8080");
    const txRef = `irrec-${recognitionId}-${Date.now()}`;
    const payer = rec.createdBy;
    const names = (payer?.firstName + " " + (payer?.lastName || "")).trim().split(" ");
    const firstName = names[0] || "Majlis";
    const lastName = names.slice(1).join(" ") || "Staff";

    const payload = {
      amount: String(Math.round(amount)),
      currency: "ETB",
      email: chapaPayerEmail(payer?.email ?? null, recognitionId),
      first_name: firstName.slice(0, 50),
      last_name: lastName.slice(0, 50),
      phone_number: "0911000000",
      tx_ref: txRef,
      callback_url: new URL(
        `/api/v1/institution-recognitions/recognitions/${recognitionId}/payment/chapa-callback`,
        apiBase
      ).toString(),
      return_url: new URL(
        `/majlis/institutions/${rec.institutionId}?recognitionPayment=success&recognitionId=${recognitionId}`,
        frontendUrl
      ).toString(),
      customization: {
        title: chapaCustomizationTitle(),
        description: chapaCustomizationDescription(rec.institution.name),
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
            ? (data.message.customization?.title ?? data.message.message ?? JSON.stringify(data.message))
            : "Failed to initialize Chapa payment.";
      return res.status(400).json({ message: errMsg });
    }

    await prisma.institutionRecognition.update({
      where: { id: recognitionId },
      data: { chapaTxRef: txRef, paymentMethod: InstitutionRecognitionPaymentMethod.CHAPA },
    });

    res.json({ checkoutUrl: data.data.checkout_url, txRef });
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to initialize payment" });
  }
}

export async function submitManualPayment(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthenticated" });

    const { recognitionId } = req.params;
    const rec = await prisma.institutionRecognition.findUnique({ where: { id: recognitionId } });
    if (!rec) return res.status(404).json({ message: "Recognition not found" });
    if (rec.status !== InstitutionRecognitionStatus.PENDING_PAYMENT) {
      return res.status(400).json({ message: "Recognition is not awaiting payment" });
    }

    const file = (req as any).file as Express.Multer.File | undefined;
    const receiptUrl = file?.filename ? `/uploads/membership/${file.filename}` : undefined;
    if (!receiptUrl) {
      return res.status(400).json({ message: "Receipt file is required" });
    }
    const bankName = typeof (req as any).body?.bankName === "string" ? (req as any).body.bankName.trim() || undefined : undefined;

    const updated = await prisma.institutionRecognition.update({
      where: { id: recognitionId },
      data: {
        paymentMethod: InstitutionRecognitionPaymentMethod.MANUAL,
        paymentReceiptUrl: receiptUrl,
        bankName,
        status: InstitutionRecognitionStatus.MANUAL_PENDING_APPROVAL,
      },
    });

    res.json(updated);
  } catch (e: any) {
    res.status(400).json({ message: e.message || "Failed to submit manual payment" });
  }
}

export async function approveManualPayment(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthenticated" });

    const u = (req as any).user as { permissions?: string[] };
    const perms = u.permissions || [];
    const canApprove =
      perms.includes("majlis.institutions.approve") || perms.includes("majlis.membership.admin");
    if (!canApprove) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { recognitionId } = req.params;
    const rec = await prisma.institutionRecognition.findUnique({ where: { id: recognitionId } });
    if (!rec) return res.status(404).json({ message: "Recognition not found" });
    if (rec.status !== InstitutionRecognitionStatus.MANUAL_PENDING_APPROVAL) {
      return res.status(400).json({ message: "Recognition is not pending manual approval" });
    }
    if (!rec.paymentReceiptUrl) {
      return res.status(400).json({ message: "No receipt on file" });
    }

    await prisma.institutionRecognition.update({
      where: { id: recognitionId },
      data: {
        manualPaymentApprovedById: userId,
        manualPaymentApprovedAt: new Date(),
      },
    });

    const finalized = await finalizeRecognitionIssuance(
      recognitionId,
      InstitutionRecognitionPaymentMethod.MANUAL,
      null
    );
    res.json(finalized);
  } catch (e: any) {
    res.status(400).json({ message: e.message || "Failed to approve payment" });
  }
}

export async function downloadCertificate(req: Request, res: Response) {
  try {
    const { recognitionId } = req.params;
    const rec = await prisma.institutionRecognition.findUnique({ where: { id: recognitionId } });
    if (!rec || !rec.pdfUrl) {
      return res.status(404).json({ message: "Certificate file not available" });
    }
    if (rec.status !== InstitutionRecognitionStatus.COMPLETED) {
      return res.status(400).json({ message: "Certificate not yet issued" });
    }

    const rel = rec.pdfUrl.startsWith("/") ? rec.pdfUrl.slice(1) : rec.pdfUrl;
    const abs = path.join(process.cwd(), rel);
    if (!fs.existsSync(abs)) {
      return res.status(404).json({ message: "File missing on server" });
    }
    res.download(abs, `institution-recognition-${rec.certificateNumber ?? recognitionId}.pdf`);
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Download failed" });
  }
}

/** Preview mosque recognition PDF using the active document template (draft fields). */
export async function previewRecognitionCertificate(req: Request, res: Response) {
  try {
    const { institutionId } = req.params;
    const body = PreviewInstitutionRecognitionDto.parse(req.body);

    const institution = await prisma.institution.findUnique({ where: { id: institutionId } });
    if (!institution) return res.status(404).json({ message: "Institution not found" });
    if (institution.type !== "MOSQUE") {
      return res.status(400).json({ message: "Template preview is only available for mosque institutions" });
    }

    const buffer = await renderMosqueRecognitionCertificateBuffer({
      certificateNumber: "IRR-PREVIEW",
      institutionNameOnCert: body.institutionNameOnCert,
      zoneCityAdmin: body.zoneCityAdmin,
      districtSubcity: body.districtSubcity,
      gandaKebele: body.gandaKebele,
      issueDate: body.issueDate,
    });

    if (!buffer) {
      return res.status(400).json({
        message:
          "No active mosque certificate template found. Configure one under Documents → Certificate templates.",
      });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="mosque-recognition-preview.pdf"');
    return res.send(buffer);
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ message: e.issues[0]?.message ?? "Invalid input" });
    }
    const message = e instanceof Error ? e.message : "Failed to generate preview";
    return res.status(400).json({ message });
  }
}

/** Re-render a completed mosque recognition PDF with the current active template. */
export async function regenerateRecognitionCertificate(req: Request, res: Response) {
  try {
    const { recognitionId } = req.params;
    const rec = await prisma.institutionRecognition.findUnique({
      where: { id: recognitionId },
      include: { institution: true },
    });
    if (!rec) return res.status(404).json({ message: "Recognition not found" });
    if (rec.status !== InstitutionRecognitionStatus.COMPLETED) {
      return res.status(400).json({ message: "Certificate has not been issued yet" });
    }
    if (rec.institution.type !== "MOSQUE") {
      return res.status(400).json({ message: "Template regeneration applies to mosque institutions only" });
    }
    if (!rec.certificateNumber) {
      return res.status(400).json({ message: "Certificate number missing" });
    }

    const { pdfUrl } = await generateInstitutionRecognitionPdf({
      certificateNumber: rec.certificateNumber,
      institutionNameOnCert: rec.institutionNameOnCert,
      institutionType: rec.institution.type,
      zoneCityAdmin: rec.zoneCityAdmin,
      districtSubcity: rec.districtSubcity,
      gandaKebele: rec.gandaKebele,
      issueDate: rec.issueDate,
    });

    const updated = await prisma.institutionRecognition.update({
      where: { id: recognitionId },
      data: { pdfUrl },
      include: { institution: true },
    });

    return res.json(updated);
  } catch (e: any) {
    return res.status(400).json({ message: e.message || "Failed to regenerate certificate" });
  }
}
