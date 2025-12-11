import { z } from "zod";

export const DocumentLanguageSchema = z.enum(["EN", "AM", "OR"]);

export const CreateDocumentSettingsDto = z.object({
  companyName: z.string().min(1, "Company name is required"),
  companyLogo: z.string().optional(),
  headerText: z.string().optional(),
  footerText: z.string().optional(),
  stampImage: z.string().optional(),
  signatureImage: z.string().optional(),
  signatureName: z.string().optional(),
  signatureTitle: z.string().optional(),
  defaultLanguage: DocumentLanguageSchema.optional().default("EN"),
  dateFormat: z.string().optional().default("DD/MM/YYYY"),
  currency: z.string().optional().default("ETB"),
  currencySymbol: z.string().optional().default("ETB"),
  timezone: z.string().optional().default("Africa/Addis_Ababa"),
  companyAddress: z.string().optional(),
  companyPhone: z.string().optional(),
  companyEmail: z.string().optional(),
  companyWebsite: z.string().optional(),
});

export const UpdateDocumentSettingsDto = CreateDocumentSettingsDto.partial();

export type CreateDocumentSettingsData = z.infer<typeof CreateDocumentSettingsDto>;
export type UpdateDocumentSettingsData = z.infer<typeof UpdateDocumentSettingsDto>;

