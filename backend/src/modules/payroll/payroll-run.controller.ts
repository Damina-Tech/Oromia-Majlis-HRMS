import { Request, Response } from "express";
import { PrismaClient, Prisma, NotificationModule, NotificationType } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import {
  CreatePayrollRunDto,
  UpdatePayrollRunDto,
  ReviewPayrollRunDto,
  ApprovePayrollRunDto,
  ProcessPayrollRunDto,
  UpdatePayrollItemDto,
  ListPayrollRunQuery,
  ListPayrollItemsQuery,
} from "./payroll-run.dto.js";
import {
  calculatePayrollItem,
  type PayrollCalculationResult,
} from "./payroll-calculator.js";
import { createAuditLog } from "./payroll-audit.js";
import { generateBankExport, getBankExportBuffer } from "./bank-export.js";
import { generateAndSavePayslip, generatePayslipData } from "./payslip-generator.js";
import { NotificationService } from "../notifications/notification.service.js";
import { format } from "date-fns";

const prisma = new PrismaClient();

/**
 * Create a new payroll run and generate items for employees
 */
export async function createPayrollRun(req: Request, res: Response) {
  try {
    const dto = CreatePayrollRunDto.parse(req.body);
    const userId = (req as any).user?.id;

    const periodStart = new Date(dto.periodStart);
    const periodEnd = new Date(dto.periodEnd);

    // Check if payroll run already exists for this period
    const existing = await prisma.payrollRun.findFirst({
      where: {
        periodType: dto.periodType,
        periodStart,
        periodEnd,
      },
    });

    if (existing) {
      return res.status(400).json({
        message: "Payroll run already exists for this period",
      });
    }

    // Build employee query
    const whereClause: any = {
      status: "ACTIVE",
    };

    if (dto.employeeIds && dto.employeeIds.length > 0) {
      whereClause.id = { in: dto.employeeIds };
    }

    if (dto.departmentId) {
      whereClause.departmentId = dto.departmentId;
    }

    // Get employees
    const employees = await prisma.employee.findMany({
      where: whereClause,
      include: {
        department: true,
        user: true,
        salaryGrade: true,
        salaryStep: true,
      },
    });

    // Create payroll run and items in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create payroll run
      const payrollRun = await tx.payrollRun.create({
        data: {
          periodType: dto.periodType,
          periodStart,
          periodEnd,
          paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : null,
          status: "DRAFT",
          employeeCount: employees.length,
        },
      });

      // Calculate and create payroll items for each employee
      const payrollItems = [];
      let totalGross = 0;
      let totalDeductions = 0;
      let totalNet = 0;

      for (const employee of employees) {
        try {
          const calculation = await calculatePayrollItem(
            employee.id,
            periodStart,
            periodEnd
          );

          const payrollItem = await tx.payrollItem.create({
            data: {
              payrollRunId: payrollRun.id,
              employeeId: employee.id,
              basicSalary: new Prisma.Decimal(calculation.basicSalary),
              allowances: new Prisma.Decimal(calculation.allowances),
              overtime: new Prisma.Decimal(calculation.overtime),
              bonus: new Prisma.Decimal(calculation.bonus),
              grossSalary: new Prisma.Decimal(calculation.grossSalary),
              incomeTax: new Prisma.Decimal(calculation.incomeTax),
              pension: new Prisma.Decimal(calculation.pension),
              healthInsurance: new Prisma.Decimal(calculation.healthInsurance),
              providentFund: new Prisma.Decimal(calculation.providentFund),
              loanDeductions: new Prisma.Decimal(calculation.loanDeductions),
              advanceDeductions: new Prisma.Decimal(calculation.advanceDeductions),
              absenceDeductions: new Prisma.Decimal(calculation.absenceDeductions),
              otherDeductions: new Prisma.Decimal(calculation.otherDeductions),
              totalDeductions: new Prisma.Decimal(calculation.totalDeductions),
              netSalary: new Prisma.Decimal(calculation.netSalary),
              workingDays: calculation.workingDays,
              presentDays: calculation.presentDays,
              absentDays: calculation.absentDays,
              leaveDays: calculation.leaveDays,
            },
            include: {
              employee: {
                select: {
                  id: true,
                  employeeCode: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          });

          payrollItems.push(payrollItem);
          totalGross += calculation.grossSalary;
          totalDeductions += calculation.totalDeductions;
          totalNet += calculation.netSalary;
        } catch (error: any) {
          console.error(`Failed to create payroll item for employee ${employee.id}:`, error);
          // Continue with other employees
        }
      }

      // Update payroll run totals
      const updatedPayrollRun = await tx.payrollRun.update({
        where: { id: payrollRun.id },
        data: {
          totalGross: new Prisma.Decimal(totalGross),
          totalDeductions: new Prisma.Decimal(totalDeductions),
          totalNet: new Prisma.Decimal(totalNet),
          employeeCount: payrollItems.length,
        },
        include: {
          items: {
            include: {
              employee: {
                select: {
                  id: true,
                  employeeCode: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      return { payrollRun: updatedPayrollRun, items: payrollItems };
    });

    // Create audit log outside transaction to avoid breaking main operation
    await createAuditLog(prisma, {
      action: "CREATE",
      entityType: "PayrollRun",
      entityId: result.payrollRun.id,
      payrollRunId: result.payrollRun.id,
      performedBy: userId,
      description: `Created payroll run for period ${dto.periodStart} to ${dto.periodEnd}`,
    });

    try {
      const periodLabel = `${format(new Date(dto.periodStart), "MMM dd, yyyy")} - ${format(
        new Date(dto.periodEnd),
        "MMM dd, yyyy"
      )}`;
      await NotificationService.sendNotification({
        module: NotificationModule.PAYROLL,
        type: NotificationType.INFO,
        title: `Payroll run created (${periodLabel})`,
        message: `A new payroll run covering ${periodLabel} has been created with ${result.payrollRun.employeeCount} employees.`,
        resourceType: "PAYROLL_RUN",
        resourceId: result.payrollRun.id,
        targets: {
          roleNames: ["FINANCE", "HR"],
        },
      });
    } catch (notifyError) {
      console.warn("Failed to send payroll creation notification:", notifyError);
    }

    return res.status(201).json(result);
  } catch (error: any) {
    console.error("Create payroll run error:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to create payroll run" });
  }
}

/**
 * List payroll runs
 */
export async function listPayrollRuns(req: Request, res: Response) {
  try {
    const query = ListPayrollRunQuery.parse(req.query);

    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.periodType) {
      where.periodType = query.periodType;
    }

    if (query.periodStart) {
      where.periodStart = { gte: new Date(query.periodStart) };
    }

    if (query.periodEnd) {
      where.periodEnd = { lte: new Date(query.periodEnd) };
    }

    const skip = (query.page - 1) * query.pageSize;

    const [items, total] = await Promise.all([
      prisma.payrollRun.findMany({
        where,
        skip,
        take: query.pageSize,
        include: {
          _count: {
            select: { items: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.payrollRun.count({ where }),
    ]);

    return res.status(200).json({
      items,
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.ceil(total / query.pageSize),
    });
  } catch (error: any) {
    console.error("List payroll runs error:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid query parameters", errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to list payroll runs" });
  }
}

/**
 * Get single payroll run with items
 */
export async function getPayrollRun(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const payrollRun = await prisma.payrollRun.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            employee: {
              select: {
                id: true,
                employeeCode: true,
                firstName: true,
                lastName: true,
                email: true,
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
          orderBy: [
            { employee: { lastName: "asc" } },
            { employee: { firstName: "asc" } },
          ],
        },
        auditLogs: {
          include: {
            // If you have a User relation, include it
          },
          orderBy: { createdAt: "desc" },
          take: 20, // Latest 20 audit logs
        },
      },
    });

    if (!payrollRun) {
      return res.status(404).json({ message: "Payroll run not found" });
    }

    return res.status(200).json(payrollRun);
  } catch (error: any) {
    console.error("Get payroll run error:", error);
    return res.status(500).json({ message: "Failed to get payroll run" });
  }
}

/**
 * Update payroll run (status, comments, notes)
 */
export async function updatePayrollRun(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const dto = UpdatePayrollRunDto.parse(req.body);
    const userId = (req as any).user?.id;

    const existing = await prisma.payrollRun.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ message: "Payroll run not found" });
    }

    // Only allow status transitions in workflow
    if (dto.status) {
      const validTransitions: Record<string, string[]> = {
        DRAFT: ["REVIEW", "CANCELLED"],
        REVIEW: ["APPROVED", "DRAFT", "CANCELLED"],
        APPROVED: ["PROCESSED", "REVIEW"],
        PROCESSED: ["PAID", "APPROVED"],
        PAID: [], // Final state
        CANCELLED: [], // Final state
      };

      if (!validTransitions[existing.status]?.includes(dto.status)) {
        return res.status(400).json({
          message: `Invalid status transition from ${existing.status} to ${dto.status}`,
        });
      }
    }

    const updateData: any = {};
    if (dto.status) {
      updateData.status = dto.status;
      if (dto.status === "REVIEW") {
        updateData.reviewedBy = userId;
        updateData.reviewedAt = new Date();
      } else if (dto.status === "APPROVED") {
        updateData.approvedBy = userId;
        updateData.approvedAt = new Date();
      } else if (dto.status === "PROCESSED") {
        updateData.processedBy = userId;
        updateData.processedAt = new Date();
      }
    }
    if (dto.paymentDate) updateData.paymentDate = new Date(dto.paymentDate);
    if (dto.comments !== undefined) updateData.comments = dto.comments;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    const payrollRun = await prisma.payrollRun.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: {
            employee: {
              select: {
                id: true,
                employeeCode: true,
                firstName: true,
                lastName: true,
                user: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Create audit log
    if (dto.status) {
      await createAuditLog(prisma, {
        action: dto.status === "APPROVED" ? "APPROVE" : "UPDATE",
        entityType: "PayrollRun",
        entityId: id,
        payrollRunId: id,
        performedBy: userId,
        description: `Status changed to ${dto.status}`,
        oldValue: existing.status,
        newValue: dto.status,
      });
    }

    return res.status(200).json(payrollRun);
  } catch (error: any) {
    console.error("Update payroll run error:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to update payroll run" });
  }
}

/**
 * Review payroll run
 */
export async function reviewPayrollRun(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const dto = ReviewPayrollRunDto.parse(req.body);
    const userId = (req as any).user?.id;

    const payrollRun = await prisma.payrollRun.update({
      where: { id },
      data: {
        status: "DRAFT",
        reviewedBy: userId,
        reviewedAt: new Date(),
        comments: dto.comments,
      },
      include: {
        items: {
          include: {
            employee: {
              select: {
                id: true,
                employeeCode: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    await createAuditLog(prisma, {
      action: "APPROVE",
      entityType: "PayrollRun",
      entityId: id,
      payrollRunId: id,
      performedBy: userId,
      description: "Payroll run sent for review",
    });

    return res.status(200).json(payrollRun);
  } catch (error: any) {
    console.error("Review payroll run error:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to review payroll run" });
  }
}

/**
 * Approve payroll run
 */
export async function approvePayrollRun(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const dto = ApprovePayrollRunDto.parse(req.body);
    const userId = (req as any).user?.id;

    const payrollRun = await prisma.payrollRun.update({
      where: { id },
      data: {
        status: "PROCESSED",
        approvedBy: userId,
        approvedAt: new Date(),
        comments: dto.comments,
      },
      include: {
        items: {
          include: {
            employee: {
              select: {
                id: true,
                employeeCode: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    await createAuditLog(prisma, {
      action: "APPROVE",
      entityType: "PayrollRun",
      entityId: id,
      payrollRunId: id,
      performedBy: userId,
      description: "Payroll run approved",
    });

    try {
      const periodLabel = `${format(payrollRun.periodStart, "MMM dd, yyyy")} - ${format(
        payrollRun.periodEnd,
        "MMM dd, yyyy"
      )}`;
      await NotificationService.sendNotification({
        module: NotificationModule.PAYROLL,
        type: NotificationType.INFO,
        title: `Payroll run approved (${periodLabel})`,
        message: `Payroll run ${payrollRun.periodType} has been approved and is ready for processing.`,
        resourceType: "PAYROLL_RUN",
        resourceId: payrollRun.id,
        targets: {
          roleNames: ["FINANCE"],
          excludeUserIds: userId ? [userId] : undefined,
        },
      });
    } catch (notifyError) {
      console.warn("Failed to send payroll approval notification:", notifyError);
    }

    return res.status(200).json(payrollRun);
  } catch (error: any) {
    console.error("Approve payroll run error:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to approve payroll run" });
  }
}

/**
 * Process payroll run (mark as processed/paid)
 */
export async function processPayrollRun(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const dto = ProcessPayrollRunDto.parse(req.body);
    const userId = (req as any).user?.id;

    const payrollRun = await prisma.payrollRun.update({
      where: { id },
      data: {
        status: "PROCESSED",
        processedBy: userId,
        processedAt: new Date(),
        comments: dto.comments,
      },
      include: {
        items: {
          include: {
            employee: {
              select: {
                id: true,
                employeeCode: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    // Apply loan and advance deductions
    await prisma.$transaction(async (tx) => {
      for (const item of payrollRun.items) {
        const loanDeductions = parseFloat(item.loanDeductions.toString());
        const advanceDeductions = parseFloat(item.advanceDeductions.toString());

        // Process loan repayments
        if (loanDeductions > 0) {
          const loans = await tx.loan.findMany({
            where: {
              employeeId: item.employeeId,
              status: "ACTIVE",
            },
          });

          for (const loan of loans) {
            const monthlyPayment = parseFloat(loan.monthlyPayment.toString());
            const remaining = parseFloat(loan.remainingAmount.toString());

            if (remaining > 0) {
              const deduction = Math.min(monthlyPayment, remaining);

              await tx.loanRepayment.create({
                data: {
                  loanId: loan.id,
                  payrollRunId: id,
                  amount: new Prisma.Decimal(deduction),
                  paymentDate: payrollRun.paymentDate || new Date(),
                },
              });

              const newRemaining = remaining - deduction;
              await tx.loan.update({
                where: { id: loan.id },
                data: {
                  remainingAmount: new Prisma.Decimal(newRemaining),
                  status: newRemaining <= 0 ? "COMPLETED" : "ACTIVE",
                },
              });
            }
          }
        }

        // Process advance repayments
        if (advanceDeductions > 0) {
          const advances = await tx.advance.findMany({
            where: {
              employeeId: item.employeeId,
              status: "APPROVED",
            },
          });

          for (const advance of advances) {
            const monthlyDeduction = parseFloat(advance.monthlyDeduction.toString());
            const remaining = parseFloat(advance.remainingAmount.toString());

            if (remaining > 0) {
              const deduction = Math.min(monthlyDeduction, remaining);

              await tx.advanceRepayment.create({
                data: {
                  advanceId: advance.id,
                  payrollRunId: id,
                  amount: new Prisma.Decimal(deduction),
                  paymentDate: payrollRun.paymentDate || new Date(),
                },
              });

              const newRemaining = remaining - deduction;
              await tx.advance.update({
                where: { id: advance.id },
                data: {
                  remainingAmount: new Prisma.Decimal(newRemaining),
                  status: newRemaining <= 0 ? "REPAID" : "APPROVED",
                },
              });
            }
          }
        }
      }
    });

    await createAuditLog(prisma, {
      action: "PROCESS",
      entityType: "PayrollRun",
      entityId: id,
      payrollRunId: id,
      performedBy: userId,
      description: "Payroll run processed and deductions applied",
    });

    try {
      const periodLabel = `${format(payrollRun.periodStart, "MMM dd, yyyy")} - ${format(
        payrollRun.periodEnd,
        "MMM dd, yyyy"
      )}`;

      const employeeUserIds = Array.from(
        new Set(
          payrollRun.items
            .map((item) => {
              const emp = item.employee;
              return (emp as any)?.user?.id || null;
            })
            .filter((id): id is string => id !== null)
            .filter((value): value is string => Boolean(value))
        )
      );

      if (employeeUserIds.length > 0) {
        await NotificationService.sendNotification({
          module: NotificationModule.PAYROLL,
          type: NotificationType.SUCCESS,
          title: `Payslips ready (${periodLabel})`,
          message: `Payroll run for ${periodLabel} has been processed. Your payslip is now ready.`,
          resourceType: "PAYROLL_RUN",
          resourceId: payrollRun.id,
          targets: {
            userIds: employeeUserIds,
          },
        });
      }

      await NotificationService.sendNotification({
        module: NotificationModule.PAYROLL,
        type: NotificationType.INFO,
        title: `Payroll run processed (${periodLabel})`,
        message: `Payroll run ${payrollRun.periodType} has been processed.`,
        resourceType: "PAYROLL_RUN",
        resourceId: payrollRun.id,
        targets: {
          roleNames: ["FINANCE", "HR"],
          excludeUserIds: userId ? [userId] : undefined,
        },
      });
    } catch (notifyError) {
      console.warn("Failed to send payroll processing notifications:", notifyError);
    }

    return res.status(200).json(payrollRun);
  } catch (error: any) {
    console.error("Process payroll run error:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to process payroll run" });
  }
}

/**
 * List payroll items for a run
 */
export async function listPayrollItems(req: Request, res: Response) {
  try {
    const { runId } = req.params; // Get from route parameter
    const query = ListPayrollItemsQuery.parse({ ...req.query, payrollRunId: runId });

    const where: any = {
      payrollRunId: runId,
    };

    if (query.employeeId) {
      where.employeeId = query.employeeId;
    }

    const skip = (query.page - 1) * query.pageSize;

    const [items, total] = await Promise.all([
      prisma.payrollItem.findMany({
        where,
        skip,
        take: query.pageSize,
        include: {
          employee: {
            select: {
              id: true,
              employeeCode: true,
              firstName: true,
              lastName: true,
              email: true,
              designation: true,
              department: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          payrollRun: {
            select: {
              id: true,
              periodStart: true,
              periodEnd: true,
              status: true,
            },
          },
        },
        orderBy: [
          { employee: { lastName: "asc" } },
          { employee: { firstName: "asc" } },
        ],
      }),
      prisma.payrollItem.count({ where }),
    ]);

    return res.status(200).json({
      items,
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.ceil(total / query.pageSize),
    });
  } catch (error: any) {
    console.error("List payroll items error:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid query parameters", errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to list payroll items" });
  }
}

/**
 * Update payroll item
 */
export async function updatePayrollItem(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const dto = UpdatePayrollItemDto.parse(req.body);
    const userId = (req as any).user?.id;

    const existing = await prisma.payrollItem.findUnique({
      where: { id },
      include: {
        payrollRun: true,
      },
    });

    if (!existing) {
      return res.status(404).json({ message: "Payroll item not found" });
    }

    // Only allow updates if payroll run is in DRAFT or REVIEW status
    if (existing.payrollRun.status !== "DRAFT" && existing.payrollRun.status !== "REVIEW") {
      return res.status(400).json({
        message: "Can only update payroll items in DRAFT or REVIEW status",
      });
    }

    // Recalculate totals
    const basicSalary = parseFloat(existing.basicSalary.toString());
    const allowances = dto.allowances !== undefined ? dto.allowances : parseFloat(existing.allowances.toString());
    const overtime = dto.overtime !== undefined ? dto.overtime : parseFloat(existing.overtime.toString());
    const bonus = dto.bonus !== undefined ? dto.bonus : parseFloat(existing.bonus.toString());

    const grossSalary = basicSalary + allowances + overtime + bonus;

    const incomeTax = dto.incomeTax !== undefined ? dto.incomeTax : parseFloat(existing.incomeTax.toString());
    const pension = parseFloat(existing.pension.toString()); // Keep pension as calculated
    const healthInsurance = parseFloat(existing.healthInsurance.toString()); // Keep as calculated
    const providentFund = parseFloat(existing.providentFund.toString()); // Keep as calculated
    const loanDeductions = parseFloat(existing.loanDeductions.toString()); // Keep as calculated
    const advanceDeductions = parseFloat(existing.advanceDeductions.toString()); // Keep as calculated
    const absenceDeductions = parseFloat(existing.absenceDeductions.toString()); // Keep as calculated
    const otherDeductions = dto.otherDeductions !== undefined ? dto.otherDeductions : parseFloat(existing.otherDeductions.toString());

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

    const updateData: any = {
      allowances: new Prisma.Decimal(allowances),
      overtime: new Prisma.Decimal(overtime),
      bonus: new Prisma.Decimal(bonus),
      grossSalary: new Prisma.Decimal(grossSalary),
      incomeTax: new Prisma.Decimal(incomeTax),
      otherDeductions: new Prisma.Decimal(otherDeductions),
      totalDeductions: new Prisma.Decimal(totalDeductions),
      netSalary: new Prisma.Decimal(netSalary),
    };

    if (dto.notes !== undefined) updateData.notes = dto.notes;

    const payrollItem = await prisma.payrollItem.update({
      where: { id },
      data: updateData,
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
          },
        },
        payrollRun: {
          select: {
            id: true,
            periodStart: true,
            periodEnd: true,
            status: true,
          },
        },
      },
    });

    // Recalculate and update payroll run totals
    const allItems = await prisma.payrollItem.findMany({
      where: { payrollRunId: existing.payrollRunId },
    });

    const runTotalGross = allItems.reduce((sum, item) => sum + parseFloat(item.grossSalary.toString()), 0);
    const runTotalDeductions = allItems.reduce((sum, item) => sum + parseFloat(item.totalDeductions.toString()), 0);
    const runTotalNet = allItems.reduce((sum, item) => sum + parseFloat(item.netSalary.toString()), 0);

    await prisma.payrollRun.update({
      where: { id: existing.payrollRunId },
      data: {
        totalGross: new Prisma.Decimal(runTotalGross),
        totalDeductions: new Prisma.Decimal(runTotalDeductions),
        totalNet: new Prisma.Decimal(runTotalNet),
      },
    });

    await createAuditLog(prisma, {
      action: "UPDATE",
      entityType: "PayrollItem",
      entityId: id,
      payrollRunId: existing.payrollRunId,
      performedBy: userId,
      description: "Payroll item updated",
    });

    return res.status(200).json(payrollItem);
  } catch (error: any) {
    console.error("Update payroll item error:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to update payroll item" });
  }
}

/**
 * Get single payroll item
 */
export async function getPayrollItem(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const payrollItem = await prisma.payrollItem.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            designation: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        payrollRun: {
          select: {
            id: true,
            periodStart: true,
            periodEnd: true,
            periodType: true,
            status: true,
            paymentDate: true,
          },
        },
      },
    });

    if (!payrollItem) {
      return res.status(404).json({ message: "Payroll item not found" });
    }

    return res.status(200).json(payrollItem);
  } catch (error: any) {
    console.error("Get payroll item error:", error);
    return res.status(500).json({ message: "Failed to get payroll item" });
  }
}

/**
 * Delete payroll run (only if DRAFT)
 */
export async function deletePayrollRun(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    const existing = await prisma.payrollRun.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ message: "Payroll run not found" });
    }

    if (existing.status !== "DRAFT") {
      return res.status(400).json({
        message: "Can only delete payroll runs in DRAFT status",
      });
    }

    await prisma.payrollRun.delete({
      where: { id },
    });

    await createAuditLog(prisma, {
      action: "DELETE",
      entityType: "PayrollRun",
      entityId: id,
      payrollRunId: id,
      performedBy: userId,
      description: "Payroll run deleted",
    });

    return res.status(204).send();
  } catch (error: any) {
    console.error("Delete payroll run error:", error);
    return res.status(500).json({ message: "Failed to delete payroll run" });
  }
}

/**
 * Export bank file for payroll run
 */
export async function exportBankFile(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { format } = req.query;
    const userId = (req as any).user?.id;

    const fileFormat = (format === "txt" ? "txt" : "csv") as "csv" | "txt";

    const exportContent = await generateBankExport(id, fileFormat);
    const buffer = Buffer.from(exportContent, "utf-8");

    // Create audit log
    await createAuditLog(prisma, {
      action: "EXPORT",
      entityType: "PayrollRun",
      entityId: id,
      payrollRunId: id,
      performedBy: userId,
      description: `Bank export file generated (${fileFormat.toUpperCase()})`,
    });

    const filename = `bank_export_${id}_${Date.now()}.${fileFormat}`;
    const contentType = fileFormat === "csv" ? "text/csv" : "text/plain";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error: any) {
    console.error("Export bank file error:", error);
    return res.status(500).json({ message: error.message || "Failed to export bank file" });
  }
}

/**
 * Generate payslip for a payroll item
 */
export async function generatePayslip(req: Request, res: Response) {
  try {
    const { itemId } = req.params;
    const userId = (req as any).user?.id;
    const currentUserEmployeeId = (req as any).user?.employeeId;
    const userRoles = (req as any).user?.roles || [];

    // Get payroll item to check permissions
    const payrollItem = await prisma.payrollItem.findUnique({
      where: { id: itemId },
      include: {
        payrollRun: true,
      },
    });

    if (!payrollItem) {
      return res.status(404).json({ message: "Payroll item not found" });
    }

    // Check access - employees can only generate their own payslips
    if (!userRoles.includes("ADMIN") && !userRoles.includes("HR")) {
      if (payrollItem.employeeId !== currentUserEmployeeId) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    // Generate payslip
    const payslipUrl = await generateAndSavePayslip(itemId);

    // Create audit log
    await createAuditLog(prisma, {
      action: "CREATE",
      entityType: "PayrollItem",
      entityId: itemId,
      payrollRunId: payrollItem.payrollRunId,
      performedBy: userId,
      description: "Payslip generated",
    });

    return res.status(200).json({
      message: "Payslip generated successfully",
      payslipUrl,
    });
  } catch (error: any) {
    console.error("Generate payslip error:", error);
    return res.status(500).json({ message: error.message || "Failed to generate payslip" });
  }
}

/**
 * Download payslip PDF
 */
export async function downloadPayslip(req: Request, res: Response) {
  try {
    const { itemId } = req.params;
    const currentUserEmployeeId = (req as any).user?.employeeId;
    const userRoles = (req as any).user?.roles || [];

    const payrollItem = await prisma.payrollItem.findUnique({
      where: { id: itemId },
    });

    if (!payrollItem) {
      return res.status(404).json({ message: "Payroll item not found" });
    }

    if (!payrollItem.payslipUrl) {
      return res.status(404).json({ message: "Payslip not generated yet" });
    }

    // Check access
    if (!userRoles.includes("ADMIN") && !userRoles.includes("HR")) {
      if (payrollItem.employeeId !== currentUserEmployeeId) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    // Serve the payslip file
    const filePath = path.join(process.cwd(), payrollItem.payslipUrl);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Payslip file not found" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="payslip_${payrollItem.id}.pdf"`
    );
    res.sendFile(filePath);
  } catch (error: any) {
    console.error("Download payslip error:", error);
    return res.status(500).json({ message: "Failed to download payslip" });
  }
}

/**
 * Get payslip data (for frontend rendering)
 */
export async function getPayslipData(req: Request, res: Response) {
  try {
    const { itemId } = req.params;
    const currentUserEmployeeId = (req as any).user?.employeeId;
    const userRoles = (req as any).user?.roles || [];

    const payrollItem = await prisma.payrollItem.findUnique({
      where: { id: itemId },
    });

    if (!payrollItem) {
      return res.status(404).json({ message: "Payroll item not found" });
    }

    // Check access
    if (!userRoles.includes("ADMIN") && !userRoles.includes("HR")) {
      if (payrollItem.employeeId !== currentUserEmployeeId) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    const payslipData = await generatePayslipData(itemId);
    return res.status(200).json(payslipData);
  } catch (error: any) {
    console.error("Get payslip data error:", error);
    return res.status(500).json({ message: error.message || "Failed to get payslip data" });
  }
}

