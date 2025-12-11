import api from "./api";

export type PayrollRunStatus = "DRAFT" | "REVIEW" | "APPROVED" | "PROCESSED" | "PAID" | "CANCELLED";
export type PayrollPeriodType = "MONTHLY" | "BIWEEKLY" | "WEEKLY";

export interface PayrollRun {
  id: string;
  periodType: PayrollPeriodType;
  periodStart: string;
  periodEnd: string;
  paymentDate?: string | null;
  status: PayrollRunStatus;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  employeeCount: number;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  processedBy?: string | null;
  processedAt?: string | null;
  comments?: string | null;
  notes?: string | null;
  items?: PayrollItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PayrollItem {
  id: string;
  payrollRunId: string;
  employeeId: string;
  employee: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    email?: string;
    designation?: string;
    department?: {
      id: string;
      name: string;
    };
  };
  basicSalary: number;
  allowances: number;
  overtime: number;
  bonus: number;
  grossSalary: number;
  incomeTax: number;
  pension: number;
  healthInsurance: number;
  providentFund: number;
  loanDeductions: number;
  advanceDeductions: number;
  absenceDeductions: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  payslipGenerated: boolean;
  payslipUrl?: string | null;
  bankAccountNumber?: string | null;
  bankName?: string | null;
  notes?: string | null;
}

export interface CreatePayrollRunData {
  periodType: PayrollPeriodType;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string; // YYYY-MM-DD
  paymentDate?: string; // YYYY-MM-DD
  employeeIds?: string[];
  departmentId?: string;
}

export interface UpdatePayrollRunData {
  status?: PayrollRunStatus;
  paymentDate?: string;
  comments?: string;
  notes?: string;
}

export interface UpdatePayrollItemData {
  allowances?: number;
  overtime?: number;
  bonus?: number;
  incomeTax?: number;
  otherDeductions?: number;
  notes?: string;
}

export interface ListPayrollRunsParams {
  periodStart?: string;
  periodEnd?: string;
  status?: PayrollRunStatus;
  periodType?: PayrollPeriodType;
  page?: number;
  pageSize?: number;
}

export interface ListPayrollItemsParams {
  payrollRunId: string;
  employeeId?: string;
  page?: number;
  pageSize?: number;
}

export interface PayslipData {
  employee: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    designation?: string;
  };
  payrollRun: {
    id: string;
    periodStart: string;
    periodEnd: string;
    periodType: string;
    paymentDate?: string | null;
  };
  payrollItem: {
    basicSalary: number;
    allowances: number;
    overtime: number;
    bonus: number;
    grossSalary: number;
    incomeTax: number;
    pension: number;
    healthInsurance: number;
    providentFund: number;
    loanDeductions: number;
    advanceDeductions: number;
    absenceDeductions: number;
    otherDeductions: number;
    totalDeductions: number;
    netSalary: number;
    workingDays: number;
    presentDays: number;
    absentDays: number;
    leaveDays: number;
  };
}

// Payroll Run Operations
export async function createPayrollRun(data: CreatePayrollRunData) {
  const response = await api.post<{ payrollRun: PayrollRun; items: PayrollItem[] }>(
    "/payroll/runs",
    data
  );
  return response.data;
}

export async function listPayrollRuns(params?: ListPayrollRunsParams) {
  const response = await api.get<{
    items: PayrollRun[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>("/payroll/runs", { params });
  return response.data;
}

export async function getPayrollRun(id: string) {
  const response = await api.get<PayrollRun>(`/payroll/runs/${id}`);
  return response.data;
}

export async function updatePayrollRun(id: string, data: UpdatePayrollRunData) {
  const response = await api.put<PayrollRun>(`/payroll/runs/${id}`, data);
  return response.data;
}

export async function reviewPayrollRun(id: string, comments?: string) {
  const response = await api.post<PayrollRun>(`/payroll/runs/${id}/review`, { comments });
  return response.data;
}

export async function approvePayrollRun(id: string, comments?: string) {
  const response = await api.post<PayrollRun>(`/payroll/runs/${id}/approve`, { comments });
  return response.data;
}

export async function processPayrollRun(id: string, comments?: string) {
  const response = await api.post<PayrollRun>(`/payroll/runs/${id}/process`, { comments });
  return response.data;
}

export async function deletePayrollRun(id: string) {
  await api.delete(`/payroll/runs/${id}`);
}

export async function exportBankFile(id: string, format: "csv" | "txt" = "csv") {
  const response = await api.get(`/payroll/runs/${id}/export?format=${format}`, {
    responseType: "blob",
  });
  
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `bank_export_${id}_${Date.now()}.${format}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

// Payroll Item Operations
export async function listPayrollItems(params: ListPayrollItemsParams) {
  const response = await api.get<{
    items: PayrollItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>(`/payroll/runs/${params.payrollRunId}/items`, {
    params: { employeeId: params.employeeId, page: params.page, pageSize: params.pageSize },
  });
  return response.data;
}

export async function getPayrollItem(id: string) {
  const response = await api.get<PayrollItem>(`/payroll/runs/items/${id}`);
  return response.data;
}

export async function updatePayrollItem(id: string, data: UpdatePayrollItemData) {
  const response = await api.put<PayrollItem>(`/payroll/runs/items/${id}`, data);
  return response.data;
}

// Payslip Operations
export async function generatePayslip(itemId: string) {
  const response = await api.post<{ message: string; payslipUrl: string }>(
    `/payroll/runs/items/${itemId}/payslip`
  );
  return response.data;
}

export async function getPayslipData(itemId: string) {
  const response = await api.get<PayslipData>(`/payroll/runs/items/${itemId}/payslip`);
  return response.data;
}

export async function downloadPayslip(itemId: string) {
  const response = await api.get(`/payroll/runs/items/${itemId}/payslip/download`, {
    responseType: "blob",
  });
  
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `payslip_${itemId}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

