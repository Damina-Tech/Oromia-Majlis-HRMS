import { z } from "zod";

export const CreateAllowanceDto = z.object({
  name: z.string().min(1, "Allowance name is required"),
  type: z.enum(["TRANSPORT", "HOUSING", "MEAL", "COMMUNICATION", "MEDICAL", "OTHER"]),
  description: z.string().optional(),
  amount: z.coerce.number().min(0, "Amount must be positive"),
  isPercentage: z.boolean().default(false),
  percentage: z.coerce.number().min(0).max(100).optional(),
  isActive: z.boolean().default(true),
});

export const UpdateAllowanceDto = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(["TRANSPORT", "HOUSING", "MEAL", "COMMUNICATION", "MEDICAL", "OTHER"]).optional(),
  description: z.string().optional(),
  amount: z.coerce.number().min(0).optional(),
  isPercentage: z.boolean().optional(),
  percentage: z.coerce.number().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
});

export const AssignEmployeeAllowanceDto = z.object({
  employeeId: z.string(),
  allowanceId: z.string(),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format"),
  amount: z.coerce.number().min(0),
  notes: z.string().optional(),
});

export const ListAllowanceQuery = z.object({
  type: z.enum(["TRANSPORT", "HOUSING", "MEAL", "COMMUNICATION", "MEDICAL", "OTHER"]).optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(1000).default(50),
});

export type CreateAllowanceDtoType = z.infer<typeof CreateAllowanceDto>;
export type UpdateAllowanceDtoType = z.infer<typeof UpdateAllowanceDto>;
export type AssignEmployeeAllowanceDtoType = z.infer<typeof AssignEmployeeAllowanceDto>;
export type ListAllowanceQueryType = z.infer<typeof ListAllowanceQuery>;

