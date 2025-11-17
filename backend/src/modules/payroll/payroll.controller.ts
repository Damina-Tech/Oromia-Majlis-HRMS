import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { In } from "typeorm";
import { AppDataSource } from "../../db/data-source.js";
import { Payroll, PayrollStatus, PayrollPeriodType } from "../../entities/Payroll.js";
import { Employee } from "../../entities/Employee.js";
import { Attendance, AttendanceStatus } from "../../entities/Attendance.js";
import {
  CreatePayrollDto,
  UpdatePayrollDto,
  ProcessPayrollDto,
  ListPayrollQuery,
  GeneratePayrollDto,
} from "./payroll.dto.js";

/**
 * Calculate tax based on gross salary (Ethiopian tax brackets - simplified)
 */
function calculateIncomeTax(grossSalary: number): number {
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

    const empRepo = AppDataSource.getRepository(Employee);
    const payrollRepo = AppDataSource.getRepository(Payroll);
    const attendanceRepo = AppDataSource.getRepository(Attendance);

    const queryBuilder = empRepo.createQueryBuilder("employee")
      .leftJoinAndSelect("employee.department", "department")
      .where("employee.status = :status", { status: "ACTIVE" });

    if (body.employeeIds && body.employeeIds.length > 0) {
      queryBuilder.andWhere("employee.id IN (:...ids)", { ids: body.employeeIds });
    }

    if (body.departmentId) {
      queryBuilder.andWhere("employee.departmentId = :departmentId", { departmentId: body.departmentId });
    }

    const employees = await queryBuilder.getMany();
    const createdPayrolls = [];

    for (const employee of employees) {
      // Check if payroll already exists for this period
      const existing = await payrollRepo.findOne({
        where: {
          employeeId: employee.id,
          periodStart,
          periodEnd,
        },
      });

      if (existing) {
        continue;
      }

      // Get attendance data for the period
      const attendanceRecords = await attendanceRepo
        .createQueryBuilder("attendance")
        .where("attendance.employeeId = :employeeId", { employeeId: employee.id })
        .andWhere("attendance.date >= :periodStart", { periodStart })
        .andWhere("attendance.date <= :periodEnd", { periodEnd })
        .getMany();

      // Calculate working days
      const totalDays = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const presentDays = attendanceRecords.filter(a => a.status === AttendanceStatus.PRESENT || a.status === AttendanceStatus.LATE).length;
      const absentDays = attendanceRecords.filter(a => a.status === AttendanceStatus.ABSENT).length;
      const leaveDays = attendanceRecords.filter(a => a.status === AttendanceStatus.ON_LEAVE).length;

      // Calculate salary components
      const monthlySalary = employee.salary ? parseFloat(employee.salary) : 0;
      const basicSalary = monthlySalary * 0.70;
      const allowances = monthlySalary * 0.20;
      const overtime = 0;
      const bonus = 0;

      const grossSalary = basicSalary + allowances + overtime + bonus;

      // Calculate deductions
      const incomeTax = calculateIncomeTax(grossSalary);
      const healthInsurance = grossSalary * 0.02;
      const providentFund = grossSalary * 0.07;
      const otherDeductions = 0;

      const totalDeductions = incomeTax + healthInsurance + providentFund + otherDeductions;
      const netSalary = grossSalary - totalDeductions;

      // Create payroll record
      const payroll = new Payroll();
      payroll.id = uuidv4();
      payroll.employeeId = employee.id;
      payroll.periodType = PayrollPeriodType.MONTHLY;
      payroll.periodStart = periodStart;
      payroll.periodEnd = periodEnd;
      payroll.basicSalary = basicSalary.toFixed(2);
      payroll.allowances = allowances.toFixed(2);
      payroll.overtime = overtime.toFixed(2);
      payroll.bonus = bonus.toFixed(2);
      payroll.grossSalary = grossSalary.toFixed(2);
      payroll.incomeTax = incomeTax.toFixed(2);
      payroll.healthInsurance = healthInsurance.toFixed(2);
      payroll.providentFund = providentFund.toFixed(2);
      payroll.otherDeductions = otherDeductions.toFixed(2);
      payroll.totalDeductions = totalDeductions.toFixed(2);
      payroll.netSalary = netSalary.toFixed(2);
      payroll.workingDays = totalDays;
      payroll.presentDays = presentDays;
      payroll.absentDays = absentDays;
      payroll.leaveDays = leaveDays;
      payroll.status = PayrollStatus.DRAFT;

      const saved = await payrollRepo.save(payroll);
      const withRelations = await payrollRepo.findOne({
        where: { id: saved.id },
        relations: ["employee", "employee.department"],
      });

      createdPayrolls.push(withRelations);
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

    const payrollRepo = AppDataSource.getRepository(Payroll);
    const queryBuilder = payrollRepo.createQueryBuilder("payroll")
      .leftJoinAndSelect("payroll.employee", "employee")
      .leftJoinAndSelect("employee.department", "department");

    // Access control
    if (!userRoles.includes("ADMIN") && !userRoles.includes("HR")) {
      if (currentUserEmployeeId) {
        queryBuilder.andWhere("payroll.employeeId = :employeeId", { employeeId: currentUserEmployeeId });
      } else {
        return res.status(403).json({ message: "Access denied" });
      }
    } else if (query.employeeId) {
      queryBuilder.andWhere("payroll.employeeId = :employeeId", { employeeId: query.employeeId });
    }

    if (query.status) {
      queryBuilder.andWhere("payroll.status = :status", { status: query.status });
    }

    if (query.periodStart) {
      queryBuilder.andWhere("payroll.periodStart >= :periodStart", { periodStart: new Date(query.periodStart) });
    }

    if (query.periodEnd) {
      queryBuilder.andWhere("payroll.periodEnd <= :periodEnd", { periodEnd: new Date(query.periodEnd) });
    }

    if (query.month) {
      const [year, month] = query.month.split("-");
      const start = new Date(parseInt(year), parseInt(month) - 1, 1);
      const end = new Date(parseInt(year), parseInt(month), 0);
      queryBuilder.andWhere("payroll.periodStart >= :start", { start })
        .andWhere("payroll.periodEnd <= :end", { end });
    }

    if (query.year) {
      const start = new Date(parseInt(query.year), 0, 1);
      const end = new Date(parseInt(query.year), 11, 31);
      queryBuilder.andWhere("payroll.periodStart >= :start", { start })
        .andWhere("payroll.periodEnd <= :end", { end });
    }

    if (query.departmentId) {
      queryBuilder.andWhere("employee.departmentId = :departmentId", { departmentId: query.departmentId });
    }

    const skip = (query.page - 1) * query.pageSize;
    queryBuilder.orderBy("payroll.periodStart", "DESC")
      .addOrderBy("payroll.createdAt", "DESC")
      .skip(skip)
      .take(query.pageSize);

    const [items, total] = await queryBuilder.getManyAndCount();

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

    const payrollRepo = AppDataSource.getRepository(Payroll);
    const payroll = await payrollRepo.findOne({
      where: { id },
      relations: ["employee", "employee.department"],
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
    const body = UpdatePayrollDto.parse(req.body);

    const payrollRepo = AppDataSource.getRepository(Payroll);
    const existing = await payrollRepo.findOne({ where: { id } });

    if (!existing) {
      return res.status(404).json({ message: "Payroll record not found" });
    }

    if (existing.status !== PayrollStatus.DRAFT) {
      return res.status(400).json({ message: "Can only update draft payroll records" });
    }

    // Recalculate gross salary and net salary
    const basicSalary = parseFloat(existing.basicSalary);
    const allowances = body.allowances !== undefined ? body.allowances : parseFloat(existing.allowances);
    const overtime = body.overtime !== undefined ? body.overtime : parseFloat(existing.overtime);
    const bonus = body.bonus !== undefined ? body.bonus : parseFloat(existing.bonus);

    const grossSalary = basicSalary + allowances + overtime + bonus;

    const incomeTax = body.incomeTax !== undefined ? body.incomeTax : parseFloat(existing.incomeTax);
    const healthInsurance = body.healthInsurance !== undefined ? body.healthInsurance : parseFloat(existing.healthInsurance);
    const providentFund = body.providentFund !== undefined ? body.providentFund : parseFloat(existing.providentFund);
    const otherDeductions = body.otherDeductions !== undefined ? body.otherDeductions : parseFloat(existing.otherDeductions);

    const totalDeductions = incomeTax + healthInsurance + providentFund + otherDeductions;
    const netSalary = grossSalary - totalDeductions;

    if (body.allowances !== undefined) existing.allowances = body.allowances.toFixed(2);
    if (body.overtime !== undefined) existing.overtime = body.overtime.toFixed(2);
    if (body.bonus !== undefined) existing.bonus = body.bonus.toFixed(2);
    existing.grossSalary = grossSalary.toFixed(2);
    if (body.incomeTax !== undefined) existing.incomeTax = body.incomeTax.toFixed(2);
    if (body.healthInsurance !== undefined) existing.healthInsurance = body.healthInsurance.toFixed(2);
    if (body.providentFund !== undefined) existing.providentFund = body.providentFund.toFixed(2);
    if (body.otherDeductions !== undefined) existing.otherDeductions = body.otherDeductions.toFixed(2);
    existing.totalDeductions = totalDeductions.toFixed(2);
    existing.netSalary = netSalary.toFixed(2);
    if (body.notes !== undefined) existing.notes = body.notes;

    const updated = await payrollRepo.save(existing);
    const withRelations = await payrollRepo.findOne({
      where: { id: updated.id },
      relations: ["employee"],
    });

    return res.status(200).json(withRelations);
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

    const payrollRepo = AppDataSource.getRepository(Payroll);
    const payrolls = await payrollRepo.find({
      where: {
        id: In(body.payrollIds),
        status: PayrollStatus.DRAFT,
      },
    });

    let count = 0;
    for (const payroll of payrolls) {
      payroll.status = PayrollStatus.PROCESSED;
      payroll.processedBy = userId;
      payroll.processedAt = new Date();
      payroll.paymentDate = paymentDate;
      await payrollRepo.save(payroll);
      count++;
    }

    return res.status(200).json({
      message: `Processed ${count} payroll records`,
      count,
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

    const payrollRepo = AppDataSource.getRepository(Payroll);
    const existing = await payrollRepo.findOne({ where: { id } });

    if (!existing) {
      return res.status(404).json({ message: "Payroll record not found" });
    }

    if (existing.status !== PayrollStatus.PROCESSED) {
      return res.status(400).json({ message: "Can only mark processed payroll as paid" });
    }

    existing.status = PayrollStatus.PAID;
    const updated = await payrollRepo.save(existing);

    return res.status(200).json(updated);
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

    const payrollRepo = AppDataSource.getRepository(Payroll);
    const existing = await payrollRepo.findOne({ where: { id } });

    if (!existing) {
      return res.status(404).json({ message: "Payroll record not found" });
    }

    if (existing.status === PayrollStatus.PAID) {
      return res.status(400).json({ message: "Cannot delete paid payroll records" });
    }

    await payrollRepo.remove(existing);

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
      const now = new Date();
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    const payrollRepo = AppDataSource.getRepository(Payroll);
    const payrolls = await payrollRepo
      .createQueryBuilder("payroll")
      .where("payroll.periodStart >= :periodStart", { periodStart })
      .andWhere("payroll.periodEnd <= :periodEnd", { periodEnd })
      .getMany();

    const summary = {
      totalEmployees: payrolls.length,
      totalPayroll: payrolls.reduce((sum, p) => sum + parseFloat(p.grossSalary), 0),
      totalDeductions: payrolls.reduce((sum, p) => sum + parseFloat(p.totalDeductions), 0),
      netPayroll: payrolls.reduce((sum, p) => sum + parseFloat(p.netSalary), 0),
      avgSalary: payrolls.length > 0 
        ? payrolls.reduce((sum, p) => sum + parseFloat(p.netSalary), 0) / payrolls.length 
        : 0,
      draft: payrolls.filter(p => p.status === PayrollStatus.DRAFT).length,
      processed: payrolls.filter(p => p.status === PayrollStatus.PROCESSED).length,
      paid: payrolls.filter(p => p.status === PayrollStatus.PAID).length,
      breakdown: {
        basicSalary: payrolls.reduce((sum, p) => sum + parseFloat(p.basicSalary), 0),
        allowances: payrolls.reduce((sum, p) => sum + parseFloat(p.allowances), 0),
        overtime: payrolls.reduce((sum, p) => sum + parseFloat(p.overtime), 0),
        bonus: payrolls.reduce((sum, p) => sum + parseFloat(p.bonus), 0),
        incomeTax: payrolls.reduce((sum, p) => sum + parseFloat(p.incomeTax), 0),
        healthInsurance: payrolls.reduce((sum, p) => sum + parseFloat(p.healthInsurance), 0),
        providentFund: payrolls.reduce((sum, p) => sum + parseFloat(p.providentFund), 0),
      },
    };

    return res.status(200).json(summary);
  } catch (error: any) {
    console.error("Get payroll summary error:", error);
    return res.status(500).json({ message: "Failed to get payroll summary" });
  }
}
