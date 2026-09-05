import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { DocumentTemplateEngine, HalalCertificateTemplateType, PrismaClient } from "@prisma/client";
import {
  DEFAULT_MEMBERSHIP_ID_CERTIFICATE_LAYOUT,
  MEMBERSHIP_ID_CERT_TEMPLATE_CODE,
} from "./membership-id-certificate-layout.shared.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const assetsDir = path.join(__dirname, "../../../assets/certificate-templates");
const uploadsDir = path.join(__dirname, "../../../uploads/document-template-sources");

const FRONT_ASSET = "membership-id-front.jpg";
const BACK_ASSET = "membership-id-back.jpg";
const FRONT_UPLOAD = "membership-id-front-v1.jpg";
const BACK_UPLOAD = "membership-id-back-v1.jpg";

function copyAsset(assetName: string, uploadName: string): string | null {
  const assetPath = path.join(assetsDir, assetName);
  if (!fs.existsSync(assetPath)) {
    console.log(`⚠️  Membership ID asset not found (${assetName}), skipping`);
    return null;
  }
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const destPath = path.join(uploadsDir, uploadName);
  if (!fs.existsSync(destPath)) {
    fs.copyFileSync(assetPath, destPath);
  }
  return `/uploads/document-template-sources/${uploadName}`;
}

export async function seedMembershipIdCertificateTemplate(prisma: PrismaClient, adminUserId: string) {
  const frontUrl = copyAsset(FRONT_ASSET, FRONT_UPLOAD);
  const backUrl = copyAsset(BACK_ASSET, BACK_UPLOAD);
  if (!frontUrl || !backUrl) return;

  const layoutConfig = {
    ...DEFAULT_MEMBERSHIP_ID_CERTIFICATE_LAYOUT,
    pages: DEFAULT_MEMBERSHIP_ID_CERTIFICATE_LAYOUT.pages!.map((p) =>
      p.key === "front"
        ? { ...p, sourceFileUrl: frontUrl }
        : p.key === "back"
          ? { ...p, sourceFileUrl: backUrl }
          : p
    ),
  };

  const mergeFields = {
    fields: layoutConfig.pages.flatMap((p) => p.fields.map((f) => f.key)),
    pages: layoutConfig.pages.map((p) => ({ key: p.key, fields: p.fields.map((f) => f.key) })),
  };

  await prisma.documentTemplate.upsert({
    where: { code: MEMBERSHIP_ID_CERT_TEMPLATE_CODE },
    update: {
      name: "Membership ID Card",
      category: "CERTIFICATE",
      description:
        "Official ORIASC membership ID card (front + back). Used when issuing membership certificates.",
      templateEngine: DocumentTemplateEngine.PDF_CERTIFICATE,
      certificateType: HalalCertificateTemplateType.MEMBERSHIP_ID,
      sourceFileUrl: frontUrl,
      layoutConfig: layoutConfig as object,
      mergeFields,
      status: "ACTIVE",
      active: true,
      updatedBy: adminUserId,
    },
    create: {
      code: MEMBERSHIP_ID_CERT_TEMPLATE_CODE,
      name: "Membership ID Card",
      category: "CERTIFICATE",
      description:
        "Official ORIASC membership ID card (front + back). Used when issuing membership certificates.",
      content: "<!-- PDF certificate template (multipage ID card) -->",
      templateEngine: DocumentTemplateEngine.PDF_CERTIFICATE,
      certificateType: HalalCertificateTemplateType.MEMBERSHIP_ID,
      sourceFileUrl: frontUrl,
      layoutConfig: layoutConfig as object,
      mergeFields,
      language: "OR",
      tags: ["membership", "id-card", "certificate"],
      status: "ACTIVE",
      active: true,
      createdBy: adminUserId,
      updatedBy: adminUserId,
    },
  });

  await prisma.documentTemplate.updateMany({
    where: {
      certificateType: HalalCertificateTemplateType.MEMBERSHIP_ID,
      templateEngine: DocumentTemplateEngine.PDF_CERTIFICATE,
      status: "ACTIVE",
      code: { not: MEMBERSHIP_ID_CERT_TEMPLATE_CODE },
    },
    data: { status: "ARCHIVED", active: false },
  });

  console.log(`✅ Membership ID certificate template seeded (${MEMBERSHIP_ID_CERT_TEMPLATE_CODE})`);
}
