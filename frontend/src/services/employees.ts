import api from "./api";

export type Employee = {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  emergencyContact?: string | null;
  designation?: string | null;
  status: "ACTIVE"|"INACTIVE"|"ON_LEAVE";
  joiningDate?: string | null;
  salary?: number | null;
  departmentId?: string | null;
  department?: { id: string; name: string } | null;
  manager?: { id: string; firstName: string; lastName: string } | null;
<<<<<<< HEAD
=======
  userId?: string | null;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    status: string;
  } | null;
>>>>>>> dev
};

export async function listEmployees(params: {
  search?: string; status?: "ACTIVE"|"INACTIVE"|"ON_LEAVE";
  departmentId?: string; page?: number; pageSize?: number;
}) {
  const { data } = await api.get("/employees", { params });
  return data as { items: Employee[]; total: number; page: number; pageSize: number };
}

export async function createEmployee(payload: Partial<Employee> & {
  firstName: string; lastName: string; email: string;
}) {
  const { data } = await api.post("/employees", payload);
  return data as Employee;
}

export async function updateEmployee(id: string, payload: Partial<Employee>) {
  const { data } = await api.put(`/employees/${id}`, payload);
  return data as Employee;
}

export async function deleteEmployee(id: string) {
  await api.delete(`/employees/${id}`);
}
