import api from "./api";

export interface TaxRate {
  id: string;
  minIncome: number;
  maxIncome?: number | null;
  rate: number;
  fixedAmount?: number | null;
  year: number;
  isActive: boolean;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PensionRate {
  id: string;
  employeeRate: number;
  employerRate: number;
  year: number;
  isActive: boolean;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaxRateData {
  minIncome: number;
  maxIncome?: number | null;
  rate: number;
  fixedAmount?: number | null;
  year: number;
  description?: string;
  isActive?: boolean;
}

export interface UpdateTaxRateData {
  minIncome?: number;
  maxIncome?: number | null;
  rate?: number;
  fixedAmount?: number | null;
  description?: string;
  isActive?: boolean;
}

export interface CreatePensionRateData {
  employeeRate: number;
  employerRate: number;
  year: number;
  description?: string;
  isActive?: boolean;
}

export interface UpdatePensionRateData {
  employeeRate?: number;
  employerRate?: number;
  description?: string;
  isActive?: boolean;
}

export interface ListTaxRatesParams {
  year?: number;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export interface ListPensionRatesParams {
  year?: number;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export async function listTaxRates(params?: ListTaxRatesParams) {
  const response = await api.get<{
    items: TaxRate[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>("/payroll/tax-pension/tax", { params });
  return response.data;
}

export async function getTaxRate(id: string) {
  const response = await api.get<TaxRate>(`/payroll/tax-pension/tax/${id}`);
  return response.data;
}

export async function createTaxRate(data: CreateTaxRateData) {
  const response = await api.post<TaxRate>("/payroll/tax-pension/tax", data);
  return response.data;
}

export async function updateTaxRate(id: string, data: UpdateTaxRateData) {
  const response = await api.put<TaxRate>(`/payroll/tax-pension/tax/${id}`, data);
  return response.data;
}

export async function deleteTaxRate(id: string) {
  await api.delete(`/payroll/tax-pension/tax/${id}`);
}

export async function listPensionRates(params?: ListPensionRatesParams) {
  const response = await api.get<{
    items: PensionRate[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>("/payroll/tax-pension/pension", { params });
  return response.data;
}

export async function getPensionRate(id: string) {
  const response = await api.get<PensionRate>(`/payroll/tax-pension/pension/${id}`);
  return response.data;
}

export async function createPensionRate(data: CreatePensionRateData) {
  const response = await api.post<PensionRate>("/payroll/tax-pension/pension", data);
  return response.data;
}

export async function updatePensionRate(id: string, data: UpdatePensionRateData) {
  const response = await api.put<PensionRate>(`/payroll/tax-pension/pension/${id}`, data);
  return response.data;
}

export async function deletePensionRate(id: string) {
  await api.delete(`/payroll/tax-pension/pension/${id}`);
}

