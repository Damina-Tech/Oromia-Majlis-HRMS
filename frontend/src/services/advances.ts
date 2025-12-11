import api from "./api";

export type AdvanceStatus = "PENDING" | "APPROVED" | "REPAID" | "CANCELLED";

export interface Advance {
  id: string;
  employeeId: string;
  employee: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
  };
  amount: number;
  requestedAmount: number;
  remainingAmount: number;
  monthlyDeduction: number;
  requestDate: string;
  approvalDate?: string | null;
  repaidDate?: string | null;
  status: AdvanceStatus;
  reason?: string | null;
  approvedBy?: string | null;
  notes?: string | null;
  repaymentHistory?: AdvanceRepayment[];
  createdAt: string;
  updatedAt: string;
}

export interface AdvanceRepayment {
  id: string;
  advanceId: string;
  payrollRunId?: string | null;
  amount: number;
  paymentDate: string;
  notes?: string | null;
  createdAt: string;
}

export interface CreateAdvanceData {
  employeeId: string;
  requestedAmount: number;
  monthlyDeduction: number;
  requestDate: string; // YYYY-MM-DD
  reason?: string;
}

export interface UpdateAdvanceData {
  monthlyDeduction?: number;
  status?: AdvanceStatus;
  reason?: string;
  notes?: string;
}

export interface ApproveAdvanceData {
  approvedBy: string;
  notes?: string;
}

export interface AddAdvanceRepaymentData {
  amount: number;
  paymentDate: string; // YYYY-MM-DD
  payrollRunId?: string;
  notes?: string;
}

export interface ListAdvancesParams {
  employeeId?: string;
  status?: AdvanceStatus;
  page?: number;
  pageSize?: number;
}

export async function listAdvances(params?: ListAdvancesParams) {
  const response = await api.get<{
    items: Advance[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>("/payroll/advances", { params });
  return response.data;
}

export async function getAdvance(id: string) {
  const response = await api.get<Advance>(`/payroll/advances/${id}`);
  return response.data;
}

export async function createAdvance(data: CreateAdvanceData) {
  const response = await api.post<Advance>("/payroll/advances", data);
  return response.data;
}

export async function updateAdvance(id: string, data: UpdateAdvanceData) {
  const response = await api.put<Advance>(`/payroll/advances/${id}`, data);
  return response.data;
}

export async function approveAdvance(id: string, data: ApproveAdvanceData) {
  const response = await api.post<Advance>(`/payroll/advances/${id}/approve`, data);
  return response.data;
}

export async function addAdvanceRepayment(id: string, data: AddAdvanceRepaymentData) {
  const response = await api.post<{ repayment: AdvanceRepayment; advance: Advance }>(
    `/payroll/advances/${id}/repayment`,
    data
  );
  return response.data;
}

export async function deleteAdvance(id: string) {
  await api.delete(`/payroll/advances/${id}`);
}

