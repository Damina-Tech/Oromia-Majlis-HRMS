import { z } from "zod";
export declare const CreatePayrollRunDto: z.ZodObject<{
    periodType: z.ZodDefault<z.ZodEnum<{
        MONTHLY: "MONTHLY";
        BIWEEKLY: "BIWEEKLY";
        WEEKLY: "WEEKLY";
    }>>;
    periodStart: z.ZodString;
    periodEnd: z.ZodString;
    paymentDate: z.ZodOptional<z.ZodString>;
    employeeIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    departmentId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const UpdatePayrollRunDto: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<{
        APPROVED: "APPROVED";
        CANCELLED: "CANCELLED";
        DRAFT: "DRAFT";
        PROCESSED: "PROCESSED";
        PAID: "PAID";
        REVIEW: "REVIEW";
    }>>;
    paymentDate: z.ZodOptional<z.ZodString>;
    comments: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const ReviewPayrollRunDto: z.ZodObject<{
    comments: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const ApprovePayrollRunDto: z.ZodObject<{
    comments: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const ProcessPayrollRunDto: z.ZodObject<{
    comments: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const UpdatePayrollItemDto: z.ZodObject<{
    allowances: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    overtime: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    bonus: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    incomeTax: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    pension: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    healthInsurance: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    providentFund: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    otherDeductions: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const ListPayrollRunQuery: z.ZodObject<{
    periodStart: z.ZodOptional<z.ZodString>;
    periodEnd: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        APPROVED: "APPROVED";
        CANCELLED: "CANCELLED";
        DRAFT: "DRAFT";
        PROCESSED: "PROCESSED";
        PAID: "PAID";
        REVIEW: "REVIEW";
    }>>;
    periodType: z.ZodOptional<z.ZodEnum<{
        MONTHLY: "MONTHLY";
        BIWEEKLY: "BIWEEKLY";
        WEEKLY: "WEEKLY";
    }>>;
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const ListPayrollItemsQuery: z.ZodObject<{
    payrollRunId: z.ZodOptional<z.ZodString>;
    employeeId: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export type CreatePayrollRunDtoType = z.infer<typeof CreatePayrollRunDto>;
export type UpdatePayrollRunDtoType = z.infer<typeof UpdatePayrollRunDto>;
export type ReviewPayrollRunDtoType = z.infer<typeof ReviewPayrollRunDto>;
export type ApprovePayrollRunDtoType = z.infer<typeof ApprovePayrollRunDto>;
export type ProcessPayrollRunDtoType = z.infer<typeof ProcessPayrollRunDto>;
export type UpdatePayrollItemDtoType = z.infer<typeof UpdatePayrollItemDto>;
export type ListPayrollRunQueryType = z.infer<typeof ListPayrollRunQuery>;
export type ListPayrollItemsQueryType = z.infer<typeof ListPayrollItemsQuery>;
//# sourceMappingURL=payroll-run.dto.d.ts.map