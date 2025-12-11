import { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import {
  CreateSalaryIncrementDto,
  BulkIncrementDto,
  ListSalaryIncrementQuery,
} from "./salary-increment.dto.js";

const prisma = new PrismaClient();

export async function createSalaryIncrement(req: Request, res: Response) {
  try {
    const dto = CreateSalaryIncrementDto.parse(req.body);
    const userId = (req as any).user?.id;

    if (!dto.incrementAmount && !dto.incrementPercentage) {
      return res.status(400).json({
        message: "Either incrementAmount or incrementPercentage must be provided",
      });
    }

    // Get employee current salary
    const employee = await prisma.employee.findUnique({
      where: { id: dto.employeeId },
      include: {
        salaryGrade: true,
        salaryStep: true,
      },
    });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const currentSalary = employee.salary
      ? parseFloat(employee.salary.toString())
      : employee.salaryStep
      ? parseFloat(employee.salaryStep.salary.toString())
      : 0;

    if (currentSalary === 0) {
      return res.status(400).json({ message: "Employee has no salary set" });
    }

    // Calculate increment
    let incrementAmount: number;
    let incrementPercentage: number;
    let newSalary: number;

    if (dto.incrementAmount) {
      incrementAmount = dto.incrementAmount;
      incrementPercentage = (incrementAmount / currentSalary) * 100;
      newSalary = currentSalary + incrementAmount;
    } else {
      incrementPercentage = dto.incrementPercentage!;
      incrementAmount = (currentSalary * incrementPercentage) / 100;
      newSalary = currentSalary + incrementAmount;
    }

    // Create increment record and update employee salary in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create increment history
      const increment = await tx.salaryIncrement.create({
        data: {
          employeeId: dto.employeeId,
          previousSalary: new Prisma.Decimal(currentSalary),
          newSalary: new Prisma.Decimal(newSalary),
          incrementAmount: new Prisma.Decimal(incrementAmount),
          incrementPercentage: new Prisma.Decimal(incrementPercentage),
          effectiveDate: new Date(dto.incrementDate),
          reason: dto.reason,
          approvedBy: userId,
          notes: dto.notes,
        },
      });

      // Update employee salary
      await tx.employee.update({
        where: { id: dto.employeeId },
        data: {
          salary: new Prisma.Decimal(newSalary),
          lastIncrementDate: new Date(dto.incrementDate),
        },
      });

      return increment;
    });

    const incrementWithEmployee = await prisma.salaryIncrement.findUnique({
      where: { id: result.id },
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

    return res.status(201).json(incrementWithEmployee);
  } catch (error: any) {
    console.error("Create salary increment error:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to create salary increment" });
  }
}

export async function bulkIncrement(req: Request, res: Response) {
  try {
    const dto = BulkIncrementDto.parse(req.body);
    const userId = (req as any).user?.id;

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
        salaryGrade: true,
        salaryStep: true,
      },
    });

    const incrementDate = new Date(dto.incrementDate);
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as Array<{ employeeId: string; error: string }>,
    };

    // Process increments in a transaction
    await prisma.$transaction(async (tx) => {
      for (const employee of employees) {
        try {
          const currentSalary = employee.salary
            ? parseFloat(employee.salary.toString())
            : employee.salaryStep
            ? parseFloat(employee.salaryStep.salary.toString())
            : 0;

          if (currentSalary === 0) {
            results.failed++;
            results.errors.push({
              employeeId: employee.id,
              error: "Employee has no salary set",
            });
            continue;
          }

          const incrementAmount = (currentSalary * dto.incrementPercentage) / 100;
          const newSalary = currentSalary + incrementAmount;
          const incrementPercentage = dto.incrementPercentage;

          // Create increment history
          await tx.salaryIncrement.create({
            data: {
              employeeId: employee.id,
              previousSalary: new Prisma.Decimal(currentSalary),
              newSalary: new Prisma.Decimal(newSalary),
              incrementAmount: new Prisma.Decimal(incrementAmount),
              incrementPercentage: new Prisma.Decimal(incrementPercentage),
              effectiveDate: incrementDate,
              reason: dto.reason,
              approvedBy: userId,
              notes: dto.notes,
            },
          });

          // Update employee salary
          await tx.employee.update({
            where: { id: employee.id },
            data: {
              salary: new Prisma.Decimal(newSalary),
              lastIncrementDate: incrementDate,
            },
          });

          results.successful++;
        } catch (error: any) {
          results.failed++;
          results.errors.push({
            employeeId: employee.id,
            error: error.message || "Failed to process increment",
          });
        }
      }
    });

    return res.status(200).json({
      message: `Bulk increment completed. ${results.successful} successful, ${results.failed} failed.`,
      results,
    });
  } catch (error: any) {
    console.error("Bulk increment error:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to process bulk increment" });
  }
}

export async function listSalaryIncrements(req: Request, res: Response) {
  try {
    const query = ListSalaryIncrementQuery.parse(req.query);
    const currentUserEmployeeId = (req as any).user?.employeeId;
    const userRoles = (req as any).user?.roles || [];

    const where: any = {};

    // If not admin/HR, only show own increments
    if (!userRoles.includes("ADMIN") && !userRoles.includes("HR")) {
      if (currentUserEmployeeId) {
        where.employeeId = currentUserEmployeeId;
      } else {
        return res.status(403).json({ message: "Access denied" });
      }
    } else if (query.employeeId) {
      where.employeeId = query.employeeId;
    }

    if (query.year) {
      where.effectiveDate = {
        gte: new Date(query.year, 0, 1),
        lte: new Date(query.year, 11, 31),
      };
    }

    const skip = (query.page - 1) * query.pageSize;

    const [items, total] = await Promise.all([
      prisma.salaryIncrement.findMany({
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
            },
          },
        },
        orderBy: { effectiveDate: "desc" },
      }),
      prisma.salaryIncrement.count({ where }),
    ]);

    return res.status(200).json({
      items,
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.ceil(total / query.pageSize),
    });
  } catch (error: any) {
    console.error("List salary increments error:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid query parameters", errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to list salary increments" });
  }
}

export async function getSalaryIncrement(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const currentUserEmployeeId = (req as any).user?.employeeId;
    const userRoles = (req as any).user?.roles || [];

    const increment = await prisma.salaryIncrement.findUnique({
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
          },
        },
      },
    });

    if (!increment) {
      return res.status(404).json({ message: "Salary increment not found" });
    }

    // Check access
    if (!userRoles.includes("ADMIN") && !userRoles.includes("HR")) {
      if (increment.employeeId !== currentUserEmployeeId) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    return res.status(200).json(increment);
  } catch (error: any) {
    console.error("Get salary increment error:", error);
    return res.status(500).json({ message: "Failed to get salary increment" });
  }
}

