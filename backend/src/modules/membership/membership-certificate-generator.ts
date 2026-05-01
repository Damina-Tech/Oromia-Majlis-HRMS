import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const certsDir = path.join(__dirname, "../../../uploads/membership/certificates");
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true });
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

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function getVerifyUrl(certificateId: string): string {
  const base = normalizeBaseUrl(process.env.FRONTEND_URL, "http://localhost:8080");
  return new URL(`/verify/membership/${certificateId}`, base).toString();
}

export async function generateMembershipCertificatePDF(params: {
  certificateId: string;
  fullName: string;
  category: string;
  issuedAt: Date;
  expiresAt: Date;
  photoPath?: string | null;
}): Promise<{ pdfPath: string; pdfUrl: string; qrDataUrl: string }> {
  const { certificateId, fullName, category, issuedAt, expiresAt, photoPath } = params;
  const verifyUrl = getVerifyUrl(certificateId);
  const qrBuffer = await QRCode.toBuffer(verifyUrl, { width: 120, margin: 2 });
  const fileName = `MAJ-${certificateId}-${Date.now()}.pdf`;
  const filePath = path.join(certsDir, fileName);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const left = 50;
    const right = doc.page.width - 50;
    const width = right - left;

    // Decorative frame (Oromia Majlis formal style)
    doc.save();
    doc.lineWidth(2).strokeColor("#0b6b5b").roundedRect(30, 30, doc.page.width - 60, doc.page.height - 60, 12).stroke();
    doc.lineWidth(0.8).strokeColor("#d4af37").roundedRect(38, 38, doc.page.width - 76, doc.page.height - 76, 10).stroke();
    doc.restore();

    // Header banner
    doc.save();
    doc.rect(left, 55, width, 56).fill("#0b6b5b");
    doc.restore();
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(13).text("OROMIA MAJLIS", left, 72, { width, align: "center" });
    doc.font("Helvetica").fontSize(9).text("Oromia Regional Islamic Affairs Supreme Council", left, 89, { width, align: "center" });

    // Title block
    doc.moveDown(3.5);
    doc.fillColor("#0b6b5b").font("Helvetica-Bold").fontSize(24).text("MEMBERSHIP CERTIFICATE", { align: "center" });
    doc.moveDown(0.35);
    doc.fillColor("#6b7280").font("Helvetica").fontSize(10).text("Official Proof of Active Majlis Membership", { align: "center" });
    doc.moveDown(1.2);

    // Member photo (optional)
    const startY = doc.y + 2;
    if (photoPath && fs.existsSync(photoPath)) {
      try {
        doc.image(photoPath, left, startY, { width: 88, height: 88, fit: [88, 88] });
      } catch (_) {}
    }
    doc.y = startY;

    // Certificate meta right-aligned
    doc.fontSize(11).font("Helvetica-Bold").fillColor("#111827").text(`Certificate ID: ${certificateId}`, 150, startY + 2, {
      width: width - 100,
      align: "right",
    });
    doc.fontSize(10).font("Helvetica").fillColor("#4b5563").text(`Issued: ${fmtDate(issuedAt)}`, 150, startY + 24, {
      width: width - 100,
      align: "right",
    });
    doc.text(`Valid Until: ${fmtDate(expiresAt)}`, 150, startY + 42, { width: width - 100, align: "right" });
    doc.text(`Category: ${category.replace(/_/g, " ")}`, 150, startY + 60, { width: width - 100, align: "right" });
    doc.moveDown(1);

    // Body statement
    doc.moveDown(3);
    doc.font("Helvetica").fontSize(11).fillColor("#374151");
    doc.text("This is to certify that", { align: "center" });
    doc.moveDown(0.5);
    doc.font("Helvetica-Bold").fontSize(21).fillColor("#111827").text(fullName, { align: "center" });
    doc.moveDown(0.5);
    doc.font("Helvetica").fontSize(11).fillColor("#374151").text(`has been recognized as a ${category.replace(/_/g, " ").toLowerCase()}.`, {
      align: "center",
    });
    doc.moveDown(1);
    doc.text(
      "This certificate is issued by Oromia Majlis as official evidence of membership in good standing and is valid until the expiry date stated.",
      {
        align: "center",
      }
    );
    doc.moveDown(1.7);

    // Signature lines
    const sigY = doc.y;
    doc.strokeColor("#9ca3af").lineWidth(0.8);
    doc.moveTo(left, sigY + 24).lineTo(left + 180, sigY + 24).stroke();
    doc.moveTo(right - 180, sigY + 24).lineTo(right, sigY + 24).stroke();
    doc.fontSize(9).fillColor("#4b5563");
    doc.text("Authorized Signatory", left, sigY + 28, { width: 180, align: "center" });
    doc.text("Official Seal", right - 180, sigY + 28, { width: 180, align: "center" });
    doc.moveDown(3);

    // Verification block
    const verifyTop = doc.y;
    doc.roundedRect(left, verifyTop, width, 95, 8).fillAndStroke("#f8fafc", "#e5e7eb");
    doc.image(qrBuffer, left + 12, verifyTop + 12, { width: 70, height: 70 });
    doc.fillColor("#111827").font("Helvetica-Bold").fontSize(10).text("Verify this certificate (Live):", left + 95, verifyTop + 16);
    doc.fillColor("#4b5563").font("Helvetica").fontSize(8).text(
      "Scan the QR code or open the public verification URL below to see current member validity.",
      left + 95,
      verifyTop + 32,
      { width: width - 110 }
    );
    doc.fillColor("#0b6b5b").fontSize(8).text(verifyUrl, left + 95, verifyTop + 58, {
      width: width - 110,
      underline: true,
    });
    doc.y = verifyTop + 104;

    doc.fontSize(8).fillColor("#6b7280").text(
      "Generated electronically by Oromia Majlis. Alteration or unauthorized reproduction voids this certificate.",
      { align: "center" }
    );
    doc.moveDown(1);
    doc.text("© Oromia Regional Islamic Affairs Supreme Council - Majlis", { align: "center" });

    doc.end();

    stream.on("finish", () => {
      resolve({
        pdfPath: filePath,
        pdfUrl: `/uploads/membership/certificates/${fileName}`,
        qrDataUrl: verifyUrl,
      });
    });
    stream.on("error", reject);
  });
}
