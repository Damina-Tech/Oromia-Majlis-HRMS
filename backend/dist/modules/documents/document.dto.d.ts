import { z } from "zod";
export declare const DocumentCategoryEnum: z.ZodEnum<{
    HR: "HR";
    OTHER: "OTHER";
    CONTRACT: "CONTRACT";
    PAYROLL: "PAYROLL";
    WARNING: "WARNING";
    LEGAL: "LEGAL";
    CERTIFICATE: "CERTIFICATE";
}>;
export declare const DocumentLanguageEnum: z.ZodEnum<{
    OR: "OR";
    EN: "EN";
    AM: "AM";
}>;
export declare const DocumentTemplateStatusEnum: z.ZodEnum<{
    ACTIVE: "ACTIVE";
    DRAFT: "DRAFT";
    ARCHIVED: "ARCHIVED";
}>;
export declare const CreateDocumentTemplateDto: z.ZodObject<{
    code: z.ZodString;
    name: z.ZodString;
    category: z.ZodEnum<{
        HR: "HR";
        OTHER: "OTHER";
        CONTRACT: "CONTRACT";
        PAYROLL: "PAYROLL";
        WARNING: "WARNING";
        LEGAL: "LEGAL";
        CERTIFICATE: "CERTIFICATE";
    }>;
    description: z.ZodOptional<z.ZodString>;
    content: z.ZodString;
    contentPlain: z.ZodOptional<z.ZodString>;
    language: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        OR: "OR";
        EN: "EN";
        AM: "AM";
    }>>>;
    tags: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    mergeFields: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, z.core.$strip>;
export type CreateDocumentTemplateDto = z.infer<typeof CreateDocumentTemplateDto>;
export declare const UpdateDocumentTemplateDto: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodEnum<{
        HR: "HR";
        OTHER: "OTHER";
        CONTRACT: "CONTRACT";
        PAYROLL: "PAYROLL";
        WARNING: "WARNING";
        LEGAL: "LEGAL";
        CERTIFICATE: "CERTIFICATE";
    }>>;
    description: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    contentPlain: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        ACTIVE: "ACTIVE";
        DRAFT: "DRAFT";
        ARCHIVED: "ARCHIVED";
    }>>;
    language: z.ZodOptional<z.ZodEnum<{
        OR: "OR";
        EN: "EN";
        AM: "AM";
    }>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    active: z.ZodOptional<z.ZodBoolean>;
    mergeFields: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, z.core.$strip>;
export type UpdateDocumentTemplateDto = z.infer<typeof UpdateDocumentTemplateDto>;
export declare const ListTemplatesQuery: z.ZodObject<{
    page: z.ZodDefault<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    pageSize: z.ZodDefault<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    search: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodEnum<{
        HR: "HR";
        OTHER: "OTHER";
        CONTRACT: "CONTRACT";
        PAYROLL: "PAYROLL";
        WARNING: "WARNING";
        LEGAL: "LEGAL";
        CERTIFICATE: "CERTIFICATE";
    }>>;
    status: z.ZodOptional<z.ZodEnum<{
        ACTIVE: "ACTIVE";
        DRAFT: "DRAFT";
        ARCHIVED: "ARCHIVED";
    }>>;
    active: z.ZodOptional<z.ZodCoercedBoolean<unknown>>;
    language: z.ZodOptional<z.ZodEnum<{
        OR: "OR";
        EN: "EN";
        AM: "AM";
    }>>;
    tags: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        createdAt: "createdAt";
        updatedAt: "updatedAt";
        name: "name";
        category: "category";
    }>>>;
    sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        desc: "desc";
        asc: "asc";
    }>>>;
}, z.core.$strip>;
export type ListTemplatesQuery = z.infer<typeof ListTemplatesQuery>;
export declare const GenerateDocumentDto: z.ZodObject<{
    templateId: z.ZodString;
    employeeId: z.ZodOptional<z.ZodString>;
    employeeIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    departmentId: z.ZodOptional<z.ZodString>;
    mergeData: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    email: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    format: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        pdf: "pdf";
        docx: "docx";
        html: "html";
    }>>>;
}, z.core.$strip>;
export type GenerateDocumentDto = z.infer<typeof GenerateDocumentDto>;
export declare const PreviewDocumentDto: z.ZodObject<{
    templateId: z.ZodString;
    employeeId: z.ZodOptional<z.ZodString>;
    mergeData: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    useSampleData: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>;
export type PreviewDocumentDto = z.infer<typeof PreviewDocumentDto>;
export declare const ListGeneratedDocumentsQuery: z.ZodObject<{
    page: z.ZodDefault<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    pageSize: z.ZodDefault<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    templateId: z.ZodOptional<z.ZodString>;
    employeeId: z.ZodOptional<z.ZodString>;
    generatedBy: z.ZodOptional<z.ZodString>;
    dateFrom: z.ZodOptional<z.ZodString>;
    dateTo: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        createdAt: "createdAt";
        templateId: "templateId";
        fileName: "fileName";
    }>>>;
    sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        desc: "desc";
        asc: "asc";
    }>>>;
}, z.core.$strip>;
export type ListGeneratedDocumentsQuery = z.infer<typeof ListGeneratedDocumentsQuery>;
export declare const CreateTemplatePermissionDto: z.ZodObject<{
    templateId: z.ZodString;
    roleId: z.ZodOptional<z.ZodString>;
    userId: z.ZodOptional<z.ZodString>;
    permissionType: z.ZodEnum<{
        view: "view";
        edit: "edit";
        generate: "generate";
        manage: "manage";
    }>;
}, z.core.$strip>;
export type CreateTemplatePermissionDto = z.infer<typeof CreateTemplatePermissionDto>;
export declare const CreateRetentionPolicyDto: z.ZodObject<{
    templateId: z.ZodOptional<z.ZodString>;
    retentionDays: z.ZodNumber;
    autoArchive: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    autoDelete: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>;
export type CreateRetentionPolicyDto = z.infer<typeof CreateRetentionPolicyDto>;
//# sourceMappingURL=document.dto.d.ts.map