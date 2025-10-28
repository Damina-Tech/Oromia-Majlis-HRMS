import { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import {
  CreateLeaveRequestDto,
  UpdateLeaveStatusDto,
  ListLeaveRequestsQuery,
} from "./leave.dto.js";

const prisma = new PrismaClient();

// Helper function to calculate days between two dates
function calculateDays(startDate: Date, endDate: Date): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
}

// GET /api/v1/leaves - List leave requests
export async function listLeaveRequests(req: Request, res: Response) {
  try {
    const query = ListLeaveRequestsQuery.parse(req.query);
    const { status, employeeId, page, pageSize } = query;

    const where: Prisma.LeaveRequestWhereInput = {};
    
    if (status) {
      where.status = status;
    }
    
    // If user is not admin/HR, only show their own leave requests
    const userEmployeeId = (req as any).user?.employeeId;
    if (employeeId) {
      where.employeeId = employeeId;
    } else if (userEmployeeId) {
      // Regular employees can only see their own leaves
      where.employeeId = userEmployeeId;
    }

    const [items, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              designation: true,
            },
          },
          approver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.leaveRequest.count({ where }),
    ]);

    res.json({
      items,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("List leave requests error:", error);
    res.status(500).json({ message: "Failed to fetch leave requests" });
  }
}

// GET /api/v1/leaves/:id - Get specific leave request
export async function getLeaveRequest(req: Request, res: Response) {
  try {
    const leave = await prisma.leaveRequest.findUnique({
      where: { id: req.params.id },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            designation: true,
          },
        },
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!leave) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    res.json(leave);
  } catch (error) {
    console.error("Get leave request error:", error);
    res.status(500).json({ message: "Failed to fetch leave request" });
  }
}

// POST /api/v1/leaves - Create new leave request
export async function createLeaveRequest(req: Request, res: Response) {
  try {
    const data = CreateLeaveRequestDto.parse(req.body);
    const userEmployeeId = (req as any).user?.employeeId;

    if (!userEmployeeId) {
      return res.status(403).json({ message: "Employee record not found for user" });
    }

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const days = calculateDays(startDate, endDate);

    // Check if employee has leave balance
    const balance = await prisma.leaveBalance.findUnique({
      where: { employeeId: userEmployeeId },
    });

    if (balance) {
      const leaveTypeMap: Record<string, keyof typeof balance> = {
        CASUAL: "casualLeave",
        SICK: "sickLeave",
        VACATION: "vacationLeave",
        PERSONAL: "personalLeave",
      };

      const balanceField = leaveTypeMap[data.type];
      if (balanceField && (balance[balanceField] as number) < days) {
        return res.status(400).json({
          message: `Insufficient leave balance. Available: ${balance[balanceField]} days, Requested: ${days} days`,
        });
      }
    }

    const leave = await prisma.leaveRequest.create({
      data: {
        employeeId: userEmployeeId,
        type: data.type,
        startDate,
        endDate,
        days,
        reason: data.reason,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json(leave);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid input data", errors: error });
    }
    console.error("Create leave request error:", error);
    res.status(500).json({ message: "Failed to create leave request" });
  }
}

// PUT /api/v1/leaves/:id/status - Approve or reject leave
export async function updateLeaveStatus(req: Request, res: Response) {
  try {
    const data = UpdateLeaveStatusDto.parse(req.body);
    const approverId = (req as any).user?.employeeId || null; // Admin might not have employee record

    const leave = await prisma.leaveRequest.findUnique({
      where: { id: req.params.id },
      include: { employee: true },
    });

    if (!leave) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    if (leave.status !== "PENDING") {
      return res.status(400).json({ message: "Leave request already processed" });
    }

    // Update leave balance if approved
    if (data.status === "APPROVED") {
      const balance = await prisma.leaveBalance.findUnique({
        where: { employeeId: leave.employeeId },
      });

      if (balance) {
        const leaveTypeMap: Record<string, keyof typeof balance> = {
          CASUAL: "casualLeave",
          SICK: "sickLeave",
          VACATION: "vacationLeave",
          PERSONAL: "personalLeave",
        };

        const balanceField = leaveTypeMap[leave.type];
        if (balanceField) {
          await prisma.leaveBalance.update({
            where: { employeeId: leave.employeeId },
            data: {
              [balanceField]: {
                decrement: leave.days,
              },
            },
          });
        }
      }
    }

    const updated = await prisma.leaveRequest.update({
      where: { id: req.params.id },
      data: {
        status: data.status,
        approverId,
        approvedAt: new Date(),
        rejectionReason: data.rejectionReason,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid input data", errors: error });
    }
    console.error("Update leave status error:", error);
    res.status(500).json({ message: "Failed to update leave status" });
  }
}

// GET /api/v1/leaves/balance/:employeeId - Get leave balance
export async function getLeaveBalance(req: Request, res: Response) {
  try {
    const { employeeId } = req.params;
    const userEmployeeId = (req as any).user?.employeeId;

    // Users can only see their own balance unless they're admin/HR
    if (employeeId !== userEmployeeId) {
      // TODO: Add role check for admin/HR
      return res.status(403).json({ message: "Access denied" });
    }

    let balance = await prisma.leaveBalance.findUnique({
      where: { employeeId },
    });

    // Create default balance if doesn't exist
    if (!balance) {
      balance = await prisma.leaveBalance.create({
        data: { employeeId },
      });
    }

    res.json(balance);
  } catch (error) {
    console.error("Get leave balance error:", error);
    res.status(500).json({ message: "Failed to fetch leave balance" });
  }
}

// DELETE /api/v1/leaves/:id - Cancel leave request
export async function cancelLeaveRequest(req: Request, res: Response) {
  try {
    const userEmployeeId = (req as any).user?.employeeId;

    const leave = await prisma.leaveRequest.findUnique({
      where: { id: req.params.id },
    });

    if (!leave) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    // Only the employee who created the request can cancel it
    if (leave.employeeId !== userEmployeeId) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (leave.status !== "PENDING") {
      return res.status(400).json({ message: "Can only cancel pending requests" });
    }

    await prisma.leaveRequest.update({
      where: { id: req.params.id },
      data: { status: "CANCELLED" },
    });

    res.status(204).send();
  } catch (error) {
    console.error("Cancel leave request error:", error);
    res.status(500).json({ message: "Failed to cancel leave request" });
  }
}

