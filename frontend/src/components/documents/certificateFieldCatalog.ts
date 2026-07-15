export type HalalCertificateTemplateType = "HALAL_BUSINESS" | "HALAL_PRODUCT" | "MOSQUE_INSTITUTION";

export type CertificateCatalogField = {
  key: string;
  label: string;
  type: "text" | "date" | "qrcode" | "image";
};

export type CertificateLayoutField = {
  key: string;
  label: string;
  type: "text" | "date" | "qrcode" | "image";
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  fontWeight?: "normal" | "bold";
  align?: "left" | "center" | "right";
  color?: string;
};

export type CertificateLayoutConfig = {
  version: 1;
  pageWidth: number;
  pageHeight: number;
  fields: CertificateLayoutField[];
};

export const PDF_PAGE_WIDTH = 595.28;
export const PDF_PAGE_HEIGHT = 841.89;
export const PDF_PAGE_LANDSCAPE_WIDTH = 841.89;
export const PDF_PAGE_LANDSCAPE_HEIGHT = 595.28;
/** US Letter — matches official Halal business / product certificate PDFs */
export const PDF_LETTER_WIDTH = 612;
export const PDF_LETTER_HEIGHT = 792;

export function getCertificatePageDimensions(certificateType?: string | null): {
  width: number;
  height: number;
} {
  if (certificateType === "MOSQUE_INSTITUTION") {
    return { width: PDF_PAGE_LANDSCAPE_WIDTH, height: PDF_PAGE_LANDSCAPE_HEIGHT };
  }
  if (certificateType === "HALAL_BUSINESS" || certificateType === "HALAL_PRODUCT") {
    return { width: PDF_LETTER_WIDTH, height: PDF_LETTER_HEIGHT };
  }
  return { width: PDF_PAGE_WIDTH, height: PDF_PAGE_HEIGHT };
}

export const DEFAULT_FIELD_SIZE: Record<string, { width: number; height: number; fontSize?: number }> = {
  text: { width: 220, height: 28, fontSize: 12 },
  date: { width: 140, height: 24, fontSize: 11 },
  qrcode: { width: 80, height: 80 },
  image: { width: 120, height: 48 },
};
