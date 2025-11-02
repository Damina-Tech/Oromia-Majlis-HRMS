import { z } from "zod";

export const CreatePayrollRunDto = z.object({
  periodType: z.enum(["MONTHLY", "BIWEEKLY", "WEEKLY"]).default("MONTHLY"),
  periodStart: z.string(), // YYYY-MM-DD
  periodEnd: z.string(),   // YYYY-MM-DD
  paymentDate: z.string().optional(), // YYYY-MM-DD
  employeeIds: z.array(z.string()).optional(), // If not provided, generate for all active employees
  departmentId: z.string().optional(),
});

export const UpdatePayrollRunDto = z.object({
  status: z.enum(["DRAFT", "REVIEW", "APPROVED", "PROCESSED", "PAID", "CANCELLED"]).optional(),
  paymentDate: z.string().optional(),
  comments: z.string().optional(),
  notes: z.string().optional(),
});

export const ReviewPayrollRunDto = z.object({
  comments: z.string().optional(),
});

export const ApprovePayrollRunDto = z.object({
  comments: z.string().optional(),
});

export const ProcessPayrollRunDto = z.object({
  comments: z.string().optional(),
});

export const UpdatePayrollItemDto = z.object({
  allowances: z.coerce.number().min(0).optional(),
  overtime: z.coerce.number().min(0).optional(),
  bonus: z.coerce.number().min(0).optional(),
  incomeTax: z.coerce.number().min(0).optional(),
  pension: z.coerce.number().min(0).optional(),
  healthInsurance: z.coerce.number().min(0).optional(),
  providentFund: z.coerce.number().min(0).optional(),
  otherDeductions: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
});

export const ListPayrollRunQuery = z.object({
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
  status: z.enum(["DRAFT", "REVIEW", "APPROVED", "PROCESSED", "PAID", "CANCELLED"]).optional(),
  periodType: z.enum(["MONTHLY", "BIWEEKLY", "WEEKLY"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(1000).default(50),
});

export const ListPayrollItemsQuery = z.object({
  payrollRunId: z.string().optional(), // Optional because it comes from route param
  employeeId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(1000).default(50),
});

export type CreatePayrollRunDtoType = z.infer<typeof CreatePayrollRunDto>;
export type UpdatePayrollRunDtoType = z.infer<typeof UpdatePayrollRunDto>;
export type ReviewPayrollRunDtoType = z.infer<typeof ReviewPayrollRunDto>;
export type ApprovePayrollRunDtoType = z.infer<typeof ApprovePayrollRunDto>;
export type ProcessPayrollRunDtoType = z.infer<typeof ProcessPayrollRunDto>;
export type UpdatePayrollItemDtoType = z.infer<typeof UpdatePayrollItemDto>;
export type ListPayrollRunQueryType = z.infer<typeof ListPayrollRunQuery>;
export type ListPayrollItemsQueryType = z.infer<typeof ListPayrollItemsQuery>;

