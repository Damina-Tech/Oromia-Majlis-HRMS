import { z } from "zod";

export const CertificateFieldTypeEnum = z.enum(["text", "date", "qrcode", "image"]);
export type CertificateFieldType = z.infer<typeof CertificateFieldTypeEnum>;

export const CertificateLayoutFieldSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: CertificateFieldTypeEnum,
  /** PDF points from top-left of page */
  x: z.number().nonnegative(),
  y: z.number().nonnegative(),
  width: z.number().positive(),
  height: z.number().positive(),
  fontSize: z.number().positive().optional(),
  fontWeight: z.enum(["normal", "bold"]).optional(),
  align: z.enum(["left", "center", "right"]).optional(),
  color: z.string().optional(),
});

export type CertificateLayoutField = z.infer<typeof CertificateLayoutFieldSchema>;

export const CertificateLayoutPageSchema = z.object({
  key: z.string().min(1),
  label: z.string().optional(),
  /** Page-specific background (PDF/image). Falls back to template.sourceFileUrl when omitted. */
  sourceFileUrl: z.string().optional().nullable(),
  fields: z.array(CertificateLayoutFieldSchema),
});

export type CertificateLayoutPage = z.infer<typeof CertificateLayoutPageSchema>;

export const CertificateLayoutConfigSchema = z.object({
  version: z.literal(1).default(1),
  pageWidth: z.number().positive().default(595.28),
  pageHeight: z.number().positive().default(841.89),
  /** Single-page legacy fields (used when `pages` is empty/omitted). */
  fields: z.array(CertificateLayoutFieldSchema).default([]),
  /** Multi-page layouts (e.g. membership ID front + back). */
  pages: z.array(CertificateLayoutPageSchema).optional(),
});

export type CertificateLayoutConfig = z.infer<typeof CertificateLayoutConfigSchema>;

export function parseLayoutConfig(raw: unknown): CertificateLayoutConfig | null {
  if (!raw || typeof raw !== "object") return null;
  const parsed = CertificateLayoutConfigSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

/** Resolve pages to render: multipage config or a single synthetic page from legacy fields. */
export function resolveLayoutPages(
  layout: CertificateLayoutConfig,
  fallbackSourceFileUrl?: string | null
): CertificateLayoutPage[] {
  if (layout.pages && layout.pages.length > 0) {
    return layout.pages.map((p, i) => ({
      ...p,
      sourceFileUrl: p.sourceFileUrl || (i === 0 ? fallbackSourceFileUrl : p.sourceFileUrl) || fallbackSourceFileUrl,
    }));
  }
  return [
    {
      key: "main",
      label: "Page 1",
      sourceFileUrl: fallbackSourceFileUrl,
      fields: layout.fields ?? [],
    },
  ];
}

/** True when layout has at least one field on any page (legacy `fields` or multipage `pages`). */
export function layoutHasConfiguredFields(layout: unknown): boolean {
  const parsed = parseLayoutConfig(layout);
  if (!parsed) return false;
  return resolveLayoutPages(parsed).some((p) => (p.fields?.length ?? 0) > 0);
}
