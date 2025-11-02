import { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import {
  CreateAllowanceDto,
  UpdateAllowanceDto,
  AssignEmployeeAllowanceDto,
  ListAllowanceQuery,
} from "./allowance.dto.js";

const prisma = new PrismaClient();

// ========== Allowance Configuration CRUD ==========

export async function createAllowance(req: Request, res: Response) {
  try {
    const dto = CreateAllowanceDto.parse(req.body);

    const allowance = await prisma.allowance.create({
      data: {
        name: dto.name,
        type: dto.type,
        description: dto.description,
        amount: new Prisma.Decimal(dto.amount),
        isPercentage: dto.isPercentage,
        percentage: dto.percentage ? new Prisma.Decimal(dto.percentage) : null,
        isActive: dto.isActive,
      },
    });

    return res.status(201).json(allowance);
  } catch (error: any) {
    console.error("Create allowance error:", error);
    if (error.code === "P2002") {
      return res.status(400).json({ message: "Allowance name already exists" });
    }
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to create allowance" });
  }
}

export async function listAllowances(req: Request, res: Response) {
  try {
    const query = ListAllowanceQuery.parse(req.query);

    const where: any = {};
    if (query.type) where.type = query.type;
    if (query.isActive !== undefined) where.isActive = query.isActive;

    const skip = (query.page - 1) * query.pageSize;

    const [items, total] = await Promise.all([
      prisma.allowance.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: { name: "asc" },
      }),
      prisma.allowance.count({ where }),
    ]);

    return res.status(200).json({
      items,
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.ceil(total / query.pageSize),
    });
  } catch (error: any) {
    console.error("List allowances error:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid query parameters", errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to list allowances" });
  }
}

export async function getAllowance(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const allowance = await prisma.allowance.findUnique({
      where: { id },
    });

    if (!allowance) {
      return res.status(404).json({ message: "Allowance not found" });
    }

    return res.status(200).json(allowance);
  } catch (error: any) {
    console.error("Get allowance error:", error);
    return res.status(500).json({ message: "Failed to get allowance" });
  }
}

export async function updateAllowance(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const dto = UpdateAllowanceDto.parse(req.body);

    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.type) updateData.type = dto.type;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.amount !== undefined) updateData.amount = new Prisma.Decimal(dto.amount);
    if (dto.isPercentage !== undefined) updateData.isPercentage = dto.isPercentage;
    if (dto.percentage !== undefined) updateData.percentage = dto.percentage ? new Prisma.Decimal(dto.percentage) : null;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    const allowance = await prisma.allowance.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json(allowance);
  } catch (error: any) {
    console.error("Update allowance error:", error);
    if (error.code === "P2002") {
      return res.status(400).json({ message: "Allowance name already exists" });
    }
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to update allowance" });
  }
}

export async function deleteAllowance(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Check if allowance has assignments
    const assignmentCount = await prisma.employeeAllowance.count({
      where: { allowanceId: id },
    });

    if (assignmentCount > 0) {
      return res.status(400).json({
        message: `Cannot delete allowance. It is assigned to ${assignmentCount} employee(s).`,
      });
    }

    await prisma.allowance.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (error: any) {
    console.error("Delete allowance error:", error);
    return res.status(500).json({ message: "Failed to delete allowance" });
  }
}

// ========== Employee Allowance Assignment ==========

export async function assignEmployeeAllowance(req: Request, res: Response) {
  try {
    const dto = AssignEmployeeAllowanceDto.parse(req.body);

    // Verify employee and allowance exist
    const [employee, allowance] = await Promise.all([
      prisma.employee.findUnique({ where: { id: dto.employeeId } }),
      prisma.allowance.findUnique({ where: { id: dto.allowanceId } }),
    ]);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    if (!allowance) {
      return res.status(404).json({ message: "Allowance not found" });
    }

    if (!allowance.isActive) {
      return res.status(400).json({ message: "Cannot assign inactive allowance" });
    }

    // Calculate amount if percentage-based
    let amount = dto.amount;
    if (allowance.isPercentage && allowance.percentage) {
      const employeeSalary = employee.salary ? parseFloat(employee.salary.toString()) : 0;
      const basicSalary = employeeSalary * 0.70; // 70% basic
      amount = basicSalary * (parseFloat(allowance.percentage.toString()) / 100);
    }

    const employeeAllowance = await prisma.employeeAllowance.upsert({
      where: {
        employeeId_allowanceId_month: {
          employeeId: dto.employeeId,
          allowanceId: dto.allowanceId,
          month: dto.month,
        },
      },
      create: {
        employeeId: dto.employeeId,
        allowanceId: dto.allowanceId,
        month: dto.month,
        amount: new Prisma.Decimal(amount),
        notes: dto.notes,
      },
      update: {
        amount: new Prisma.Decimal(amount),
        notes: dto.notes,
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
        allowance: true,
      },
    });

    return res.status(201).json(employeeAllowance);
  } catch (error: any) {
    console.error("Assign employee allowance error:", error);
    if (error.code === "P2002") {
      return res.status(400).json({ message: "Allowance already assigned for this month" });
    }
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to assign employee allowance" });
  }
}

export async function listEmployeeAllowances(req: Request, res: Response) {
  try {
    const { employeeId, month } = req.query;

    const where: any = {};
    if (employeeId) where.employeeId = employeeId as string;
    if (month) where.month = month as string;

    const allowances = await prisma.employeeAllowance.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
          },
        },
        allowance: true,
      },
      orderBy: [{ month: "desc" }, { createdAt: "desc" }],
    });

    return res.status(200).json(allowances);
  } catch (error: any) {
    console.error("List employee allowances error:", error);
    return res.status(500).json({ message: "Failed to list employee allowances" });
  }
}

export async function removeEmployeeAllowance(req: Request, res: Response) {
  try {
    const { id } = req.params;

    await prisma.employeeAllowance.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (error: any) {
    console.error("Remove employee allowance error:", error);
    return res.status(500).json({ message: "Failed to remove employee allowance" });
  }
}

