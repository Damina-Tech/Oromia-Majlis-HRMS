import api from "./api";

export type LeaveType = "CASUAL" | "SICK" | "VACATION" | "MATERNITY" | "PERSONAL";
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export type LeaveRequest = {
  id: string;
  employeeId: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    designation?: string | null;
  };
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  approverId?: string | null;
  approver?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LeaveBalance = {
  id: string;
  employeeId: string;
  casualLeave: number;
  sickLeave: number;
  vacationLeave: number;
  personalLeave: number;
  createdAt: string;
  updatedAt: string;
};

export async function listLeaveRequests(params: {
  status?: LeaveStatus;
  employeeId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  type?: LeaveType;
  sortBy?: "createdAt" | "startDate" | "endDate" | "days" | "status";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}) {
  const { data } = await api.get("/leaves", { params });
  return data as { items: LeaveRequest[]; total: number; page: number; pageSize: number };
}

export async function getLeaveRequest(id: string) {
  const { data } = await api.get(`/leaves/${id}`);
  return data as LeaveRequest;
}

export async function createLeaveRequest(payload: {
  employeeId?: string; // Optional: for creating on behalf of others
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  halfDay?: boolean;
}) {
  const { data } = await api.post("/leaves", payload);
  return data as LeaveRequest;
}

export async function updateLeaveStatus(
  id: string,
  payload: {
    status: "APPROVED" | "REJECTED";
    rejectionReason?: string;
    comment?: string;
  }
) {
  const { data } = await api.put(`/leaves/${id}/status`, payload);
  return data as LeaveRequest;
}

export async function getLeaveBalance(employeeId: string) {
  const { data } = await api.get(`/leaves/balance/${employeeId}`);
  return data as LeaveBalance;
}

export async function updateLeaveRequest(
  id: string,
  payload: {
    type?: LeaveType;
    startDate?: string;
    endDate?: string;
    reason?: string;
    halfDay?: boolean;
  }
) {
  const { data } = await api.put(`/leaves/${id}`, payload);
  return data as LeaveRequest;
}

export async function cancelLeaveRequest(id: string) {
  await api.delete(`/leaves/${id}`);
}

