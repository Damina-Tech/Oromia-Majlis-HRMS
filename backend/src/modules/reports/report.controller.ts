import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import {
  GenerateReportDto,
  ListReportsQuery,
  ReportData,
  ReportTemplate,
  ListAuditLogsQuery,
  DashboardWidget,
  SaveDashboardConfigDto,
} from "./report.dto.js";
import { paginate } from "../../utils/pagination.js";
// Using native Date methods instead of date-fns
function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return startOfDay(new Date(d.setDate(diff)));
}

function endOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + 6;
  return endOfDay(new Date(d.setDate(diff)));
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function startOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1);
}

function endOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
}

function subDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

const prisma = new PrismaClient();

// Helper functions
function getCurrentUserId(req: Request): string {
  return (req as any).user?.id;
}

function getCurrentUserRoles(req: Request): string[] {
  return (req as any).user?.roles || [];
}

function getDateRangeFilter(
  dateRange?: string,
  startDate?: string,
  endDate?: string
): { start: Date; end: Date } {
  const now = new Date();
  let start: Date;
  let end: Date = endOfDay(now);

  if (dateRange === "CUSTOM" && startDate && endDate) {
    start = startOfDay(new Date(startDate));
    end = endOfDay(new Date(endDate));
  } else {
    switch (dateRange) {
      case "TODAY":
        start = startOfDay(now);
        break;
      case "THIS_WEEK":
        start = startOfWeek(now);
        end = endOfWeek(now);
        break;
      case "THIS_MONTH":
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case "LAST_30_DAYS":
        start = startOfDay(subDays(now, 30));
        break;
      case "LAST_90_DAYS":
        start = startOfDay(subDays(now, 90));
        break;
      case "THIS_YEAR":
        start = startOfYear(now);
        end = endOfYear(now);
        break;
      default:
        start = startOfMonth(now);
        end = endOfMonth(now);
    }
  }

  return { start, end };
}

/**
 * Generate report data based on module and filters
 */
export async function generateReport(req: Request, res: Response) {
  try {
    const userId = getCurrentUserId(req);
    const dto: GenerateReportDto = req.body;
    const { module, filters, reportType } = dto;

    const dateFilter = getDateRangeFilter(
      filters.dateRange,
      filters.startDate,
      filters.endDate
    );

    let reportData: any[] = [];
    let metadata: any = {
      totalRows: 0,
      generatedAt: new Date().toISOString(),
      filters,
      columns: dto.columns,
      aggregations: dto.aggregations,
    };

    // Build base where clause
    const where: any = {};

    if (filters.departmentIds && filters.departmentIds.length > 0) {
      where.departmentId = { in: filters.departmentIds };
    }

    if (filters.employeeIds && filters.employeeIds.length > 0) {
      where.employeeId = { in: filters.employeeIds };
    }

    if (filters.status) {
      where.status = filters.status;
    }

    // Module-specific report generation
    switch (module) {
      case "EMPLOYEES":
        reportData = await generateEmployeeReport(where, dateFilter, filters, reportType);
        break;
      case "DEPARTMENTS":
        reportData = await generateDepartmentReport(where, dateFilter, filters, reportType);
        break;
      case "LEAVES":
        reportData = await generateLeaveReport(where, dateFilter, filters, reportType);
        break;
      case "ATTENDANCE":
        reportData = await generateAttendanceReport(where, dateFilter, filters, reportType);
        break;
      case "PAYROLL":
        reportData = await generatePayrollReport(where, dateFilter, filters, reportType);
        break;
      case "TASKS":
        reportData = await generateTaskReport(where, dateFilter, filters, reportType);
        break;
      case "ASSETS":
        reportData = await generateAssetReport(where, dateFilter, filters, reportType);
        break;
      case "EXPENSES":
        reportData = await generateExpenseReport(where, dateFilter, filters, reportType);
        break;
      case "DOCUMENTS":
        reportData = await generateDocumentReport(where, dateFilter, filters, reportType);
        break;
      case "TIMESHEETS":
        reportData = await generateTimesheetReport(where, dateFilter, filters, reportType);
        break;
      default:
        return res.status(400).json({ message: "Invalid module" });
    }

    metadata.totalRows = reportData.length;

    // Log report generation
    await logReportGeneration({
      userId,
      module,
      reportType,
      filters,
      templateId: dto.templateId,
    });

    res.json({
      data: reportData,
      metadata,
    } as ReportData);
  } catch (error: any) {
    console.error("Generate report error:", error);
    res.status(500).json({ message: error.message || "Failed to generate report" });
  }
}

/**
 * Employee Reports
 */
async function generateEmployeeReport(
  where: any,
  dateFilter: { start: Date; end: Date },
  filters: any,
  reportType: string
): Promise<any[]> {
  const employees = await prisma.employee.findMany({
    where: {
      ...where,
      ...(filters.status && { status: filters.status }),
    },
    include: {
      department: true,
      user: {
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      },
    },
  });

  if (reportType === "SUMMARY") {
    return employees.map((emp) => ({
      id: emp.id,
      employeeId: emp.employeeCode,
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      department: emp.department?.name,
      designation: emp.designation,
      status: emp.status,
      joiningDate: emp.joiningDate,
      employmentType: emp.employmentType,
    }));
  }

  // Detailed report with more fields
  return employees.map((emp) => ({
    ...emp,
    departmentName: emp.department?.name,
    roles: emp.user?.userRoles?.map((ur) => ur.role.name) || [],
  }));
}

/**
 * Department Reports
 */
async function generateDepartmentReport(
  where: any,
  dateFilter: { start: Date; end: Date },
  filters: any,
  reportType: string
): Promise<any[]> {
  const departments = await prisma.department.findMany({
    where,
    include: {
      employees: {
        where: {
          ...(filters.status && { status: filters.status }),
        },
      },
      _count: {
        select: {
          employees: true,
        },
      },
    },
  });

  return departments.map((dept) => ({
    id: dept.id,
    name: dept.name,
    managerId: dept.managerId,
    employeeCount: dept._count.employees,
    activeEmployees: dept.employees.filter((e) => e.status === "ACTIVE").length,
    inactiveEmployees: dept.employees.filter((e) => e.status === "INACTIVE").length,
  }));
}

/**
 * Leave Reports
 */
async function generateLeaveReport(
  where: any,
  dateFilter: { start: Date; end: Date },
  filters: any,
  reportType: string
): Promise<any[]> {
  const leaveWhere: any = {
    ...where,
    startDate: {
      gte: dateFilter.start,
      lte: dateFilter.end,
    },
    ...(filters.leaveType && { leaveType: filters.leaveType }),
    ...(filters.status && { status: filters.status }),
  };

  const leaves = await prisma.leaveRequest.findMany({
    where: leaveWhere,
    include: {
      employee: {
        include: {
          department: true,
        },
      },
    },
  });

  return leaves.map((leave) => ({
    id: leave.id,
    employeeId: leave.employee.employeeCode,
    employeeName: `${leave.employee.firstName} ${leave.employee.lastName}`,
    department: leave.employee.department?.name,
    leaveType: leave.type,
    status: leave.status,
    startDate: leave.startDate,
    endDate: leave.endDate,
    days: leave.days,
    reason: leave.reason,
    appliedAt: leave.createdAt,
  }));
}

/**
 * Attendance Reports
 */
async function generateAttendanceReport(
  where: any,
  dateFilter: { start: Date; end: Date },
  filters: any,
  reportType: string
): Promise<any[]> {
  const attendanceWhere: any = {
    ...where,
    date: {
      gte: dateFilter.start,
      lte: dateFilter.end,
    },
    ...(filters.status && { status: filters.status }),
  };

  const attendance = await prisma.attendance.findMany({
    where: attendanceWhere,
    include: {
      employee: {
        include: {
          department: true,
        },
      },
    },
  });

  return attendance.map((att) => ({
    id: att.id,
    employeeId: att.employee.employeeCode,
    employeeName: `${att.employee.firstName} ${att.employee.lastName}`,
    department: att.employee.department?.name,
    date: att.date,
    status: att.status,
    checkIn: att.checkInTime,
    checkOut: att.checkOutTime,
    hoursWorked: att.workHours,
  }));
}

/**
 * Payroll Reports
 */
async function generatePayrollReport(
  where: any,
  dateFilter: { start: Date; end: Date },
  filters: any,
  reportType: string
): Promise<any[]> {
  const payrollWhere: any = {
    ...where,
    payPeriodStart: {
      gte: dateFilter.start,
      lte: dateFilter.end,
    },
    ...(filters.status && { status: filters.status }),
  };

  const payrolls = await prisma.payroll.findMany({
    where: payrollWhere,
    include: {
      employee: {
        include: {
          department: true,
        },
      },
    },
  });

  return payrolls.map((pay) => ({
    id: pay.id,
    employeeId: pay.employee.employeeCode,
    employeeName: `${pay.employee.firstName} ${pay.employee.lastName}`,
    department: pay.employee.department?.name,
    payPeriodStart: pay.periodStart,
    payPeriodEnd: pay.periodEnd,
    grossSalary: pay.grossSalary,
    totalAllowances: pay.bonus, // Using bonus as allowance proxy
    totalDeductions: pay.totalDeductions,
    netSalary: pay.netSalary,
    status: pay.status,
  }));
}

/**
 * Task Reports
 */
async function generateTaskReport(
  where: any,
  dateFilter: { start: Date; end: Date },
  filters: any,
  reportType: string
): Promise<any[]> {
  const taskWhere: any = {
    ...where,
    createdAt: {
      gte: dateFilter.start,
      lte: dateFilter.end,
    },
    ...(filters.taskStatus && { status: filters.taskStatus }),
    ...(filters.taskPriority && { priority: filters.taskPriority }),
  };

  const tasks = await prisma.task.findMany({
    where: taskWhere,
    include: {
      assignments: {
        include: {
          employee: true,
        },
      },
    },
  });

  return tasks.map((task) => ({
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    project: task.project,
    dueDate: task.dueDate,
    assignedTo: task.assignments.map((a) => a.employee.employeeCode).join(", "),
    createdAt: task.createdAt,
    completedAt: task.completedAt,
  }));
}

/**
 * Asset Reports
 */
async function generateAssetReport(
  where: any,
  dateFilter: { start: Date; end: Date },
  filters: any,
  reportType: string
): Promise<any[]> {
  const assetWhere: any = {
    ...where,
    ...(filters.assetCategory && { categoryId: filters.assetCategory }),
    ...(filters.status && { status: filters.status }),
  };

  const assets = await prisma.asset.findMany({
    where: assetWhere,
    include: {
      category: true,
      assetLocation: true,
      department: true,
    },
  });

  return assets.map((asset) => ({
    id: asset.id,
    assetCode: asset.assetCode,
    serialNumber: asset.serialNumber,
    name: asset.name,
    category: asset.category?.name,
    location: asset.assetLocation?.name,
    department: asset.department?.name,
    status: asset.status,
    purchaseDate: asset.purchaseDate,
    purchasePrice: asset.purchasePrice,
    currentValue: asset.currentValue,
  }));
}

/**
 * Expense Reports
 */
async function generateExpenseReport(
  where: any,
  dateFilter: { start: Date; end: Date },
  filters: any,
  reportType: string
): Promise<any[]> {
  const expenseWhere: any = {
    ...where,
    incurredDate: {
      gte: dateFilter.start,
      lte: dateFilter.end,
    },
    ...(filters.expenseType && { expenseType: filters.expenseType }),
    ...(filters.status && { status: filters.status }),
  };

  const expenses = await prisma.expense.findMany({
    where: expenseWhere,
    include: {
      submittedByEmployee: {
        include: {
          department: true,
        },
      },
      department: true,
    },
  });

  return expenses.map((exp) => ({
    id: exp.id,
    referenceNo: exp.referenceNo,
    title: exp.title,
    amount: exp.amount,
    currency: exp.currency,
    expenseType: exp.expenseType,
    status: exp.status,
    submittedBy: `${exp.submittedByEmployee.firstName} ${exp.submittedByEmployee.lastName}`,
    department: exp.department?.name,
    incurredDate: exp.incurredDate,
    approvedAt: exp.approvedAt,
    paidAt: exp.paidAt,
  }));
}

/**
 * Document Reports
 */
async function generateDocumentReport(
  where: any,
  dateFilter: { start: Date; end: Date },
  filters: any,
  reportType: string
): Promise<any[]> {
  const documentWhere: any = {
    ...where,
    createdAt: {
      gte: dateFilter.start,
      lte: dateFilter.end,
    },
    ...(filters.status && { status: filters.status }),
  };

  const documents = await prisma.generatedDocument.findMany({
    where: documentWhere,
    include: {
      template: true,
      employee: true,
      generatedByUser: true,
    },
  });

  return documents.map((doc) => ({
    id: doc.id,
    templateName: doc.template?.name,
    employeeName: doc.employee
      ? `${doc.employee.firstName} ${doc.employee.lastName}`
      : null,
    generatedBy: doc.generatedByUser
      ? `${doc.generatedByUser.firstName} ${doc.generatedByUser.lastName}`
      : null,
    generatedAt: doc.createdAt,
  }));
}

/**
 * Timesheet Reports
 */
async function generateTimesheetReport(
  where: any,
  dateFilter: { start: Date; end: Date },
  filters: any,
  reportType: string
): Promise<any[]> {
  const timesheetWhere: any = {
    ...where,
    date: {
      gte: dateFilter.start,
      lte: dateFilter.end,
    },
  };

  const timesheets = await prisma.timesheet.findMany({
    where: timesheetWhere,
    include: {
      employee: {
        include: {
          department: true,
        },
      },
    },
  });

  return timesheets.map((ts) => ({
    id: ts.id,
    employeeId: ts.employee.employeeCode,
    employeeName: `${ts.employee.firstName} ${ts.employee.lastName}`,
    department: ts.employee.department?.name,
    date: ts.date,
    totalHours: ts.totalHours,
  }));
}

/**
 * Log report generation for audit
 */
async function logReportGeneration(data: {
  userId: string;
  module: string;
  reportType: string;
  filters: any;
  templateId?: string;
}) {
  // In a real implementation, you'd save this to a ReportAuditLog table
  // For now, we'll just log it
  console.log("Report generated:", {
    userId: data.userId,
    module: data.module,
    reportType: data.reportType,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Get report templates
 */
export async function getReportTemplates(req: Request, res: Response) {
  try {
    // Pre-built system templates
    const templates: ReportTemplate[] = [
      {
        id: "emp-summary",
        name: "Employee Summary",
        description: "Overview of all employees",
        module: "EMPLOYEES",
        reportType: "SUMMARY",
        isSystem: true,
        createdBy: "system",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "leave-balance",
        name: "Leave Balance Summary",
        description: "Leave balances by employee and department",
        module: "LEAVES",
        reportType: "SUMMARY",
        isSystem: true,
        createdBy: "system",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "attendance-daily",
        name: "Daily Attendance",
        description: "Daily attendance summary",
        module: "ATTENDANCE",
        reportType: "SUMMARY",
        isSystem: true,
        createdBy: "system",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "payroll-monthly",
        name: "Monthly Payroll Summary",
        description: "Monthly payroll expenses",
        module: "PAYROLL",
        reportType: "SUMMARY",
        isSystem: true,
        createdBy: "system",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "expense-trend",
        name: "Expense Trend",
        description: "Expense trends over time",
        module: "EXPENSES",
        reportType: "TREND",
        isSystem: true,
        createdBy: "system",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    res.json({ items: templates, total: templates.length });
  } catch (error: any) {
    console.error("Get templates error:", error);
    res.status(500).json({ message: error.message || "Failed to get templates" });
  }
}

/**
 * Get dashboard widgets/KPIs
 */
export async function getDashboardWidgets(req: Request, res: Response) {
  try {
    const userId = getCurrentUserId(req);
    const { module } = req.query;

    // Generate KPIs for the requested module or all modules
    const widgets: DashboardWidget[] = [];

    if (!module || module === "EMPLOYEES") {
      try {
        const totalEmployees = await prisma.employee.count({
          where: { status: "ACTIVE" },
        });
        widgets.push({
          id: "emp-total",
          type: "KPI",
          title: "Total Employees",
          module: "EMPLOYEES",
          config: { value: totalEmployees, format: "number" },
        });
      } catch (err: any) {
        console.warn("Failed to load employee widget:", err.message);
      }
    }

    if (!module || module === "LEAVES") {
      try {
        const pendingLeaves = await prisma.leaveRequest.count({
          where: { status: "PENDING" },
        });
        widgets.push({
          id: "leave-pending",
          type: "KPI",
          title: "Pending Leave Requests",
          module: "LEAVES",
          config: { value: pendingLeaves, format: "number" },
        });
      } catch (err: any) {
        console.warn("Failed to load leave widget:", err.message);
      }
    }

    if (!module || module === "ATTENDANCE") {
      try {
        const today = new Date();
        const todayAttendance = await prisma.attendance.count({
          where: {
            date: {
              gte: startOfDay(today),
              lte: endOfDay(today),
            },
            status: "PRESENT",
          },
        });
        widgets.push({
          id: "att-today",
          type: "KPI",
          title: "Today's Attendance",
          module: "ATTENDANCE",
          config: { value: todayAttendance, format: "number" },
        });
      } catch (err: any) {
        console.warn("Failed to load attendance widget:", err.message);
      }
    }

    if (!module || module === "EXPENSES") {
      try {
        const pendingExpenses = await prisma.expense.count({
          where: { status: "SUBMITTED" },
        });
        widgets.push({
          id: "exp-pending",
          type: "KPI",
          title: "Pending Expenses",
          module: "EXPENSES",
          config: { value: pendingExpenses, format: "number" },
        });
      } catch (err: any) {
        console.warn("Failed to load expense widget:", err.message);
      }
    }

    res.json({ widgets });
  } catch (error: any) {
    console.error("Get dashboard widgets error:", error);
    res.status(500).json({ message: error.message || "Failed to get widgets" });
  }
}

/**
 * Get report audit logs
 */
export async function getReportAuditLogs(req: Request, res: Response) {
  try {
    const query: ListAuditLogsQuery = {
      page: Number(req.query.page) || 1,
      pageSize: Number(req.query.pageSize) || 20,
      module: req.query.module as any,
      generatedBy: req.query.generatedBy as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    };

    // In a real implementation, fetch from ReportAuditLog table
    // For now, return empty with pagination structure
    res.json({
      items: [],
      total: 0,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: 0,
    });
  } catch (error: any) {
    console.error("Get audit logs error:", error);
    res.status(500).json({ message: error.message || "Failed to get audit logs" });
  }
}

