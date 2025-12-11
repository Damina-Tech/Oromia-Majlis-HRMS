import { z } from "zod";
export declare const CreateAdvanceDto: z.ZodObject<{
    employeeId: z.ZodString;
    requestedAmount: z.ZodCoercedNumber<unknown>;
    monthlyDeduction: z.ZodCoercedNumber<unknown>;
    requestDate: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const UpdateAdvanceDto: z.ZodObject<{
    monthlyDeduction: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    status: z.ZodOptional<z.ZodEnum<{
        PENDING: "PENDING";
        APPROVED: "APPROVED";
        CANCELLED: "CANCELLED";
        REPAID: "REPAID";
    }>>;
    description: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const ApproveAdvanceDto: z.ZodObject<{
    approvedBy: z.ZodString;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const AddAdvanceRepaymentDto: z.ZodObject<{
    amount: z.ZodCoercedNumber<unknown>;
    paymentDate: z.ZodString;
    payrollRunId: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const ListAdvanceQuery: z.ZodObject<{
    employeeId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        PENDING: "PENDING";
        APPROVED: "APPROVED";
        CANCELLED: "CANCELLED";
        REPAID: "REPAID";
    }>>;
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export type CreateAdvanceDtoType = z.infer<typeof CreateAdvanceDto>;
export type UpdateAdvanceDtoType = z.infer<typeof UpdateAdvanceDto>;
export type ApproveAdvanceDtoType = z.infer<typeof ApproveAdvanceDto>;
export type AddAdvanceRepaymentDtoType = z.infer<typeof AddAdvanceRepaymentDto>;
export type ListAdvanceQueryType = z.infer<typeof ListAdvanceQuery>;
//# sourceMappingURL=advance.dto.d.ts.map