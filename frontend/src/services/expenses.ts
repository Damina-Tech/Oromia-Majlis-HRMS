import api from "./api";

// Types
export interface Expense {
  id: string;
  referenceNo: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  expenseType: "OPERATIONAL" | "TRAVEL" | "REIMBURSEMENT" | "MAINTENANCE" | "RENT" | "UTILITIES" | "OTHER";
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "PAID";
  incurredDate: string;
  submittedBy: string;
  submittedByEmployee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
  };
  departmentId: string;
  department?: {
    id: string;
    name: string;
  };
  assetId?: string;
  asset?: {
    id: string;
    name: string;
    assetCode: string;
  };
  vendorId?: string;
  vendor?: {
    id: string;
    name: string;
  };
  paymentMethod?: "CASH" | "BANK_TRANSFER" | "E_BIRR" | "TELEBIRR" | "OTHER";
  receiptUrl?: string;
  approvedBy?: string;
  approvedByEmployee?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  approvedAt?: string;
  paidBy?: string;
  paidByEmployee?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  approvals?: ExpenseApproval[];
  payments?: ExpensePayment[];
}

export interface ExpenseApproval {
  id: string;
  expenseId: string;
  approverId: string;
  approver: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
  };
  action: "SUBMITTED" | "APPROVED" | "REJECTED";
  comment?: string;
  createdAt: string;
}

export interface ExpensePayment {
  id: string;
  expenseId: string;
  paidAmount: number;
  paymentMethod: "CASH" | "BANK_TRANSFER" | "E_BIRR" | "TELEBIRR" | "OTHER";
  paymentReference?: string;
  paidBy: string;
  paidByEmployee: {
    id: string;
    firstName: string;
    lastName: string;
  };
  paidAt: string;
  notes?: string;
}

export interface CreateExpenseData {
  title: string;
  description?: string;
  amount: number;
  currency?: string;
  expenseType: Expense["expenseType"];
  incurredDate: string;
  departmentId: string;
  assetId?: string;
  vendorId?: string;
  paymentMethod?: Expense["paymentMethod"];
  submit?: boolean;
}

export interface UpdateExpenseData {
  title?: string;
  description?: string;
  amount?: number;
  currency?: string;
  expenseType?: Expense["expenseType"];
  incurredDate?: string;
  departmentId?: string;
  assetId?: string | null;
  vendorId?: string | null;
  paymentMethod?: Expense["paymentMethod"] | null;
}

export interface ListExpensesParams {
  page?: number;
  pageSize?: number;
  status?: Expense["status"];
  expenseType?: Expense["expenseType"];
  departmentId?: string;
  submittedBy?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

// API Functions
export async function createExpense(data: CreateExpenseData): Promise<Expense> {
  const response = await api.post("/expenses", data);
  return response.data;
}

export async function listExpenses(params?: ListExpensesParams): Promise<{
  items: Expense[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const response = await api.get("/expenses", { params });
  return response.data;
}

export async function getExpense(id: string): Promise<Expense> {
  const response = await api.get(`/expenses/${id}`);
  return response.data;
}

export async function updateExpense(id: string, data: UpdateExpenseData): Promise<Expense> {
  const response = await api.put(`/expenses/${id}`, data);
  return response.data;
}

export async function submitExpense(id: string, comment?: string): Promise<Expense> {
  const response = await api.post(`/expenses/${id}/submit`, { comment });
  return response.data;
}

export async function approveExpense(id: string, comment?: string): Promise<Expense> {
  const response = await api.post(`/expenses/${id}/approve`, { comment });
  return response.data;
}

export async function rejectExpense(id: string, comment: string): Promise<Expense> {
  const response = await api.post(`/expenses/${id}/reject`, { comment });
  return response.data;
}

export async function payExpense(
  id: string,
  paymentMethod: Expense["paymentMethod"],
  paymentReference?: string,
  notes?: string
): Promise<Expense> {
  const response = await api.post(`/expenses/${id}/pay`, {
    paymentMethod,
    paymentReference,
    notes,
  });
  return response.data;
}

export async function uploadReceipt(id: string, file: File): Promise<Expense> {
  const formData = new FormData();
  formData.append("receipt", file);
  const response = await api.post(`/expenses/${id}/receipt`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

// Helper functions
export function getExpenseTypeLabel(type: Expense["expenseType"]): string {
  const labels: Record<Expense["expenseType"], string> = {
    OPERATIONAL: "Operational",
    TRAVEL: "Travel",
    REIMBURSEMENT: "Reimbursement",
    MAINTENANCE: "Maintenance",
    RENT: "Rent",
    UTILITIES: "Utilities",
    OTHER: "Other",
  };
  return labels[type] || type;
}

export function getStatusLabel(status: Expense["status"]): string {
  const labels: Record<Expense["status"], string> = {
    DRAFT: "Draft",
    SUBMITTED: "Submitted",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    PAID: "Paid",
  };
  return labels[status] || status;
}

export function getStatusColor(status: Expense["status"]): string {
  const colors: Record<Expense["status"], string> = {
    DRAFT: "bg-gray-100 text-gray-800",
    SUBMITTED: "bg-blue-100 text-blue-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    PAID: "bg-purple-100 text-purple-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

export function getPaymentMethodLabel(method: Expense["paymentMethod"]): string {
  const labels: Record<NonNullable<Expense["paymentMethod"]>, string> = {
    CASH: "Cash",
    BANK_TRANSFER: "Bank Transfer",
    E_BIRR: "e-Birr",
    TELEBIRR: "Telebirr",
    OTHER: "Other",
  };
  return labels[method] || method || "—";
}

