import api from "./api";

export type AllowanceType = "TRANSPORT" | "HOUSING" | "MEAL" | "COMMUNICATION" | "MEDICAL" | "OTHER";

export interface Allowance {
  id: string;
  name: string;
  type: AllowanceType;
  description?: string | null;
  amount: number;
  isPercentage: boolean;
  percentage?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeAllowance {
  id: string;
  employeeId: string;
  employee: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
  };
  allowanceId: string;
  allowance: Allowance;
  month: string; // YYYY-MM
  amount: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAllowanceData {
  name: string;
  type: AllowanceType;
  description?: string;
  amount: number;
  isPercentage?: boolean;
  percentage?: number;
  isActive?: boolean;
}

export interface UpdateAllowanceData {
  name?: string;
  type?: AllowanceType;
  description?: string;
  amount?: number;
  isPercentage?: boolean;
  percentage?: number;
  isActive?: boolean;
}

export interface AssignEmployeeAllowanceData {
  employeeId: string;
  allowanceId: string;
  month: string; // YYYY-MM
  amount: number;
  notes?: string;
}

export interface ListAllowancesParams {
  type?: AllowanceType;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export async function listAllowances(params?: ListAllowancesParams) {
  const response = await api.get<{
    items: Allowance[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>("/payroll/allowances", { params });
  return response.data;
}

export async function getAllowance(id: string) {
  const response = await api.get<Allowance>(`/payroll/allowances/${id}`);
  return response.data;
}

export async function createAllowance(data: CreateAllowanceData) {
  const response = await api.post<Allowance>("/payroll/allowances", data);
  return response.data;
}

export async function updateAllowance(id: string, data: UpdateAllowanceData) {
  const response = await api.put<Allowance>(`/payroll/allowances/${id}`, data);
  return response.data;
}

export async function deleteAllowance(id: string) {
  await api.delete(`/payroll/allowances/${id}`);
}

export async function assignEmployeeAllowance(data: AssignEmployeeAllowanceData) {
  const response = await api.post<EmployeeAllowance>("/payroll/allowances/assign", data);
  return response.data;
}

export async function listEmployeeAllowances(employeeId?: string, month?: string) {
  const response = await api.get<EmployeeAllowance[]>("/payroll/allowances/assign/list", {
    params: { employeeId, month },
  });
  return response.data;
}

export async function removeEmployeeAllowance(id: string) {
  await api.delete(`/payroll/allowances/assign/${id}`);
}

