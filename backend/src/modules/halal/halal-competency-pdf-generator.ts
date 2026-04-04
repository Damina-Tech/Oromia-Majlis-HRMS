import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const competencyCertsDir = path.join(__dirname, "../../../uploads/halal/competency-certificates");
if (!fs.existsSync(competencyCertsDir)) {
  fs.mkdirSync(competencyCertsDir, { recursive: true });
}

function getVerifyUrl(certificateNumber: string): string {
  const base = process.env.FRONTEND_URL || "http://localhost:8080";
  return `${base}/verify/halal-competency/${encodeURIComponent(certificateNumber)}`;
}

export async function generateHalalCompetencyCertificatePDF(params: {
  certificateNumber: string;
  holderName: string;
  employerName: string;
  jobTitle?: string | null;
  issuedAt: Date;
  expiresAt: Date;
}): Promise<{ pdfPath: string; pdfUrl: string }> {
  const { certificateNumber, holderName, employerName, jobTitle, issuedAt, expiresAt } = params;
  const verifyUrl = getVerifyUrl(certificateNumber);
  const qrBuffer = await QRCode.toBuffer(verifyUrl, { width: 140, margin: 2 });
  const safeFile = `HAL-COMP-${certificateNumber.replace(/[^A-Za-z0-9._-]/g, "_")}-${Date.now()}.pdf`;
  const filePath = path.join(competencyCertsDir, safeFile);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 48, bottom: 48, left: 48, right: 48 },
    });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.rect(0, 0, doc.page.width, 10).fill("#047857");

    doc.moveDown(0.8);
    doc.fontSize(11).font("Helvetica-Bold").fillColor("#065f46").text("OROMIA REGIONAL ISLAMIC AFFAIRS SUPREME COUNCIL", {
      align: "center",
    });
    doc.moveDown(0.3);
    doc.fontSize(18).font("Helvetica-Bold").fillColor("#064e3b").text("HALAL COMPETENCY CERTIFICATE", { align: "center" });
    doc.moveDown(0.2);
    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#64748b")
      .text("Individual certification of knowledge and professional competence related to Halal standards", {
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

    row("Holder:", holderName);
    row("Employer / organization:", employerName);
    if (jobTitle?.trim()) {
      row("Role / title:", jobTitle.trim());
    }

    doc.moveDown(0.5);
    doc.fontSize(9).fillColor("#475569").text(
      "This certificate attests that the named individual has completed the council’s Halal competency process (including assessment) for the period shown. Renewal is required annually before expiry.",
      { align: "left" }
    );
    doc.moveDown(0.8);

    doc.fontSize(9).font("Helvetica").fillColor("#334155");
    doc.text(
      `Issued: ${issuedAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`
    );
    doc.text(
      `Valid until: ${expiresAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`
    );
    doc.moveDown(0.8);

    doc.fontSize(8).fillColor("#64748b").text("Verification URL:");
    doc.fontSize(7).fillColor("#94a3b8").text(verifyUrl, { width: 380 });
    const qrY = doc.y + 8;
    doc.image(qrBuffer, doc.page.width - 48 - 80, qrY, { width: 80, height: 80 });
    doc.moveDown(4.5);

    doc.fontSize(7).fillColor("#94a3b8").text("Verify authenticity using the QR code or URL above.", { align: "center" });

    doc.end();

    stream.on("finish", () => {
      resolve({
        pdfPath: filePath,
        pdfUrl: `/uploads/halal/competency-certificates/${safeFile}`,
      });
    });
    stream.on("error", reject);
  });
}
