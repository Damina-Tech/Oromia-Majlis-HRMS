import { z } from "zod";

export const CreateTaxRateDto = z.object({
  minIncome: z.coerce.number().min(0, "Minimum income must be positive"),
  maxIncome: z.coerce.number().min(0).nullable().optional(),
  rate: z.coerce.number().min(0).max(100, "Rate must be between 0 and 100"),
  fixedAmount: z.coerce.number().min(0).nullable().optional(),
  year: z.coerce.number().int().positive(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const UpdateTaxRateDto = z.object({
  minIncome: z.coerce.number().min(0).optional(),
  maxIncome: z.coerce.number().min(0).nullable().optional(),
  rate: z.coerce.number().min(0).max(100).optional(),
  fixedAmount: z.coerce.number().min(0).nullable().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const CreatePensionRateDto = z.object({
  employeeRate: z.coerce.number().min(0).max(100, "Employee rate must be between 0 and 100"),
  employerRate: z.coerce.number().min(0).max(100, "Employer rate must be between 0 and 100"),
  year: z.coerce.number().int().positive(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const UpdatePensionRateDto = z.object({
  employeeRate: z.coerce.number().min(0).max(100).optional(),
  employerRate: z.coerce.number().min(0).max(100).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const ListTaxRateQuery = z.object({
  year: z.coerce.number().int().positive().optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(1000).default(50),
});

export const ListPensionRateQuery = z.object({
  year: z.coerce.number().int().positive().optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(1000).default(50),
});

export type CreateTaxRateDtoType = z.infer<typeof CreateTaxRateDto>;
export type UpdateTaxRateDtoType = z.infer<typeof UpdateTaxRateDto>;
export type CreatePensionRateDtoType = z.infer<typeof CreatePensionRateDto>;
export type UpdatePensionRateDtoType = z.infer<typeof UpdatePensionRateDto>;
export type ListTaxRateQueryType = z.infer<typeof ListTaxRateQuery>;
export type ListPensionRateQueryType = z.infer<typeof ListPensionRateQuery>;

