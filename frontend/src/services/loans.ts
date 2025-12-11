import api from "./api";

export type LoanStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";

export interface Loan {
  id: string;
  employeeId: string;
  employee: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
  };
  loanAmount: number;
  interestRate: number;
  totalAmount: number;
  remainingAmount: number;
  monthlyPayment: number;
  startDate: string;
  endDate?: string | null;
  status: LoanStatus;
  description?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  repaymentHistory?: LoanRepayment[];
  createdAt: string;
  updatedAt: string;
}

export interface LoanRepayment {
  id: string;
  loanId: string;
  payrollRunId?: string | null;
  amount: number;
  paymentDate: string;
  notes?: string | null;
  createdAt: string;
}

export interface CreateLoanData {
  employeeId: string;
  loanAmount: number;
  interestRate?: number;
  monthlyPayment: number;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  description?: string;
}

export interface UpdateLoanData {
  interestRate?: number;
  monthlyPayment?: number;
  status?: LoanStatus;
  description?: string;
}

export interface AddLoanRepaymentData {
  amount: number;
  paymentDate: string; // YYYY-MM-DD
  payrollRunId?: string;
  notes?: string;
}

export interface ListLoansParams {
  employeeId?: string;
  status?: LoanStatus;
  page?: number;
  pageSize?: number;
}

export async function listLoans(params?: ListLoansParams) {
  const response = await api.get<{
    items: Loan[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>("/payroll/loans", { params });
  return response.data;
}

export async function getLoan(id: string) {
  const response = await api.get<Loan>(`/payroll/loans/${id}`);
  return response.data;
}

export async function createLoan(data: CreateLoanData) {
  const response = await api.post<Loan>("/payroll/loans", data);
  return response.data;
}

export async function updateLoan(id: string, data: UpdateLoanData) {
  const response = await api.put<Loan>(`/payroll/loans/${id}`, data);
  return response.data;
}

export async function approveLoan(id: string, approvedBy: string) {
  const response = await api.post<Loan>(`/payroll/loans/${id}/approve`, { approvedBy });
  return response.data;
}

export async function addLoanRepayment(id: string, data: AddLoanRepaymentData) {
  const response = await api.post<{ repayment: LoanRepayment; loan: Loan }>(
    `/payroll/loans/${id}/repayment`,
    data
  );
  return response.data;
}

export async function deleteLoan(id: string) {
  await api.delete(`/payroll/loans/${id}`);
}

