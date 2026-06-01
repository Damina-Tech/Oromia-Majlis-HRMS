import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { HalalCertificateTemplateType } from "@prisma/client";
import { halalBusinessCertificateData } from "../documents/certificate-field-catalog.js";
import { renderCertificateToFile } from "../documents/certificate-template.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const certsDir = path.join(__dirname, "../../../uploads/halal/certificates");
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true });
}

function getVerifyUrl(certificateId: string): string {
  const base = process.env.FRONTEND_URL || "http://localhost:8080";
  return `${base}/verify/halal/${certificateId}`;
}

async function generateHalalCertificatePDFLegacy(params: {
  certificateId: string;
  businessName: string;
  category: string;
  issuedAt: Date;
  expiresAt: Date;
  verifyUrl: string;
  qrBuffer: Buffer;
  filePath: string;
  fileName: string;
}): Promise<{ pdfPath: string; pdfUrl: string; qrDataUrl: string }> {
  const { certificateId, businessName, category, issuedAt, expiresAt, verifyUrl, qrBuffer, filePath, fileName } =
    params;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 60, bottom: 60, left: 60, right: 60 },
    });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(24).font("Helvetica-Bold").text("HALAL CERTIFICATE", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(10).font("Helvetica").fillColor("#666").text("Oromia Regional Islamic Affairs Supreme Council", { align: "center" });
    doc.moveDown(2);

    doc.fontSize(14).font("Helvetica-Bold").fillColor("#000").text(`Certificate ID: ${certificateId}`, { align: "center" });
    doc.moveDown(1.5);

    doc.font("Helvetica").fontSize(11);
    doc.text("This is to certify that:", { align: "center" });
    doc.moveDown(0.5);
    doc.font("Helvetica-Bold").fontSize(14).text(businessName, { align: "center" });
    doc.moveDown(0.5);
    doc.font("Helvetica").fontSize(11).text(`Category: ${category.replace(/_/g, " ")}`, { align: "center" });
    doc.moveDown(1);
    doc.text("has been duly inspected and found to comply with Halal requirements.", { align: "center" });
    doc.moveDown(2);

    doc.fontSize(10).fillColor("#444");
    doc.text(`Issued: ${issuedAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`, 60, doc.y);
    doc.text(`Expires: ${expiresAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`, 0, doc.y, { align: "right", width: 495 });
    doc.moveDown(2);

    doc.text("Verify at:", 60, doc.y, { continued: false });
    doc.moveDown(0.3);
    doc.fontSize(8).fillColor("#666").text(verifyUrl, 60, doc.y, { width: 300 });
    doc.moveDown(0.5);
    doc.image(qrBuffer, 60, doc.y, { width: 80, height: 80 });
    doc.moveDown(2);

    doc.fontSize(8).fillColor("#999").text("This certificate can be verified by scanning the QR code or visiting the verification URL.", { align: "center" });
    doc.moveDown(1);
    doc.text("© Oromia Regional Islamic Affairs Supreme Council", { align: "center" });

    doc.end();

    stream.on("finish", () => {
      resolve({
        pdfPath: filePath,
        pdfUrl: `/uploads/halal/certificates/${fileName}`,
        qrDataUrl: verifyUrl,
      });
    });
    stream.on("error", reject);
  });
}

export async function generateHalalCertificatePDF(params: {
  certificateId: string;
  businessName: string;
  category: string;
  issuedAt: Date;
  expiresAt: Date;
}): Promise<{ pdfPath: string; pdfUrl: string; qrDataUrl: string }> {
  const { certificateId, businessName, category, issuedAt, expiresAt } = params;
  const verifyUrl = getVerifyUrl(certificateId);
  const fileName = `HAL-${certificateId}-${Date.now()}.pdf`;
  const filePath = path.join(certsDir, fileName);

  const templateCode = process.env.HALAL_BUSINESS_CERT_TEMPLATE_CODE?.trim();
  const data = halalBusinessCertificateData({
    certificateId,
    businessName,
    category,
    issuedAt,
    expiresAt,
    verifyUrl,
  });

  try {
    const rendered = await renderCertificateToFile({
      templateCode: templateCode || undefined,
      certificateType: templateCode ? undefined : HalalCertificateTemplateType.HALAL_BUSINESS,
      data,
      outputFilePath: filePath,
    });
    if (rendered) {
      return {
        pdfPath: filePath,
        pdfUrl: `/uploads/halal/certificates/${fileName}`,
        qrDataUrl: verifyUrl,
      };
    }
  } catch (err) {
    console.warn("Halal business certificate template render failed, using legacy layout:", err);
  }

  const qrBuffer = await QRCode.toBuffer(verifyUrl, { width: 150, margin: 2 });
  return generateHalalCertificatePDFLegacy({
    certificateId,
    businessName,
    category,
    issuedAt,
    expiresAt,
    verifyUrl,
    qrBuffer,
    filePath,
    fileName,
  });
}
