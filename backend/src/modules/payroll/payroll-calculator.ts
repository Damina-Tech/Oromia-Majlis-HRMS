import { Prisma } from "@prisma/client";
import prisma from "../../db/client.js";

/**
 * Calculate income tax based on Ethiopian PAYE tax brackets
 * Can use dynamic tax rates from database if available
 */
export async function calculateIncomeTax(
  grossSalary: number,
  year?: number
): Promise<number> {
  const currentYear = year || new Date().getFullYear();

  // Try to fetch tax rates from database
  const taxRates = await prisma.taxRate.findMany({
    where: {
      year: currentYear,
      isActive: true,
    },
    orderBy: { minIncome: "asc" },
  });

  if (taxRates.length > 0) {
    // Use dynamic tax rates from database
    let tax = 0;
    let remainingSalary = grossSalary;

    for (const rate of taxRates) {
      const minIncome = parseFloat(rate.minIncome.toString());
      const maxIncome = rate.maxIncome ? parseFloat(rate.maxIncome.toString()) : Infinity;
      const ratePercent = parseFloat(rate.rate.toString()) / 100;
      const fixedAmount = rate.fixedAmount ? parseFloat(rate.fixedAmount.toString()) : 0;

      if (grossSalary > minIncome) {
        const taxableAmount = Math.min(remainingSalary, maxIncome - minIncome);
        if (taxableAmount > 0) {
          tax += taxableAmount * ratePercent + fixedAmount;
          remainingSalary -= taxableAmount;
          if (remainingSalary <= 0) break;
        }
      }
    }

    return Math.max(0, tax);
  }

  // Fallback to simplified Ethiopian tax brackets (2024 baseline)
  if (grossSalary <= 600) return 0;
  if (grossSalary <= 1650) return (grossSalary - 600) * 0.10;
  if (grossSalary <= 3200) return 105 + (grossSalary - 1650) * 0.15;
  if (grossSalary <= 5250) return 337.50 + (grossSalary - 3200) * 0.20;
  if (grossSalary <= 7800) return 747.50 + (grossSalary - 5250) * 0.25;
  if (grossSalary <= 10900) return 1385 + (grossSalary - 7800) * 0.30;
  return 2315 + (grossSalary - 10900) * 0.35;
}

/**
 * Calculate pension contribution (employee portion)
 */
export async function calculatePension(
  grossSalary: number,
  year?: number
): Promise<number> {
  const currentYear = year || new Date().getFullYear();

  const pensionRate = await prisma.pensionRate.findFirst({
    where: {
      year: currentYear,
      isActive: true,
    },
  });

  if (pensionRate) {
    const employeeRate = parseFloat(pensionRate.employeeRate.toString()) / 100;
    return grossSalary * employeeRate;
  }

  // Default: 7% employee contribution (Ethiopian standard)
  return grossSalary * 0.07;
}

/**
 * Calculate total allowances for an employee for a specific month
 */
export async function calculateAllowances(
  employeeId: string,
  periodStart: Date,
  periodEnd: Date,
  basicSalary: number
): Promise<number> {
  // Get active allowances assigned to this employee for the period
  const periodMonth = `${periodStart.getFullYear()}-${String(periodStart.getMonth() + 1).padStart(2, "0")}`;

  const employeeAllowances = await prisma.employeeAllowance.findMany({
    where: {
      employeeId,
      month: periodMonth,
    },
    include: {
      allowance: true,
    },
  });

  let totalAllowances = 0;

  for (const empAllowance of employeeAllowances) {
    const allowance = empAllowance.allowance;
    if (!allowance.isActive) continue;

    if (allowance.isPercentage) {
      const percentage = allowance.percentage
        ? parseFloat(allowance.percentage.toString()) / 100
        : 0;
      totalAllowances += basicSalary * percentage;
    } else {
      totalAllowances += parseFloat(empAllowance.amount.toString());
    }
  }

  return totalAllowances;
}

/**
 * Calculate total loan deductions for an employee
 */
export async function calculateLoanDeductions(
  employeeId: string,
  payrollRunId?: string
): Promise<number> {
  const activeLoans = await prisma.loan.findMany({
    where: {
      employeeId,
      status: "ACTIVE",
    },
  });

  let totalDeductions = 0;

  for (const loan of activeLoans) {
    const remainingAmount = parseFloat(loan.remainingAmount.toString());
    const monthlyPayment = parseFloat(loan.monthlyPayment.toString());

    if (remainingAmount > 0) {
      // Deduct monthly payment, but don't exceed remaining amount
      const deduction = Math.min(monthlyPayment, remainingAmount);
      totalDeductions += deduction;
    }
  }

  return totalDeductions;
}

/**
 * Calculate total advance deductions for an employee
 */
export async function calculateAdvanceDeductions(
  employeeId: string,
  payrollRunId?: string
): Promise<number> {
  const activeAdvances = await prisma.advance.findMany({
    where: {
      employeeId,
      status: "APPROVED",
    },
  });

  let totalDeductions = 0;

  for (const advance of activeAdvances) {
    const remainingAmount = parseFloat(advance.remainingAmount.toString());
    const monthlyDeduction = parseFloat(advance.monthlyDeduction.toString());

    if (remainingAmount > 0) {
      // Deduct monthly payment, but don't exceed remaining amount
      const deduction = Math.min(monthlyDeduction, remainingAmount);
      totalDeductions += deduction;
    }
  }

  return totalDeductions;
}

/**
 * Calculate absence deductions based on attendance
 */
export function calculateAbsenceDeductions(
  basicSalary: number,
  workingDays: number,
  absentDays: number
): number {
  if (workingDays === 0) return 0;
  const dailyRate = basicSalary / workingDays;
  return dailyRate * absentDays;
}

/**
 * Calculate complete payroll item for an employee
 */
export interface PayrollCalculationResult {
  basicSalary: number;
  allowances: number;
  overtime: number;
  bonus: number;
  grossSalary: number;
  incomeTax: number;
  pension: number;
  healthInsurance: number;
  providentFund: number;
  loanDeductions: number;
  advanceDeductions: number;
  absenceDeductions: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
}

export async function calculatePayrollItem(
  employeeId: string,
  periodStart: Date,
  periodEnd: Date,
  options?: {
    overtime?: number;
    bonus?: number;
    healthInsuranceRate?: number;
    providentFundRate?: number;
    otherDeductions?: number;
  }
): Promise<PayrollCalculationResult> {
  // Get employee with salary info
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      salaryGrade: true,
      salaryStep: true,
    },
  });

  if (!employee) {
    throw new Error("Employee not found");
  }

  // Get basic salary
  let basicSalary = 0;
  if (employee.salary) {
    basicSalary = parseFloat(employee.salary.toString()) * 0.70; // 70% basic
  } else if (employee.salaryStep) {
    basicSalary = parseFloat(employee.salaryStep.salary.toString()) * 0.70;
  }

  // Calculate allowances
  const allowances = await calculateAllowances(employeeId, periodStart, periodEnd, basicSalary);

  // Get attendance data
  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      employeeId,
      date: {
        gte: periodStart,
        lte: periodEnd,
      },
    },
  });

  // Calculate working days
  const totalDays = Math.ceil(
    (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;
  const presentDays = attendanceRecords.filter(
    (a) => a.status === "PRESENT" || a.status === "LATE"
  ).length;
  const absentDays = attendanceRecords.filter((a) => a.status === "ABSENT").length;
  const leaveDays = attendanceRecords.filter((a) => a.status === "ON_LEAVE").length;

  // Earnings
  const overtime = options?.overtime || 0;
  const bonus = options?.bonus || 0;
  const grossSalary = basicSalary + allowances + overtime + bonus;

  // Deductions
  const incomeTax = await calculateIncomeTax(grossSalary);
  const pension = await calculatePension(grossSalary);
  const healthInsurance =
    (options?.healthInsuranceRate || 0.02) * grossSalary; // Default 2%
  const providentFund = (options?.providentFundRate || 0.07) * grossSalary; // Default 7%
  const loanDeductions = await calculateLoanDeductions(employeeId);
  const advanceDeductions = await calculateAdvanceDeductions(employeeId);
  const absenceDeductions = calculateAbsenceDeductions(basicSalary, totalDays, absentDays);
  const otherDeductions = options?.otherDeductions || 0;

  const totalDeductions =
    incomeTax +
    pension +
    healthInsurance +
    providentFund +
    loanDeductions +
    advanceDeductions +
    absenceDeductions +
    otherDeductions;

  const netSalary = grossSalary - totalDeductions;

  return {
    basicSalary,
    allowances,
    overtime,
    bonus,
    grossSalary,
    incomeTax,
    pension,
    healthInsurance,
    providentFund,
    loanDeductions,
    advanceDeductions,
    absenceDeductions,
    otherDeductions,
    totalDeductions,
    netSalary,
    workingDays: totalDays,
    presentDays,
    absentDays,
    leaveDays,
  };
}

