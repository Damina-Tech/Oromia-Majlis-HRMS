import api from "./api";

export interface DashboardStats {
  totalEmployees?: {
    total: number;
    active: number;
    inactive: number;
  };
  todayAttendance?: {
    present: number;
    absent: number;
    late: number;
    total: number;
  };
  myAttendance?: any;
  pendingLeaves?: number;
  myPendingLeaves?: number;
  monthlyPayroll?: {
    amount: number;
    currency: string;
    delta: string;
    trend: "up" | "down";
  };
  overdueTasks?: number;
  totalAssets?: number;
  recentActivity?: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: string;
    status: string;
    module: string;
  }>;
  charts?: {
    employeesByDepartment?: Array<{ name: string; value: number }>;
    payrollTrend?: Array<{ month: string; amount: number }>;
    expensesByType?: Array<{ name: string; value: number }>;
    assetsByStatus?: Array<{ name: string; value: number }>;
  };
  widgets?: {
    overdueTasks?: Array<{
      id: string;
      title: string;
      dueDate: string;
      priority: string;
      status: string;
      assignee: string;
    }>;
    pendingExpenses?: Array<{
      id: string;
      title: string;
      amount: number;
      currency: string;
      submittedBy: string;
      department?: string;
      submittedAt: string;
    }>;
    assetsNeedingMaintenance?: Array<{
      id: string;
      name: string;
      assetTag: string;
      nextMaintenanceDate: string;
      department?: string;
    }>;
  };
}

export interface DashboardResponse {
  stats: DashboardStats;
  generatedAt: string;
}

/**
 * Get dashboard stats
 */
export async function getDashboardStats(): Promise<DashboardResponse> {
  const response = await api.get<DashboardResponse>("/dashboard/stats");
  return response.data;
}

