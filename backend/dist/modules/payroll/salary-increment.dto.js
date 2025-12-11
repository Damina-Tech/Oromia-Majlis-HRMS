import { z } from "zod";
export const CreateSalaryIncrementDto = z.object({
    employeeId: z.string(),
    incrementPercentage: z.coerce.number().min(0).max(100, "Increment percentage must be between 0 and 100").optional(),
    incrementAmount: z.coerce.number().min(0, "Increment amount must be positive").optional(),
    incrementDate: z.string(), // YYYY-MM-DD
    reason: z.string().optional(),
    notes: z.string().optional(),
});
export const BulkIncrementDto = z.object({
    incrementPercentage: z.coerce.number().min(0).max(100),
    incrementDate: z.string(), // YYYY-MM-DD
    employeeIds: z.array(z.string()).optional(), // If not provided, applies to all active employees
    departmentId: z.string().optional(),
    reason: z.string().optional(),
    notes: z.string().optional(),
});
export const ListSalaryIncrementQuery = z.object({
    employeeId: z.string().optional(),
    year: z.coerce.number().int().positive().optional(),
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(1000).default(50),
});
//# sourceMappingURL=salary-increment.dto.js.map