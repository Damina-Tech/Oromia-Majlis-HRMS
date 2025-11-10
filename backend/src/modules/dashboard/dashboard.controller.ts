import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper functions
function getCurrentUserId(req: Request): string {
  return (req as any).user?.id;
}

function getCurrentUserRoles(req: Request): string[] {
  return (req as any).user?.roles || [];
}

function getCurrentUserEmployeeId(req: Request): string | null {
  return (req as any).user?.employeeId || null;
}

// Date helpers
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

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function subMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() - months);
  return d;
}

/**
 * Get dashboard stats and KPIs
 */
export async function getDashboardStats(req: Request, res: Response) {
  try {
    const userId = getCurrentUserId(req);
    const roles = getCurrentUserRoles(req);
    const employeeId = getCurrentUserEmployeeId(req);
    const isAdmin = roles.some((r) => r.toUpperCase() === "ADMIN");
    const isHR = roles.some((r) => r.toUpperCase() === "HR");
    const isManager = roles.some((r) => r.toUpperCase() === "MANAGER");
    const isEmployee = roles.some((r) => r.toUpperCase() === "EMPLOYEE");

    const today = new Date();
    const thisMonthStart = startOfMonth(today);
    const thisMonthEnd = endOfMonth(today);
    const lastMonthStart = startOfMonth(subMonths(today, 1));
    const lastMonthEnd = endOfMonth(subMonths(today, 1));

    const stats: any = {};

    // Total Employees (only for Admin/HR/Manager)
    if (isAdmin || isHR || isManager) {
      try {
        const [totalEmployees, activeEmployees, inactiveEmployees] = await Promise.all([
          prisma.employee.count(),
          prisma.employee.count({ where: { status: "ACTIVE" } }),
          prisma.employee.count({ where: { status: "INACTIVE" } }),
        ]);

        stats.totalEmployees = {
          total: totalEmployees,
          active: activeEmployees,
          inactive: inactiveEmployees,
        };
      } catch (err: any) {
        console.warn("Failed to load employee stats:", err.message);
      }
    }

    // Today's Attendance (for Admin/HR/Manager or own for Employee)
    try {
      const todayStart = startOfDay(today);
      const todayEnd = endOfDay(today);

      if (isAdmin || isHR || isManager) {
        const [presentToday, absentToday, lateToday] = await Promise.all([
          prisma.attendance.count({
            where: {
              date: { gte: todayStart, lte: todayEnd },
              status: "PRESENT",
            },
          }),
          prisma.attendance.count({
            where: {
              date: { gte: todayStart, lte: todayEnd },
              status: "ABSENT",
            },
          }),
          prisma.attendance.count({
            where: {
              date: { gte: todayStart, lte: todayEnd },
              status: "LATE",
            },
          }),
        ]);

        stats.todayAttendance = {
          present: presentToday,
          absent: absentToday,
          late: lateToday,
          total: presentToday + absentToday + lateToday,
        };
      } else if (isEmployee && employeeId) {
        const myAttendance = await prisma.attendance.findFirst({
          where: {
            employeeId,
            date: { gte: todayStart, lte: todayEnd },
          },
        });
        stats.myAttendance = myAttendance;
      }
    } catch (err: any) {
      console.warn("Failed to load attendance stats:", err.message);
    }

    // Pending Leave Requests (for Admin/HR/Manager)
    if (isAdmin || isHR || isManager) {
      try {
        const pendingLeaves = await prisma.leave.count({
          where: { status: "PENDING" },
        });
        stats.pendingLeaves = pendingLeaves;
      } catch (err: any) {
        console.warn("Failed to load leave stats:", err.message);
      }
    } else if (isEmployee && employeeId) {
      try {
        const myPendingLeaves = await prisma.leave.count({
          where: {
            employeeId,
            status: "PENDING",
          },
        });
        stats.myPendingLeaves = myPendingLeaves;
      } catch (err: any) {
        console.warn("Failed to load my leave stats:", err.message);
      }
    }

    // Monthly Payroll (only for Admin/HR/Finance)
    if (isAdmin || isHR) {
      try {
        const [thisMonthPayroll, lastMonthPayroll] = await Promise.all([
          prisma.payroll.aggregate({
            where: {
              payPeriodStart: { gte: thisMonthStart, lte: thisMonthEnd },
            },
            _sum: {
              netSalary: true,
            },
          }),
          prisma.payroll.aggregate({
            where: {
              payPeriodStart: { gte: lastMonthStart, lte: lastMonthEnd },
            },
            _sum: {
              netSalary: true,
            },
          }),
        ]);

        const thisMonthTotal = Number(thisMonthPayroll._sum.netSalary || 0);
        const lastMonthTotal = Number(lastMonthPayroll._sum.netSalary || 0);
        const delta = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

        stats.monthlyPayroll = {
          amount: thisMonthTotal,
          currency: "ETB",
          delta: delta.toFixed(2),
          trend: delta >= 0 ? "up" : "down",
        };
      } catch (err: any) {
        console.warn("Failed to load payroll stats:", err.message);
      }
    }

    // Open Tasks (overdue)
    try {
      const overdueTasks = await prisma.task.count({
        where: {
          status: { not: "COMPLETED" },
          dueDate: { lt: today },
        },
      });
      stats.overdueTasks = overdueTasks;
    } catch (err: any) {
      console.warn("Failed to load task stats:", err.message);
    }

    // Total Assets (for Admin/HR/Manager)
    if (isAdmin || isHR || isManager) {
      try {
        const totalAssets = await prisma.asset.count();
        stats.totalAssets = totalAssets;
      } catch (err: any) {
        console.warn("Failed to load asset stats:", err.message);
      }
    }

    // Recent Activity (last 24 hours)
    const recentActivity: any[] = [];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    try {
      // Recent leaves
      if (isAdmin || isHR || isManager) {
        const recentLeaves = await prisma.leave.findMany({
          where: {
            createdAt: { gte: yesterday },
          },
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            employee: {
              select: {
                firstName: true,
                lastName: true,
                employeeCode: true,
              },
            },
          },
        });

        recentLeaves.forEach((leave) => {
          recentActivity.push({
            id: `leave-${leave.id}`,
            type: "leave",
            title: `${leave.employee.firstName} ${leave.employee.lastName} applied for ${leave.leaveType} leave`,
            description: `${leave.days} days from ${new Date(leave.startDate).toLocaleDateString()}`,
            timestamp: leave.createdAt,
            status: leave.status,
            module: "LEAVES",
          });
        });
      }

      // Recent expenses
      if (isAdmin || isHR || isManager) {
        const recentExpenses = await prisma.expense.findMany({
          where: {
            createdAt: { gte: yesterday },
          },
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            submittedByEmployee: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        });

        recentExpenses.forEach((exp) => {
          recentActivity.push({
            id: `expense-${exp.id}`,
            type: "expense",
            title: `${exp.submittedByEmployee.firstName} ${exp.submittedByEmployee.lastName} submitted ${exp.expenseType} expense`,
            description: `${exp.currency} ${Number(exp.amount).toLocaleString()}`,
            timestamp: exp.createdAt,
            status: exp.status,
            module: "EXPENSES",
          });
        });
      }

      // Recent tasks
      const recentTasks = await prisma.task.findMany({
        where: {
          createdAt: { gte: yesterday },
        },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          assignments: {
            take: 1,
            include: {
              employee: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      recentTasks.forEach((task) => {
        const assignee = task.assignments[0]?.employee;
        recentActivity.push({
          id: `task-${task.id}`,
          type: "task",
          title: assignee
            ? `Task "${task.title}" assigned to ${assignee.firstName} ${assignee.lastName}`
            : `New task created: "${task.title}"`,
          description: `Priority: ${task.priority}, Status: ${task.status}`,
          timestamp: task.createdAt,
          status: task.status,
          module: "TASKS",
        });
      });
    } catch (err: any) {
      console.warn("Failed to load recent activity:", err.message);
    }

    // Sort activity by timestamp
    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    stats.recentActivity = recentActivity.slice(0, 20);

    // Charts data
    const charts: any = {};

    // Employees by Department
    if (isAdmin || isHR || isManager) {
      try {
        const departments = await prisma.department.findMany({
          include: {
            _count: {
              select: {
                employees: true,
              },
            },
          },
        });

        charts.employeesByDepartment = departments.map((dept) => ({
          name: dept.name,
          value: dept._count.employees,
        }));
      } catch (err: any) {
        console.warn("Failed to load employees by department:", err.message);
      }
    }

    // Monthly Payroll Trend (last 6 months)
    if (isAdmin || isHR) {
      try {
        const payrollTrend = [];
        for (let i = 5; i >= 0; i--) {
          const monthStart = startOfMonth(subMonths(today, i));
          const monthEnd = endOfMonth(subMonths(today, i));
          const monthName = monthStart.toLocaleDateString("en-US", { month: "short" });

          const payroll = await prisma.payroll.aggregate({
            where: {
              payPeriodStart: { gte: monthStart, lte: monthEnd },
            },
            _sum: {
              netSalary: true,
            },
          });

          payrollTrend.push({
            month: monthName,
            amount: Number(payroll._sum.netSalary || 0),
          });
        }
        charts.payrollTrend = payrollTrend;
      } catch (err: any) {
        console.warn("Failed to load payroll trend:", err.message);
      }
    }

    // Expenses by Type
    if (isAdmin || isHR || isManager) {
      try {
        const expensesByType = await prisma.expense.groupBy({
          by: ["expenseType"],
          where: {
            createdAt: { gte: subMonths(today, 1) },
          },
          _sum: {
            amount: true,
          },
        });

        charts.expensesByType = expensesByType.map((exp) => ({
          name: exp.expenseType,
          value: Number(exp._sum.amount || 0),
        }));
      } catch (err: any) {
        console.warn("Failed to load expenses by type:", err.message);
      }
    }

    // Assets Status Overview
    if (isAdmin || isHR || isManager) {
      try {
        const assetsByStatus = await prisma.asset.groupBy({
          by: ["status"],
          _count: {
            id: true,
          },
        });

        charts.assetsByStatus = assetsByStatus.map((asset) => ({
          name: asset.status,
          value: asset._count.id,
        }));
      } catch (err: any) {
        console.warn("Failed to load assets by status:", err.message);
      }
    }

    stats.charts = charts;

    // Table widgets data
    const widgets: any = {};

    // Recent Tasks (overdue)
    try {
      const overdueTasksList = await prisma.task.findMany({
        where: {
          status: { not: "COMPLETED" },
          dueDate: { lt: today },
        },
        take: 10,
        orderBy: { dueDate: "asc" },
        include: {
          assignments: {
            take: 1,
            include: {
              employee: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      widgets.overdueTasks = overdueTasksList.map((task) => ({
        id: task.id,
        title: task.title,
        dueDate: task.dueDate,
        priority: task.priority,
        status: task.status,
        assignee: task.assignments[0]?.employee
          ? `${task.assignments[0].employee.firstName} ${task.assignments[0].employee.lastName}`
          : "Unassigned",
      }));
    } catch (err: any) {
      console.warn("Failed to load overdue tasks:", err.message);
    }

    // Recent Expense Approvals (pending)
    if (isAdmin || isHR || isManager) {
      try {
        const pendingExpenses = await prisma.expense.findMany({
          where: {
            status: "SUBMITTED",
          },
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            submittedByEmployee: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            department: {
              select: {
                name: true,
              },
            },
          },
        });

        widgets.pendingExpenses = pendingExpenses.map((exp) => ({
          id: exp.id,
          title: exp.title,
          amount: Number(exp.amount),
          currency: exp.currency,
          submittedBy: `${exp.submittedByEmployee.firstName} ${exp.submittedByEmployee.lastName}`,
          department: exp.department?.name,
          submittedAt: exp.createdAt,
        }));
      } catch (err: any) {
        console.warn("Failed to load pending expenses:", err.message);
      }
    }

    // Assets needing maintenance (next 30 days)
    if (isAdmin || isHR || isManager) {
      try {
        const next30Days = new Date(today);
        next30Days.setDate(next30Days.getDate() + 30);

        // Get maintenance records with nextDueDate in next 30 days
        const upcomingMaintenance = await prisma.assetMaintenance.findMany({
          where: {
            nextDueDate: {
              lte: next30Days,
              gte: today,
            },
          },
          take: 10,
          orderBy: { nextDueDate: "asc" },
          include: {
            asset: {
              include: {
                department: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        });

        widgets.assetsNeedingMaintenance = upcomingMaintenance.map((maintenance) => ({
          id: maintenance.assetId,
          name: maintenance.asset.name,
          assetTag: maintenance.asset.assetCode,
          nextMaintenanceDate: maintenance.nextDueDate,
          department: maintenance.asset.department?.name,
        }));
      } catch (err: any) {
        console.warn("Failed to load assets needing maintenance:", err.message);
      }
    }

    stats.widgets = widgets;

    res.json({
      stats,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({ message: error.message || "Failed to get dashboard stats" });
  }
}

