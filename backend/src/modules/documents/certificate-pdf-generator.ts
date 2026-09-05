import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import QRCode from "qrcode";
import * as fs from "fs";
import * as path from "path";
import { resolveUploadPath, uploadsRoot } from "../../lib/uploads-path.js";
import {
  parseLayoutConfig,
  resolveLayoutPages,
  type CertificateLayoutConfig,
  type CertificateLayoutField,
} from "./certificate-layout.types.js";

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  if (h.length !== 6) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(h.slice(0, 2), 16) / 255,
    g: parseInt(h.slice(2, 4), 16) / 255,
    b: parseInt(h.slice(4, 6), 16) / 255,
  };
}

function pdfYFromTop(pageHeight: number, field: CertificateLayoutField): number {
  return pageHeight - field.y - field.height;
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(test, fontSize) <= maxWidth) {
      line = test;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

async function drawField(
  pdfDoc: PDFDocument,
  page: PDFPage,
  field: CertificateLayoutField,
  value: string,
  pageHeight: number,
  fontRegular: PDFFont,
  fontBold: PDFFont
): Promise<void> {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return;

  const pageWidth = page.getWidth();

  if (field.type === "image") {
    let imgPath: string;
    try {
      imgPath = resolveUploadPath(trimmed);
    } catch {
      return;
    }
    if (!fs.existsSync(imgPath)) return;
    const bytes = fs.readFileSync(imgPath);
    const ext = path.extname(imgPath).toLowerCase();
    const embedded =
      ext === ".png"
        ? await pdfDoc.embedPng(bytes)
        : ext === ".jpg" || ext === ".jpeg"
          ? await pdfDoc.embedJpg(bytes)
          : null;
    if (!embedded) return;
    const y = pdfYFromTop(pageHeight, field);
    page.drawImage(embedded, {
      x: field.x,
      y,
      width: field.width,
      height: field.height,
    });
    return;
  }

  if (field.type === "qrcode") {
    const qrBuffer = await QRCode.toBuffer(trimmed, {
      width: Math.max(64, Math.round(field.width * 2)),
      margin: 1,
    });
    const qrImage = await pdfDoc.embedPng(qrBuffer);
    const y = pdfYFromTop(pageHeight, field);
    page.drawImage(qrImage, {
      x: field.x,
      y,
      width: field.width,
      height: field.height,
    });
    return;
  }

  const fontSize = field.fontSize ?? 11;
  const font = field.fontWeight === "bold" ? fontBold : fontRegular;
  const color = field.color ? hexToRgb(field.color) : { r: 0, g: 0, b: 0 };
  const lines = wrapText(trimmed, font, fontSize, field.width);
  const lineHeight = fontSize * 1.25;
  let yTop = field.y + field.height - fontSize;

  for (const line of lines) {
    const textWidth = font.widthOfTextAtSize(line, fontSize);
    let x = field.x;
    const align = field.align ?? "left";
    if (align === "center") {
      x = field.x + (field.width - textWidth) / 2;
    } else if (align === "right") {
      x = field.x + field.width - textWidth;
    }
    x = Math.max(0, Math.min(x, pageWidth - textWidth));
    const yPdf = pageHeight - yTop;
    page.drawText(line, {
      x,
      y: yPdf,
      size: fontSize,
      font,
      color: rgb(color.r, color.g, color.b),
    });
    yTop += lineHeight;
    if (yTop > field.y + field.height) break;
  }
}

async function embedBackgroundOnPage(
  pdfDoc: PDFDocument,
  page: PDFPage,
  sourcePath: string,
  layout: CertificateLayoutConfig
): Promise<void> {
  const ext = path.extname(sourcePath).toLowerCase();
  const bytes = fs.readFileSync(sourcePath);

  if (ext === ".pdf") {
    const bgDoc = await PDFDocument.load(bytes);
    const [embeddedPage] = await pdfDoc.embedPdf(bgDoc, [0]);
    page.drawPage(embeddedPage, {
      x: 0,
      y: 0,
      width: layout.pageWidth,
      height: layout.pageHeight,
    });
    return;
  }

  const embedded =
    ext === ".png"
      ? await pdfDoc.embedPng(bytes)
      : ext === ".jpg" || ext === ".jpeg"
        ? await pdfDoc.embedJpg(bytes)
        : null;
  if (!embedded) {
    throw new Error("Template must be PDF, PNG, or JPEG");
  }
  page.drawImage(embedded, {
    x: 0,
    y: 0,
    width: layout.pageWidth,
    height: layout.pageHeight,
  });
}

/**
 * Generate a certificate PDF from a template file + saved layout JSON (no hardcoded positions).
 * Supports single-page (`fields`) and multipage (`pages`, e.g. membership ID front/back).
 */
export async function generateCertificatePdfFromLayout(params: {
  sourceFileUrl: string;
  layoutConfig: unknown;
  data: Record<string, string>;
  outputFilePath: string;
}): Promise<void> {
  const layout = parseLayoutConfig(params.layoutConfig);
  if (!layout) {
    throw new Error("Certificate template has invalid layout configuration");
  }

  const pagesConfig = resolveLayoutPages(layout, params.sourceFileUrl);
  const hasAnyFields = pagesConfig.some((p) => p.fields?.length);
  if (!hasAnyFields) {
    throw new Error("Certificate template has no layout fields configured");
  }

  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  for (const pageCfg of pagesConfig) {
    const sourceUrl = pageCfg.sourceFileUrl || params.sourceFileUrl;
    if (!sourceUrl) {
      throw new Error(`Missing background file for page "${pageCfg.key}"`);
    }
    const sourcePath = resolveUploadPath(sourceUrl);
    const page = pdfDoc.addPage([layout.pageWidth, layout.pageHeight]);
    await embedBackgroundOnPage(pdfDoc, page, sourcePath, layout);
    const pageHeight = page.getHeight();

    for (const field of pageCfg.fields) {
      const value = params.data[field.key] ?? "";
      await drawField(pdfDoc, page, field, value, pageHeight, fontRegular, fontBold);
    }
  }

  const outDir = path.dirname(params.outputFilePath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(params.outputFilePath, pdfBytes);
}

export async function generateCertificatePdfBuffer(params: {
  sourceFileUrl: string;
  layoutConfig: unknown;
  data: Record<string, string>;
  /** When true, merge signature/seal from active DocumentSettings into data */
  applyBranding?: boolean;
}): Promise<Buffer> {
  let data = params.data;
  if (params.applyBranding !== false) {
    const { getCertificateBrandingAssets, mergeCertificateBrandingIntoData } = await import(
      "./certificate-branding.service.js"
    );
    const branding = await getCertificateBrandingAssets();
    data = mergeCertificateBrandingIntoData(data, branding);
  }
  const tmpDir = path.join(uploadsRoot, "temp");
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  const tmpPath = path.join(tmpDir, `cert-preview-${Date.now()}.pdf`);
  await generateCertificatePdfFromLayout({
    sourceFileUrl: params.sourceFileUrl,
    layoutConfig: params.layoutConfig,
    data,
    outputFilePath: tmpPath,
  });
  const buf = fs.readFileSync(tmpPath);
  try {
    fs.unlinkSync(tmpPath);
  } catch {
    /* ignore */
  }
  return buf;
}
