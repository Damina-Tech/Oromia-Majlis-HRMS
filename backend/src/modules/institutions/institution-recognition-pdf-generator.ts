import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { HalalCertificateTemplateType, type InstitutionType } from "@prisma/client";
import { mosqueInstitutionCertificateData } from "../documents/certificate-field-catalog.js";
import { generateCertificatePdfBuffer } from "../documents/certificate-pdf-generator.js";
import {
  getActiveCertificateTemplateByCode,
  getActiveCertificateTemplateByType,
} from "../documents/certificate-template.service.js";
import { publicCertificateVerifyUrl } from "../../lib/certificate-verify-url.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const certsDir = path.join(__dirname, "../../../uploads/institution-recognitions/certificates");
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true });
}

const fontsDir = path.join(__dirname, "../../../assets/fonts");

function verifyUrlFor(certificateNumber: string): string {
  return publicCertificateVerifyUrl(certificateNumber);
}

function fmtDateDMY(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function typeLabelEn(t: InstitutionType): string {
  switch (t) {
    case "MOSQUE":
      return "Mosque";
    case "MADRASAH":
      return "Madrasah";
    case "MARKAZ":
      return "Markaz";
    default:
      return String(t);
  }
}

type FontSet = { sans: string; eth: string; arb: string };

function resolveFonts(doc: InstanceType<typeof PDFDocument>): FontSet {
  const sansPath = path.join(fontsDir, "NotoSans-Regular.ttf");
  const ethPath = path.join(fontsDir, "NotoSansEthiopic-Regular.ttf");
  const arbPath = path.join(fontsDir, "NotoNaskhArabic-Regular.ttf");
  let sans = "Helvetica";
  let eth = "Helvetica";
  let arb = "Helvetica";
  try {
    if (fs.existsSync(sansPath)) {
      doc.registerFont("NotoSans", sansPath);
      sans = "NotoSans";
    }
    if (fs.existsSync(ethPath)) {
      doc.registerFont("NotoEthiopic", ethPath);
      eth = "NotoEthiopic";
    }
    if (fs.existsSync(arbPath)) {
      doc.registerFont("NotoArabic", arbPath);
      arb = "NotoArabic";
    }
  } catch {
    // keep Helvetica fallbacks
  }
  return { sans, eth, arb };
}

type RecognitionPdfParams = {
  certificateNumber: string;
  institutionNameOnCert: string;
  institutionType: InstitutionType;
  zoneCityAdmin: string;
  districtSubcity: string;
  gandaKebele: string;
  issueDate: Date;
  expiresAt?: Date;
};

async function resolveMosqueCertificateTemplate() {
  const templateCode = process.env.MOSQUE_INSTITUTION_CERT_TEMPLATE_CODE?.trim();
  if (templateCode) {
    const byCode = await getActiveCertificateTemplateByCode(templateCode);
    if (byCode) return byCode;
  }
  return getActiveCertificateTemplateByType(HalalCertificateTemplateType.MOSQUE_INSTITUTION);
}

/** Render mosque recognition PDF into memory using the active document template. */
export async function renderMosqueRecognitionCertificateBuffer(params: {
  certificateNumber: string;
  institutionNameOnCert: string;
  zoneCityAdmin: string;
  districtSubcity: string;
  gandaKebele: string;
  issueDate: Date;
  expiresAt?: Date;
}): Promise<Buffer | null> {
  const template = await resolveMosqueCertificateTemplate();
  if (!template?.sourceFileUrl || !template.layoutConfig) return null;

  const verifyUrl = verifyUrlFor(params.certificateNumber);
  const expiresAt =
    params.expiresAt ??
    (() => {
      const d = new Date(params.issueDate);
      d.setFullYear(d.getFullYear() + 2);
      return d;
    })();
  const data = mosqueInstitutionCertificateData({
    certificateNumber: params.certificateNumber,
    zoneCityAdmin: params.zoneCityAdmin,
    districtSubcity: params.districtSubcity,
    gandaKebele: params.gandaKebele,
    institutionNameOnCert: params.institutionNameOnCert,
    issueDate: params.issueDate,
    expiresAt,
    verifyUrl,
  });

  return generateCertificatePdfBuffer({
    sourceFileUrl: template.sourceFileUrl,
    layoutConfig: template.layoutConfig,
    data,
    applyBranding: false,
  });
}

async function generateMosqueCertificateFromTemplate(
  params: RecognitionPdfParams
): Promise<{ pdfPath: string; pdfUrl: string } | null> {
  const buffer = await renderMosqueRecognitionCertificateBuffer({
    certificateNumber: params.certificateNumber,
    institutionNameOnCert: params.institutionNameOnCert,
    zoneCityAdmin: params.zoneCityAdmin,
    districtSubcity: params.districtSubcity,
    gandaKebele: params.gandaKebele,
    issueDate: params.issueDate,
    expiresAt: params.expiresAt,
  });
  if (!buffer) return null;

  const fileName = `IRR-${params.certificateNumber.replace(/[^A-Za-z0-9-]/g, "_")}-${Date.now()}.pdf`;
  const filePath = path.join(certsDir, fileName);
  fs.writeFileSync(filePath, buffer);

  return {
    pdfPath: filePath,
    pdfUrl: `/uploads/institution-recognitions/certificates/${fileName}`,
  };
}

async function generateLegacyInstitutionRecognitionPdf(
  params: RecognitionPdfParams
): Promise<{ pdfPath: string; pdfUrl: string }> {
  const {
    certificateNumber,
    institutionNameOnCert,
    institutionType,
    zoneCityAdmin,
    districtSubcity,
    gandaKebele,
    issueDate,
  } = params;

  const verifyUrl = verifyUrlFor(certificateNumber);
  const qrBuffer = await QRCode.toBuffer(verifyUrl, {
    width: 150,
    margin: 1,
    color: { dark: "#0070C0", light: "#FFFFFF" },
  });

  const fileName = `IRR-${certificateNumber.replace(/[^A-Za-z0-9-]/g, "_")}-${Date.now()}.pdf`;
  const filePath = path.join(certsDir, fileName);

  const GOLD = "#C58E58";
  const GREEN = "#008000";
  const MAROON = "#800000";
  const CREAM = "#FFFEF5";

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margins: { top: 44, bottom: 44, left: 48, right: 48 },
    });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const fonts = resolveFonts(doc);
    const pageW = doc.page.width;
    const pageH = doc.page.height;

    doc.save();
    doc.rect(0, 0, pageW, pageH).fill(CREAM);
    doc.restore();

    doc.save();
    doc.lineWidth(5).strokeColor(GOLD).rect(14, 14, pageW - 28, pageH - 28).stroke();
    doc.lineWidth(2).rect(24, 24, pageW - 48, pageH - 48).stroke();
    doc.lineWidth(0.6).opacity(0.85).rect(32, 32, pageW - 64, pageH - 64).stroke();
    doc.restore();

    const innerLeft = 52;
    const innerRight = pageW - 52;
    const innerW = innerRight - innerLeft;
    let y = 38;

    doc.font(fonts.sans).fontSize(8).fillColor(GREEN);
    doc.text("Mana Maaree Waliigala Dhimmoota Islaamummaa Naannoo Oromiyaa", innerLeft, y, { width: innerW * 0.28, align: "left" });
    doc.font(fonts.eth).text("የኦሮሚያ ክልል እስልምና ጉዳዮች ጠቅላይ ም/ቤት", innerLeft, y + 22, { width: innerW * 0.32, align: "left" });

    doc.font(fonts.arb).fontSize(9).text("المجلس الأعلى للشؤون الإسلامية في إقليم أورومية", innerRight - innerW * 0.34, y, {
      width: innerW * 0.34,
      align: "right",
    });
    doc.font(fonts.sans).fontSize(8).text("Oromia Region Islamic Affairs Supreme Council", innerRight - innerW * 0.36, y + 24, {
      width: innerW * 0.36,
      align: "right",
    });

    const cx = pageW / 2;
    doc.save();
    doc.circle(cx, y + 28, 22).fillAndStroke("#e8f5e9", GREEN);
    doc.fillColor(GREEN).font(fonts.sans).fontSize(7).text("☪", cx - 4, y + 22);
    doc.restore();

    y = 108;
    doc.font(fonts.sans).fontSize(20).fillColor(MAROON).text("Waraqaa Ragaa Beekkamtii Masjiidaa / Institution Recognition", innerLeft, y, {
      width: innerW,
      align: "center",
    });
    y += 26;
    doc.font(fonts.arb).fontSize(16).fillColor(MAROON).text("شهادة إعتماد المسجد / المركز / المدرسة", innerLeft, y, {
      width: innerW,
      align: "center",
    });

    y += 36;
    const serialX = innerRight - 118;
    doc.roundedRect(serialX, y - 4, 110, 36, 10).strokeColor(MAROON).lineWidth(1).stroke();
    doc.font(fonts.sans).fontSize(8).fillColor(MAROON).text("Lakkoofsa / No.", serialX + 8, y + 2, { width: 94 });
    doc.font(fonts.sans).fontSize(11).fillColor("#111827").text(certificateNumber, serialX + 8, y + 16, { width: 94 });

    const bodyTop = y + 44;
    const colGap = 28;
    const colW = (innerW - colGap - 160) / 2;
    const qrX = innerLeft;
    const leftColX = qrX + 158;
    const rightColX = leftColX + colW + colGap;

    doc.image(qrBuffer, qrX, bodyTop, { width: 140, height: 140 });

    const typeEn = typeLabelEn(institutionType);
    const dmy = fmtDateDMY(issueDate);

    let ly = bodyTop;
    doc.font(fonts.sans).fontSize(9).fillColor("#111827");
    doc.text(`Godina / Bulchiinsa Magaalaa: ${zoneCityAdmin}`, leftColX, ly, { width: colW });
    ly += 18;
    doc.text(`Aanaa / Kutaa Magaalaa: ${districtSubcity}`, leftColX, ly, { width: colW });
    ly += 18;
    doc.text(`Ganda: ${gandaKebele}`, leftColX, ly, { width: colW });
    ly += 22;
    doc.font(fonts.sans).fontSize(10).fillColor(MAROON).text(`Kan argamu (${typeEn}): ${institutionNameOnCert}`, leftColX, ly, { width: colW });
    ly += 36;
    doc.font(fonts.sans).fontSize(8.5).fillColor("#374151");
    doc.text(
      "Kunis ragaa waan Mana Maaree Waliigala Dhimmoota Islaamummaa Naannoo Oromiyaa beekumsa masjiidaa / institution kanaaf kenne irra jiru.",
      leftColX,
      ly,
      { width: colW, align: "left" }
    );
    ly += 40;
    doc.font(fonts.sans).fontSize(9).text(`Guyyaa / Date: ${dmy}`, leftColX, ly, { width: colW });

    let ry = bodyTop;
    doc.font(fonts.arb).fontSize(10).fillColor("#111827");
    doc.text(`المسجد / المؤسسة: ${institutionNameOnCert}`, rightColX, ry, { width: colW, align: "right" });
    ry += 22;
    doc.font(fonts.arb).fontSize(9).text(`المنطقة / الإدارة: ${zoneCityAdmin}`, rightColX, ry, { width: colW, align: "right" });
    ry += 20;
    doc.text(`المديرية: ${districtSubcity}`, rightColX, ry, { width: colW, align: "right" });
    ry += 20;
    doc.text(`الحي: ${gandaKebele}`, rightColX, ry, { width: colW, align: "right" });
    ry += 28;
    doc.font(fonts.arb).fontSize(8.5).fillColor("#374151");
    doc.text(
      "تشهد هيئة الشؤون الإسلامية العليا لإقليم أوروميا بأن المؤسسة أعلاه قد تم الاعتراف بها وفق الإجراءات الرسمية.",
      rightColX,
      ry,
      { width: colW, align: "right" }
    );
    ry += 44;
    doc.font(fonts.arb).fontSize(9).text(`تاريخ الإصدار: ${dmy}`, rightColX, ry, { width: colW, align: "right" });

    const footY = pageH - 100;
    doc.save();
    doc.circle(cx, footY, 28).strokeColor("#6b21a8").lineWidth(2).stroke();
    doc.font(fonts.sans).fontSize(6).fillColor("#6b21a8").text("SEAL", cx - 12, footY - 4);
    doc.restore();

    doc.font(fonts.sans).fontSize(8).fillColor("#111827");
    doc.text("Shekh Ghaalii Mukhtaar Abbaaduraa — Pirezidantii / الرئيس / ፕሬዝዳንት", innerRight - 280, footY + 12, {
      width: 260,
      align: "right",
    });
    doc.moveTo(innerRight - 260, footY + 36).lineTo(innerRight, footY + 36).strokeColor("#9ca3af").lineWidth(0.8).stroke();

    doc.font(fonts.sans).fontSize(7).fillColor("#0070C0").text(`Verify (live): ${verifyUrl}`, innerLeft, pageH - 36, { width: innerW * 0.85 });

    doc.font(fonts.sans).fontSize(7).fillColor("#6b7280").text(
      "Generated electronically. Unauthorized alteration voids this certificate.",
      innerLeft,
      pageH - 22,
      { width: innerW, align: "center" }
    );

    doc.end();

    stream.on("finish", () => {
      resolve({
        pdfPath: filePath,
        pdfUrl: `/uploads/institution-recognitions/certificates/${fileName}`,
      });
    });
    stream.on("error", reject);
  });
}

export async function generateInstitutionRecognitionPdf(
  params: RecognitionPdfParams
): Promise<{ pdfPath: string; pdfUrl: string }> {
  if (params.institutionType === "MOSQUE") {
    const fromTemplate = await generateMosqueCertificateFromTemplate(params);
    if (fromTemplate) return fromTemplate;
  }
  return generateLegacyInstitutionRecognitionPdf(params);
}
