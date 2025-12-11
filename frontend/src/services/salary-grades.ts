import api from "./api";

export interface SalaryGrade {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  minSalary: number;
  maxSalary: number;
  steps?: SalaryStep[];
  createdAt: string;
  updatedAt: string;
}

export interface SalaryStep {
  id: string;
  gradeId: string;
  grade?: SalaryGrade;
  stepNumber: number;
  salary: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSalaryGradeData {
  name: string;
  code: string;
  description?: string;
  minSalary: number;
  maxSalary: number;
}

export interface UpdateSalaryGradeData {
  name?: string;
  code?: string;
  description?: string;
  minSalary?: number;
  maxSalary?: number;
}

export interface CreateSalaryStepData {
  gradeId: string;
  stepNumber: number;
  salary: number;
}

export interface UpdateSalaryStepData {
  stepNumber?: number;
  salary?: number;
}

export async function listSalaryGrades() {
  const response = await api.get<SalaryGrade[]>("/payroll/salary-grades");
  return response.data;
}

export async function getSalaryGrade(id: string) {
  const response = await api.get<SalaryGrade>(`/payroll/salary-grades/${id}`);
  return response.data;
}

export async function createSalaryGrade(data: CreateSalaryGradeData) {
  const response = await api.post<SalaryGrade>("/payroll/salary-grades", data);
  return response.data;
}

export async function updateSalaryGrade(id: string, data: UpdateSalaryGradeData) {
  const response = await api.put<SalaryGrade>(`/payroll/salary-grades/${id}`, data);
  return response.data;
}

export async function deleteSalaryGrade(id: string) {
  await api.delete(`/payroll/salary-grades/${id}`);
}

export async function listSalarySteps(gradeId?: string) {
  const response = await api.get<SalaryStep[]>("/payroll/salary-grades/steps", {
    params: { gradeId },
  });
  return response.data;
}

export async function getSalaryStep(id: string) {
  const response = await api.get<SalaryStep>(`/payroll/salary-grades/steps/${id}`);
  return response.data;
}

export async function createSalaryStep(data: CreateSalaryStepData) {
  const response = await api.post<SalaryStep>("/payroll/salary-grades/steps", data);
  return response.data;
}

export async function updateSalaryStep(id: string, data: UpdateSalaryStepData) {
  const response = await api.put<SalaryStep>(`/payroll/salary-grades/steps/${id}`, data);
  return response.data;
}

export async function deleteSalaryStep(id: string) {
  await api.delete(`/payroll/salary-grades/steps/${id}`);
}

