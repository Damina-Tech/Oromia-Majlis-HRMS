import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { DocumentTemplateEngine, HalalCertificateTemplateType, PrismaClient } from "@prisma/client";
import type { CertificateLayoutConfig } from "../documents/certificate-layout.types.js";
import {
  DEFAULT_HALAL_BUSINESS_CERTIFICATE_LAYOUT,
  DEFAULT_HALAL_PRODUCT_CERTIFICATE_LAYOUT,
  HALAL_BUSINESS_CERT_TEMPLATE_CODE,
  HALAL_PRODUCT_CERT_TEMPLATE_CODE,
} from "./halal-certificate-layout.shared.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const assetsDir = path.join(__dirname, "../../../assets/certificate-templates");
const uploadsDir = path.join(__dirname, "../../../uploads/document-template-sources");

type HalalSeedSpec = {
  assetFileName: string;
  uploadFileName: string;
  code: string;
  name: string;
  description: string;
  certificateType: HalalCertificateTemplateType;
  layoutConfig: CertificateLayoutConfig;
  tags: string[];
};

const HALAL_TEMPLATE_SPECS: HalalSeedSpec[] = [
  {
    assetFileName: "halal-business-certificate.pdf",
    uploadFileName: "halal-business-certificate-v1.pdf",
    code: HALAL_BUSINESS_CERT_TEMPLATE_CODE,
    name: "Halal Business Certificate",
    description:
      "Official ORIASC-HCB Halal business / slaughter approval certificate background. Used when issuing Halal business certificates.",
    certificateType: HalalCertificateTemplateType.HALAL_BUSINESS,
    layoutConfig: DEFAULT_HALAL_BUSINESS_CERTIFICATE_LAYOUT,
    tags: ["halal", "business", "certificate", "slaughter"],
  },
  {
    assetFileName: "halal-product-certificate.pdf",
    uploadFileName: "halal-product-certificate-v1.pdf",
    code: HALAL_PRODUCT_CERT_TEMPLATE_CODE,
    name: "Halal Product Certificate",
    description:
      "Official ORIASC-HCB Halal product / consignment certificate background. Used when issuing Halal product certificates.",
    certificateType: HalalCertificateTemplateType.HALAL_PRODUCT,
    layoutConfig: DEFAULT_HALAL_PRODUCT_CERTIFICATE_LAYOUT,
    tags: ["halal", "product", "certificate", "consignment"],
  },
];

async function seedOneHalalCertificateTemplate(
  prisma: PrismaClient,
  adminUserId: string,
  spec: HalalSeedSpec
) {
  const assetPath = path.join(assetsDir, spec.assetFileName);
  if (!fs.existsSync(assetPath)) {
    console.log(`⚠️  Halal certificate asset not found (${spec.assetFileName}), skipping`);
    return;
  }

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const destPath = path.join(uploadsDir, spec.uploadFileName);
  if (!fs.existsSync(destPath)) {
    fs.copyFileSync(assetPath, destPath);
  }

  const sourceFileUrl = `/uploads/document-template-sources/${spec.uploadFileName}`;
  const mergeFields = {
    fields: spec.layoutConfig.fields.map((f) => f.key),
  };

  await prisma.documentTemplate.upsert({
    where: { code: spec.code },
    update: {
      name: spec.name,
      category: "CERTIFICATE",
      description: spec.description,
      templateEngine: DocumentTemplateEngine.PDF_CERTIFICATE,
      certificateType: spec.certificateType,
      sourceFileUrl,
      layoutConfig: spec.layoutConfig as object,
      mergeFields,
      status: "ACTIVE",
      active: true,
      updatedBy: adminUserId,
    },
    create: {
      code: spec.code,
      name: spec.name,
      category: "CERTIFICATE",
      description: spec.description,
      content: "<!-- PDF certificate template -->",
      templateEngine: DocumentTemplateEngine.PDF_CERTIFICATE,
      certificateType: spec.certificateType,
      sourceFileUrl,
      layoutConfig: spec.layoutConfig as object,
      mergeFields,
      language: "EN",
      tags: spec.tags,
      status: "ACTIVE",
      active: true,
      createdBy: adminUserId,
      updatedBy: adminUserId,
    },
  });

  await prisma.documentTemplate.updateMany({
    where: {
      certificateType: spec.certificateType,
      templateEngine: DocumentTemplateEngine.PDF_CERTIFICATE,
      status: "ACTIVE",
      code: { not: spec.code },
    },
    data: { status: "ARCHIVED", active: false },
  });

  console.log(`✅ ${spec.name} template seeded (${spec.code})`);
}

export async function seedHalalCertificateTemplates(prisma: PrismaClient, adminUserId: string) {
  for (const spec of HALAL_TEMPLATE_SPECS) {
    await seedOneHalalCertificateTemplate(prisma, adminUserId, spec);
  }
}
