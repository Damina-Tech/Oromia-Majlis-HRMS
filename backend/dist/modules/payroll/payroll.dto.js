import { z } from "zod";
// Create payroll DTO
export const CreatePayrollDto = z.object({
    employeeId: z.string(),
    periodStart: z.string(), // YYYY-MM-DD
    periodEnd: z.string(), // YYYY-MM-DD
    basicSalary: z.number().min(0),
    allowances: z.number().min(0).default(0),
    overtime: z.number().min(0).default(0),
    bonus: z.number().min(0).default(0),
    incomeTax: z.number().min(0).default(0),
    healthInsurance: z.number().min(0).default(0),
    providentFund: z.number().min(0).default(0),
    otherDeductions: z.number().min(0).default(0),
    notes: z.string().optional(),
});
// Update payroll DTO
export const UpdatePayrollDto = z.object({
    allowances: z.number().min(0).optional(),
    overtime: z.number().min(0).optional(),
    bonus: z.number().min(0).optional(),
    incomeTax: z.number().min(0).optional(),
    healthInsurance: z.number().min(0).optional(),
    providentFund: z.number().min(0).optional(),
    otherDeductions: z.number().min(0).optional(),
    notes: z.string().optional(),
});
// Process payroll DTO
export const ProcessPayrollDto = z.object({
    payrollIds: z.array(z.string()).min(1),
    paymentDate: z.string().optional(), // YYYY-MM-DD
});
// List payroll query
export const ListPayrollQuery = z.object({
    employeeId: z.string().optional(),
    departmentId: z.string().optional(),
    status: z.enum(["DRAFT", "PROCESSED", "PAID", "CANCELLED"]).optional(),
    periodStart: z.string().optional(), // YYYY-MM-DD
    periodEnd: z.string().optional(), // YYYY-MM-DD
    month: z.string().optional(), // e.g., "2024-11"
    year: z.string().optional(), // e.g., "2024"
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(1000).default(50),
});
// Generate payroll DTO
export const GeneratePayrollDto = z.object({
    periodStart: z.string(), // YYYY-MM-DD
    periodEnd: z.string(), // YYYY-MM-DD
    employeeIds: z.array(z.string()).optional(), // If not provided, generate for all active employees
    departmentId: z.string().optional(),
});
//# sourceMappingURL=payroll.dto.js.map