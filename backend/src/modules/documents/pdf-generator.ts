import PDFDocument from "pdfkit";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure documents directory exists
const documentsDir = path.join(__dirname, "../../../uploads/generated-documents");
if (!fs.existsSync(documentsDir)) {
  fs.mkdirSync(documentsDir, { recursive: true });
}

/**
 * Convert HTML content to plain text (for basic PDF generation)
 */
function htmlToPlainText(html: string): string {
  // Remove HTML tags and decode entities
  let text = html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  return text;
}

/**
 * Convert HTML to simple formatted text (preserves basic structure)
 */
function htmlToFormattedText(html: string): string[] {
  // Extract text while preserving basic formatting hints
  const lines: string[] = [];
  let currentLine = "";

  // Simple HTML parser for basic tags
  html = html.replace(/<br\s*\/?>/gi, "\n");
  html = html.replace(/<\/p>/gi, "\n\n");
  html = html.replace(/<\/div>/gi, "\n");
  html = html.replace(/<\/h[1-6]>/gi, "\n\n");
  html = html.replace(/<strong>/gi, "**");
  html = html.replace(/<\/strong>/gi, "**");
  html = html = html.replace(/<b>/gi, "**");
  html = html.replace(/<\/b>/gi, "**");
  html = html.replace(/<em>/gi, "_");
  html = html.replace(/<\/em>/gi, "_");
  html = html.replace(/<i>/gi, "_");
  html = html.replace(/<\/i>/gi, "_");

  // Remove remaining HTML tags
  html = html.replace(/<[^>]+>/g, "");

  // Split into lines
  const tempLines = html.split("\n");
  for (const line of tempLines) {
    const trimmed = line.trim();
    if (trimmed) {
      lines.push(trimmed);
    }
  }

  return lines;
}

/**
 * Generate PDF from HTML content using pdfkit
 * Note: This is a basic implementation. For complex HTML/CSS, consider using puppeteer
 */
export async function generatePDFFromHTML(
  htmlContent: string,
  outputFileName: string
): Promise<{ filePath: string; fileName: string; fileSize: number }> {
  return new Promise((resolve, reject) => {
    try {
      const filePath = path.join(documentsDir, outputFileName);
      const doc = new PDFDocument({
        size: "A4",
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50,
        },
      });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Convert HTML to formatted text lines
      const lines = htmlToFormattedText(htmlContent);

      // Write content
      let yPosition = 50;
      const lineHeight = 20;
      const pageHeight = 792; // A4 height in points
      const margin = 50;

      for (const line of lines) {
        // Check if we need a new page
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }

        // Basic formatting detection
        if (line.startsWith("**") && line.endsWith("**")) {
          // Bold text
          const text = line.slice(2, -2);
          doc.font("Helvetica-Bold").text(text, margin, yPosition, {
            width: 500,
            align: "left",
          });
        } else if (line.startsWith("_") && line.endsWith("_")) {
          // Italic text
          const text = line.slice(1, -1);
          doc.font("Helvetica-Oblique").text(text, margin, yPosition, {
            width: 500,
            align: "left",
          });
        } else {
          // Regular text
          doc.font("Helvetica").text(line, margin, yPosition, {
            width: 500,
            align: "left",
          });
        }

        yPosition += lineHeight;

        // Add extra space for paragraphs
        if (line.trim().length < 10) {
          yPosition += 10;
        }
      }

      doc.end();

      stream.on("finish", () => {
        const stats = fs.statSync(filePath);
        resolve({
          filePath: `/uploads/generated-documents/${outputFileName}`,
          fileName: outputFileName,
          fileSize: stats.size,
        });
      });

      stream.on("error", (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate PDF filename
 */
export function generateDocumentFileName(
  templateCode: string,
  employeeCode: string | null,
  extension: string = "pdf"
): string {
  const timestamp = Date.now();
  const employeePart = employeeCode ? `-${employeeCode}` : "";
  return `${templateCode}${employeePart}-${timestamp}.${extension}`;
}

/**
 * Clean up old generated documents (for retention policies)
 */
export async function cleanupOldDocuments(olderThanDays: number): Promise<number> {
  try {
    const files = fs.readdirSync(documentsDir);
    const now = Date.now();
    const maxAge = olderThanDays * 24 * 60 * 60 * 1000;
    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(documentsDir, file);
      const stats = fs.statSync(filePath);

      if (now - stats.mtimeMs > maxAge) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    }

    return deletedCount;
  } catch (error) {
    console.error("Error cleaning up old documents:", error);
    return 0;
  }
}

