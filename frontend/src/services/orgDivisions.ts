import api from "./api";

export interface OrgDivisionHead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface OrgDivision {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  headUserId?: string | null;
  active: boolean;
  headUser?: OrgDivisionHead | null;
  _count?: { assignments: number };
  assignments?: DivisionAssignment[];
}

export interface DivisionAssignment {
  id: string;
  userId: string;
  divisionId: string;
  roleId: string;
  isPrimary: boolean;
  assignedAt: string;
  user?: { id: string; firstName: string; lastName: string; email: string; status?: string };
  division?: { id: string; code: string; name: string };
  role?: { id: string; name: string; description?: string | null };
}

export async function listOrgDivisions(): Promise<OrgDivision[]> {
  const { data } = await api.get("/org-divisions");
  return data.items ?? [];
}

export async function getOrgDivision(id: string): Promise<OrgDivision> {
  const { data } = await api.get(`/org-divisions/${id}`);
  return data;
}

export async function updateOrgDivision(
  id: string,
  payload: { name?: string; description?: string | null; headUserId?: string | null; active?: boolean }
): Promise<OrgDivision> {
  const { data } = await api.patch(`/org-divisions/${id}`, payload);
  return data;
}

export async function listDivisionAssignments(query?: {
  divisionId?: string;
  userId?: string;
}): Promise<DivisionAssignment[]> {
  const { data } = await api.get("/org-divisions/assignments", { params: query });
  return data.items ?? [];
}

export async function createDivisionAssignment(payload: {
  userId: string;
  divisionId: string;
  roleId: string;
  isPrimary?: boolean;
}): Promise<DivisionAssignment> {
  const { data } = await api.post("/org-divisions/assignments", payload);
  return data;
}

export async function updateDivisionAssignment(
  id: string,
  payload: { roleId?: string; isPrimary?: boolean }
): Promise<DivisionAssignment> {
  const { data } = await api.patch(`/org-divisions/assignments/${id}`, payload);
  return data;
}

export async function deleteDivisionAssignment(id: string): Promise<void> {
  await api.delete(`/org-divisions/assignments/${id}`);
}
