import { z } from "zod";
export declare const CreateSalaryGradeDto: z.ZodObject<{
    name: z.ZodString;
    code: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    minSalary: z.ZodCoercedNumber<unknown>;
    maxSalary: z.ZodCoercedNumber<unknown>;
}, z.core.$strip>;
export declare const UpdateSalaryGradeDto: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    code: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    minSalary: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    maxSalary: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const CreateSalaryStepDto: z.ZodObject<{
    gradeId: z.ZodString;
    step: z.ZodCoercedNumber<unknown>;
    salary: z.ZodCoercedNumber<unknown>;
}, z.core.$strip>;
export declare const UpdateSalaryStepDto: z.ZodObject<{
    step: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    salary: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export type CreateSalaryGradeDtoType = z.infer<typeof CreateSalaryGradeDto>;
export type UpdateSalaryGradeDtoType = z.infer<typeof UpdateSalaryGradeDto>;
export type CreateSalaryStepDtoType = z.infer<typeof CreateSalaryStepDto>;
export type UpdateSalaryStepDtoType = z.infer<typeof UpdateSalaryStepDto>;
//# sourceMappingURL=salary-grade.dto.d.ts.map