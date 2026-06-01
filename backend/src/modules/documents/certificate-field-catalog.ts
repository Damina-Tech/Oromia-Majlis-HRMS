import type { HalalCertificateTemplateType } from "@prisma/client";
import {
  getCertificateBrandingAssets,
  mergeCertificateBrandingIntoData,
} from "./certificate-branding.service.js";

export type CertificateCatalogField = {
  key: string;
  label: string;
  type: "text" | "date" | "qrcode" | "image";
  sampleValue?: string;
};

const HALAL_BUSINESS_FIELDS: CertificateCatalogField[] = [
  { key: "certificateId", label: "Certificate ID", type: "text", sampleValue: "HAL-2026-0001" },
  { key: "businessName", label: "Business name", type: "text", sampleValue: "Sample Halal Business PLC" },
  { key: "category", label: "Category", type: "text", sampleValue: "Food processing" },
  { key: "issuedAt", label: "Issued date", type: "date" },
  { key: "expiresAt", label: "Expires date", type: "date" },
  { key: "signature", label: "Signature (uploaded asset)", type: "image" },
  { key: "seal", label: "Seal (uploaded asset)", type: "image" },
  { key: "qrCode", label: "Verification QR", type: "qrcode" },
];

const HALAL_PRODUCT_FIELDS: CertificateCatalogField[] = [
  { key: "certificateNumber", label: "Certificate number", type: "text", sampleValue: "HAL-P-2026-00001" },
  { key: "businessName", label: "Business name", type: "text", sampleValue: "Sample Halal Business PLC" },
  { key: "parentCertificateId", label: "Parent Halal certificate", type: "text", sampleValue: "HAL-2026-0001" },
  { key: "productName", label: "Product name", type: "text", sampleValue: "Halal beef export batch" },
  { key: "productAmount", label: "Amount / quantity (legacy)", type: "text", sampleValue: "12,000 kg" },
  { key: "consignmentPcs", label: "Consignment details (PCS)", type: "text", sampleValue: "240 cartons" },
  { key: "netWeightKg", label: "Net weight (kg)", type: "text", sampleValue: "12,000" },
  { key: "grossWeightKg", label: "Gross weight (kg)", type: "text", sampleValue: "12,480" },
  { key: "shipping", label: "Shipping", type: "text", sampleValue: "Air freight" },
  { key: "voyageFlightNo", label: "Voyage / flight no.", type: "text", sampleValue: "ET 302" },
  { key: "loadingPort", label: "Loading port", type: "text", sampleValue: "Addis Ababa Airport" },
  { key: "destination", label: "Destination", type: "text", sampleValue: "Dubai, UAE" },
  { key: "slaughteringDate", label: "Slaughtering date", type: "date" },
  { key: "productionDate", label: "Production date", type: "date" },
  { key: "expiryDate", label: "Expiry date", type: "date" },
  { key: "healthCertificateNo", label: "Health certificate no.", type: "text", sampleValue: "HC-2026-001" },
  { key: "slaughteringCertificate", label: "Slaughtering certificate", type: "text", sampleValue: "SC-2026-001" },
  { key: "authorizedRepresentative", label: "Authorized representative", type: "text", sampleValue: "Ahmed Hassan" },
  { key: "signature", label: "Signature (uploaded asset)", type: "image" },
  { key: "seal", label: "Seal (uploaded asset)", type: "image" },
  { key: "notes", label: "Notes", type: "text", sampleValue: "Batch #A-42" },
  { key: "issuedAt", label: "Issued date", type: "date" },
  { key: "qrCode", label: "Verification QR", type: "qrcode" },
];

export function getCertificateFieldCatalog(
  certificateType: HalalCertificateTemplateType
): CertificateCatalogField[] {
  switch (certificateType) {
    case "HALAL_BUSINESS":
      return HALAL_BUSINESS_FIELDS;
    case "HALAL_PRODUCT":
      return HALAL_PRODUCT_FIELDS;
    default:
      return [];
  }
}

export async function buildSampleCertificateData(
  certificateType: HalalCertificateTemplateType
): Promise<Record<string, string>> {
  const fields = getCertificateFieldCatalog(certificateType);
  const now = new Date();
  const issued = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const expires = new Date(now);
  expires.setFullYear(expires.getFullYear() + 1);
  const expiresStr = expires.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const base = process.env.FRONTEND_URL || "http://localhost:8080";

  const data: Record<string, string> = {};
  for (const f of fields) {
    if (f.type === "date") {
      if (f.key === "expiresAt") data[f.key] = expiresStr;
      else if (f.key === "expiryDate") data[f.key] = expiresStr;
      else data[f.key] = issued;
    } else if (f.type === "qrcode") {
      data[f.key] =
        certificateType === "HALAL_BUSINESS"
          ? `${base}/verify/halal/HAL-2026-0001`
          : `${base}/verify/halal-product/HAL-P-2026-00001`;
    } else if (f.type === "image") {
      data[f.key] = "";
    } else {
      data[f.key] = f.sampleValue ?? `[${f.label}]`;
    }
  }
  const branding = await getCertificateBrandingAssets();
  return mergeCertificateBrandingIntoData(data, {
    signatureImageUrl: branding.signatureImageUrl,
    sealImageUrl: branding.sealImageUrl,
  });
}

/** Map Halal business certificate issuance params to layout field keys */
export function halalBusinessCertificateData(params: {
  certificateId: string;
  businessName: string;
  category: string;
  issuedAt: Date;
  expiresAt: Date;
  verifyUrl: string;
}): Record<string, string> {
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  return {
    certificateId: params.certificateId,
    businessName: params.businessName,
    category: params.category.replace(/_/g, " "),
    issuedAt: fmt(params.issuedAt),
    expiresAt: fmt(params.expiresAt),
    qrCode: params.verifyUrl,
  };
}

/** Map Halal product certificate issuance params to layout field keys */
export function halalProductCertificateData(params: {
  certificateNumber: string;
  businessName: string;
  parentCertificateId: string;
  productName: string;
  productAmount: string;
  consignmentPcs: string;
  netWeightKg: string;
  grossWeightKg: string;
  shipping: string;
  voyageFlightNo: string;
  loadingPort: string;
  destination: string;
  slaughteringDate: Date;
  productionDate: Date;
  expiryDate: Date;
  healthCertificateNo: string;
  slaughteringCertificate: string;
  authorizedRepresentative: string;
  notes?: string | null;
  issuedAt: Date;
  verifyUrl: string;
}): Record<string, string> {
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  return {
    certificateNumber: params.certificateNumber,
    businessName: params.businessName,
    parentCertificateId: params.parentCertificateId,
    productName: params.productName,
    productAmount: params.productAmount,
    consignmentPcs: params.consignmentPcs,
    netWeightKg: params.netWeightKg,
    grossWeightKg: params.grossWeightKg,
    shipping: params.shipping,
    voyageFlightNo: params.voyageFlightNo,
    loadingPort: params.loadingPort,
    destination: params.destination,
    slaughteringDate: fmt(params.slaughteringDate),
    productionDate: fmt(params.productionDate),
    expiryDate: fmt(params.expiryDate),
    healthCertificateNo: params.healthCertificateNo,
    slaughteringCertificate: params.slaughteringCertificate,
    authorizedRepresentative: params.authorizedRepresentative,
    notes: params.notes?.trim() ?? "",
    issuedAt: fmt(params.issuedAt),
    qrCode: params.verifyUrl,
  };
}
