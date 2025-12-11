import { z } from "zod";

export const CreateLoanDto = z.object({
  employeeId: z.string(),
  loanAmount: z.coerce.number().min(0, "Loan amount must be positive"),
  interestRate: z.coerce.number().min(0).max(100).default(0),
  monthlyPayment: z.coerce.number().min(0, "Monthly payment must be positive"),
  startDate: z.string(), // YYYY-MM-DD
  endDate: z.string().optional(), // YYYY-MM-DD (calculated if not provided)
  description: z.string().optional(),
});

export const UpdateLoanDto = z.object({
  interestRate: z.coerce.number().min(0).max(100).optional(),
  monthlyPayment: z.coerce.number().min(0).optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
  description: z.string().optional(),
});

export const ApproveLoanDto = z.object({
  approvedBy: z.string(),
});

export const AddLoanRepaymentDto = z.object({
  amount: z.coerce.number().min(0, "Amount must be positive"),
  paymentDate: z.string(), // YYYY-MM-DD
  payrollRunId: z.string().optional(), // If paid via payroll
  notes: z.string().optional(),
});

export const ListLoanQuery = z.object({
  employeeId: z.string().optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(1000).default(50),
});

export type CreateLoanDtoType = z.infer<typeof CreateLoanDto>;
export type UpdateLoanDtoType = z.infer<typeof UpdateLoanDto>;
export type ApproveLoanDtoType = z.infer<typeof ApproveLoanDto>;
export type AddLoanRepaymentDtoType = z.infer<typeof AddLoanRepaymentDto>;
export type ListLoanQueryType = z.infer<typeof ListLoanQuery>;

