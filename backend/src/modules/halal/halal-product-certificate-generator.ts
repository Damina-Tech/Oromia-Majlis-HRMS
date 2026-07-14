import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { HalalCertificateTemplateType } from "@prisma/client";
import { renderCertificateToFile } from "../documents/certificate-template.service.js";
import {
  halalProductCertificatePdfData,
  type HalalProductCertificatePdfSource,
} from "./halal-product-certificate-pdf-data.js";
import { publicCertificateVerifyUrl } from "../../lib/certificate-verify-url.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const productCertsDir = path.join(__dirname, "../../../uploads/halal/product-certificates");
if (!fs.existsSync(productCertsDir)) {
  fs.mkdirSync(productCertsDir, { recursive: true });
}

function getVerifyUrl(certificateNumber: string): string {
  return publicCertificateVerifyUrl(certificateNumber);
}

async function generateHalalProductCertificatePDFLegacy(
  row: HalalProductCertificatePdfSource,
  params: {
    verifyUrl: string;
    qrBuffer: Buffer;
    filePath: string;
    safeFile: string;
  }
): Promise<{ pdfPath: string; pdfUrl: string; qrDataUrl: string }> {
  const { verifyUrl, qrBuffer, filePath, safeFile } = params;
  const {
    certificateNumber,
    businessName,
    parentCertificateId,
    productName,
    productAmount,
    destination,
    notes,
    consignmentPcs,
    netWeightKg,
    grossWeightKg,
    shipping,
    voyageFlightNo,
    loadingPort,
    slaughteringDate,
    productionDate,
    expiryDate,
    healthCertificateNo,
    slaughteringCertificate,
    authorizedRepresentative,
    issuedAt,
  } = row;
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 48, bottom: 48, left: 48, right: 48 },
    });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.rect(0, 0, doc.page.width, 10).fill("#0d9488");

    doc.moveDown(0.8);
    doc.fontSize(11).font("Helvetica-Bold").fillColor("#0f766e").text("OROMIA REGIONAL ISLAMIC AFFAIRS SUPREME COUNCIL", {
      align: "center",
    });
    doc.moveDown(0.3);
    doc.fontSize(18).font("Helvetica-Bold").fillColor("#134e4a").text("PRODUCT HALAL CERTIFICATE", { align: "center" });
    doc.moveDown(0.2);
    doc.fontSize(9).font("Helvetica").fillColor("#64748b").text("Batch / shipment product attestation (linked to business Halal certification)", {
      align: "center",
    });
    doc.moveDown(1);

    doc.fontSize(10).font("Helvetica-Bold").fillColor("#0f172a").text(`Certificate No. ${certificateNumber}`, {
      align: "center",
    });
    doc.moveDown(0.8);

    const row = (label: string, value: string) => {
      doc.fontSize(10).font("Helvetica-Bold").fillColor("#334155").text(`${label} `, { continued: true });
      doc.font("Helvetica").fillColor("#0f172a").text(value);
      doc.moveDown(0.35);
    };

    row("Business:", businessName);
    row("Parent Halal certificate:", parentCertificateId);
    row("Product:", productName);
    row("Consignment (PCS):", consignmentPcs);
    row("Net weight:", `${netWeightKg} kg`);
    row("Gross weight:", `${grossWeightKg} kg`);
    row("Shipping:", shipping);
    row("Voyage / flight no.:", voyageFlightNo);
    row("Loading port:", loadingPort);
    row("Destination:", destination);
    row("Slaughtering date:", fmt(slaughteringDate));
    row("Production date:", fmt(productionDate));
    row("Expiry date:", fmt(expiryDate));
    row("Health certificate no.:", healthCertificateNo);
    row("Slaughtering certificate:", slaughteringCertificate);
    row("Authorized representative:", authorizedRepresentative);
    if (productAmount?.trim()) {
      row("Amount / quantity:", productAmount);
    }
    if (notes?.trim()) {
      row("Notes:", notes.trim());
    }

    doc.moveDown(0.5);
    doc.fontSize(9).fillColor("#475569").text(
      "This document certifies that the specified product shipment is covered under the referenced Halal business certificate, subject to the conditions of that certification.",
      { align: "left" }
    );
    doc.moveDown(0.8);

    doc.fontSize(9).font("Helvetica").fillColor("#334155");
    doc.text(`Issued: ${issuedAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`);
    doc.moveDown(0.8);

    doc.fontSize(8).fillColor("#64748b").text("Verification URL:");
    doc.fontSize(7).fillColor("#94a3b8").text(verifyUrl, { width: 380 });
    const qrY = doc.y + 8;
    doc.image(qrBuffer, doc.page.width - 48 - 80, qrY, { width: 80, height: 80 });
    doc.moveDown(4.5);

    doc.fontSize(7).fillColor("#94a3b8").text(
      "Each product certificate is issued for a specific batch or shipment. Verify using the QR code or URL above.",
      { align: "center" }
    );

    doc.end();

    stream.on("finish", () => {
      resolve({
        pdfPath: filePath,
        pdfUrl: `/uploads/halal/product-certificates/${safeFile}`,
        qrDataUrl: verifyUrl,
      });
    });
    stream.on("error", reject);
  });
}

/**
 * Product-specific Halal certificate PDF (template-driven when configured in documents module).
 */
export async function generateHalalProductCertificatePDF(
  row: HalalProductCertificatePdfSource
): Promise<{ pdfPath: string; pdfUrl: string; qrDataUrl: string }> {
  const { certificateNumber, issuedAt } = row;
  const verifyUrl = getVerifyUrl(certificateNumber);
  const safeFile = `HAL-P-${certificateNumber.replace(/[^A-Za-z0-9._-]/g, "_")}-${Date.now()}.pdf`;
  const filePath = path.join(productCertsDir, safeFile);

  const templateCode = process.env.HALAL_PRODUCT_CERT_TEMPLATE_CODE?.trim();
  const data = await halalProductCertificatePdfData(row, verifyUrl);

  try {
    const rendered = await renderCertificateToFile({
      templateCode: templateCode || undefined,
      certificateType: templateCode ? undefined : HalalCertificateTemplateType.HALAL_PRODUCT,
      data,
      outputFilePath: filePath,
    });
    if (rendered) {
      return {
        pdfPath: filePath,
        pdfUrl: `/uploads/halal/product-certificates/${safeFile}`,
        qrDataUrl: verifyUrl,
      };
    }
  } catch (err) {
    console.warn("Halal product certificate template render failed, using legacy layout:", err);
  }

  const qrBuffer = await QRCode.toBuffer(verifyUrl, { width: 140, margin: 2 });
  return generateHalalProductCertificatePDFLegacy(row, {
    verifyUrl,
    qrBuffer,
    filePath,
    safeFile,
  });
}
