import { StateCreator } from 'zustand';

export interface ExpenseCategory {
  id: string;
  name: string;
  description: string;
  allowedRoles: string[];
  maxAmount?: number;
  requiresReceipt: boolean;
}

export interface Expense {
  id: string;
  employeeId: string;
  employeeName: string;
  title: string;
  description: string;
  category: string;
  amount: number;
  currency: string;
  date: Date;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'reimbursed';
  receipts: ExpenseReceipt[];
  approvalFlow: ApprovalStep[];
  submittedAt?: Date;
  approvedAt?: Date;
  reimbursedAt?: Date;
  rejectionReason?: string;
  reimbursementMethod?: 'bank_transfer' | 'check' | 'cash' | 'payroll';
  tags: string[];
}

export interface ExpenseReceipt {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt: Date;
}

export interface ApprovalStep {
  id: string;
  approverId: string;
  approverName: string;
  approverRole: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  date?: Date;
  order: number;
}

export interface ExpenseSlice {
  expenses: Expense[];
  categories: ExpenseCategory[];
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  submitExpense: (id: string) => void;
  approveExpense: (id: string, approverId: string, comments?: string) => void;
  rejectExpense: (id: string, approverId: string, reason: string) => void;
  addReceipt: (expenseId: string, receipt: Omit<ExpenseReceipt, 'id' | 'uploadedAt'>) => void;
  removeReceipt: (expenseId: string, receiptId: string) => void;
  reimburseExpense: (id: string, method: Expense['reimbursementMethod']) => void;
  getExpensesByStatus: (status: Expense['status']) => Expense[];
  getExpensesByEmployee: (employeeId: string) => Expense[];
}

export const expenseSlice: StateCreator<ExpenseSlice> = (set, get) => ({
  expenses: [
  {
    id: '1',
    employeeId: 'emp-001',
    employeeName: 'John Doe',
    title: 'Client Lunch Meeting',
    description: 'Lunch with potential client to discuss project requirements',
    category: 'meals',
    amount: 75.50,
    currency: 'USD',
    date: new Date('2024-01-15'),
    status: 'approved',
    receipts: [
    {
      id: 'r1',
      fileName: 'lunch_receipt.pdf',
      fileUrl: '/uploads/receipts/lunch_receipt.pdf',
      fileSize: 245760,
      uploadedAt: new Date('2024-01-15')
    }],

    approvalFlow: [
    {
      id: 'a1',
      approverId: 'mgr-001',
      approverName: 'Sarah Wilson',
      approverRole: 'Manager',
      status: 'approved',
      comments: 'Valid business expense',
      date: new Date('2024-01-16'),
      order: 1
    }],

    submittedAt: new Date('2024-01-15'),
    approvedAt: new Date('2024-01-16'),
    tags: ['client', 'business development']
  },
  {
    id: '2',
    employeeId: 'emp-002',
    employeeName: 'Jane Smith',
    title: 'Conference Travel',
    description: 'Flight tickets for tech conference in San Francisco',
    category: 'travel',
    amount: 450.00,
    currency: 'USD',
    date: new Date('2024-01-20'),
    status: 'submitted',
    receipts: [
    {
      id: 'r2',
      fileName: 'flight_ticket.pdf',
      fileUrl: '/uploads/receipts/flight_ticket.pdf',
      fileSize: 156432,
      uploadedAt: new Date('2024-01-20')
    }],

    approvalFlow: [
    {
      id: 'a2',
      approverId: 'mgr-001',
      approverName: 'Sarah Wilson',
      approverRole: 'Manager',
      status: 'pending',
      order: 1
    },
    {
      id: 'a3',
      approverId: 'fin-001',
      approverName: 'Finance Team',
      approverRole: 'Finance',
      status: 'pending',
      order: 2
    }],

    submittedAt: new Date('2024-01-20'),
    tags: ['conference', 'professional development']
  }],

  categories: [
  {
    id: 'meals',
    name: 'Meals & Entertainment',
    description: 'Business meals and client entertainment',
    allowedRoles: ['all'],
    maxAmount: 200,
    requiresReceipt: true
  },
  {
    id: 'travel',
    name: 'Travel',
    description: 'Travel expenses including flights, hotels, and transportation',
    allowedRoles: ['all'],
    requiresReceipt: true
  },
  {
    id: 'office',
    name: 'Office Supplies',
    description: 'Office equipment and supplies',
    allowedRoles: ['manager', 'admin'],
    maxAmount: 100,
    requiresReceipt: true
  },
  {
    id: 'training',
    name: 'Training & Development',
    description: 'Professional development and training courses',
    allowedRoles: ['all'],
    requiresReceipt: true
  }],


  addExpense: (expenseData) => {
    const expense: Expense = {
      ...expenseData,
      id: Date.now().toString()
    };

    set((state) => ({
      expenses: [...state.expenses, expense]
    }));
  },

  updateExpense: (id, updates) => {
    set((state) => ({
      expenses: state.expenses.map((expense) =>
      expense.id === id ? { ...expense, ...updates } : expense
      )
    }));
  },

  deleteExpense: (id) => {
    set((state) => ({
      expenses: state.expenses.filter((expense) => expense.id !== id)
    }));
  },

  submitExpense: (id) => {
    const expense = get().expenses.find((e) => e.id === id);
    if (!expense || expense.status !== 'draft') return;

    // Create approval flow based on amount and category
    const approvalFlow: ApprovalStep[] = [
    {
      id: Date.now().toString(),
      approverId: 'mgr-001',
      approverName: 'Manager',
      approverRole: 'Manager',
      status: 'pending',
      order: 1
    }];


    // Add finance approval for amounts over $500
    if (expense.amount > 500) {
      approvalFlow.push({
        id: (Date.now() + 1).toString(),
        approverId: 'fin-001',
        approverName: 'Finance Team',
        approverRole: 'Finance',
        status: 'pending',
        order: 2
      });
    }

    get().updateExpense(id, {
      status: 'submitted',
      submittedAt: new Date(),
      approvalFlow
    });
  },

  approveExpense: (id, approverId, comments) => {
    const expense = get().expenses.find((e) => e.id === id);
    if (!expense) return;

    const updatedApprovalFlow = expense.approvalFlow.map((step) => {
      if (step.approverId === approverId && step.status === 'pending') {
        return {
          ...step,
          status: 'approved' as const,
          comments,
          date: new Date()
        };
      }
      return step;
    });

    // Check if all approvals are complete
    const allApproved = updatedApprovalFlow.every((step) => step.status === 'approved');
    const status = allApproved ? 'approved' : 'submitted';
    const approvedAt = allApproved ? new Date() : undefined;

    get().updateExpense(id, {
      approvalFlow: updatedApprovalFlow,
      status,
      approvedAt
    });
  },

  rejectExpense: (id, approverId, reason) => {
    const expense = get().expenses.find((e) => e.id === id);
    if (!expense) return;

    const updatedApprovalFlow = expense.approvalFlow.map((step) => {
      if (step.approverId === approverId && step.status === 'pending') {
        return {
          ...step,
          status: 'rejected' as const,
          comments: reason,
          date: new Date()
        };
      }
      return step;
    });

    get().updateExpense(id, {
      approvalFlow: updatedApprovalFlow,
      status: 'rejected',
      rejectionReason: reason
    });
  },

  addReceipt: (expenseId, receiptData) => {
    const receipt: ExpenseReceipt = {
      ...receiptData,
      id: Date.now().toString(),
      uploadedAt: new Date()
    };

    const expense = get().expenses.find((e) => e.id === expenseId);
    if (expense) {
      get().updateExpense(expenseId, {
        receipts: [...expense.receipts, receipt]
      });
    }
  },

  removeReceipt: (expenseId, receiptId) => {
    const expense = get().expenses.find((e) => e.id === expenseId);
    if (expense) {
      get().updateExpense(expenseId, {
        receipts: expense.receipts.filter((r) => r.id !== receiptId)
      });
    }
  },

  reimburseExpense: (id, method) => {
    get().updateExpense(id, {
      status: 'reimbursed',
      reimbursedAt: new Date(),
      reimbursementMethod: method
    });
  },

  getExpensesByStatus: (status) => {
    return get().expenses.filter((expense) => expense.status === status);
  },

  getExpensesByEmployee: (employeeId) => {
    return get().expenses.filter((expense) => expense.employeeId === employeeId);
  }
});