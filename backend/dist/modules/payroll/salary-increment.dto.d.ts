import { z } from "zod";
export declare const CreateSalaryIncrementDto: z.ZodObject<{
    employeeId: z.ZodString;
    incrementPercentage: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    incrementAmount: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    incrementDate: z.ZodString;
    reason: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const BulkIncrementDto: z.ZodObject<{
    incrementPercentage: z.ZodCoercedNumber<unknown>;
    incrementDate: z.ZodString;
    employeeIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    departmentId: z.ZodOptional<z.ZodString>;
    reason: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const ListSalaryIncrementQuery: z.ZodObject<{
    employeeId: z.ZodOptional<z.ZodString>;
    year: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export type CreateSalaryIncrementDtoType = z.infer<typeof CreateSalaryIncrementDto>;
export type BulkIncrementDtoType = z.infer<typeof BulkIncrementDto>;
export type ListSalaryIncrementQueryType = z.infer<typeof ListSalaryIncrementQuery>;
//# sourceMappingURL=salary-increment.dto.d.ts.map