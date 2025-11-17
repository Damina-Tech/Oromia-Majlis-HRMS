import api from "./api";

export type PayrollStatus = "DRAFT" | "PROCESSED" | "PAID" | "CANCELLED";
export type PayrollPeriodType = "MONTHLY" | "BIWEEKLY" | "WEEKLY";

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
    designation: string;
    email?: string;
    phone?: string;
    department?: {
      id: string;
      name: string;
    };
  };
  periodType: PayrollPeriodType;
  periodStart: string;
  periodEnd: string;
  paymentDate?: string;
  basicSalary: number;
  allowances: number;
  overtime: number;
  bonus: number;
  grossSalary: number;
  incomeTax: number;
  healthInsurance: number;
  providentFund: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  status: PayrollStatus;
  processedBy?: string;
  processedAt?: string;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollSummary {
  totalEmployees: number;
  totalPayroll: number;
  totalDeductions: number;
  netPayroll: number;
  avgSalary: number;
  draft: number;
  processed: number;
  paid: number;
  breakdown: {
    basicSalary: number;
    allowances: number;
    overtime: number;
    bonus: number;
    incomeTax: number;
    healthInsurance: number;
    providentFund: number;
  };
}

export interface ListPayrollParams {
  employeeId?: string;
  departmentId?: string;
  status?: PayrollStatus;
  periodStart?: string;
  periodEnd?: string;
  month?: string; // e.g., "2024-11"
  year?: string;  // e.g., "2024"
  page?: number;
  pageSize?: number;
}

export interface GeneratePayrollData {
  periodStart: string;
  periodEnd: string;
  employeeIds?: string[];
  departmentId?: string;
}

export interface UpdatePayrollData {
  allowances?: number;
  overtime?: number;
  bonus?: number;
  incomeTax?: number;
  healthInsurance?: number;
  providentFund?: number;
  otherDeductions?: number;
  notes?: string;
}

export interface ProcessPayrollData {
  payrollIds: string[];
  paymentDate?: string;
}

/**
 * List payroll records
 */
export async function listPayroll(params?: ListPayrollParams) {
  const response = await api.get<{
    items: PayrollRecord[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>("/payroll", { params });
  return response.data;
}

/**
 * Get single payroll record
 */
export async function getPayroll(id: string) {
  const response = await api.get<PayrollRecord>(`/payroll/${id}`);
  return response.data;
}

/**
 * Generate payroll for employees
 */
export async function generatePayroll(data: GeneratePayrollData) {
  const response = await api.post<{
    message: string;
    payrolls: PayrollRecord[];
  }>("/payroll/generate", data);
  return response.data;
}

/**
 * Update payroll record
 */
export async function updatePayroll(id: string, data: UpdatePayrollData) {
  const response = await api.put<PayrollRecord>(`/payroll/${id}`, data);
  return response.data;
}

/**
 * Process payroll (mark as processed)
 */
export async function processPayroll(data: ProcessPayrollData) {
  const response = await api.post<{
    message: string;
    count: number;
  }>("/payroll/process", data);
  return response.data;
}

/**
 * Mark payroll as paid
 */
export async function markPayrollAsPaid(id: string) {
  const response = await api.patch<PayrollRecord>(`/payroll/${id}/paid`);
  return response.data;
}

/**
 * Delete payroll record
 */
export async function deletePayroll(id: string) {
  await api.delete(`/payroll/${id}`);
}

/**
 * Get payroll summary/statistics
 */
export async function getPayrollSummary(month?: string, year?: string) {
  const response = await api.get<PayrollSummary>("/payroll/summary", {
    params: { month, year },
  });
  return response.data;
}
