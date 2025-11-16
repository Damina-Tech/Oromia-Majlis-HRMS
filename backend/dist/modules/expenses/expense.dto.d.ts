import { z } from "zod";
export declare const ExpenseTypeSchema: z.ZodEnum<{
    OTHER: "OTHER";
    OPERATIONAL: "OPERATIONAL";
    TRAVEL: "TRAVEL";
    REIMBURSEMENT: "REIMBURSEMENT";
    MAINTENANCE: "MAINTENANCE";
    RENT: "RENT";
    UTILITIES: "UTILITIES";
}>;
export declare const ExpenseStatusSchema: z.ZodEnum<{
    APPROVED: "APPROVED";
    REJECTED: "REJECTED";
    DRAFT: "DRAFT";
    PAID: "PAID";
    SUBMITTED: "SUBMITTED";
}>;
export declare const PaymentMethodSchema: z.ZodEnum<{
    OTHER: "OTHER";
    CASH: "CASH";
    BANK_TRANSFER: "BANK_TRANSFER";
    E_BIRR: "E_BIRR";
    TELEBIRR: "TELEBIRR";
}>;
export declare const CreateExpenseDto: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    amount: z.ZodCoercedNumber<unknown>;
    currency: z.ZodDefault<z.ZodString>;
    expenseType: z.ZodEnum<{
        OTHER: "OTHER";
        OPERATIONAL: "OPERATIONAL";
        TRAVEL: "TRAVEL";
        REIMBURSEMENT: "REIMBURSEMENT";
        MAINTENANCE: "MAINTENANCE";
        RENT: "RENT";
        UTILITIES: "UTILITIES";
    }>;
    incurredDate: z.ZodString;
    departmentId: z.ZodString;
    assetId: z.ZodOptional<z.ZodString>;
    vendorId: z.ZodOptional<z.ZodString>;
    paymentMethod: z.ZodOptional<z.ZodEnum<{
        OTHER: "OTHER";
        CASH: "CASH";
        BANK_TRANSFER: "BANK_TRANSFER";
        E_BIRR: "E_BIRR";
        TELEBIRR: "TELEBIRR";
    }>>;
    submit: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>;
export declare const UpdateExpenseDto: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    amount: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    currency: z.ZodOptional<z.ZodString>;
    expenseType: z.ZodOptional<z.ZodEnum<{
        OTHER: "OTHER";
        OPERATIONAL: "OPERATIONAL";
        TRAVEL: "TRAVEL";
        REIMBURSEMENT: "REIMBURSEMENT";
        MAINTENANCE: "MAINTENANCE";
        RENT: "RENT";
        UTILITIES: "UTILITIES";
    }>>;
    incurredDate: z.ZodOptional<z.ZodString>;
    departmentId: z.ZodOptional<z.ZodString>;
    assetId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    vendorId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    paymentMethod: z.ZodNullable<z.ZodOptional<z.ZodEnum<{
        OTHER: "OTHER";
        CASH: "CASH";
        BANK_TRANSFER: "BANK_TRANSFER";
        E_BIRR: "E_BIRR";
        TELEBIRR: "TELEBIRR";
    }>>>;
}, z.core.$strip>;
export declare const ListExpensesQuery: z.ZodObject<{
    page: z.ZodDefault<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    pageSize: z.ZodDefault<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    status: z.ZodOptional<z.ZodEnum<{
        APPROVED: "APPROVED";
        REJECTED: "REJECTED";
        DRAFT: "DRAFT";
        PAID: "PAID";
        SUBMITTED: "SUBMITTED";
    }>>;
    expenseType: z.ZodOptional<z.ZodEnum<{
        OTHER: "OTHER";
        OPERATIONAL: "OPERATIONAL";
        TRAVEL: "TRAVEL";
        REIMBURSEMENT: "REIMBURSEMENT";
        MAINTENANCE: "MAINTENANCE";
        RENT: "RENT";
        UTILITIES: "UTILITIES";
    }>>;
    departmentId: z.ZodOptional<z.ZodString>;
    submittedBy: z.ZodOptional<z.ZodString>;
    dateFrom: z.ZodOptional<z.ZodString>;
    dateTo: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const SubmitExpenseDto: z.ZodObject<{
    comment: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const ApproveExpenseDto: z.ZodObject<{
    comment: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const RejectExpenseDto: z.ZodObject<{
    comment: z.ZodString;
}, z.core.$strip>;
export declare const PayExpenseDto: z.ZodObject<{
    paymentMethod: z.ZodEnum<{
        OTHER: "OTHER";
        CASH: "CASH";
        BANK_TRANSFER: "BANK_TRANSFER";
        E_BIRR: "E_BIRR";
        TELEBIRR: "TELEBIRR";
    }>;
    paymentReference: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CreateExpenseDto = z.infer<typeof CreateExpenseDto>;
export type UpdateExpenseDto = z.infer<typeof UpdateExpenseDto>;
export type ListExpensesQuery = z.infer<typeof ListExpensesQuery>;
export type SubmitExpenseDto = z.infer<typeof SubmitExpenseDto>;
export type ApproveExpenseDto = z.infer<typeof ApproveExpenseDto>;
export type RejectExpenseDto = z.infer<typeof RejectExpenseDto>;
export type PayExpenseDto = z.infer<typeof PayExpenseDto>;
//# sourceMappingURL=expense.dto.d.ts.map