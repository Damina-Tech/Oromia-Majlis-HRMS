import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { DocumentTemplateEngine, HalalCertificateTemplateType, PrismaClient } from "@prisma/client";
import {
  DEFAULT_MOSQUE_INSTITUTION_CERTIFICATE_LAYOUT,
  MOSQUE_INSTITUTION_CERT_TEMPLATE_CODE,
} from "../institutions/mosque-institution-certificate-layout.shared.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const assetPath = path.join(__dirname, "../../../assets/certificate-templates/mosque-certificate.jpg");
const uploadsDir = path.join(__dirname, "../../../uploads/document-template-sources");
const uploadFileName = "mosque-certificate-v1.jpg";

export async function seedMosqueInstitutionCertificateTemplate(prisma: PrismaClient, adminUserId: string) {
  if (!fs.existsSync(assetPath)) {
    console.log("⚠️  Mosque certificate asset not found, skipping mosque template seed");
    return;
  }

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const destPath = path.join(uploadsDir, uploadFileName);
  if (!fs.existsSync(destPath)) {
    fs.copyFileSync(assetPath, destPath);
  }

  const sourceFileUrl = `/uploads/document-template-sources/${uploadFileName}`;
  const layoutConfig = DEFAULT_MOSQUE_INSTITUTION_CERTIFICATE_LAYOUT;
  const mergeFields = {
    fields: layoutConfig.fields.map((f) => f.key),
  };

  await prisma.documentTemplate.upsert({
    where: { code: MOSQUE_INSTITUTION_CERT_TEMPLATE_CODE },
    update: {
      name: "Mosque Institution Recognition Certificate",
      category: "CERTIFICATE",
      description:
        "Official ORIASC mosque recognition certificate background. Used automatically when issuing recognition for MOSQUE institutions.",
      templateEngine: DocumentTemplateEngine.PDF_CERTIFICATE,
      certificateType: HalalCertificateTemplateType.MOSQUE_INSTITUTION,
      sourceFileUrl,
      layoutConfig: layoutConfig as object,
      mergeFields,
      status: "ACTIVE",
      active: true,
      updatedBy: adminUserId,
    },
    create: {
      code: MOSQUE_INSTITUTION_CERT_TEMPLATE_CODE,
      name: "Mosque Institution Recognition Certificate",
      category: "CERTIFICATE",
      description:
        "Official ORIASC mosque recognition certificate background. Used automatically when issuing recognition for MOSQUE institutions.",
      content: "<!-- PDF certificate template -->",
      templateEngine: DocumentTemplateEngine.PDF_CERTIFICATE,
      certificateType: HalalCertificateTemplateType.MOSQUE_INSTITUTION,
      sourceFileUrl,
      layoutConfig: layoutConfig as object,
      mergeFields,
      language: "OR",
      tags: ["majlis", "mosque", "institution", "certificate", "recognition"],
      status: "ACTIVE",
      active: true,
      createdBy: adminUserId,
      updatedBy: adminUserId,
    },
  });

  await prisma.documentTemplate.updateMany({
    where: {
      certificateType: HalalCertificateTemplateType.MOSQUE_INSTITUTION,
      templateEngine: DocumentTemplateEngine.PDF_CERTIFICATE,
      status: "ACTIVE",
      code: { not: MOSQUE_INSTITUTION_CERT_TEMPLATE_CODE },
    },
    data: { status: "ARCHIVED", active: false },
  });

  console.log("✅ Mosque institution certificate template seeded");
}
