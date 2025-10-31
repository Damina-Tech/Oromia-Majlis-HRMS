import api from "./api";
import { Employee } from "./employees";

export type LeaveType = "CASUAL" | "SICK" | "VACATION" | "MATERNITY" | "PERSONAL";

export type LeaveBalance = {
  id: string;
  employeeId: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    designation?: string | null;
    employeeCode: string;
  };
  leaveType: LeaveType;
  year: number;
  allocatedDays: number;
  usedDays: number;
  carriedOver: number;
  availableDays: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateLeaveBalancePayload = {
  employeeId: string;
  leaveType: LeaveType;
  year: number;
  allocatedDays: number;
  carriedOver?: number;
};

export type UpdateLeaveBalancePayload = {
  allocatedDays?: number;
  usedDays?: number;
  carriedOver?: number;
};

export type CarryOverPayload = {
  employeeId: string;
  leaveType: LeaveType;
  fromYear: number;
  toYear: number;
  daysToCarryOver: number;
};

export async function listLeaveBalances(params?: {
  employeeId?: string;
  year?: number;
  leaveType?: LeaveType;
  page?: number;
  pageSize?: number;
  search?: string;
}) {
  const { data } = await api.get("/leave-balances", { params });
  return data as {
    items: LeaveBalance[];
    total: number;
    page: number;
    pageSize: number;
  };
}

export async function getLeaveBalance(id: string) {
  const { data } = await api.get(`/leave-balances/${id}`);
  return data as LeaveBalance;
}

export async function createLeaveBalance(payload: CreateLeaveBalancePayload) {
  const { data } = await api.post("/leave-balances", payload);
  return data as LeaveBalance;
}

export async function updateLeaveBalance(
  id: string,
  payload: UpdateLeaveBalancePayload
) {
  const { data } = await api.put(`/leave-balances/${id}`, payload);
  return data as LeaveBalance;
}

export async function deleteLeaveBalance(id: string) {
  await api.delete(`/leave-balances/${id}`);
}

export async function carryOverLeave(payload: CarryOverPayload) {
  const { data } = await api.post("/leave-balances/carry-over", payload);
  return data;
}

