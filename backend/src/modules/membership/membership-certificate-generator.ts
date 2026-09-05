import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { HalalCertificateTemplateType } from "@prisma/client";
import { publicCertificateVerifyUrl } from "../../lib/certificate-verify-url.js";
import { membershipIdCertificateData } from "../documents/certificate-field-catalog.js";
import { generateCertificatePdfFromLayout } from "../documents/certificate-pdf-generator.js";
import {
  getActiveCertificateTemplateByCode,
  getActiveCertificateTemplateByType,
} from "../documents/certificate-template.service.js";
import { parseLayoutConfig, resolveLayoutPages } from "../documents/certificate-layout.types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const certsDir = path.join(__dirname, "../../../uploads/membership/certificates");
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true });
}

export type MembershipCertificateMemberInput = {
  fullName: string;
  phone: string;
  category: string;
  categoryData?: Record<string, unknown> | null;
  profilePhotoUrl?: string | null;
  addressLine?: string | null;
  zone?: { name: string } | null;
  woreda?: { name: string } | null;
};

export async function generateMembershipCertificatePDF(params: {
  certificateId: string;
  fullName: string;
  category: string;
  issuedAt: Date;
  expiresAt: Date;
  photoPath?: string | null;
  /** Preferred: full member context for template-driven ID cards */
  member?: MembershipCertificateMemberInput | null;
}): Promise<{ pdfPath: string; pdfUrl: string; qrDataUrl: string }> {
  const { certificateId, issuedAt, expiresAt } = params;
  const verifyUrl = publicCertificateVerifyUrl(certificateId);
  const fileName = `MAJ-${certificateId}-${Date.now()}.pdf`;
  const filePath = path.join(certsDir, fileName);
  const pdfUrl = `/uploads/membership/certificates/${fileName}`;

  const member = params.member ?? {
    fullName: params.fullName,
    phone: "",
    category: params.category,
    profilePhotoUrl: null,
  };

  const data = membershipIdCertificateData({
    certificateId,
    fullName: member.fullName || params.fullName,
    phone: member.phone || "",
    category: member.category || params.category,
    categoryData: member.categoryData,
    zoneName: member.zone?.name,
    woredaName: member.woreda?.name,
    addressLine: member.addressLine,
    profilePhotoUrl: member.profilePhotoUrl || undefined,
    issuedAt,
    expiresAt,
    verifyUrl,
  });

  // Prefer absolute upload path for photo when a local file path was passed
  if (params.photoPath && fs.existsSync(params.photoPath)) {
    const rel = params.photoPath.replace(/\\/g, "/");
    const idx = rel.indexOf("/uploads/");
    data.photo = idx >= 0 ? rel.slice(idx) : member.profilePhotoUrl || data.photo;
  }

  const templateCode = process.env.MEMBERSHIP_ID_CERT_TEMPLATE_CODE?.trim();
  const template = templateCode
    ? await getActiveCertificateTemplateByCode(templateCode)
    : await getActiveCertificateTemplateByType(HalalCertificateTemplateType.MEMBERSHIP_ID);

  if (template?.sourceFileUrl && template.layoutConfig) {
    const layout = parseLayoutConfig(template.layoutConfig);
    const pages = layout ? resolveLayoutPages(layout, template.sourceFileUrl) : [];
    if (pages.some((p) => p.fields.length > 0)) {
      await generateCertificatePdfFromLayout({
        sourceFileUrl: template.sourceFileUrl,
        layoutConfig: template.layoutConfig,
        data,
        outputFilePath: filePath,
      });
      return { pdfPath: filePath, pdfUrl, qrDataUrl: verifyUrl };
    }
  }

  // Fallback: still fail loudly so admins know to activate a membership ID template
  throw new Error(
    "No active Membership ID certificate template found. Under Documents → Template, create/activate a PDF certificate of type Membership ID."
  );
}
