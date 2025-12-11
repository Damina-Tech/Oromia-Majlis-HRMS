import { z } from "zod";
export declare const DocumentLanguageSchema: z.ZodEnum<{
    OR: "OR";
    EN: "EN";
    AM: "AM";
}>;
export declare const CreateDocumentSettingsDto: z.ZodObject<{
    companyName: z.ZodString;
    companyLogo: z.ZodOptional<z.ZodString>;
    headerText: z.ZodOptional<z.ZodString>;
    footerText: z.ZodOptional<z.ZodString>;
    stampImage: z.ZodOptional<z.ZodString>;
    signatureImage: z.ZodOptional<z.ZodString>;
    signatureName: z.ZodOptional<z.ZodString>;
    signatureTitle: z.ZodOptional<z.ZodString>;
    defaultLanguage: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        OR: "OR";
        EN: "EN";
        AM: "AM";
    }>>>;
    dateFormat: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    currency: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    currencySymbol: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    timezone: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    companyAddress: z.ZodOptional<z.ZodString>;
    companyPhone: z.ZodOptional<z.ZodString>;
    companyEmail: z.ZodOptional<z.ZodString>;
    companyWebsite: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const UpdateDocumentSettingsDto: z.ZodObject<{
    companyName: z.ZodOptional<z.ZodString>;
    companyLogo: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    headerText: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    footerText: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    stampImage: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    signatureImage: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    signatureName: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    signatureTitle: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    defaultLanguage: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        OR: "OR";
        EN: "EN";
        AM: "AM";
    }>>>>;
    dateFormat: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodString>>>;
    currency: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodString>>>;
    currencySymbol: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodString>>>;
    timezone: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodString>>>;
    companyAddress: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    companyPhone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    companyEmail: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    companyWebsite: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export type CreateDocumentSettingsData = z.infer<typeof CreateDocumentSettingsDto>;
export type UpdateDocumentSettingsData = z.infer<typeof UpdateDocumentSettingsDto>;
//# sourceMappingURL=document-settings.dto.d.ts.map