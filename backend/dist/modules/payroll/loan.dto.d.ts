import { z } from "zod";
export declare const CreateLoanDto: z.ZodObject<{
    employeeId: z.ZodString;
    loanAmount: z.ZodCoercedNumber<unknown>;
    interestRate: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    monthlyPayment: z.ZodCoercedNumber<unknown>;
    startDate: z.ZodString;
    endDate: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const UpdateLoanDto: z.ZodObject<{
    interestRate: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    monthlyPayment: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    status: z.ZodOptional<z.ZodEnum<{
        ACTIVE: "ACTIVE";
        CANCELLED: "CANCELLED";
        COMPLETED: "COMPLETED";
    }>>;
    description: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const ApproveLoanDto: z.ZodObject<{
    approvedBy: z.ZodString;
}, z.core.$strip>;
export declare const AddLoanRepaymentDto: z.ZodObject<{
    amount: z.ZodCoercedNumber<unknown>;
    paymentDate: z.ZodString;
    payrollRunId: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const ListLoanQuery: z.ZodObject<{
    employeeId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        ACTIVE: "ACTIVE";
        CANCELLED: "CANCELLED";
        COMPLETED: "COMPLETED";
    }>>;
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export type CreateLoanDtoType = z.infer<typeof CreateLoanDto>;
export type UpdateLoanDtoType = z.infer<typeof UpdateLoanDto>;
export type ApproveLoanDtoType = z.infer<typeof ApproveLoanDto>;
export type AddLoanRepaymentDtoType = z.infer<typeof AddLoanRepaymentDto>;
export type ListLoanQueryType = z.infer<typeof ListLoanQuery>;
//# sourceMappingURL=loan.dto.d.ts.map