import { z } from "zod";
export declare const CreateDocumentRequestDto: z.ZodObject<{
    templateId: z.ZodString;
    purpose: z.ZodOptional<z.ZodString>;
    priority: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        LOW: "LOW";
        NORMAL: "NORMAL";
        HIGH: "HIGH";
        URGENT: "URGENT";
    }>>>;
}, z.core.$strip>;
export declare const UpdateDocumentRequestDto: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<{
        PENDING: "PENDING";
        APPROVED: "APPROVED";
        REJECTED: "REJECTED";
        CANCELLED: "CANCELLED";
        GENERATED: "GENERATED";
    }>>;
    rejectionReason: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const ListDocumentRequestsQuery: z.ZodObject<{
    page: z.ZodDefault<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    pageSize: z.ZodDefault<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    status: z.ZodOptional<z.ZodEnum<{
        PENDING: "PENDING";
        APPROVED: "APPROVED";
        REJECTED: "REJECTED";
        CANCELLED: "CANCELLED";
        GENERATED: "GENERATED";
    }>>;
    priority: z.ZodOptional<z.ZodEnum<{
        LOW: "LOW";
        NORMAL: "NORMAL";
        HIGH: "HIGH";
        URGENT: "URGENT";
    }>>;
    employeeId: z.ZodOptional<z.ZodString>;
    templateId: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CreateDocumentRequestData = z.infer<typeof CreateDocumentRequestDto>;
export type UpdateDocumentRequestData = z.infer<typeof UpdateDocumentRequestDto>;
export type ListDocumentRequestsQueryData = z.infer<typeof ListDocumentRequestsQuery>;
//# sourceMappingURL=document-request.dto.d.ts.map