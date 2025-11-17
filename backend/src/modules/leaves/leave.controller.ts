import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { AppDataSource } from "../../db/data-source.js";
import { LeaveRequest, LeaveStatus, LeaveType } from "../../entities/LeaveRequest.js";
import { LeaveBalance } from "../../entities/LeaveBalance.js";
import { Employee } from "../../entities/Employee.js";
import {
  CreateLeaveRequestDto,
  UpdateLeaveStatusDto,
  ListLeaveRequestsQuery,
} from "./leave.dto.js";

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

    const leaveRepo = AppDataSource.getRepository(LeaveRequest);
    const userEmployeeId = (req as any).user?.employeeId;

    const queryBuilder = leaveRepo.createQueryBuilder("leave")
      .leftJoinAndSelect("leave.employee", "employee")
      .leftJoinAndSelect("leave.approver", "approver");

    if (status) {
      queryBuilder.andWhere("leave.status = :status", { status });
    }

    if (employeeId) {
      queryBuilder.andWhere("leave.employeeId = :employeeId", { employeeId });
    } else if (userEmployeeId) {
      queryBuilder.andWhere("leave.employeeId = :userEmployeeId", { userEmployeeId });
    }

    queryBuilder.orderBy("leave.createdAt", "DESC")
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await queryBuilder.getManyAndCount();

    res.json({ items, total, page, pageSize });
  } catch (error) {
    console.error("List leave requests error:", error);
    res.status(500).json({ message: "Failed to fetch leave requests" });
  }
}

// GET /api/v1/leaves/:id - Get specific leave request
export async function getLeaveRequest(req: Request, res: Response) {
  try {
    const leaveRepo = AppDataSource.getRepository(LeaveRequest);
    const leave = await leaveRepo.findOne({
      where: { id: req.params.id },
      relations: ["employee", "approver"],
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

    const leaveBalanceRepo = AppDataSource.getRepository(LeaveBalance);
    const balance = await leaveBalanceRepo.findOne({
      where: { employeeId: userEmployeeId },
    });

    if (balance) {
      const leaveTypeMap: Record<string, keyof LeaveBalance> = {
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

    const leaveRepo = AppDataSource.getRepository(LeaveRequest);
    const leave = new LeaveRequest();
    leave.id = uuidv4();
    leave.employeeId = userEmployeeId;
    leave.type = data.type as LeaveType;
    leave.startDate = startDate;
    leave.endDate = endDate;
    leave.days = days;
    leave.reason = data.reason;
    leave.status = LeaveStatus.PENDING;

    const saved = await leaveRepo.save(leave);
    const withRelations = await leaveRepo.findOne({
      where: { id: saved.id },
      relations: ["employee"],
    });

    res.status(201).json(withRelations);
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
    const approverId = (req as any).user?.employeeId || null;

    const leaveRepo = AppDataSource.getRepository(LeaveRequest);
    const leave = await leaveRepo.findOne({
      where: { id: req.params.id },
      relations: ["employee"],
    });

    if (!leave) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    if (leave.status !== LeaveStatus.PENDING) {
      return res.status(400).json({ message: "Leave request already processed" });
    }

    const leaveBalanceRepo = AppDataSource.getRepository(LeaveBalance);
    if (data.status === "APPROVED") {
      const balance = await leaveBalanceRepo.findOne({
        where: { employeeId: leave.employeeId },
      });

      if (balance) {
        const leaveTypeMap: Record<string, keyof LeaveBalance> = {
          CASUAL: "casualLeave",
          SICK: "sickLeave",
          VACATION: "vacationLeave",
          PERSONAL: "personalLeave",
        };

        const balanceField = leaveTypeMap[leave.type];
        if (balanceField) {
          const currentBalance = balance[balanceField] as number;
          if (balanceField === "casualLeave") balance.casualLeave = currentBalance - leave.days;
          else if (balanceField === "sickLeave") balance.sickLeave = currentBalance - leave.days;
          else if (balanceField === "vacationLeave") balance.vacationLeave = currentBalance - leave.days;
          else if (balanceField === "personalLeave") balance.personalLeave = currentBalance - leave.days;
          await leaveBalanceRepo.save(balance);
        }
      }
    }

    leave.status = data.status as LeaveStatus;
    leave.approverId = approverId || undefined;
    leave.approvedAt = new Date();
    leave.rejectionReason = data.rejectionReason || undefined;

    const updated = await leaveRepo.save(leave);
    const withRelations = await leaveRepo.findOne({
      where: { id: updated.id },
      relations: ["employee", "approver"],
    });

    res.json(withRelations);
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

    if (employeeId !== userEmployeeId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const leaveBalanceRepo = AppDataSource.getRepository(LeaveBalance);
    let balance = await leaveBalanceRepo.findOne({
      where: { employeeId },
    });

    if (!balance) {
      balance = new LeaveBalance();
      balance.id = uuidv4();
      balance.employeeId = employeeId;
      balance.casualLeave = 12;
      balance.sickLeave = 10;
      balance.vacationLeave = 21;
      balance.personalLeave = 5;
      balance = await leaveBalanceRepo.save(balance);
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

    const leaveRepo = AppDataSource.getRepository(LeaveRequest);
    const leave = await leaveRepo.findOne({
      where: { id: req.params.id },
    });

    if (!leave) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    if (leave.employeeId !== userEmployeeId) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (leave.status !== LeaveStatus.PENDING) {
      return res.status(400).json({ message: "Can only cancel pending requests" });
    }

    leave.status = LeaveStatus.CANCELLED;
    await leaveRepo.save(leave);

    res.status(204).send();
  } catch (error) {
    console.error("Cancel leave request error:", error);
    res.status(500).json({ message: "Failed to cancel leave request" });
  }
}
