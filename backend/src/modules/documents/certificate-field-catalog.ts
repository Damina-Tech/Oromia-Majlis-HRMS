import type { HalalCertificateTemplateType } from "@prisma/client";

export type CertificateCatalogField = {
  key: string;
  label: string;
  type: "text" | "date" | "qrcode";
  sampleValue?: string;
};

const HALAL_BUSINESS_FIELDS: CertificateCatalogField[] = [
  { key: "certificateId", label: "Certificate ID", type: "text", sampleValue: "HAL-2026-0001" },
  { key: "businessName", label: "Business name", type: "text", sampleValue: "Sample Halal Business PLC" },
  { key: "category", label: "Category", type: "text", sampleValue: "Food processing" },
  { key: "issuedAt", label: "Issued date", type: "date" },
  { key: "expiresAt", label: "Expires date", type: "date" },
  { key: "qrCode", label: "Verification QR", type: "qrcode" },
];

const HALAL_PRODUCT_FIELDS: CertificateCatalogField[] = [
  { key: "certificateNumber", label: "Certificate number", type: "text", sampleValue: "HAL-P-2026-00001" },
  { key: "businessName", label: "Business name", type: "text", sampleValue: "Sample Halal Business PLC" },
  { key: "parentCertificateId", label: "Parent Halal certificate", type: "text", sampleValue: "HAL-2026-0001" },
  { key: "productName", label: "Product name", type: "text", sampleValue: "Halal beef export batch" },
  { key: "productAmount", label: "Amount / quantity", type: "text", sampleValue: "12,000 kg" },
  { key: "destination", label: "Destination", type: "text", sampleValue: "Djibouti Port" },
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

export function buildSampleCertificateData(
  certificateType: HalalCertificateTemplateType
): Record<string, string> {
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
      data[f.key] = f.key === "expiresAt" ? expiresStr : issued;
    } else if (f.type === "qrcode") {
      data[f.key] =
        certificateType === "HALAL_BUSINESS"
          ? `${base}/verify/halal/HAL-2026-0001`
          : `${base}/verify/halal-product/HAL-P-2026-00001`;
    } else {
      data[f.key] = f.sampleValue ?? `[${f.label}]`;
    }
  }
  return data;
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
  destination: string;
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
    destination: params.destination,
    notes: params.notes?.trim() ?? "",
    issuedAt: fmt(params.issuedAt),
    qrCode: params.verifyUrl,
  };
}
