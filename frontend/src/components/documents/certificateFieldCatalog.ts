export type HalalCertificateTemplateType =
  | "HALAL_BUSINESS"
  | "HALAL_PRODUCT"
  | "MOSQUE_INSTITUTION"
  | "MEMBERSHIP_ID";

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

export type CertificateLayoutPage = {
  key: string;
  label?: string;
  sourceFileUrl?: string | null;
  fields: CertificateLayoutField[];
};

export type CertificateLayoutConfig = {
  version: 1;
  pageWidth: number;
  pageHeight: number;
  fields: CertificateLayoutField[];
  pages?: CertificateLayoutPage[];
};

export const PDF_PAGE_WIDTH = 595.28;
export const PDF_PAGE_HEIGHT = 841.89;
export const PDF_PAGE_LANDSCAPE_WIDTH = 841.89;
export const PDF_PAGE_LANDSCAPE_HEIGHT = 595.28;
/** US Letter — matches official Halal business / product certificate PDFs */
export const PDF_LETTER_WIDTH = 612;
export const PDF_LETTER_HEIGHT = 792;
/** Membership ID card (half of 1296×816 artwork) */
export const MEMBERSHIP_ID_PAGE_WIDTH = 648;
export const MEMBERSHIP_ID_PAGE_HEIGHT = 408;

export function getCertificatePageDimensions(certificateType?: string | null): {
  width: number;
  height: number;
} {
  if (certificateType === "MEMBERSHIP_ID") {
    return { width: MEMBERSHIP_ID_PAGE_WIDTH, height: MEMBERSHIP_ID_PAGE_HEIGHT };
  }
  if (certificateType === "MOSQUE_INSTITUTION") {
    return { width: PDF_PAGE_LANDSCAPE_WIDTH, height: PDF_PAGE_LANDSCAPE_HEIGHT };
  }
  if (certificateType === "HALAL_BUSINESS" || certificateType === "HALAL_PRODUCT") {
    return { width: PDF_LETTER_WIDTH, height: PDF_LETTER_HEIGHT };
  }
  return { width: PDF_PAGE_WIDTH, height: PDF_PAGE_HEIGHT };
}

export function resolveLayoutPages(
  layout: CertificateLayoutConfig | null | undefined,
  fallbackSourceFileUrl?: string | null
): CertificateLayoutPage[] {
  if (layout?.pages && layout.pages.length > 0) {
    return layout.pages.map((p, i) => ({
      ...p,
      fields: p.fields ?? [],
      sourceFileUrl: p.sourceFileUrl || (i === 0 ? fallbackSourceFileUrl : p.sourceFileUrl) || fallbackSourceFileUrl,
    }));
  }
  return [
    {
      key: "main",
      label: "Page 1",
      sourceFileUrl: fallbackSourceFileUrl,
      fields: layout?.fields ?? [],
    },
  ];
}

export function countLayoutFields(layout?: CertificateLayoutConfig | null): number {
  if (!layout) return 0;
  if (layout.pages?.length) {
    return layout.pages.reduce((n, p) => n + (p.fields?.length ?? 0), 0);
  }
  return layout.fields?.length ?? 0;
}

export function defaultMembershipIdLayout(): CertificateLayoutConfig {
  return {
    version: 1,
    pageWidth: MEMBERSHIP_ID_PAGE_WIDTH,
    pageHeight: MEMBERSHIP_ID_PAGE_HEIGHT,
    fields: [],
    pages: [
      { key: "front", label: "Front", sourceFileUrl: null, fields: [] },
      { key: "back", label: "Back", sourceFileUrl: null, fields: [] },
    ],
  };
}

export const DEFAULT_FIELD_SIZE: Record<string, { width: number; height: number; fontSize?: number }> = {
  text: { width: 220, height: 28, fontSize: 12 },
  date: { width: 140, height: 24, fontSize: 11 },
  qrcode: { width: 80, height: 80 },
  image: { width: 120, height: 48 },
};
