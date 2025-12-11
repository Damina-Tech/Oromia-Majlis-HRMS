import { createCanvas, loadImage } from "@napi-rs/canvas";
import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import QRCode from "qrcode";
import bwipjs from "bwip-js";
import fetch from "node-fetch";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.join(__dirname, "../../../uploads");
const idCardsDir = path.join(uploadsRoot, "id-cards");
if (!fs.existsSync(idCardsDir)) {
    fs.mkdirSync(idCardsDir, { recursive: true });
}
const CARD_DIMENSIONS = {
    ID1: { width: 1011, height: 638 },
    ID2: { width: 1030, height: 650 },
    ID3: { width: 638, height: 1011 },
};
const DEFAULT_FONT_FAMILY = "Inter, sans-serif";
function getDimensions(settings) {
    if (settings.size === "CUSTOM" && settings.customDimensions) {
        return settings.customDimensions;
    }
    return CARD_DIMENSIONS[settings.size ?? "ID1"] ?? CARD_DIMENSIONS.ID1;
}
function formatDate(date) {
    if (!date)
        return "—";
    return new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}
async function loadImageFromSource(src) {
    if (!src)
        return null;
    try {
        if (src.startsWith("data:")) {
            return await loadImage(src);
        }
        if (src.startsWith("http")) {
            const response = await fetch(src);
            if (!response.ok)
                return null;
            const arrayBuffer = await response.arrayBuffer();
            return await loadImage(Buffer.from(arrayBuffer));
        }
        let candidate = src;
        if (src.startsWith("/uploads")) {
            candidate = path.join(uploadsRoot, src.replace("/uploads", ""));
        }
        if (fs.existsSync(candidate)) {
            return await loadImage(candidate);
        }
    }
    catch (error) {
        console.warn("Failed to load asset image", src, error);
    }
    return null;
}
async function buildCodeImage(value, type, width) {
    if (!value || type === "NONE")
        return null;
    try {
        if (type === "QR") {
            const buffer = await QRCode.toBuffer(value, {
                width: Math.min(320, Math.round(width * 0.35)),
                margin: 1,
                color: { dark: "#111827", light: "#ffffff00" },
            });
            return await loadImage(buffer);
        }
        const buffer = await bwipjs.toBuffer({
            bcid: "code128",
            text: value,
            scale: 3,
            height: 15,
            includetext: false,
            backgroundcolor: "FFFFFF00",
        });
        return await loadImage(buffer);
    }
    catch (error) {
        console.warn("Failed to build code image", error);
        return null;
    }
}
function resolveText(templateString, employee, issueDate, expiryDate) {
    return templateString
        .replace(/{{\s*name\s*}}/gi, `${employee.firstName} ${employee.lastName}`.trim())
        .replace(/{{\s*employeeCode\s*}}/gi, employee.employeeCode)
        .replace(/{{\s*department\s*}}/gi, employee.department?.name ?? "")
        .replace(/{{\s*designation\s*}}/gi, employee.designation ?? "")
        .replace(/{{\s*issueDate\s*}}/gi, formatDate(issueDate))
        .replace(/{{\s*expiryDate\s*}}/gi, formatDate(expiryDate));
}
function getTextFont(settings, weight = "normal", size) {
    const fontFamily = settings.text?.fontFamily ?? DEFAULT_FONT_FAMILY;
    const fontSize = size ?? settings.text?.fontSize ?? 14;
    const prefix = weight === "bold" ? "bold " : "";
    return `${prefix}${fontSize}px ${fontFamily}`;
}
async function writePdfFromPng(buffer, pdfPath, width, height) {
    await new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: [width, height], margin: 0 });
        const writeStream = fs.createWriteStream(pdfPath);
        doc.pipe(writeStream);
        doc.image(buffer, 0, 0, { width, height });
        doc.end();
        writeStream.on("finish", () => resolve());
        writeStream.on("error", (error) => reject(error));
    });
}
export async function generateIdCardAssets(options) {
    const { employee, settings, template, issueDate, expiryDate, codeType } = options;
    const dims = getDimensions(settings);
    const canvas = createCanvas(dims.width, dims.height);
    const ctx = canvas.getContext("2d");
    // Canvas quality settings (if supported by canvas library)
    // @ts-ignore - These properties may exist on some canvas implementations
    if ('patternQuality' in ctx) {
        ctx.patternQuality = "best";
    }
    // @ts-ignore
    if ('antialias' in ctx) {
        ctx.antialias = "subpixel";
    }
    // @ts-ignore
    if ('textDrawingMode' in ctx) {
        ctx.textDrawingMode = "glyph";
    }
    // Background
    if (settings.background?.type === "image" && settings.background.value) {
        const backgroundImage = await loadImageFromSource(settings.background.value);
        if (backgroundImage) {
            ctx.drawImage(backgroundImage, 0, 0, dims.width, dims.height);
        }
        else {
            ctx.fillStyle = settings.background?.value ?? "#ffffff";
            ctx.fillRect(0, 0, dims.width, dims.height);
        }
    }
    else {
        ctx.fillStyle = settings.background?.value ?? "#ffffff";
        ctx.fillRect(0, 0, dims.width, dims.height);
        if (settings.assets?.backgroundUrl) {
            const texture = await loadImageFromSource(settings.assets.backgroundUrl);
            if (texture) {
                ctx.globalAlpha = 0.2;
                ctx.drawImage(texture, 0, 0, dims.width, dims.height);
                ctx.globalAlpha = 1;
            }
        }
    }
    // Border
    if (settings.border && settings.border.width > 0) {
        ctx.strokeStyle = settings.border.color ?? "#111827";
        ctx.lineWidth = settings.border.width;
        const radius = settings.border.radius ?? 0;
        ctx.beginPath();
        ctx.moveTo(radius, 0);
        ctx.lineTo(dims.width - radius, 0);
        ctx.quadraticCurveTo(dims.width, 0, dims.width, radius);
        ctx.lineTo(dims.width, dims.height - radius);
        ctx.quadraticCurveTo(dims.width, dims.height, dims.width - radius, dims.height);
        ctx.lineTo(radius, dims.height);
        ctx.quadraticCurveTo(0, dims.height, 0, dims.height - radius);
        ctx.lineTo(0, radius);
        ctx.quadraticCurveTo(0, 0, radius, 0);
        ctx.closePath();
        ctx.stroke();
    }
    const padding = Math.round(dims.width * 0.05);
    // Logo
    if (settings.fieldVisibility?.showCompanyLogo && settings.assets?.logoUrl) {
        const logo = await loadImageFromSource(settings.assets.logoUrl);
        if (logo) {
            const logoWidth = Math.min(logo.width, Math.round(dims.width * 0.2));
            const ratio = logoWidth / logo.width;
            const logoHeight = logo.height * ratio;
            ctx.drawImage(logo, padding, padding, logoWidth, logoHeight);
        }
    }
    const layout = settings.layout ?? "PHOTO_LEFT";
    const photoArea = { x: padding, y: padding * 1.6, width: dims.width * 0.3, height: dims.height - padding * 3 };
    const contentArea = { x: padding * 1.4 + photoArea.width, y: padding * 1.6, width: dims.width - photoArea.width - padding * 2.4 };
    if (layout === "PHOTO_TOP") {
        photoArea.x = padding;
        photoArea.y = padding * 2;
        photoArea.width = dims.width - padding * 2;
        photoArea.height = Math.min(dims.height * 0.4, photoArea.width * 0.6);
        contentArea.x = padding;
        contentArea.y = photoArea.y + photoArea.height + padding * 0.6;
        contentArea.width = dims.width - padding * 2;
    }
    else if (layout === "PHOTO_RIGHT") {
        contentArea.x = padding;
        contentArea.width = dims.width * 0.55;
        photoArea.x = contentArea.x + contentArea.width + padding * 0.4;
        photoArea.width = dims.width - photoArea.x - padding;
    }
    // Photo
    if (settings.fieldVisibility?.showPhoto) {
        const avatarImage = await loadImageFromSource(employee.avatarUrl);
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(photoArea.x, photoArea.y, photoArea.width, photoArea.height, 18);
        ctx.clip();
        if (avatarImage) {
            ctx.drawImage(avatarImage, photoArea.x, photoArea.y, photoArea.width, photoArea.height);
        }
        else {
            ctx.fillStyle = "#d1d5db";
            ctx.fillRect(photoArea.x, photoArea.y, photoArea.width, photoArea.height);
            const initials = `${employee.firstName?.[0] ?? ""}${employee.lastName?.[0] ?? ""}`.toUpperCase();
            ctx.fillStyle = "#374151";
            ctx.font = `bold ${Math.round(photoArea.width / 3)}px ${settings.text?.fontFamily ?? DEFAULT_FONT_FAMILY}`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(initials || "?", photoArea.x + photoArea.width / 2, photoArea.y + photoArea.height / 2);
        }
        ctx.restore();
    }
    // Content
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = settings.text?.color ?? "#111827";
    let cursorY = contentArea.y;
    const fullName = `${employee.firstName} ${employee.lastName}`.trim() || employee.employeeCode;
    if (settings.fieldVisibility?.showEmployeeName) {
        ctx.font = getTextFont(settings, "bold", settings.text?.headingSize ?? 20);
        ctx.fillText(fullName, contentArea.x, cursorY);
        cursorY += (settings.text?.headingSize ?? 20) + 8;
    }
    const infoLines = [];
    if (settings.fieldVisibility?.showJobTitle && employee.designation) {
        infoLines.push(employee.designation);
    }
    if (settings.fieldVisibility?.showDepartment && employee.department?.name) {
        infoLines.push(employee.department.name);
    }
    if (settings.fieldVisibility?.showEmployeeCode) {
        infoLines.push(`ID: ${employee.employeeCode}`);
    }
    ctx.font = getTextFont(settings, "normal");
    infoLines.forEach((line) => {
        ctx.fillText(line, contentArea.x, cursorY);
        cursorY += (settings.text?.fontSize ?? 14) + 6;
    });
    const metaLines = [];
    if (settings.fieldVisibility?.showIssueDate) {
        metaLines.push(`Issued: ${formatDate(issueDate)}`);
    }
    if (settings.fieldVisibility?.showExpiryDate && expiryDate) {
        metaLines.push(`Expires: ${formatDate(expiryDate)}`);
    }
    metaLines.forEach((line) => {
        ctx.fillText(line, contentArea.x, cursorY);
        cursorY += (settings.text?.fontSize ?? 14) + 6;
    });
    if (settings.extraLines && settings.extraLines.length > 0) {
        ctx.font = getTextFont(settings, "normal", Math.max(11, (settings.text?.fontSize ?? 14) - 1));
        ctx.fillStyle = `${(settings.text?.color ?? "#111827")}cc`;
        settings.extraLines.forEach((line) => {
            const parsed = resolveText(line, employee, issueDate, expiryDate);
            ctx.fillText(parsed, contentArea.x, cursorY);
            cursorY += (settings.text?.fontSize ?? 14);
        });
    }
    // Signature
    if (settings.fieldVisibility?.showSignature && settings.assets?.signatureUrl) {
        const signature = await loadImageFromSource(settings.assets.signatureUrl);
        if (signature) {
            const signatureWidth = Math.min(180, Math.round(contentArea.width * 0.6));
            const ratio = signatureWidth / signature.width;
            const signatureHeight = signature.height * ratio;
            const sigY = dims.height - signatureHeight - padding * 1.4;
            ctx.drawImage(signature, contentArea.x, sigY, signatureWidth, signatureHeight);
            ctx.font = getTextFont(settings, "normal", 12);
            ctx.fillText("Authorized Signature", contentArea.x, sigY + signatureHeight + 4);
        }
    }
    // Stamp
    if (settings.fieldVisibility?.showStamp && settings.assets?.stampUrl) {
        const stamp = await loadImageFromSource(settings.assets.stampUrl);
        if (stamp) {
            const stampSize = Math.min(140, Math.round(dims.width * 0.18));
            ctx.globalAlpha = 0.75;
            ctx.drawImage(stamp, dims.width - stampSize - padding, dims.height - stampSize - padding, stampSize, stampSize);
            ctx.globalAlpha = 1;
        }
    }
    const codeImage = await buildCodeImage(employee.employeeCode, codeType ?? settings.codeType ?? "QR", dims.width);
    if (codeImage) {
        const codeWidth = Math.min(codeImage.width, Math.round(dims.width * 0.32));
        const codeHeight = codeImage.height * (codeWidth / codeImage.width);
        const codeX = layout === "PHOTO_LEFT" ? contentArea.x : padding;
        const codeY = dims.height - codeHeight - padding;
        ctx.drawImage(codeImage, codeX, codeY, codeWidth, codeHeight);
    }
    const pngBuffer = canvas.toBuffer("image/png");
    const timestamp = Date.now();
    const safeCode = employee.employeeCode.replace(/[^\w-]+/g, "-");
    const baseName = `${safeCode}-${timestamp}`;
    const pngFileName = `${baseName}.png`;
    const pdfFileName = `${baseName}.pdf`;
    const pngFullPath = path.join(idCardsDir, pngFileName);
    const pdfFullPath = path.join(idCardsDir, pdfFileName);
    await fs.promises.writeFile(pngFullPath, pngBuffer);
    await writePdfFromPng(pngBuffer, pdfFullPath, dims.width, dims.height);
    const pngUrl = `/uploads/id-cards/${pngFileName}`;
    const pdfUrl = `/uploads/id-cards/${pdfFileName}`;
    const metadata = {
        templateId: template.id,
        templateName: template.name,
        issueDate: issueDate.toISOString(),
        expiryDate: expiryDate?.toISOString() ?? null,
        layout,
        size: dims,
        codeType: codeType ?? settings.codeType ?? "QR",
    };
    return {
        pngPath: pngFullPath,
        pdfPath: pdfFullPath,
        pngUrl,
        pdfUrl,
        metadata,
        codeType: codeType ?? settings.codeType ?? "QR",
    };
}
//# sourceMappingURL=id-card.renderer.js.map