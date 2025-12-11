import { z } from "zod";
export declare const CreateTaxRateDto: z.ZodObject<{
    minIncome: z.ZodCoercedNumber<unknown>;
    maxIncome: z.ZodOptional<z.ZodNullable<z.ZodCoercedNumber<unknown>>>;
    rate: z.ZodCoercedNumber<unknown>;
    fixedAmount: z.ZodOptional<z.ZodNullable<z.ZodCoercedNumber<unknown>>>;
    year: z.ZodCoercedNumber<unknown>;
    description: z.ZodOptional<z.ZodString>;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare const UpdateTaxRateDto: z.ZodObject<{
    minIncome: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    maxIncome: z.ZodOptional<z.ZodNullable<z.ZodCoercedNumber<unknown>>>;
    rate: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    fixedAmount: z.ZodOptional<z.ZodNullable<z.ZodCoercedNumber<unknown>>>;
    description: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const CreatePensionRateDto: z.ZodObject<{
    employeeRate: z.ZodCoercedNumber<unknown>;
    employerRate: z.ZodCoercedNumber<unknown>;
    year: z.ZodCoercedNumber<unknown>;
    description: z.ZodOptional<z.ZodString>;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare const UpdatePensionRateDto: z.ZodObject<{
    employeeRate: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    employerRate: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    description: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const ListTaxRateQuery: z.ZodObject<{
    year: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    isActive: z.ZodOptional<z.ZodCoercedBoolean<unknown>>;
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const ListPensionRateQuery: z.ZodObject<{
    year: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    isActive: z.ZodOptional<z.ZodCoercedBoolean<unknown>>;
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export type CreateTaxRateDtoType = z.infer<typeof CreateTaxRateDto>;
export type UpdateTaxRateDtoType = z.infer<typeof UpdateTaxRateDto>;
export type CreatePensionRateDtoType = z.infer<typeof CreatePensionRateDto>;
export type UpdatePensionRateDtoType = z.infer<typeof UpdatePensionRateDto>;
export type ListTaxRateQueryType = z.infer<typeof ListTaxRateQuery>;
export type ListPensionRateQueryType = z.infer<typeof ListPensionRateQuery>;
//# sourceMappingURL=tax-pension.dto.d.ts.map