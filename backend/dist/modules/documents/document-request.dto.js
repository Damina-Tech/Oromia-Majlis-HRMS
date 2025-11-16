import { z } from "zod";
export const CreateDocumentRequestDto = z.object({
    templateId: z.string().min(1, "Template ID is required"),
    purpose: z.string().optional(),
    priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional().default("NORMAL"),
});
export const UpdateDocumentRequestDto = z.object({
    status: z.enum(["PENDING", "APPROVED", "REJECTED", "GENERATED", "CANCELLED"]).optional(),
    rejectionReason: z.string().optional(),
    notes: z.string().optional(),
});
export const ListDocumentRequestsQuery = z.object({
    page: z.coerce.number().min(1).optional().default(1),
    pageSize: z.coerce.number().min(1).max(100).optional().default(20),
    status: z.enum(["PENDING", "APPROVED", "REJECTED", "GENERATED", "CANCELLED"]).optional(),
    priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
    employeeId: z.string().optional(),
    templateId: z.string().optional(),
    search: z.string().optional(),
});
//# sourceMappingURL=document-request.dto.js.map