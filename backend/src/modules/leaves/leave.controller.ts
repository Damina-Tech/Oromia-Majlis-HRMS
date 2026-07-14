import { Request, Response } from "express";
import { Prisma, NotificationModule, NotificationType } from "@prisma/client";
import prisma from "../../db/client.js";
import {
  CreateLeaveRequestDto,
  UpdateLeaveStatusDto,
  UpdateLeaveRequestDto,
  ListLeaveRequestsQuery,
} from "./leave.dto.js";

import { NotificationService } from "../notifications/notification.service.js";

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
    const { status, employeeId, search, startDate, endDate, type, sortBy, sortOrder, page, pageSize } = query;
    const user = (req as any).user;
    const userRoles = user?.roles || [];
    const userPermissions = user?.permissions || [];
    const isAdminOrHR = userRoles.includes("ADMIN") || userRoles.includes("HR") || 
                       userPermissions.includes("leave.manage") || userPermissions.includes("leave.approve");
    const userEmployeeId = user?.employeeId;

    const where: Prisma.LeaveRequestWhereInput = {};
    
    if (status) {
      where.status = status;
    }
    
    if (type) {
      where.type = type;
    }
    
    // Date range filtering
    if (startDate || endDate) {
      where.AND = [
        startDate ? { startDate: { gte: new Date(startDate) } } : undefined,
        endDate ? { endDate: { lte: new Date(endDate) } } : undefined,
      ].filter(Boolean) as Prisma.LeaveRequestWhereInput[];
    }
    
    // If user is not admin/HR/manager, only show their own leave requests
    if (employeeId) {
      where.employeeId = employeeId;
    } else if (!isAdminOrHR && userEmployeeId) {
      // Regular employees can only see their own leaves
      where.employeeId = userEmployeeId;
    }
    
    // Search by employee name or email
    if (search) {
      where.employee = {
        OR: [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    // Build orderBy clause
    let orderBy: Prisma.LeaveRequestOrderByWithRelationInput = {};
    if (sortBy === "startDate") {
      orderBy = { startDate: sortOrder };
    } else if (sortBy === "endDate") {
      orderBy = { endDate: sortOrder };
    } else if (sortBy === "days") {
      orderBy = { days: sortOrder };
    } else if (sortBy === "status") {
      orderBy = { status: sortOrder };
    } else {
      orderBy = { createdAt: sortOrder };
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
        orderBy,
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
    const user = (req as any).user;
    const userRoles = user?.roles || [];
    const userPermissions = user?.permissions || [];
    const isAdminOrHR = userRoles.includes("ADMIN") || userRoles.includes("HR") || 
                       userPermissions.includes("leave.manage");
    
    // Determine which employee this request is for
    let targetEmployeeId: string;
    if (data.employeeId) {
      // If employeeId is provided, check if user has permission to create for others
      if (!isAdminOrHR) {
        return res.status(403).json({ message: "You don't have permission to create leave requests for other employees" });
      }
      targetEmployeeId = data.employeeId;
    } else {
      // Otherwise, create for the current user
      const userEmployeeId = user?.employeeId;
      if (!userEmployeeId) {
        return res.status(403).json({ message: "Employee record not found for user" });
      }
      targetEmployeeId = userEmployeeId;
    }

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    let days = calculateDays(startDate, endDate);
    
    // If half day is enabled and startDate === endDate, reduce to 0.5
    if (data.halfDay && startDate.toDateString() === endDate.toDateString()) {
      days = 0.5;
    }

    // Check if employee has leave balance (for the target employee)
    const currentYear = new Date().getFullYear();
    const balances = await prisma.leaveBalance.findMany({
      where: {
        employeeId: targetEmployeeId,
        year: currentYear,
        leaveType: data.type,
      },
    });

    if (balances.length > 0) {
      const balance = balances[0];
      const availableDays = Number(balance.availableDays);
      if (availableDays < days) {
        return res.status(400).json({
          message: `Insufficient leave balance. Available: ${availableDays} days, Requested: ${days} days`,
        });
      }
    }

    const leave = await prisma.leaveRequest.create({
      data: {
        employeeId: targetEmployeeId,
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
            departmentId: true,
            userId: true,
          },
        },
      },
    });

    try {
      await NotificationService.sendNotification({
        module: NotificationModule.LEAVE,
        type: NotificationType.INFO,
        title: "New leave request submitted",
        message: `${leave.employee.firstName} ${leave.employee.lastName} submitted a ${leave.type.toLowerCase()} leave request.`,
        resourceType: "LEAVE_REQUEST",
        resourceId: leave.id,
        dedupKey: `leave-submitted-${leave.employeeId}`,
        data: {
          leaveId: leave.id,
          startDate: leave.startDate,
          endDate: leave.endDate,
          days: leave.days,
          employeeId: leave.employeeId,
        },
        targets: {
          roleNames: ["HR", "MANAGER"],
          departmentIds: leave.employee?.departmentId
            ? [leave.employee.departmentId]
            : undefined,
          excludeUserIds: [user.id],
        },
      });
    } catch (notifyError) {
      console.warn("Failed to send leave submission notification:", notifyError);
    }

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
    const user = (req as any).user;
    // For approval, we need an approver. If admin doesn't have employeeId, we'll use their userId
    // But first, try to find if they have an employee record
    let approverId: string | null = null;
    if (user?.employeeId) {
      approverId = user.employeeId;
    } else if (user?.id) {
      // Admin might not have employee record, but we still want to track who approved
      // We'll try to find their employee record by userId
      const adminEmployee = await prisma.employee.findFirst({
        where: {
          user: {
            id: user.id,
          },
        },
        select: { id: true },
      });
      approverId = adminEmployee?.id || null;
    }

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
      const currentYear = new Date(leave.startDate).getFullYear();
      const balance = await prisma.leaveBalance.findUnique({
        where: {
          employeeId_leaveType_year: {
            employeeId: leave.employeeId,
            leaveType: leave.type,
            year: currentYear,
          },
        },
      });

      if (balance) {
        // Update usedDays and recalculate availableDays
        const newUsedDays = Number(balance.usedDays) + Number(leave.days);
        const availableDays = Number(balance.allocatedDays) + Number(balance.carriedOver) - newUsedDays;
        
        await prisma.leaveBalance.update({
          where: {
            employeeId_leaveType_year: {
              employeeId: leave.employeeId,
              leaveType: leave.type,
              year: currentYear,
            },
          },
          data: {
            usedDays: newUsedDays,
            availableDays: availableDays,
          },
        });
      } else {
        // Create balance entry if it doesn't exist
        await prisma.leaveBalance.create({
          data: {
            employeeId: leave.employeeId,
            leaveType: leave.type,
            year: currentYear,
            allocatedDays: 0,
            usedDays: Number(leave.days),
            carriedOver: 0,
            availableDays: -Number(leave.days), // Negative balance
          },
        });
      }
    }

    const updated = await prisma.leaveRequest.update({
      where: { id: req.params.id },
      data: {
        status: data.status,
        approverId,
        approvedAt: new Date(),
        rejectionReason: data.comment || data.rejectionReason, // Use comment for both approval comments and rejection reasons
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            userId: true,
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

    try {
      if (updated.employee?.userId) {
        const statusMessage =
          data.status === "APPROVED"
            ? "approved"
            : data.status === "REJECTED"
            ? "rejected"
            : "updated";

        await NotificationService.sendNotification({
          module: NotificationModule.LEAVE,
          type:
            data.status === "APPROVED"
              ? NotificationType.SUCCESS
              : data.status === "REJECTED"
              ? NotificationType.WARNING
              : NotificationType.INFO,
          title: `Leave request ${statusMessage}`,
          message:
            data.status === "APPROVED"
              ? "Your leave request has been approved."
              : data.status === "REJECTED"
              ? `Your leave request was rejected${data.comment ? `: ${data.comment}` : ""}.`
              : `Your leave request status changed to ${String(data.status).toLowerCase()}.`,
          resourceType: "LEAVE_REQUEST",
          resourceId: updated.id,
          targets: {
            userIds: [updated.employee.userId],
          },
        });
      }
    } catch (notifyError) {
      console.warn("Failed to send leave status notification:", notifyError);
    }

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
    const { year } = req.query;
    const userEmployeeId = (req as any).user?.employeeId;

    // Check if user has permission to view other employees' balances
    const user = (req as any).user;
    const userRoles = user?.roles || [];
    const userPermissions = user?.permissions || [];
    const isAdminOrHR = userRoles.includes("ADMIN") || userRoles.includes("HR") || 
                       userPermissions.includes("leave.manage") || userPermissions.includes("leave.read");
    
    // Users can only see their own balance unless they're admin/HR
    if (employeeId !== userEmployeeId && !isAdminOrHR) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Get current year if not specified
    const currentYear = year ? parseInt(year as string) : new Date().getFullYear();

    // Fetch all leave balances for this employee and year
    const balances = await prisma.leaveBalance.findMany({
      where: {
        employeeId,
        year: currentYear,
      },
    });

    // Aggregate balances into the old format for backward compatibility
    // Default values if no balances exist
    const aggregated = {
      id: `balance-${employeeId}-${currentYear}`,
      employeeId,
      casualLeave: 0,
      sickLeave: 0,
      vacationLeave: 0,
      personalLeave: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Aggregate by leave type
    balances.forEach((balance) => {
      const availableDays = Number(balance.availableDays);
      switch (balance.leaveType) {
        case "CASUAL":
          aggregated.casualLeave = availableDays;
          break;
        case "SICK":
          aggregated.sickLeave = availableDays;
          break;
        case "VACATION":
          aggregated.vacationLeave = availableDays;
          break;
        case "PERSONAL":
          aggregated.personalLeave = availableDays;
          break;
      }
    });

    // If no balances exist, create default balances for current year
    if (balances.length === 0) {
      const defaultBalances = [
        { leaveType: "CASUAL" as const, allocatedDays: 12 },
        { leaveType: "SICK" as const, allocatedDays: 10 },
        { leaveType: "VACATION" as const, allocatedDays: 21 },
        { leaveType: "PERSONAL" as const, allocatedDays: 5 },
      ];

      await prisma.$transaction(
        defaultBalances.map((defaultBalance) =>
          prisma.leaveBalance.create({
            data: {
              employeeId,
              leaveType: defaultBalance.leaveType,
              year: currentYear,
              allocatedDays: defaultBalance.allocatedDays,
              usedDays: 0,
              carriedOver: 0,
              availableDays: defaultBalance.allocatedDays,
            },
          })
        )
      );

      // Update aggregated with defaults
      aggregated.casualLeave = 12;
      aggregated.sickLeave = 10;
      aggregated.vacationLeave = 21;
      aggregated.personalLeave = 5;
    }

    res.json(aggregated);
  } catch (error) {
    console.error("Get leave balance error:", error);
    res.status(500).json({ message: "Failed to fetch leave balance" });
  }
}

// PUT /api/v1/leaves/:id - Update leave request (for admins/managers)
export async function updateLeaveRequest(req: Request, res: Response) {
  try {
    const data = UpdateLeaveRequestDto.parse(req.body);
    const user = (req as any).user;
    const userRoles = user?.roles || [];
    const userPermissions = user?.permissions || [];
    const isAdminOrHR = userRoles.includes("ADMIN") || userRoles.includes("HR") || 
                       userPermissions.includes("leave.manage");

    const leave = await prisma.leaveRequest.findUnique({
      where: { id: req.params.id },
      include: { employee: true },
    });

    if (!leave) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    // Only admins/managers can edit leave requests
    if (!isAdminOrHR) {
      return res.status(403).json({ message: "You don't have permission to edit leave requests" });
    }

    // Can only edit pending requests
    if (leave.status !== "PENDING") {
      return res.status(400).json({ message: "Can only edit pending leave requests" });
    }

    // Calculate new days if dates changed
    let days = leave.days;
    if (data.startDate || data.endDate) {
      const startDate = new Date(data.startDate || leave.startDate);
      const endDate = new Date(data.endDate || leave.endDate);
      days = calculateDays(startDate, endDate);
      
      // Apply half day if enabled and same day
      if (data.halfDay && startDate.toDateString() === endDate.toDateString()) {
        days = 0.5;
      }
    }

    // Update leave request
    const updated = await prisma.leaveRequest.update({
      where: { id: req.params.id },
      data: {
        type: data.type || leave.type,
        startDate: data.startDate ? new Date(data.startDate) : leave.startDate,
        endDate: data.endDate ? new Date(data.endDate) : leave.endDate,
        days,
        reason: data.reason || leave.reason,
      },
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

    res.json(updated);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid input data", errors: error });
    }
    console.error("Update leave request error:", error);
    res.status(500).json({ message: "Failed to update leave request" });
  }
}

// DELETE /api/v1/leaves/:id - Cancel leave request
export async function cancelLeaveRequest(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const userEmployeeId = user?.employeeId;
    const userRoles = user?.roles || [];
    const userPermissions = user?.permissions || [];
    const isAdminOrHR = userRoles.includes("ADMIN") || userRoles.includes("HR") || 
                       userPermissions.includes("leave.manage");

    const leave = await prisma.leaveRequest.findUnique({
      where: { id: req.params.id },
    });

    if (!leave) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    // Only the employee who created the request or admin/manager can cancel it
    if (leave.employeeId !== userEmployeeId && !isAdminOrHR) {
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

