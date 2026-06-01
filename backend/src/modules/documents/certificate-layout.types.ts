import { z } from "zod";

export const CertificateFieldTypeEnum = z.enum(["text", "date", "qrcode"]);
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

export const CertificateLayoutConfigSchema = z.object({
  version: z.literal(1).default(1),
  pageWidth: z.number().positive().default(595.28),
  pageHeight: z.number().positive().default(841.89),
  fields: z.array(CertificateLayoutFieldSchema),
});

export type CertificateLayoutConfig = z.infer<typeof CertificateLayoutConfigSchema>;

export function parseLayoutConfig(raw: unknown): CertificateLayoutConfig | null {
  if (!raw || typeof raw !== "object") return null;
  const parsed = CertificateLayoutConfigSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
