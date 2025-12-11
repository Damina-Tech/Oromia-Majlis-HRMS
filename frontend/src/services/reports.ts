import api from "./api";

export interface ReportFilter {
  dateRange?: "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "LAST_30_DAYS" | "LAST_90_DAYS" | "THIS_YEAR" | "CUSTOM";
  startDate?: string;
  endDate?: string;
  departmentIds?: string[];
  employeeIds?: string[];
  roleIds?: string[];
  status?: string;
  tags?: string[];
  leaveType?: string;
  expenseType?: string;
  assetCategory?: string;
  taskStatus?: string;
  taskPriority?: string;
}

export interface GenerateReportDto {
  templateId?: string;
  module: "EMPLOYEES" | "DEPARTMENTS" | "LEAVES" | "ATTENDANCE" | "PAYROLL" | "TASKS" | "ASSETS" | "EXPENSES" | "DOCUMENTS" | "TIMESHEETS";
  reportType: "SUMMARY" | "DETAILED" | "COMPARATIVE" | "TREND" | "DISTRIBUTION";
  filters: ReportFilter;
  columns?: string[];
  groupBy?: string[];
  aggregations?: Record<string, string>;
  visualization?: "TABLE" | "LINE_CHART" | "BAR_CHART" | "PIE_CHART" | "HEATMAP";
  saveAsTemplate?: boolean;
  templateName?: string;
}

export interface ReportData {
  data: any[];
  metadata: {
    totalRows: number;
    generatedAt: string;
    filters?: ReportFilter;
    columns?: string[];
    aggregations?: Record<string, any>;
  };
}

export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  module: string;
  reportType: string;
  defaultFilters?: ReportFilter;
  defaultColumns?: string[];
  defaultGroupBy?: string[];
  defaultVisualization?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isSystem: boolean;
}

export interface DashboardWidget {
  id: string;
  type: "KPI" | "CHART" | "TABLE";
  title: string;
  module: string;
  config: Record<string, any>;
  position?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

/**
 * Generate a report
 */
export async function generateReport(dto: GenerateReportDto): Promise<ReportData> {
  const response = await api.post<ReportData>("/reports/generate", dto);
  return response.data;
}

/**
 * Get report templates
 */
export async function getReportTemplates(): Promise<{ items: ReportTemplate[]; total: number }> {
  const response = await api.get<{ items: ReportTemplate[]; total: number }>("/reports/templates");
  return response.data;
}

/**
 * Get dashboard widgets/KPIs
 */
export async function getDashboardWidgets(module?: string): Promise<{ widgets: DashboardWidget[] }> {
  const params = module ? { module } : {};
  const response = await api.get<{ widgets: DashboardWidget[] }>("/reports/dashboard/widgets", { params });
  return response.data;
}

/**
 * Get report audit logs
 */
export async function getReportAuditLogs(params?: {
  module?: string;
  generatedBy?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}): Promise<{
  items: any[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const response = await api.get("/reports/audit-logs", { params });
  return response.data;
}

/**
 * Export report to Excel/PDF/CSV
 */
export async function exportReport(
  reportData: ReportData,
  format: "EXCEL" | "PDF" | "CSV",
  filename?: string
): Promise<void> {
  // In a real implementation, this would call a backend endpoint
  // For now, we'll handle it client-side for CSV
  if (format === "CSV") {
    const csv = convertToCSV(reportData.data);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || `report-${new Date().toISOString()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}

/**
 * Convert data array to CSV string
 */
function convertToCSV(data: any[]): string {
  if (data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(",")];

  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header];
      if (value === null || value === undefined) return "";
      if (typeof value === "object") return JSON.stringify(value);
      return String(value).replace(/"/g, '""');
    });
    csvRows.push(values.map((v) => `"${v}"`).join(","));
  }

  return csvRows.join("\n");
}

/**
 * Get module label
 */
export function getModuleLabel(module: string): string {
  const labels: Record<string, string> = {
    EMPLOYEES: "Employees",
    DEPARTMENTS: "Departments",
    LEAVES: "Leaves",
    ATTENDANCE: "Attendance",
    PAYROLL: "Payroll",
    TASKS: "Tasks",
    ASSETS: "Assets",
    EXPENSES: "Expenses",
    DOCUMENTS: "Documents",
    TIMESHEETS: "Timesheets",
  };
  return labels[module] || module;
}

/**
 * Get report type label
 */
export function getReportTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    SUMMARY: "Summary",
    DETAILED: "Detailed",
    COMPARATIVE: "Comparative",
    TREND: "Trend",
    DISTRIBUTION: "Distribution",
  };
  return labels[type] || type;
}

