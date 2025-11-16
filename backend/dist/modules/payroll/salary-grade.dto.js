import { z } from "zod";
export const CreateSalaryGradeDto = z.object({
    name: z.string().min(1, "Grade name is required"),
    code: z.string().min(1, "Grade code is required"),
    description: z.string().optional(),
    minSalary: z.coerce.number().min(0, "Minimum salary must be positive"),
    maxSalary: z.coerce.number().min(0, "Maximum salary must be positive"),
});
export const UpdateSalaryGradeDto = z.object({
    name: z.string().min(1).optional(),
    code: z.string().min(1).optional(),
    description: z.string().optional(),
    minSalary: z.coerce.number().min(0).optional(),
    maxSalary: z.coerce.number().min(0).optional(),
});
export const CreateSalaryStepDto = z.object({
    gradeId: z.string(),
    step: z.coerce.number().int().positive(),
    salary: z.coerce.number().min(0, "Salary must be positive"),
});
export const UpdateSalaryStepDto = z.object({
    step: z.coerce.number().int().positive().optional(),
    salary: z.coerce.number().min(0).optional(),
});
//# sourceMappingURL=salary-grade.dto.js.map