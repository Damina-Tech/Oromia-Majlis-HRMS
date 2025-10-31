import api from "./api";

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  employee?: {
    id: string;
    employeeCode: string;
    designation?: string | null;
  } | null;
  userRoles?: Array<{
    role: {
      id: string;
      name: string;
    };
  }>;
};

export async function listUsers(activeOnly?: boolean) {
  const { data } = await api.get("/users", {
    params: activeOnly ? { active: 'true' } : {}
  });
  return data as User[];
}

export async function getUser(id: string) {
  const { data } = await api.get(`/users/${id}`);
  return data as User;
}

