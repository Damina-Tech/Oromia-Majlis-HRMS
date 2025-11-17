import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { AppDataSource } from "../../db/data-source.js";
import { Timesheet, TimesheetStatus } from "../../entities/Timesheet.js";
import { TimesheetSession } from "../../entities/TimesheetSession.js";
import {
  CreateTimesheetDto,
  UpdateTimesheetDto,
  SubmitTimesheetDto,
  UpdateTimesheetStatusDto,
  ListTimesheetQuery,
  TimesheetSummaryQuery,
  StartTimerDto,
  StopTimerDto,
  ManualTimeEntryDto,
} from "./timesheet.dto.js";
import { paginate } from "../../utils/pagination.js";
import { getWeekDates, getMonthDates, getYearDates } from "../../utils/date-utils.js";

// Helper function to get current user's employee ID
function getCurrentUserEmployeeId(req: Request): string | null {
  return (req as any).user?.employeeId || null;
}

// Helper function to get current user roles
function getCurrentUserRoles(req: Request): string[] {
  return (req as any).user?.roles || [];
}

/**
 * List timesheets with filtering and pagination
 */
export async function listTimesheets(req: Request, res: Response) {
  try {
    const query = ListTimesheetQuery.parse(req.query);
    const currentUserEmployeeId = getCurrentUserEmployeeId(req);
    const userRoles = getCurrentUserRoles(req);
    
    const timesheetRepo = AppDataSource.getRepository(Timesheet);
    const queryBuilder = timesheetRepo.createQueryBuilder("timesheet")
      .leftJoinAndSelect("timesheet.employee", "employee")
      .leftJoinAndSelect("employee.department", "department")
      .leftJoinAndSelect("timesheet.sessions", "sessions")
      .leftJoinAndSelect("timesheet.approver", "approver");

    // Access control
    if (!userRoles.includes("ADMIN") && !userRoles.includes("HR") && !userRoles.includes("MANAGER")) {
      if (currentUserEmployeeId) {
        queryBuilder.andWhere("timesheet.employeeId = :employeeId", { employeeId: currentUserEmployeeId });
      } else {
        return res.status(403).json({ message: "Employee record not found for user" });
      }
    } else if (query.employeeId) {
      queryBuilder.andWhere("timesheet.employeeId = :employeeId", { employeeId: query.employeeId });
    }

    // Date filtering
    if (query.date) {
      queryBuilder.andWhere("timesheet.date = :date", { date: new Date(query.date) });
    } else if (query.startDate || query.endDate) {
      if (query.startDate) {
        queryBuilder.andWhere("timesheet.date >= :startDate", { startDate: new Date(query.startDate) });
      }
      if (query.endDate) {
        queryBuilder.andWhere("timesheet.date <= :endDate", { endDate: new Date(query.endDate) });
      }
    } else if (query.week) {
      const { startDate, endDate } = getWeekDates(query.week);
      queryBuilder.andWhere("timesheet.date >= :startDate", { startDate })
        .andWhere("timesheet.date <= :endDate", { endDate });
    } else if (query.month) {
      const { startDate, endDate } = getMonthDates(query.month);
      queryBuilder.andWhere("timesheet.date >= :startDate", { startDate })
        .andWhere("timesheet.date <= :endDate", { endDate });
    } else if (query.year) {
      const { startDate, endDate } = getYearDates(query.year);
      queryBuilder.andWhere("timesheet.date >= :startDate", { startDate })
        .andWhere("timesheet.date <= :endDate", { endDate });
    }

    // Status filtering
    if (query.status) {
      queryBuilder.andWhere("timesheet.status = :status", { status: query.status });
    }

    const { skip, take } = paginate(query.page, query.pageSize);
    queryBuilder.orderBy("timesheet.date", "DESC")
      .addOrderBy("sessions.startTime", "ASC")
      .skip(skip)
      .take(take);

    const [timesheets, total] = await queryBuilder.getManyAndCount();

    return res.status(200).json({
      items: timesheets,
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.ceil(total / query.pageSize),
    });
  } catch (error: any) {
    console.error("List timesheets error:", error);
    return res.status(500).json({ message: "Failed to list timesheets" });
  }
}

/**
 * Get single timesheet by ID
 */
export async function getTimesheet(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const currentUserEmployeeId = getCurrentUserEmployeeId(req);
    const userRoles = getCurrentUserRoles(req);

    const timesheetRepo = AppDataSource.getRepository(Timesheet);
    const timesheet = await timesheetRepo.findOne({
      where: { id },
      relations: ["employee", "employee.department", "sessions", "approver"],
    });

    if (!timesheet) {
      return res.status(404).json({ message: "Timesheet not found" });
    }

    // Access control
    if (!userRoles.includes("ADMIN") && !userRoles.includes("HR") && !userRoles.includes("MANAGER")) {
      if (currentUserEmployeeId && timesheet.employeeId !== currentUserEmployeeId) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    // Sort sessions by startTime
    if (timesheet.sessions) {
      timesheet.sessions.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    }

    return res.status(200).json(timesheet);
  } catch (error: any) {
    console.error("Get timesheet error:", error);
    return res.status(500).json({ message: "Failed to get timesheet" });
  }
}

/**
 * Create new timesheet entry
 */
export async function createTimesheet(req: Request, res: Response) {
  try {
    const data = CreateTimesheetDto.parse(req.body);
    const currentUserEmployeeId = getCurrentUserEmployeeId(req);

    if (!currentUserEmployeeId) {
      return res.status(403).json({ message: "Employee record not found for user" });
    }

    const timesheetRepo = AppDataSource.getRepository(Timesheet);
    const sessionRepo = AppDataSource.getRepository(TimesheetSession);
    const date = new Date(data.date);
    date.setHours(0, 0, 0, 0);

    // Check if timesheet already exists for this date
    const existingTimesheet = await timesheetRepo.findOne({
      where: {
        employeeId: currentUserEmployeeId,
        date,
      },
    });

    if (existingTimesheet) {
      return res.status(409).json({ message: "Timesheet already exists for this date" });
    }

    // Calculate total hours from sessions
    const totalHours = data.sessions.reduce((total, session) => total + session.duration, 0) / 60;

    // Create timesheet with sessions in a transaction
    const result = await AppDataSource.transaction(async (manager) => {
      const timesheet = new Timesheet();
      timesheet.id = uuidv4();
      timesheet.employeeId = currentUserEmployeeId;
      timesheet.date = date;
      timesheet.totalHours = totalHours.toFixed(2);
      timesheet.status = TimesheetStatus.DRAFT;
      timesheet.notes = data.notes;

      const savedTimesheet = await manager.save(timesheet);

      // Create sessions
      const sessions = data.sessions.map((session) => {
        const ts = new TimesheetSession();
        ts.id = uuidv4();
        ts.timesheetId = savedTimesheet.id;
        ts.taskName = session.taskName;
        ts.projectName = session.projectName;
        ts.description = session.description;
        ts.startTime = new Date(session.startTime);
        ts.endTime = new Date(session.endTime);
        ts.duration = session.duration;
        return ts;
      });

      await manager.save(sessions);

      // Load with relations
      return await manager.findOne(Timesheet, {
        where: { id: savedTimesheet.id },
        relations: ["employee", "employee.department", "sessions"],
      });
    });

    if (result && result.sessions) {
      result.sessions.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    }

    return res.status(201).json(result);
  } catch (error: any) {
    console.error("Create timesheet error:", error);
    if (error.code === "23505") {
      return res.status(409).json({ message: "Timesheet already exists for this date" });
    }
    return res.status(500).json({ message: "Failed to create timesheet" });
  }
}

/**
 * Update timesheet
 */
export async function updateTimesheet(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = UpdateTimesheetDto.parse(req.body);
    const currentUserEmployeeId = getCurrentUserEmployeeId(req);
    const userRoles = getCurrentUserRoles(req);

    const timesheetRepo = AppDataSource.getRepository(Timesheet);
    const sessionRepo = AppDataSource.getRepository(TimesheetSession);
    
    const existingTimesheet = await timesheetRepo.findOne({
      where: { id },
      relations: ["sessions"],
    });

    if (!existingTimesheet) {
      return res.status(404).json({ message: "Timesheet not found" });
    }

    // Access control
    if (!userRoles.includes("ADMIN") && !userRoles.includes("HR")) {
      if (currentUserEmployeeId && existingTimesheet.employeeId !== currentUserEmployeeId) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    // Can only update draft timesheets
    if (existingTimesheet.status !== TimesheetStatus.DRAFT) {
      return res.status(400).json({ message: "Can only update draft timesheets" });
    }

    // Calculate total hours if sessions are provided
    let totalHours = parseFloat(existingTimesheet.totalHours);
    if (data.sessions) {
      totalHours = data.sessions.reduce((total, session) => total + session.duration, 0) / 60;
    }

    // Update in transaction
    const result = await AppDataSource.transaction(async (manager) => {
      if (data.date) existingTimesheet.date = new Date(data.date);
      existingTimesheet.totalHours = totalHours.toFixed(2);
      if (data.notes !== undefined) existingTimesheet.notes = data.notes;

      await manager.save(existingTimesheet);

      // Update sessions if provided
      if (data.sessions) {
        // Delete existing sessions
        await manager.delete(TimesheetSession, { timesheetId: id });

        // Create new sessions
        const sessions = data.sessions.map((session) => {
          const ts = new TimesheetSession();
          ts.id = uuidv4();
          ts.timesheetId = id;
          ts.taskName = session.taskName;
          ts.projectName = session.projectName;
          ts.description = session.description;
          ts.startTime = new Date(session.startTime);
          ts.endTime = new Date(session.endTime);
          ts.duration = session.duration;
          return ts;
        });

        await manager.save(sessions);
      }

      // Load with relations
      return await manager.findOne(Timesheet, {
        where: { id },
        relations: ["employee", "employee.department", "sessions"],
      });
    });

    if (result && result.sessions) {
      result.sessions.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    }

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Update timesheet error:", error);
    return res.status(500).json({ message: "Failed to update timesheet" });
  }
}

/**
 * Submit timesheet for approval
 */
export async function submitTimesheet(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = SubmitTimesheetDto.parse(req.body);
    const currentUserEmployeeId = getCurrentUserEmployeeId(req);

    if (!currentUserEmployeeId) {
      return res.status(403).json({ message: "Employee record not found for user" });
    }

    const timesheetRepo = AppDataSource.getRepository(Timesheet);
    const timesheet = await timesheetRepo.findOne({ where: { id } });

    if (!timesheet) {
      return res.status(404).json({ message: "Timesheet not found" });
    }

    // Only owner can submit
    if (timesheet.employeeId !== currentUserEmployeeId) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Can only submit draft timesheets
    if (timesheet.status !== TimesheetStatus.DRAFT) {
      return res.status(400).json({ message: "Can only submit draft timesheets" });
    }

    timesheet.status = TimesheetStatus.SUBMITTED;
    timesheet.submittedAt = new Date();
    if (data.notes) timesheet.notes = data.notes;

    const updated = await timesheetRepo.save(timesheet);
    const withRelations = await timesheetRepo.findOne({
      where: { id: updated.id },
      relations: ["employee", "employee.department", "sessions"],
    });

    if (withRelations && withRelations.sessions) {
      withRelations.sessions.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    }

    return res.status(200).json(withRelations);
  } catch (error: any) {
    console.error("Submit timesheet error:", error);
    return res.status(500).json({ message: "Failed to submit timesheet" });
  }
}

/**
 * Update timesheet status (approve/reject)
 */
export async function updateTimesheetStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = UpdateTimesheetStatusDto.parse(req.body);
    const currentUserId = (req as any).user?.id;
    const userRoles = getCurrentUserRoles(req);

    // Only admin, HR, or manager can approve/reject
    if (!userRoles.includes("ADMIN") && !userRoles.includes("HR") && !userRoles.includes("MANAGER")) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    const timesheetRepo = AppDataSource.getRepository(Timesheet);
    const timesheet = await timesheetRepo.findOne({ where: { id } });

    if (!timesheet) {
      return res.status(404).json({ message: "Timesheet not found" });
    }

    // Can only update submitted timesheets
    if (timesheet.status !== TimesheetStatus.SUBMITTED) {
      return res.status(400).json({ message: "Can only update submitted timesheets" });
    }

    timesheet.status = data.status as TimesheetStatus;
    if (data.status === "APPROVED") {
      timesheet.approvedAt = new Date();
      timesheet.approvedBy = currentUserId;
    }
    if (data.status === "REJECTED") {
      timesheet.rejectionReason = data.rejectionReason;
    }
    if (data.notes) timesheet.notes = data.notes;

    const updated = await timesheetRepo.save(timesheet);
    const withRelations = await timesheetRepo.findOne({
      where: { id: updated.id },
      relations: ["employee", "employee.department", "sessions", "approver"],
    });

    if (withRelations && withRelations.sessions) {
      withRelations.sessions.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    }

    return res.status(200).json(withRelations);
  } catch (error: any) {
    console.error("Update timesheet status error:", error);
    return res.status(500).json({ message: "Failed to update timesheet status" });
  }
}

/**
 * Delete timesheet
 */
export async function deleteTimesheet(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const currentUserEmployeeId = getCurrentUserEmployeeId(req);
    const userRoles = getCurrentUserRoles(req);

    const timesheetRepo = AppDataSource.getRepository(Timesheet);
    const timesheet = await timesheetRepo.findOne({ where: { id } });

    if (!timesheet) {
      return res.status(404).json({ message: "Timesheet not found" });
    }

    // Access control
    if (!userRoles.includes("ADMIN") && !userRoles.includes("HR")) {
      if (currentUserEmployeeId && timesheet.employeeId !== currentUserEmployeeId) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    // Can only delete draft timesheets
    if (timesheet.status !== TimesheetStatus.DRAFT) {
      return res.status(400).json({ message: "Can only delete draft timesheets" });
    }

    await timesheetRepo.remove(timesheet);

    return res.status(204).send();
  } catch (error: any) {
    console.error("Delete timesheet error:", error);
    return res.status(500).json({ message: "Failed to delete timesheet" });
  }
}

/**
 * Get timesheet summary/statistics
 */
export async function getTimesheetSummary(req: Request, res: Response) {
  try {
    const query = TimesheetSummaryQuery.parse(req.query);
    const currentUserEmployeeId = getCurrentUserEmployeeId(req);
    const userRoles = getCurrentUserRoles(req);

    const timesheetRepo = AppDataSource.getRepository(Timesheet);
    const queryBuilder = timesheetRepo.createQueryBuilder("timesheet")
      .leftJoinAndSelect("timesheet.sessions", "sessions")
      .leftJoinAndSelect("timesheet.employee", "employee");

    // Access control
    if (!userRoles.includes("ADMIN") && !userRoles.includes("HR") && !userRoles.includes("MANAGER")) {
      if (currentUserEmployeeId) {
        queryBuilder.andWhere("timesheet.employeeId = :employeeId", { employeeId: currentUserEmployeeId });
      } else {
        return res.status(403).json({ message: "Employee record not found for user" });
      }
    } else if (query.employeeId) {
      queryBuilder.andWhere("timesheet.employeeId = :employeeId", { employeeId: query.employeeId });
    }

    // Date filtering
    if (query.startDate || query.endDate) {
      if (query.startDate) {
        queryBuilder.andWhere("timesheet.date >= :startDate", { startDate: new Date(query.startDate) });
      }
      if (query.endDate) {
        queryBuilder.andWhere("timesheet.date <= :endDate", { endDate: new Date(query.endDate) });
      }
    } else if (query.week) {
      const { startDate, endDate } = getWeekDates(query.week);
      queryBuilder.andWhere("timesheet.date >= :startDate", { startDate })
        .andWhere("timesheet.date <= :endDate", { endDate });
    } else if (query.month) {
      const { startDate, endDate } = getMonthDates(query.month);
      queryBuilder.andWhere("timesheet.date >= :startDate", { startDate })
        .andWhere("timesheet.date <= :endDate", { endDate });
    } else if (query.year) {
      const { startDate, endDate } = getYearDates(query.year);
      queryBuilder.andWhere("timesheet.date >= :startDate", { startDate })
        .andWhere("timesheet.date <= :endDate", { endDate });
    }

    queryBuilder.orderBy("timesheet.date", "DESC");

    const timesheets = await queryBuilder.getMany();

    // Calculate aggregates manually
    const totalHours = timesheets.reduce((sum, t) => sum + parseFloat(t.totalHours), 0);
    const averageHours = timesheets.length > 0 ? totalHours / timesheets.length : 0;

    // Count by status
    const statusBreakdown: Record<string, number> = {};
    timesheets.forEach(t => {
      const status = t.status.toLowerCase();
      statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
    });

    const summary = {
      totalTimesheets: timesheets.length,
      totalHours,
      averageHours,
      statusBreakdown,
      timesheets: timesheets.slice(0, 10),
    };

    return res.status(200).json(summary);
  } catch (error: any) {
    console.error("Get timesheet summary error:", error);
    return res.status(500).json({ message: "Failed to get timesheet summary" });
  }
}

/**
 * Start timer (create a temporary session)
 */
export async function startTimer(req: Request, res: Response) {
  try {
    const data = StartTimerDto.parse(req.body);
    const currentUserEmployeeId = getCurrentUserEmployeeId(req);

    if (!currentUserEmployeeId) {
      return res.status(403).json({ message: "Employee record not found for user" });
    }

    // For now, we'll just return the timer data
    const timerData = {
      employeeId: currentUserEmployeeId,
      taskName: data.taskName,
      projectName: data.projectName,
      description: data.description,
      startTime: new Date(),
      status: "active",
    };

    return res.status(200).json({
      message: "Timer started successfully",
      timer: timerData,
    });
  } catch (error: any) {
    console.error("Start timer error:", error);
    return res.status(500).json({ message: "Failed to start timer" });
  }
}

/**
 * Stop timer and create timesheet session
 */
export async function stopTimer(req: Request, res: Response) {
  try {
    const data = StopTimerDto.parse(req.body);
    const currentUserEmployeeId = getCurrentUserEmployeeId(req);

    if (!currentUserEmployeeId) {
      return res.status(403).json({ message: "Employee record not found for user" });
    }

    return res.status(200).json({
      message: "Timer stopped successfully",
      note: "In a full implementation, this would create a timesheet session",
    });
  } catch (error: any) {
    console.error("Stop timer error:", error);
    return res.status(500).json({ message: "Failed to stop timer" });
  }
}

/**
 * Add manual time entry
 */
export async function addManualTimeEntry(req: Request, res: Response) {
  try {
    const data = ManualTimeEntryDto.parse(req.body);
    const currentUserEmployeeId = getCurrentUserEmployeeId(req);

    if (!currentUserEmployeeId) {
      return res.status(403).json({ message: "Employee record not found for user" });
    }

    // Parse start and end times
    const startDateTime = new Date(`${data.date}T${data.startTime}`);
    const endDateTime = new Date(`${data.date}T${data.endTime}`);
    const duration = Math.floor((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60));

    if (duration <= 0) {
      return res.status(400).json({ message: "End time must be after start time" });
    }

    const totalHours = duration / 60;
    const date = new Date(data.date);
    date.setHours(0, 0, 0, 0);

    const timesheetRepo = AppDataSource.getRepository(Timesheet);
    const sessionRepo = AppDataSource.getRepository(TimesheetSession);

    // Check if timesheet exists for this date
    let timesheet = await timesheetRepo.findOne({
      where: {
        employeeId: currentUserEmployeeId,
        date,
      },
      relations: ["sessions"],
    });

    if (timesheet) {
      // Add session to existing timesheet
      const newSession = new TimesheetSession();
      newSession.id = uuidv4();
      newSession.timesheetId = timesheet.id;
      newSession.taskName = data.taskName;
      newSession.projectName = data.projectName;
      newSession.description = data.description;
      newSession.startTime = startDateTime;
      newSession.endTime = endDateTime;
      newSession.duration = duration;

      await sessionRepo.save(newSession);

      // Update total hours
      const updatedTotalHours = parseFloat(timesheet.totalHours) + totalHours;
      timesheet.totalHours = updatedTotalHours.toFixed(2);
      await timesheetRepo.save(timesheet);

      return res.status(200).json({
        message: "Manual time entry added to existing timesheet",
        session: newSession,
      });
    } else {
      // Create new timesheet with session
      const result = await AppDataSource.transaction(async (manager) => {
        const newTimesheet = new Timesheet();
        newTimesheet.id = uuidv4();
        newTimesheet.employeeId = currentUserEmployeeId;
        newTimesheet.date = date;
        newTimesheet.totalHours = totalHours.toFixed(2);
        newTimesheet.status = TimesheetStatus.DRAFT;
        newTimesheet.notes = data.notes;

        const savedTimesheet = await manager.save(newTimesheet);

        const session = new TimesheetSession();
        session.id = uuidv4();
        session.timesheetId = savedTimesheet.id;
        session.taskName = data.taskName;
        session.projectName = data.projectName;
        session.description = data.description;
        session.startTime = startDateTime;
        session.endTime = endDateTime;
        session.duration = duration;

        await manager.save(session);

        return await manager.findOne(Timesheet, {
          where: { id: savedTimesheet.id },
          relations: ["employee", "employee.department", "sessions"],
        });
      });

      return res.status(201).json({
        message: "New timesheet created with manual time entry",
        timesheet: result,
      });
    }
  } catch (error: any) {
    console.error("Add manual time entry error:", error);
    return res.status(500).json({ message: "Failed to add manual time entry" });
  }
}
