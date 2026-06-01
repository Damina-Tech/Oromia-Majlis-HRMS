import { Request, Response } from "express";
import {
  Prisma,
  PrismaClient,
  HalalCertificateStatus,
  HalalProductCertificateStatus,
} from "@prisma/client";
import fetch from "node-fetch";
import { generateHalalProductCertificatePDF } from "./halal-product-certificate-generator.js";
import {
  CreateHalalProductCertificateDto,
  ListHalalProductCertificatesQuery,
  ManualPaymentDto,
} from "./halal.dto.js";
import { paginate } from "../../lib/paginate.js";

const prisma = new PrismaClient();

export const HALAL_PRODUCT_CERTIFICATE_FEE = 3500;

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

async function generateProductCertificateNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.halalProductCertificate.count({
    where: { certificateNumber: { startsWith: `HAL-P-${year}-` } },
  });
  return `HAL-P-${year}-${(count + 1).toString().padStart(5, "0")}`;
}

async function finalizeProductCertificateIssuance(
  id: string,
  paymentMethod: string,
  extra: { chapaRefId?: string | null }
) {
  const pc = await prisma.halalProductCertificate.findUnique({
    where: { id },
    include: { halalCertificate: { include: { business: true } }, business: true },
  });
  if (!pc) throw new Error("Product certificate request not found");
  if (pc.status === HalalProductCertificateStatus.ISSUED) return pc;
  if (pc.status !== HalalProductCertificateStatus.PAYMENT_PENDING) {
    throw new Error("Invalid status for completion");
  }

  const certNum = await generateProductCertificateNumber();
  const issuedAt = new Date();
  let pdfUrl: string | null = null;
  try {
    const { halalProductCertificatePdfSourceFromRow } = await import(
      "./halal-product-certificate-pdf-data.js"
    );
    const { pdfUrl: url } = await generateHalalProductCertificatePDF(
      halalProductCertificatePdfSourceFromRow(pc, certNum, issuedAt)
    );
    pdfUrl = url;
  } catch (err) {
    console.error("Halal product certificate PDF generation failed:", err);
  }

  return prisma.halalProductCertificate.update({
    where: { id },
    data: {
      certificateNumber: certNum,
      status: HalalProductCertificateStatus.ISSUED,
      feePaidAt: issuedAt,
      paymentMethod,
      chapaRefId: extra.chapaRefId ?? undefined,
      pdfUrl,
      issuedAt,
    },
    include: { halalCertificate: true, business: true },
  });
}

function canAccessProductCert(
  req: Request,
  businessUserId: string
): { ok: boolean; isStaff: boolean } {
  const perms = (req as any).user?.permissions as string[] | undefined;
  const uid = getUserId(req);
  const isStaff =
    perms?.includes("halal.admin") ||
    perms?.includes("halal.supervisor") ||
    perms?.includes("halal.audit");
  if (isStaff) return { ok: true, isStaff: true };
  if (uid === businessUserId) return { ok: true, isStaff: false };
  return { ok: false, isStaff: false };
}

export async function createProductCertificate(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const body = CreateHalalProductCertificateDto.parse(req.body);
    const parent = await prisma.halalCertificate.findUnique({
      where: { id: body.halalCertificateId },
      include: { business: true },
    });
    if (!parent) return res.status(404).json({ message: "Business Halal certificate not found" });
    if (parent.business.userId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    if (parent.status !== HalalCertificateStatus.VALID) {
      return res.status(400).json({ message: "Only a valid business Halal certificate can issue product certificates" });
    }
    if (new Date(parent.expiresAt) <= new Date()) {
      return res.status(400).json({ message: "The business Halal certificate has expired" });
    }

    const slaughteringDate = new Date(body.slaughteringDate);
    const productionDate = new Date(body.productionDate);
    const expiryDate = new Date(body.expiryDate);
    if (
      [slaughteringDate, productionDate, expiryDate].some((d) => Number.isNaN(d.getTime()))
    ) {
      return res.status(400).json({ message: "One or more dates are invalid" });
    }

    const row = await prisma.halalProductCertificate.create({
      data: {
        halalCertificateId: parent.id,
        businessId: parent.businessId,
        productName: body.productName.trim(),
        productAmount: `${body.netWeightKg.trim()} kg net / ${body.grossWeightKg.trim()} kg gross`,
        consignmentPcs: body.consignmentPcs.trim(),
        netWeightKg: body.netWeightKg.trim(),
        grossWeightKg: body.grossWeightKg.trim(),
        shipping: body.shipping.trim(),
        voyageFlightNo: body.voyageFlightNo.trim(),
        loadingPort: body.loadingPort.trim() || "Addis Ababa Airport",
        destination: body.destination.trim(),
        slaughteringDate,
        productionDate,
        expiryDate,
        healthCertificateNo: body.healthCertificateNo.trim(),
        slaughteringCertificate: body.slaughteringCertificate.trim(),
        authorizedRepresentative: body.authorizedRepresentative.trim(),
        signature: "",
        seal: "",
        notes: body.notes?.trim() || null,
        feeAmount: new Prisma.Decimal(HALAL_PRODUCT_CERTIFICATE_FEE),
        status: HalalProductCertificateStatus.PAYMENT_PENDING,
      },
      include: { halalCertificate: { select: { certificateId: true } }, business: { select: { name: true } } },
    });
    res.status(201).json(row);
  } catch (e: any) {
    res.status(400).json({ message: e.message || "Failed to create product certificate request" });
  }
}

export async function listProductCertificates(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const perms = (req as any).user?.permissions as string[] | undefined;
    const isStaff =
      perms?.includes("halal.admin") ||
      perms?.includes("halal.supervisor") ||
      perms?.includes("halal.inspector") ||
      perms?.includes("halal.audit") ||
      perms?.includes("halal.committee");
    const q = ListHalalProductCertificatesQuery.parse(req.query);
    const where: Prisma.HalalProductCertificateWhereInput = {};
    if (!isStaff) {
      where.business = { userId };
    } else if (q.businessId) {
      where.businessId = q.businessId;
    }
    const [items, total] = await Promise.all([
      prisma.halalProductCertificate.findMany({
        where,
        include: {
          halalCertificate: { select: { id: true, certificateId: true, status: true } },
          business: { select: { id: true, name: true, userId: true } },
        },
        ...paginate(q.page, q.limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.halalProductCertificate.count({ where }),
    ]);
    res.json({ items, total, page: q.page, limit: q.limit });
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to list product certificates" });
  }
}

export async function getProductCertificate(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const row = await prisma.halalProductCertificate.findUnique({
      where: { id },
      include: {
        halalCertificate: { select: { id: true, certificateId: true, status: true, expiresAt: true } },
        business: true,
      },
    });
    if (!row) return res.status(404).json({ message: "Not found" });
    const { ok } = canAccessProductCert(req, row.business.userId);
    if (!ok) return res.status(403).json({ message: "Access denied" });
    res.json(row);
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to load" });
  }
}

export async function initProductChapaPayment(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const perms = (req as any).user?.permissions as string[] | undefined;
    const isAdmin = perms?.includes("halal.admin") || perms?.includes("halal.supervisor");
    const { id } = req.params;
    const pc = await prisma.halalProductCertificate.findUnique({
      where: { id },
      include: { business: true },
    });
    if (!pc) return res.status(404).json({ message: "Not found" });
    if (pc.business.userId !== userId && !isAdmin) return res.status(403).json({ message: "Access denied" });
    if (pc.status !== HalalProductCertificateStatus.PAYMENT_PENDING) {
      return res.status(400).json({ message: "Payment already completed or invalid status" });
    }
    if (pc.feePaidAt) return res.status(400).json({ message: "Already paid" });

    const secretKey = process.env.CHAPA_SECRET_KEY;
    if (!secretKey) return res.status(500).json({ message: "Chapa payment is not configured" });
    const amount = HALAL_PRODUCT_CERTIFICATE_FEE;
    const apiBase = normalizeBaseUrl(process.env.APP_BASE_URL, "http://localhost:4000");
    const frontendUrl = normalizeBaseUrl(process.env.FRONTEND_URL, "http://localhost:8080");
    const txRef = `halalpc-${id}-${Date.now()}`;
    const names = (pc.business.contactName || "Customer").trim().split(" ");
    const firstName = names[0] || "Customer";
    const lastName = names.slice(1).join(" ") || ".";
    const callbackUrl = new URL(`/api/v1/halal/product-certificates/${id}/payment/chapa-callback`, apiBase).toString();
    const returnUrl = new URL(`/halal/product-certificates/${id}?payment=chapa`, frontendUrl).toString();
    const rawDesc = `Halal product cert ${amount} ETB`;
    const customizationDescription = rawDesc
      .replace(/[^A-Za-z0-9._\-\s]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 50);
    const payload = {
      amount: String(amount),
      currency: "ETB",
      email: pc.business.contactEmail,
      first_name: firstName,
      last_name: lastName,
      phone_number: (pc.business.contactPhone || "").replace(/\D/g, "").slice(-9)
        ? `0${(pc.business.contactPhone || "").replace(/\D/g, "").slice(-9)}`
        : undefined,
      tx_ref: txRef,
      callback_url: callbackUrl,
      return_url: returnUrl,
      customization: {
        title: "Halal product",
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
    await prisma.halalProductCertificate.update({
      where: { id },
      data: { chapaTxRef: txRef },
    });
    res.json({ checkoutUrl: data.data.checkout_url, txRef });
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to initialize payment" });
  }
}

export async function productChapaCallback(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { trx_ref, ref_id, status } = req.query as { trx_ref?: string; ref_id?: string; status?: string };
    if (!id || !trx_ref || status !== "success") {
      return res.status(400).send("Invalid callback");
    }
    const pc = await prisma.halalProductCertificate.findUnique({ where: { id } });
    if (!pc || pc.chapaTxRef !== trx_ref) {
      return res.status(404).send("Not found");
    }
    if (pc.status === HalalProductCertificateStatus.ISSUED || pc.feePaidAt) {
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
    await finalizeProductCertificateIssuance(id, "CHAPA", { chapaRefId: ref_id || null });
    res.status(200).send("OK");
  } catch (e: any) {
    res.status(500).send("Error");
  }
}

export async function confirmProductManualPayment(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const body = ManualPaymentDto.parse(req.body);
    const file = (req as any).file;
    if (!file) return res.status(400).json({ message: "Receipt file is required" });
    const pc = await prisma.halalProductCertificate.findUnique({
      where: { id },
      include: { business: true },
    });
    if (!pc) return res.status(404).json({ message: "Not found" });
    if (pc.business.userId !== userId) return res.status(403).json({ message: "Access denied" });
    if (pc.status !== HalalProductCertificateStatus.PAYMENT_PENDING || pc.feePaidAt) {
      return res.status(400).json({ message: "Invalid state for manual payment" });
    }
    const receiptUrl = `/uploads/halal/${file.filename}`;
    const updated = await prisma.halalProductCertificate.update({
      where: { id },
      data: {
        paymentMethod: "MANUAL",
        paymentBankName: body.bankName,
        paymentReceiptUrl: receiptUrl,
      },
      include: { halalCertificate: { select: { certificateId: true } }, business: { select: { name: true } } },
    });
    res.json(updated);
  } catch (e: any) {
    res.status(400).json({ message: e.message || "Failed to submit receipt" });
  }
}

export async function approveProductManualPayment(req: Request, res: Response) {
  try {
    const actorId = getUserId(req);
    const { id } = req.params;
    const pc = await prisma.halalProductCertificate.findUnique({ where: { id } });
    if (!pc) return res.status(404).json({ message: "Not found" });
    if (pc.status !== HalalProductCertificateStatus.PAYMENT_PENDING || pc.feePaidAt) {
      return res.status(400).json({ message: "No pending manual payment for this request" });
    }
    if (pc.paymentMethod !== "MANUAL" || !pc.paymentReceiptUrl) {
      return res.status(400).json({ message: "No manual receipt on file" });
    }
    const updated =     await finalizeProductCertificateIssuance(id, "MANUAL", {});
    const full = await prisma.halalProductCertificate.update({
      where: { id },
      data: { manualPaymentApprovedById: actorId },
      include: { halalCertificate: true, business: true },
    });
    res.json(full);
  } catch (e: any) {
    res.status(400).json({ message: e.message || "Failed to approve payment" });
  }
}

export async function downloadProductCertificate(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const disposition = req.query.disposition === "attachment" ? "attachment" : "inline";
    const row = await prisma.halalProductCertificate.findUnique({
      where: { id },
      include: { business: true, halalCertificate: true },
    });
    if (!row) return res.status(404).json({ message: "Not found" });
    const { ok } = canAccessProductCert(req, row.business.userId);
    if (!ok) return res.status(403).json({ message: "Access denied" });
    if (row.status !== HalalProductCertificateStatus.ISSUED || !row.certificateNumber) {
      return res.status(404).json({ message: "Certificate PDF not available" });
    }

    const { renderProductHalalCertificatePdfBuffer } = await import("./halal-certificate-render.service.js");
    let templatePdf: Buffer | null = null;
    try {
      const { halalProductCertificatePdfSourceFromRow } = await import(
        "./halal-product-certificate-pdf-data.js"
      );
      templatePdf = await renderProductHalalCertificatePdfBuffer(
        halalProductCertificatePdfSourceFromRow(
          row,
          row.certificateNumber,
          row.issuedAt ?? new Date()
        )
      );
    } catch (renderErr: any) {
      console.error("Halal product certificate template render failed:", renderErr);
      return res.status(500).json({
        message:
          renderErr?.message ||
          "Active product certificate template could not be rendered. Check Documents → Halal certificate templates.",
      });
    }

    if (templatePdf) {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `${disposition}; filename="halal-product-${row.certificateNumber}.pdf"`
      );
      return res.send(templatePdf);
    }

    if (!row.pdfUrl) {
      return res.status(404).json({
        message:
          "No active Halal product certificate template found. Configure one under Documents → Halal certificates.",
      });
    }
    const pathModule = (await import("path")).default;
    const fs = await import("fs");
    const relPath = row.pdfUrl.startsWith("/") ? row.pdfUrl.slice(1) : row.pdfUrl;
    const fullPath = pathModule.join(process.cwd(), relPath);
    if (!fs.existsSync(fullPath)) return res.status(404).json({ message: "File not found" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `${disposition}; filename="halal-product-${row.certificateNumber}.pdf"`
    );
    res.sendFile(pathModule.resolve(fullPath));
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Download failed" });
  }
}

export async function verifyProductCertificatePublic(req: Request, res: Response) {
  try {
    const { certificateNumber } = req.params;
    const row = await prisma.halalProductCertificate.findUnique({
      where: { certificateNumber },
      include: { business: true, halalCertificate: true },
    });
    if (!row || row.status !== HalalProductCertificateStatus.ISSUED) {
      return res.json({ valid: false, message: "Certificate not found" });
    }
    const parentOk =
      row.halalCertificate.status === HalalCertificateStatus.VALID && new Date() < row.halalCertificate.expiresAt;
    res.json({
      valid: true,
      certificateNumber: row.certificateNumber,
      businessName: row.business.name,
      productName: row.productName,
      productAmount: row.productAmount,
      destination: row.destination,
      issuedAt: row.issuedAt,
      parentCertificateId: row.halalCertificate.certificateId,
      parentCertificateValid: parentOk,
    });
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Verification failed", valid: false });
  }
}
