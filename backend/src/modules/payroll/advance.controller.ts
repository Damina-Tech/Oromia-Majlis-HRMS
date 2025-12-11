import { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import {
  CreateAdvanceDto,
  UpdateAdvanceDto,
  ApproveAdvanceDto,
  AddAdvanceRepaymentDto,
  ListAdvanceQuery,
} from "./advance.dto.js";

const prisma = new PrismaClient();

export async function createAdvance(req: Request, res: Response) {
  try {
    const dto = CreateAdvanceDto.parse(req.body);
    const userId = (req as any).user?.id;

    const advance = await prisma.advance.create({
      data: {
        employeeId: dto.employeeId,
        requestedAmount: new Prisma.Decimal(dto.requestedAmount),
        approvedAmount: new Prisma.Decimal(dto.requestedAmount), // Initially same as requested
        remainingAmount: new Prisma.Decimal(dto.requestedAmount), // Initially equals requested
        monthlyDeduction: new Prisma.Decimal(dto.monthlyDeduction),
        requestDate: new Date(dto.requestDate),
        status: "PENDING",
        description: dto.description,
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

    return res.status(201).json(advance);
  } catch (error: any) {
    console.error("Create advance error:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to create advance" });
  }
}

export async function listAdvances(req: Request, res: Response) {
  try {
    const query = ListAdvanceQuery.parse(req.query);
    const currentUserEmployeeId = (req as any).user?.employeeId;
    const userRoles = (req as any).user?.roles || [];

    const where: any = {};

    // If not admin/HR, only show own advances
    if (!userRoles.includes("ADMIN") && !userRoles.includes("HR")) {
      if (currentUserEmployeeId) {
        where.employeeId = currentUserEmployeeId;
      } else {
        return res.status(403).json({ message: "Access denied" });
      }
    } else if (query.employeeId) {
      where.employeeId = query.employeeId;
    }

    if (query.status) {
      where.status = query.status;
    }

    const skip = (query.page - 1) * query.pageSize;

    const [items, total] = await Promise.all([
      prisma.advance.findMany({
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
          repaymentHistory: {
            orderBy: { paymentDate: "desc" },
            take: 5, // Latest 5 repayments
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.advance.count({ where }),
    ]);

    return res.status(200).json({
      items,
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.ceil(total / query.pageSize),
    });
  } catch (error: any) {
    console.error("List advances error:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid query parameters", errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to list advances" });
  }
}

export async function getAdvance(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const currentUserEmployeeId = (req as any).user?.employeeId;
    const userRoles = (req as any).user?.roles || [];

    const advance = await prisma.advance.findUnique({
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
        repaymentHistory: {
          orderBy: { paymentDate: "desc" },
          include: {
            advance: {
              select: {
                id: true,
                approvedAmount: true,
              },
            },
          },
        },
      },
    });

    if (!advance) {
      return res.status(404).json({ message: "Advance not found" });
    }

    // Check access
    if (!userRoles.includes("ADMIN") && !userRoles.includes("HR")) {
      if (advance.employeeId !== currentUserEmployeeId) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    return res.status(200).json(advance);
  } catch (error: any) {
    console.error("Get advance error:", error);
    return res.status(500).json({ message: "Failed to get advance" });
  }
}

export async function updateAdvance(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const dto = UpdateAdvanceDto.parse(req.body);

    const existing = await prisma.advance.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ message: "Advance not found" });
    }

    const updateData: any = {};
    if (dto.monthlyDeduction !== undefined) updateData.monthlyDeduction = new Prisma.Decimal(dto.monthlyDeduction);
    if (dto.status) updateData.status = dto.status;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    // If status is REPAID and remaining amount is 0, mark as repaid
    if (dto.status === "REPAID" || (dto.status === undefined && parseFloat(existing.remainingAmount.toString()) <= 0)) {
      updateData.status = "REPAID";
    }

    const advance = await prisma.advance.update({
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
      },
    });

    return res.status(200).json(advance);
  } catch (error: any) {
    console.error("Update advance error:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to update advance" });
  }
}

export async function approveAdvance(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const dto = ApproveAdvanceDto.parse(req.body);

    const advance = await prisma.advance.update({
      where: { id },
      data: {
        approvedBy: dto.approvedBy,
        approvedAt: new Date(),
        status: "APPROVED",
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
      },
    });

    return res.status(200).json(advance);
  } catch (error: any) {
    console.error("Approve advance error:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to approve advance" });
  }
}

export async function addAdvanceRepayment(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const dto = AddAdvanceRepaymentDto.parse(req.body);

    const advance = await prisma.advance.findUnique({
      where: { id },
    });

    if (!advance) {
      return res.status(404).json({ message: "Advance not found" });
    }

    if (advance.status !== "APPROVED") {
      return res.status(400).json({ message: "Can only add repayment to approved advances" });
    }

    const repaymentAmount = dto.amount;
    const currentRemaining = parseFloat(advance.remainingAmount.toString());

    if (repaymentAmount > currentRemaining) {
      return res.status(400).json({
        message: `Repayment amount (${repaymentAmount}) exceeds remaining amount (${currentRemaining})`,
      });
    }

    // Create repayment record and update advance in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create repayment
      const repayment = await tx.advanceRepayment.create({
        data: {
          advanceId: id,
          payrollRunId: dto.payrollRunId,
          amount: new Prisma.Decimal(repaymentAmount),
          paymentDate: new Date(dto.paymentDate),
          notes: dto.notes,
        },
      });

      // Update advance remaining amount
      const newRemaining = currentRemaining - repaymentAmount;
      const updatedAdvance = await tx.advance.update({
        where: { id },
        data: {
          remainingAmount: new Prisma.Decimal(newRemaining),
          status: newRemaining <= 0 ? "REPAID" : "APPROVED",
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

      return { repayment, advance: updatedAdvance };
    });

    return res.status(201).json(result);
  } catch (error: any) {
    console.error("Add advance repayment error:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to add advance repayment" });
  }
}

export async function deleteAdvance(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const existing = await prisma.advance.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ message: "Advance not found" });
    }

    if (existing.status === "APPROVED" && parseFloat(existing.remainingAmount.toString()) > 0) {
      return res.status(400).json({ message: "Cannot delete approved advance with remaining balance" });
    }

    await prisma.advance.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (error: any) {
    console.error("Delete advance error:", error);
    return res.status(500).json({ message: "Failed to delete advance" });
  }
}

