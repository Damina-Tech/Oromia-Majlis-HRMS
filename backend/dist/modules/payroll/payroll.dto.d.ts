import { z } from "zod";
export declare const CreatePayrollDto: z.ZodObject<{
    employeeId: z.ZodString;
    periodStart: z.ZodString;
    periodEnd: z.ZodString;
    basicSalary: z.ZodNumber;
    allowances: z.ZodDefault<z.ZodNumber>;
    overtime: z.ZodDefault<z.ZodNumber>;
    bonus: z.ZodDefault<z.ZodNumber>;
    incomeTax: z.ZodDefault<z.ZodNumber>;
    healthInsurance: z.ZodDefault<z.ZodNumber>;
    providentFund: z.ZodDefault<z.ZodNumber>;
    otherDeductions: z.ZodDefault<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const UpdatePayrollDto: z.ZodObject<{
    allowances: z.ZodOptional<z.ZodNumber>;
    overtime: z.ZodOptional<z.ZodNumber>;
    bonus: z.ZodOptional<z.ZodNumber>;
    incomeTax: z.ZodOptional<z.ZodNumber>;
    healthInsurance: z.ZodOptional<z.ZodNumber>;
    providentFund: z.ZodOptional<z.ZodNumber>;
    otherDeductions: z.ZodOptional<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const ProcessPayrollDto: z.ZodObject<{
    payrollIds: z.ZodArray<z.ZodString>;
    paymentDate: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const ListPayrollQuery: z.ZodObject<{
    employeeId: z.ZodOptional<z.ZodString>;
    departmentId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        CANCELLED: "CANCELLED";
        DRAFT: "DRAFT";
        PROCESSED: "PROCESSED";
        PAID: "PAID";
    }>>;
    periodStart: z.ZodOptional<z.ZodString>;
    periodEnd: z.ZodOptional<z.ZodString>;
    month: z.ZodOptional<z.ZodString>;
    year: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const GeneratePayrollDto: z.ZodObject<{
    periodStart: z.ZodString;
    periodEnd: z.ZodString;
    employeeIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    departmentId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CreatePayrollDtoType = z.infer<typeof CreatePayrollDto>;
export type UpdatePayrollDtoType = z.infer<typeof UpdatePayrollDto>;
export type ProcessPayrollDtoType = z.infer<typeof ProcessPayrollDto>;
export type ListPayrollQueryType = z.infer<typeof ListPayrollQuery>;
export type GeneratePayrollDtoType = z.infer<typeof GeneratePayrollDto>;
//# sourceMappingURL=payroll.dto.d.ts.map