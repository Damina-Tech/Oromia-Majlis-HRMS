import { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import {
  CreatePayrollDto,
  UpdatePayrollDto,
  ProcessPayrollDto,
  ListPayrollQuery,
  GeneratePayrollDto,
} from "./payroll.dto.js";

const prisma = new PrismaClient();

/**
 * Calculate tax based on gross salary (Ethiopian tax brackets - simplified)
 */
function calculateIncomeTax(grossSalary: number): number {
  // Simplified Ethiopian tax calculation
  // 0-600: 0%
  // 601-1650: 10%
  // 1651-3200: 15%
  // 3201-5250: 20%
  // 5251-7800: 25%
  // 7801-10900: 30%
  // 10901+: 35%
  
  if (grossSalary <= 600) return 0;
  if (grossSalary <= 1650) return (grossSalary - 600) * 0.10;
  if (grossSalary <= 3200) return 105 + (grossSalary - 1650) * 0.15;
  if (grossSalary <= 5250) return 337.50 + (grossSalary - 3200) * 0.20;
  if (grossSalary <= 7800) return 747.50 + (grossSalary - 5250) * 0.25;
  if (grossSalary <= 10900) return 1385 + (grossSalary - 7800) * 0.30;
  return 2315 + (grossSalary - 10900) * 0.35;
}

/**
 * Generate payroll for employees
 */
export async function generatePayroll(req: Request, res: Response) {
  try {
    const body = GeneratePayrollDto.parse(req.body);
    const userId = (req as any).user?.id;

    const periodStart = new Date(body.periodStart);
    const periodEnd = new Date(body.periodEnd);

    // Build employee query
    const whereClause: any = {
      status: "ACTIVE",
    };

    if (body.employeeIds && body.employeeIds.length > 0) {
      whereClause.id = { in: body.employeeIds };
    }

    if (body.departmentId) {
      whereClause.departmentId = body.departmentId;
    }

    // Get employees
    const employees = await prisma.employee.findMany({
      where: whereClause,
      include: {
        department: true,
      },
    });

    const createdPayrolls = [];

    for (const employee of employees) {
      // Check if payroll already exists for this period
      const existing = await prisma.payroll.findFirst({
        where: {
          employeeId: employee.id,
          periodStart,
          periodEnd,
        },
      });

      if (existing) {
        continue; // Skip if already exists
      }

      // Get attendance data for the period
      const attendanceRecords = await prisma.attendance.findMany({
        where: {
          employeeId: employee.id,
          date: {
            gte: periodStart,
            lte: periodEnd,
          },
        },
      });

      // Calculate working days
      const totalDays = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const presentDays = attendanceRecords.filter(a => a.status === "PRESENT" || a.status === "LATE").length;
      const absentDays = attendanceRecords.filter(a => a.status === "ABSENT").length;
      const leaveDays = attendanceRecords.filter(a => a.status === "ON_LEAVE").length;

      // Calculate salary components
      const monthlySalary = employee.salary ? parseFloat(employee.salary.toString()) : 0;
      const basicSalary = monthlySalary * 0.70; // 70% basic
      const allowances = monthlySalary * 0.20;  // 20% allowances
      const overtime = 0; // Will be added manually if needed
      const bonus = 0;    // Will be added manually if needed

      const grossSalary = basicSalary + allowances + overtime + bonus;

      // Calculate deductions
      const incomeTax = calculateIncomeTax(grossSalary);
      const healthInsurance = grossSalary * 0.02; // 2% health insurance
      const providentFund = grossSalary * 0.07;   // 7% provident fund
      const otherDeductions = 0;

      const totalDeductions = incomeTax + healthInsurance + providentFund + otherDeductions;
      const netSalary = grossSalary - totalDeductions;

      // Create payroll record
      const payroll = await prisma.payroll.create({
        data: {
          employeeId: employee.id,
          periodType: "MONTHLY",
          periodStart,
          periodEnd,
          basicSalary: new Prisma.Decimal(basicSalary),
          allowances: new Prisma.Decimal(allowances),
          overtime: new Prisma.Decimal(overtime),
          bonus: new Prisma.Decimal(bonus),
          grossSalary: new Prisma.Decimal(grossSalary),
          incomeTax: new Prisma.Decimal(incomeTax),
          healthInsurance: new Prisma.Decimal(healthInsurance),
          providentFund: new Prisma.Decimal(providentFund),
          otherDeductions: new Prisma.Decimal(otherDeductions),
          totalDeductions: new Prisma.Decimal(totalDeductions),
          netSalary: new Prisma.Decimal(netSalary),
          workingDays: totalDays,
          presentDays,
          absentDays,
          leaveDays,
          status: "DRAFT",
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeCode: true,
              designation: true,
              department: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      createdPayrolls.push(payroll);
    }

    return res.status(201).json({
      message: `Generated ${createdPayrolls.length} payroll records`,
      payrolls: createdPayrolls,
    });
  } catch (error: any) {
    console.error("Generate payroll error:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to generate payroll" });
  }
}

/**
 * List payroll records
 */
export async function listPayroll(req: Request, res: Response) {
  try {
    const query = ListPayrollQuery.parse(req.query);
    const currentUserEmployeeId = (req as any).user?.employeeId;
    const userRoles = (req as any).user?.roles || [];

    // Build where clause
    const where: any = {};

    // If not admin/HR, only show own payroll
    if (!userRoles.includes("ADMIN") && !userRoles.includes("HR")) {
      if (currentUserEmployeeId) {
        where.employeeId = currentUserEmployeeId;
      } else {
        return res.status(403).json({ message: "Access denied" });
      }
    } else {
      // Admin/HR can filter by employee
      if (query.employeeId) {
        where.employeeId = query.employeeId;
      }
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.periodStart) {
      where.periodStart = { gte: new Date(query.periodStart) };
    }

    if (query.periodEnd) {
      where.periodEnd = { lte: new Date(query.periodEnd) };
    }

    // Handle month filter (e.g., "2024-11")
    if (query.month) {
      const [year, month] = query.month.split("-");
      const start = new Date(parseInt(year), parseInt(month) - 1, 1);
      const end = new Date(parseInt(year), parseInt(month), 0);
      where.periodStart = { gte: start };
      where.periodEnd = { lte: end };
    }

    // Handle year filter
    if (query.year) {
      const start = new Date(parseInt(query.year), 0, 1);
      const end = new Date(parseInt(query.year), 11, 31);
      where.periodStart = { gte: start };
      where.periodEnd = { lte: end };
    }

    if (query.departmentId) {
      where.employee = {
        departmentId: query.departmentId,
      };
    }

    const skip = (query.page - 1) * query.pageSize;

    const [items, total] = await Promise.all([
      prisma.payroll.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: [{ periodStart: "desc" }, { createdAt: "desc" }],
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeCode: true,
              designation: true,
              department: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.payroll.count({ where }),
    ]);

    return res.status(200).json({
      items,
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.ceil(total / query.pageSize),
    });
  } catch (error: any) {
    console.error("List payroll error:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid query parameters", errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to list payroll records" });
  }
}

/**
 * Get single payroll record
 */
export async function getPayroll(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const currentUserEmployeeId = (req as any).user?.employeeId;
    const userRoles = (req as any).user?.roles || [];

    const payroll = await prisma.payroll.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            designation: true,
            email: true,
            phone: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!payroll) {
      return res.status(404).json({ message: "Payroll record not found" });
    }

    // Check access
    if (!userRoles.includes("ADMIN") && !userRoles.includes("HR")) {
      if (payroll.employeeId !== currentUserEmployeeId) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    return res.status(200).json(payroll);
  } catch (error: any) {
    console.error("Get payroll error:", error);
    return res.status(500).json({ message: "Failed to get payroll record" });
  }
}

/**
 * Update payroll record
 */
export async function updatePayroll(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    // Debug: Log the incoming request body
    console.log('Update payroll request body:', req.body);
    console.log('Request body types:', Object.entries(req.body).map(([key, value]) => [key, typeof value]));
    
    const body = UpdatePayrollDto.parse(req.body);

    const existing = await prisma.payroll.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ message: "Payroll record not found" });
    }

    if (existing.status !== "DRAFT") {
      return res.status(400).json({ message: "Can only update draft payroll records" });
    }

    // Recalculate gross salary and net salary
    const basicSalary = parseFloat(existing.basicSalary.toString());
    const allowances = body.allowances !== undefined ? body.allowances : parseFloat(existing.allowances.toString());
    const overtime = body.overtime !== undefined ? body.overtime : parseFloat(existing.overtime.toString());
    const bonus = body.bonus !== undefined ? body.bonus : parseFloat(existing.bonus.toString());

    const grossSalary = basicSalary + allowances + overtime + bonus;

    const incomeTax = body.incomeTax !== undefined ? body.incomeTax : parseFloat(existing.incomeTax.toString());
    const healthInsurance = body.healthInsurance !== undefined ? body.healthInsurance : parseFloat(existing.healthInsurance.toString());
    const providentFund = body.providentFund !== undefined ? body.providentFund : parseFloat(existing.providentFund.toString());
    const otherDeductions = body.otherDeductions !== undefined ? body.otherDeductions : parseFloat(existing.otherDeductions.toString());

    const totalDeductions = incomeTax + healthInsurance + providentFund + otherDeductions;
    const netSalary = grossSalary - totalDeductions;

    const payroll = await prisma.payroll.update({
      where: { id },
      data: {
        allowances: body.allowances !== undefined ? new Prisma.Decimal(body.allowances) : undefined,
        overtime: body.overtime !== undefined ? new Prisma.Decimal(body.overtime) : undefined,
        bonus: body.bonus !== undefined ? new Prisma.Decimal(body.bonus) : undefined,
        grossSalary: new Prisma.Decimal(grossSalary),
        incomeTax: body.incomeTax !== undefined ? new Prisma.Decimal(body.incomeTax) : undefined,
        healthInsurance: body.healthInsurance !== undefined ? new Prisma.Decimal(body.healthInsurance) : undefined,
        providentFund: body.providentFund !== undefined ? new Prisma.Decimal(body.providentFund) : undefined,
        otherDeductions: body.otherDeductions !== undefined ? new Prisma.Decimal(body.otherDeductions) : undefined,
        totalDeductions: new Prisma.Decimal(totalDeductions),
        netSalary: new Prisma.Decimal(netSalary),
        notes: body.notes,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
          },
        },
      },
    });

    return res.status(200).json(payroll);
  } catch (error: any) {
    console.error("Update payroll error:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to update payroll" });
  }
}

/**
 * Process payroll (mark as processed)
 */
export async function processPayroll(req: Request, res: Response) {
  try {
    const body = ProcessPayrollDto.parse(req.body);
    const userId = (req as any).user?.id;

    const paymentDate = body.paymentDate ? new Date(body.paymentDate) : new Date();

    const updated = await prisma.payroll.updateMany({
      where: {
        id: { in: body.payrollIds },
        status: "DRAFT",
      },
      data: {
        status: "PROCESSED",
        processedBy: userId,
        processedAt: new Date(),
        paymentDate,
      },
    });

    return res.status(200).json({
      message: `Processed ${updated.count} payroll records`,
      count: updated.count,
    });
  } catch (error: any) {
    console.error("Process payroll error:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to process payroll" });
  }
}

/**
 * Mark payroll as paid
 */
export async function markAsPaid(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const existing = await prisma.payroll.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ message: "Payroll record not found" });
    }

    if (existing.status !== "PROCESSED") {
      return res.status(400).json({ message: "Can only mark processed payroll as paid" });
    }

    const payroll = await prisma.payroll.update({
      where: { id },
      data: {
        status: "PAID",
      },
    });

    return res.status(200).json(payroll);
  } catch (error: any) {
    console.error("Mark as paid error:", error);
    return res.status(500).json({ message: "Failed to mark payroll as paid" });
  }
}

/**
 * Delete payroll record
 */
export async function deletePayroll(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const existing = await prisma.payroll.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ message: "Payroll record not found" });
    }

    if (existing.status === "PAID") {
      return res.status(400).json({ message: "Cannot delete paid payroll records" });
    }

    await prisma.payroll.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (error: any) {
    console.error("Delete payroll error:", error);
    return res.status(500).json({ message: "Failed to delete payroll" });
  }
}

/**
 * Get payroll summary/statistics
 */
export async function getPayrollSummary(req: Request, res: Response) {
  try {
    const { month, year } = req.query;

    let periodStart: Date;
    let periodEnd: Date;

    if (month && year) {
      const [y, m] = (month as string).split("-");
      periodStart = new Date(parseInt(y), parseInt(m) - 1, 1);
      periodEnd = new Date(parseInt(y), parseInt(m), 0);
    } else if (year) {
      periodStart = new Date(parseInt(year as string), 0, 1);
      periodEnd = new Date(parseInt(year as string), 11, 31);
    } else {
      // Current month
      const now = new Date();
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    const payrolls = await prisma.payroll.findMany({
      where: {
        periodStart: { gte: periodStart },
        periodEnd: { lte: periodEnd },
      },
    });

    const summary = {
      totalEmployees: payrolls.length,
      totalPayroll: payrolls.reduce((sum, p) => sum + parseFloat(p.grossSalary.toString()), 0),
      totalDeductions: payrolls.reduce((sum, p) => sum + parseFloat(p.totalDeductions.toString()), 0),
      netPayroll: payrolls.reduce((sum, p) => sum + parseFloat(p.netSalary.toString()), 0),
      avgSalary: payrolls.length > 0 
        ? payrolls.reduce((sum, p) => sum + parseFloat(p.netSalary.toString()), 0) / payrolls.length 
        : 0,
      draft: payrolls.filter(p => p.status === "DRAFT").length,
      processed: payrolls.filter(p => p.status === "PROCESSED").length,
      paid: payrolls.filter(p => p.status === "PAID").length,
      breakdown: {
        basicSalary: payrolls.reduce((sum, p) => sum + parseFloat(p.basicSalary.toString()), 0),
        allowances: payrolls.reduce((sum, p) => sum + parseFloat(p.allowances.toString()), 0),
        overtime: payrolls.reduce((sum, p) => sum + parseFloat(p.overtime.toString()), 0),
        bonus: payrolls.reduce((sum, p) => sum + parseFloat(p.bonus.toString()), 0),
        incomeTax: payrolls.reduce((sum, p) => sum + parseFloat(p.incomeTax.toString()), 0),
        healthInsurance: payrolls.reduce((sum, p) => sum + parseFloat(p.healthInsurance.toString()), 0),
        providentFund: payrolls.reduce((sum, p) => sum + parseFloat(p.providentFund.toString()), 0),
      },
    };

    return res.status(200).json(summary);
  } catch (error: any) {
    console.error("Get payroll summary error:", error);
    return res.status(500).json({ message: "Failed to get payroll summary" });
  }
}
