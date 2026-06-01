export type HalalCertificateTemplateType = "HALAL_BUSINESS" | "HALAL_PRODUCT";

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

export const DEFAULT_FIELD_SIZE: Record<string, { width: number; height: number; fontSize?: number }> = {
  text: { width: 220, height: 28, fontSize: 12 },
  date: { width: 140, height: 24, fontSize: 11 },
  qrcode: { width: 80, height: 80 },
  image: { width: 120, height: 48 },
};
