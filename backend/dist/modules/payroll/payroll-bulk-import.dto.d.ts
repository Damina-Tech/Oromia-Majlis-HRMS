import { z } from "zod";
export declare const BulkImportPayrollDto: z.ZodObject<{
    payrollRunId: z.ZodString;
    data: z.ZodArray<z.ZodObject<{
        employeeCode: z.ZodString;
        allowances: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
        overtime: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
        bonus: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
        loanDeductions: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
        advanceDeductions: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
        otherDeductions: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
        bankAccountNumber: z.ZodOptional<z.ZodString>;
        bankName: z.ZodOptional<z.ZodString>;
        notes: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type BulkImportPayrollDtoType = z.infer<typeof BulkImportPayrollDto>;
//# sourceMappingURL=payroll-bulk-import.dto.d.ts.map