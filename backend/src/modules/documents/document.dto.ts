import { z } from "zod";

// Document Category Enum
export const DocumentCategoryEnum = z.enum([
  "HR",
  "PAYROLL",
  "LEGAL",
  "CERTIFICATE",
  "WARNING",
  "CONTRACT",
  "OTHER",
]);

// Document Language Enum
export const DocumentLanguageEnum = z.enum(["EN", "AM", "OR"]);

// Document Template Status Enum
export const DocumentTemplateStatusEnum = z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]);

// Create Document Template DTO
export const CreateDocumentTemplateDto = z.object({
  code: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  category: DocumentCategoryEnum,
  description: z.string().optional(),
  content: z.string().min(1),
  contentPlain: z.string().optional(),
  language: DocumentLanguageEnum.optional().default("EN"),
  tags: z.array(z.string()).optional().default([]),
  mergeFields: z.record(z.string(), z.any()).optional(),
});

export type CreateDocumentTemplateDto = z.infer<typeof CreateDocumentTemplateDto>;

// Update Document Template DTO
export const UpdateDocumentTemplateDto = z.object({
  name: z.string().min(1).max(200).optional(),
  category: DocumentCategoryEnum.optional(),
  description: z.string().optional(),
  content: z.string().min(1).optional(),
  contentPlain: z.string().optional(),
  status: DocumentTemplateStatusEnum.optional(),
  language: DocumentLanguageEnum.optional(),
  tags: z.array(z.string()).optional(),
  active: z.boolean().optional(),
  mergeFields: z.record(z.string(), z.any()).optional(),
});

export type UpdateDocumentTemplateDto = z.infer<typeof UpdateDocumentTemplateDto>;

// List Templates Query DTO
export const ListTemplatesQuery = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().optional(),
  category: DocumentCategoryEnum.optional(),
  status: DocumentTemplateStatusEnum.optional(),
  active: z.coerce.boolean().optional(),
  language: DocumentLanguageEnum.optional(),
  tags: z.string().optional(), // Comma-separated tags
  sortBy: z.enum(["name", "category", "createdAt", "updatedAt"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type ListTemplatesQuery = z.infer<typeof ListTemplatesQuery>;

// Generate Document DTO
export const GenerateDocumentDto = z.object({
  templateId: z.string(),
  employeeId: z.string().optional(), // For single employee
  employeeIds: z.array(z.string()).optional(), // For bulk generation
  departmentId: z.string().optional(), // For department-wide generation
  mergeData: z.record(z.string(), z.any()).optional(), // Custom merge field values
  email: z.boolean().optional().default(false), // Send via email
  format: z.enum(["pdf", "docx", "html"]).optional().default("pdf"),
});

export type GenerateDocumentDto = z.infer<typeof GenerateDocumentDto>;

// Preview Document DTO
export const PreviewDocumentDto = z.object({
  templateId: z.string(),
  employeeId: z.string().optional(), // Use real employee data
  mergeData: z.record(z.string(), z.any()).optional(), // Custom merge data for preview
  useSampleData: z.boolean().optional().default(false), // Use sample data instead
});

export type PreviewDocumentDto = z.infer<typeof PreviewDocumentDto>;

// List Generated Documents Query DTO
export const ListGeneratedDocumentsQuery = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
  templateId: z.string().optional(),
  employeeId: z.string().optional(),
  generatedBy: z.string().optional(),
  dateFrom: z.string().optional(), // ISO date string
  dateTo: z.string().optional(), // ISO date string
  search: z.string().optional(),
  sortBy: z.enum(["createdAt", "fileName", "templateId"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type ListGeneratedDocumentsQuery = z.infer<typeof ListGeneratedDocumentsQuery>;

// Create Template Permission DTO
export const CreateTemplatePermissionDto = z.object({
  templateId: z.string(),
  roleId: z.string().optional(),
  userId: z.string().optional(),
  permissionType: z.enum(["view", "edit", "generate", "manage"]),
}).refine(
  (data) => data.roleId || data.userId,
  { message: "Either roleId or userId must be provided" }
);

export type CreateTemplatePermissionDto = z.infer<typeof CreateTemplatePermissionDto>;

// Create Retention Policy DTO
export const CreateRetentionPolicyDto = z.object({
  templateId: z.string().optional(), // If null, applies to all templates
  retentionDays: z.number().int().positive(),
  autoArchive: z.boolean().optional().default(false),
  autoDelete: z.boolean().optional().default(false),
});

export type CreateRetentionPolicyDto = z.infer<typeof CreateRetentionPolicyDto>;

