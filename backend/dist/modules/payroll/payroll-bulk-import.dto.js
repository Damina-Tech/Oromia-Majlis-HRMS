import { z } from "zod";
export const BulkImportPayrollDto = z.object({
    payrollRunId: z.string(),
    data: z.array(z.object({
        employeeCode: z.string(),
        allowances: z.coerce.number().min(0).optional(),
        overtime: z.coerce.number().min(0).optional(),
        bonus: z.coerce.number().min(0).optional(),
        loanDeductions: z.coerce.number().min(0).optional(),
        advanceDeductions: z.coerce.number().min(0).optional(),
        otherDeductions: z.coerce.number().min(0).optional(),
        bankAccountNumber: z.string().optional(),
        bankName: z.string().optional(),
        notes: z.string().optional(),
    })),
});
//# sourceMappingURL=payroll-bulk-import.dto.js.map