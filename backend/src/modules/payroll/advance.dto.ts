import { z } from "zod";

export const CreateAdvanceDto = z.object({
  employeeId: z.string(),
  requestedAmount: z.coerce.number().min(0, "Requested amount must be positive"),
  monthlyDeduction: z.coerce.number().min(0, "Monthly deduction must be positive"),
  requestDate: z.string(), // YYYY-MM-DD
  description: z.string().optional(),
});

export const UpdateAdvanceDto = z.object({
  monthlyDeduction: z.coerce.number().min(0).optional(),
  status: z.enum(["PENDING", "APPROVED", "REPAID", "CANCELLED"]).optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
});

export const ApproveAdvanceDto = z.object({
  approvedBy: z.string(),
  notes: z.string().optional(),
});

export const AddAdvanceRepaymentDto = z.object({
  amount: z.coerce.number().min(0, "Amount must be positive"),
  paymentDate: z.string(), // YYYY-MM-DD
  payrollRunId: z.string().optional(), // If paid via payroll
  notes: z.string().optional(),
});

export const ListAdvanceQuery = z.object({
  employeeId: z.string().optional(),
  status: z.enum(["PENDING", "APPROVED", "REPAID", "CANCELLED"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(1000).default(50),
});

export type CreateAdvanceDtoType = z.infer<typeof CreateAdvanceDto>;
export type UpdateAdvanceDtoType = z.infer<typeof UpdateAdvanceDto>;
export type ApproveAdvanceDtoType = z.infer<typeof ApproveAdvanceDto>;
export type AddAdvanceRepaymentDtoType = z.infer<typeof AddAdvanceRepaymentDto>;
export type ListAdvanceQueryType = z.infer<typeof ListAdvanceQuery>;

