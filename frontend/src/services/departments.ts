import api from "./api";
import { Employee } from "./employees";

export type Department = {
  id: string;
  name: string;
  managerId?: string | null;
  manager?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    employee?: {
      id: string;
      employeeCode: string;
      designation?: string | null;
    } | null;
  } | null;
  createdAt?: string;
  updatedAt?: string;
  employees?: Employee[];
  _count?: {
    employees: number;
  };
};

export async function listDepartments() {
  const { data } = await api.get("/departments");
  return data as Department[];
}

export async function getDepartment(id: string) {
  const { data } = await api.get(`/departments/${id}`);
  return data as Department;
}

export async function createDepartment(payload: { name: string; managerId?: string }) {
  const { data } = await api.post("/departments", payload);
  return data as Department;
}

export async function updateDepartment(id: string, payload: { name: string; managerId?: string }) {
  const { data } = await api.put(`/departments/${id}`, payload);
  return data as Department;
}

export async function deleteDepartment(id: string) {
  await api.delete(`/departments/${id}`);
}

