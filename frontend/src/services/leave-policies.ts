import api from "./api";

export type LeavePolicy = {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  defaultAllocatedDays: number;
  maxCarryOverDays: number;
  carryOverEnabled: boolean;
  requiresApproval: boolean;
  requiresDocumentation: boolean;
  isActive: boolean;
  renewalMonth: number;
  renewalDay: number;
  color?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateLeavePolicyPayload = {
  name: string;
  code: string;
  description?: string;
  defaultAllocatedDays: number;
  maxCarryOverDays?: number;
  carryOverEnabled?: boolean;
  requiresApproval?: boolean;
  requiresDocumentation?: boolean;
  isActive?: boolean;
  renewalMonth?: number;
  renewalDay?: number;
  color?: string;
};

export type UpdateLeavePolicyPayload = Partial<CreateLeavePolicyPayload>;

export type RenewLeaveBalancesPayload = {
  year: number;
  leaveTypeCode?: string;
  employeeIds?: string[];
};

export async function listLeavePolicies(params?: { isActive?: boolean }) {
  const { data } = await api.get("/leave-policies", { params });
  return data as {
    items: LeavePolicy[];
    total: number;
  };
}

export async function getLeavePolicy(id: string) {
  const { data } = await api.get(`/leave-policies/${id}`);
  return data as LeavePolicy;
}

export async function createLeavePolicy(payload: CreateLeavePolicyPayload) {
  const { data } = await api.post("/leave-policies", payload);
  return data as LeavePolicy;
}

export async function updateLeavePolicy(id: string, payload: UpdateLeavePolicyPayload) {
  const { data } = await api.put(`/leave-policies/${id}`, payload);
  return data as LeavePolicy;
}

export async function deleteLeavePolicy(id: string) {
  await api.delete(`/leave-policies/${id}`);
}

export async function renewLeaveBalances(payload: RenewLeaveBalancesPayload) {
  const { data } = await api.post("/leave-policies/renew", payload);
  return data as {
    success: boolean;
    message: string;
    totalRenewed: number;
    totalCarriedOver: number;
    errors?: string[];
  };
}

