import { z } from "zod";

// Enums
export const ExpenseTypeSchema = z.enum([
  "OPERATIONAL",
  "TRAVEL",
  "REIMBURSEMENT",
  "MAINTENANCE",
  "RENT",
  "UTILITIES",
  "OTHER",
]);

export const ExpenseStatusSchema = z.enum([
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
  "PAID",
]);

export const PaymentMethodSchema = z.enum([
  "CASH",
  "BANK_TRANSFER",
  "E_BIRR",
  "TELEBIRR",
  "OTHER",
]);

// Create Expense DTO
export const CreateExpenseDto = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  amount: z.coerce.number().positive("Amount must be positive"),
  currency: z.string().default("ETB"),
  expenseType: ExpenseTypeSchema,
  incurredDate: z.string().date(),
  departmentId: z.string(),
  assetId: z.string().optional(),
  vendorId: z.string().optional(),
  paymentMethod: PaymentMethodSchema.optional(),
  submit: z.boolean().optional().default(false), // If true, submit immediately
});

// Update Expense DTO
export const UpdateExpenseDto = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  amount: z.coerce.number().positive().optional(),
  currency: z.string().optional(),
  expenseType: ExpenseTypeSchema.optional(),
  incurredDate: z.string().date().optional(),
  departmentId: z.string().optional(),
  assetId: z.string().optional().nullable(),
  vendorId: z.string().optional().nullable(),
  paymentMethod: PaymentMethodSchema.optional().nullable(),
});

// List Expenses Query
export const ListExpensesQuery = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  pageSize: z.coerce.number().min(1).max(1000).optional().default(20),
  status: ExpenseStatusSchema.optional(),
  expenseType: ExpenseTypeSchema.optional(),
  departmentId: z.string().optional(),
  submittedBy: z.string().optional(),
  dateFrom: z.string().date().optional(),
  dateTo: z.string().date().optional(),
  search: z.string().optional(),
});

// Submit Expense DTO
export const SubmitExpenseDto = z.object({
  comment: z.string().optional(),
});

// Approve Expense DTO
export const ApproveExpenseDto = z.object({
  comment: z.string().optional(),
});

// Reject Expense DTO
export const RejectExpenseDto = z.object({
  comment: z.string().min(1, "Rejection comment is required"),
});

// Pay Expense DTO
export const PayExpenseDto = z.object({
  paymentMethod: PaymentMethodSchema,
  paymentReference: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateExpenseDto = z.infer<typeof CreateExpenseDto>;
export type UpdateExpenseDto = z.infer<typeof UpdateExpenseDto>;
export type ListExpensesQuery = z.infer<typeof ListExpensesQuery>;
export type SubmitExpenseDto = z.infer<typeof SubmitExpenseDto>;
export type ApproveExpenseDto = z.infer<typeof ApproveExpenseDto>;
export type RejectExpenseDto = z.infer<typeof RejectExpenseDto>;
export type PayExpenseDto = z.infer<typeof PayExpenseDto>;

