import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../../db/client.js";
import { z } from "zod";

const CreateLeaveBalanceDto = z.object({
  employeeId: z.string(),
  leaveType: z.enum(["CASUAL", "SICK", "VACATION", "MATERNITY", "PERSONAL"]),
  year: z.number().int().min(2020).max(2100),
  allocatedDays: z.number().min(0),
  carriedOver: z.number().min(0).default(0),
});

const UpdateLeaveBalanceDto = z.object({
  allocatedDays: z.number().min(0).optional(),
  usedDays: z.number().min(0).optional(),
  carriedOver: z.number().min(0).optional(),
});

// GET /api/v1/leave-balances - List all leave balances
export async function listLeaveBalances(req: Request, res: Response) {
  try {
    const { employeeId, year, leaveType, page = 1, pageSize = 10, search } = req.query;
    
    const where: Prisma.LeaveBalanceWhereInput = {};
    
    if (employeeId) {
      where.employeeId = employeeId as string;
    }
    
    if (year) {
      where.year = parseInt(year as string);
    }
    
    if (leaveType) {
      where.leaveType = leaveType as any;
    }
    
    if (search) {
      where.employee = {
        OR: [
          { firstName: { contains: search as string, mode: "insensitive" } },
          { lastName: { contains: search as string, mode: "insensitive" } },
          { email: { contains: search as string, mode: "insensitive" } },
        ],
      };
    }

    const [items, total] = await Promise.all([
      prisma.leaveBalance.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              designation: true,
              employeeCode: true,
            },
          },
        },
        orderBy: [
          { year: "desc" },
          { employee: { firstName: "asc" } },
        ],
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
      }),
      prisma.leaveBalance.count({ where }),
    ]);

    // Convert Decimal to number for JSON serialization
    const serializedItems = items.map((item) => ({
      ...item,
      allocatedDays: Number(item.allocatedDays),
      usedDays: Number(item.usedDays),
      carriedOver: Number(item.carriedOver),
      availableDays: Number(item.availableDays),
    }));

    res.json({
      items: serializedItems,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    });
  } catch (error) {
    console.error("List leave balances error:", error);
    res.status(500).json({ message: "Failed to fetch leave balances" });
  }
}

// GET /api/v1/leave-balances/:id - Get specific leave balance
export async function getLeaveBalance(req: Request, res: Response) {
  try {
    const balance = await prisma.leaveBalance.findUnique({
      where: { id: req.params.id },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            designation: true,
            employeeCode: true,
          },
        },
      },
    });

    if (!balance) {
      return res.status(404).json({ message: "Leave balance not found" });
    }

    // Convert Decimal to number
    const serialized = {
      ...balance,
      allocatedDays: Number(balance.allocatedDays),
      usedDays: Number(balance.usedDays),
      carriedOver: Number(balance.carriedOver),
      availableDays: Number(balance.availableDays),
    };

    res.json(serialized);
  } catch (error) {
    console.error("Get leave balance error:", error);
    res.status(500).json({ message: "Failed to fetch leave balance" });
  }
}

// POST /api/v1/leave-balances - Create new leave balance
export async function createLeaveBalance(req: Request, res: Response) {
  try {
    const data = CreateLeaveBalanceDto.parse(req.body);
    
    // Calculate available days
    const availableDays = data.allocatedDays + data.carriedOver;
    
    // Check if balance already exists
    const existing = await prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveType_year: {
          employeeId: data.employeeId,
          leaveType: data.leaveType,
          year: data.year,
        },
      },
    });

    if (existing) {
      return res.status(409).json({ 
        message: `Leave balance already exists for this employee, leave type, and year` 
      });
    }

    const balance = await prisma.leaveBalance.create({
      data: {
        employeeId: data.employeeId,
        leaveType: data.leaveType,
        year: data.year,
        allocatedDays: data.allocatedDays,
        usedDays: 0,
        carriedOver: data.carriedOver,
        availableDays: availableDays,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            designation: true,
            employeeCode: true,
          },
        },
      },
    });

    // Convert Decimal to number
    const serialized = {
      ...balance,
      allocatedDays: Number(balance.allocatedDays),
      usedDays: Number(balance.usedDays),
      carriedOver: Number(balance.carriedOver),
      availableDays: Number(balance.availableDays),
    };

    res.status(201).json(serialized);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid input data", errors: error.errors });
    }
    console.error("Create leave balance error:", error);
    res.status(500).json({ message: "Failed to create leave balance" });
  }
}

// PUT /api/v1/leave-balances/:id - Update leave balance
export async function updateLeaveBalance(req: Request, res: Response) {
  try {
    const data = UpdateLeaveBalanceDto.parse(req.body);
    const balanceId = req.params.id;

    // Get current balance
    const current = await prisma.leaveBalance.findUnique({
      where: { id: balanceId },
    });

    if (!current) {
      return res.status(404).json({ message: "Leave balance not found" });
    }

    // Calculate available days
    const allocatedDays = data.allocatedDays !== undefined 
      ? Number(data.allocatedDays) 
      : Number(current.allocatedDays);
    const usedDays = data.usedDays !== undefined 
      ? Number(data.usedDays) 
      : Number(current.usedDays);
    const carriedOver = data.carriedOver !== undefined 
      ? Number(data.carriedOver) 
      : Number(current.carriedOver);
    
    const availableDays = allocatedDays - usedDays + carriedOver;

    const updated = await prisma.leaveBalance.update({
      where: { id: balanceId },
      data: {
        ...(data.allocatedDays !== undefined && { allocatedDays: data.allocatedDays }),
        ...(data.usedDays !== undefined && { usedDays: data.usedDays }),
        ...(data.carriedOver !== undefined && { carriedOver: data.carriedOver }),
        availableDays: availableDays,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            designation: true,
            employeeCode: true,
          },
        },
      },
    });

    // Convert Decimal to number
    const serialized = {
      ...updated,
      allocatedDays: Number(updated.allocatedDays),
      usedDays: Number(updated.usedDays),
      carriedOver: Number(updated.carriedOver),
      availableDays: Number(updated.availableDays),
    };

    res.json(serialized);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid input data", errors: error.errors });
    }
    console.error("Update leave balance error:", error);
    res.status(500).json({ message: "Failed to update leave balance" });
  }
}

// DELETE /api/v1/leave-balances/:id - Delete leave balance
export async function deleteLeaveBalance(req: Request, res: Response) {
  try {
    await prisma.leaveBalance.delete({
      where: { id: req.params.id },
    });

    res.status(204).send();
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Leave balance not found" });
    }
    console.error("Delete leave balance error:", error);
    res.status(500).json({ message: "Failed to delete leave balance" });
  }
}

// POST /api/v1/leave-balances/carry-over - Carry over unused leave to next year
export async function carryOverLeave(req: Request, res: Response) {
  try {
    const { employeeId, leaveType, fromYear, toYear, daysToCarryOver } = z.object({
      employeeId: z.string(),
      leaveType: z.enum(["CASUAL", "SICK", "VACATION", "MATERNITY", "PERSONAL"]),
      fromYear: z.number().int(),
      toYear: z.number().int(),
      daysToCarryOver: z.number().min(0),
    }).parse(req.body);

    // Validate years
    if (toYear !== fromYear + 1) {
      return res.status(400).json({ 
        message: "Can only carry over to the next consecutive year" 
      });
    }

    // Get source balance
    const sourceBalance = await prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveType_year: {
          employeeId,
          leaveType,
          year: fromYear,
        },
      },
    });

    if (!sourceBalance) {
      return res.status(404).json({ 
        message: `Leave balance not found for ${fromYear}` 
      });
    }

    const available = Number(sourceBalance.availableDays);
    if (daysToCarryOver > available) {
      return res.status(400).json({ 
        message: `Cannot carry over more days than available. Available: ${available}` 
      });
    }

    // Execute carry-over in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get or create target year balance
      let targetBalance = await tx.leaveBalance.findUnique({
        where: {
          employeeId_leaveType_year: {
            employeeId,
            leaveType,
            year: toYear,
          },
        },
      });

      if (targetBalance) {
        // Update existing balance
        targetBalance = await tx.leaveBalance.update({
          where: { id: targetBalance.id },
          data: {
            carriedOver: { increment: daysToCarryOver },
            availableDays: { increment: daysToCarryOver },
          },
        });
      } else {
        // Create new balance with carried over days
        const defaultAllocated = leaveType === "CASUAL" ? 12 :
                                leaveType === "SICK" ? 10 :
                                leaveType === "VACATION" ? 21 :
                                leaveType === "MATERNITY" ? 90 : 5;
        
        targetBalance = await tx.leaveBalance.create({
          data: {
            employeeId,
            leaveType,
            year: toYear,
            allocatedDays: defaultAllocated,
            usedDays: 0,
            carriedOver: daysToCarryOver,
            availableDays: defaultAllocated + daysToCarryOver,
          },
        });
      }

      return {
        fromYear: sourceBalance.year,
        toYear: targetBalance.year,
        daysCarriedOver: daysToCarryOver,
        newAvailable: Number(targetBalance.availableDays),
      };
    });

    res.json(result);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid input data", errors: error.errors });
    }
    console.error("Carry over leave error:", error);
    res.status(500).json({ message: "Failed to carry over leave" });
  }
}

