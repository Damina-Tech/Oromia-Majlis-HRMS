import { HalalCertificateTemplateType } from "@prisma/client";
import { halalBusinessCertificateData } from "../documents/certificate-field-catalog.js";
import {
  halalProductCertificatePdfData,
  type HalalProductCertificatePdfSource,
} from "./halal-product-certificate-pdf-data.js";
import { generateCertificatePdfBuffer } from "../documents/certificate-pdf-generator.js";
import {
  getActiveCertificateTemplateByCode,
  getActiveCertificateTemplateByType,
} from "../documents/certificate-template.service.js";

function businessVerifyUrl(certificateId: string, qrCode: string | null | undefined): string {
  const stored = qrCode?.trim();
  if (stored && (stored.startsWith("http://") || stored.startsWith("https://"))) {
    return stored;
  }
  const base = process.env.FRONTEND_URL || "http://localhost:8080";
  return `${base}/verify/halal/${certificateId}`;
}

function productVerifyUrl(certificateNumber: string): string {
  const base = process.env.FRONTEND_URL || "http://localhost:8080";
  return `${base}/verify/halal-product/${encodeURIComponent(certificateNumber)}`;
}

async function resolveActiveTemplate(params: {
  templateCode?: string;
  certificateType: HalalCertificateTemplateType;
}) {
  const code = params.templateCode?.trim();
  if (code) {
    const byCode = await getActiveCertificateTemplateByCode(code);
    if (byCode) return byCode;
  }
  return getActiveCertificateTemplateByType(params.certificateType);
}

async function renderWithTemplate(params: {
  templateCode?: string;
  certificateType: HalalCertificateTemplateType;
  data: Record<string, string>;
}): Promise<Buffer | null> {
  const template = await resolveActiveTemplate(params);
  if (!template?.sourceFileUrl || !template.layoutConfig) return null;

  return generateCertificatePdfBuffer({
    sourceFileUrl: template.sourceFileUrl,
    layoutConfig: template.layoutConfig,
    data: params.data,
  });
}

export async function renderBusinessHalalCertificatePdfBuffer(cert: {
  certificateId: string;
  issuedAt: Date;
  expiresAt: Date;
  qrCode: string | null;
  businessName: string;
  category: string;
}): Promise<Buffer | null> {
  const verifyUrl = businessVerifyUrl(cert.certificateId, cert.qrCode);
  const data = halalBusinessCertificateData({
    certificateId: cert.certificateId,
    businessName: cert.businessName,
    category: cert.category,
    issuedAt: cert.issuedAt,
    expiresAt: cert.expiresAt,
    verifyUrl,
  });

  return renderWithTemplate({
    templateCode: process.env.HALAL_BUSINESS_CERT_TEMPLATE_CODE,
    certificateType: HalalCertificateTemplateType.HALAL_BUSINESS,
    data,
  });
}

export async function renderProductHalalCertificatePdfBuffer(
  row: HalalProductCertificatePdfSource
): Promise<Buffer | null> {
  const verifyUrl = productVerifyUrl(row.certificateNumber);
  const data = await halalProductCertificatePdfData(row, verifyUrl);

  return renderWithTemplate({
    templateCode: process.env.HALAL_PRODUCT_CERT_TEMPLATE_CODE,
    certificateType: HalalCertificateTemplateType.HALAL_PRODUCT,
    data,
  });
}
