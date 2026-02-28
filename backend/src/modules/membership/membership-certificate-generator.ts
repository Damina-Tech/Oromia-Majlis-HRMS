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

function getVerifyUrl(certificateId: string): string {
  const base = process.env.FRONTEND_URL || "http://localhost:8080";
  return `${base}/verify/membership/${certificateId}`;
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

    // Header
    doc.fontSize(22).font("Helvetica-Bold").text("MEMBERSHIP CERTIFICATE", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(10).font("Helvetica").fillColor("#555").text("Oromia Regional Islamic Affairs Supreme Council - Majlis", { align: "center" });
    doc.moveDown(1.5);

    // Photo (optional) - left side
    const startY = doc.y;
    if (photoPath && fs.existsSync(photoPath)) {
      try {
        doc.image(photoPath, 50, startY, { width: 80, height: 80, fit: [80, 80] });
      } catch (_) {}
    }
    doc.y = startY;

    // Certificate ID right-aligned
    doc.fontSize(12).font("Helvetica-Bold").fillColor("#000").text(`Certificate ID: ${certificateId}`, 140, startY, { width: 400, align: "right" });
    doc.moveDown(1);

    doc.font("Helvetica").fontSize(11);
    doc.text("This is to certify that:", { align: "center" });
    doc.moveDown(0.5);
    doc.font("Helvetica-Bold").fontSize(16).text(fullName, { align: "center" });
    doc.moveDown(0.5);
    doc.font("Helvetica").fontSize(11).text(`Category: ${category.replace(/_/g, " ")}`, { align: "center" });
    doc.moveDown(1);
    doc.text("is a registered member in good standing of the Majlis membership program.", { align: "center" });
    doc.moveDown(2);

    // Dates
    doc.fontSize(10).fillColor("#444");
    doc.text(`Issued: ${issuedAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`, 50, doc.y);
    doc.text(`Valid until: ${expiresAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`, 0, doc.y, { align: "right", width: 495 });
    doc.moveDown(2);

    // QR Code
    doc.text("Verify at:", 50, doc.y, { continued: false });
    doc.moveDown(0.3);
    doc.fontSize(8).fillColor("#666").text(verifyUrl, 50, doc.y, { width: 320 });
    doc.moveDown(0.5);
    doc.image(qrBuffer, 50, doc.y, { width: 70, height: 70 });
    doc.moveDown(2);

    doc.fontSize(8).fillColor("#999").text("This certificate can be verified by scanning the QR code or visiting the verification URL.", { align: "center" });
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
