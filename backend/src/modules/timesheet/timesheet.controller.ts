import { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
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

const prisma = new PrismaClient();

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
    
    // Build where clause
    const where: Prisma.TimesheetWhereInput = {};
    
    // Access control: Non-admin users can only see their own timesheets
    if (!userRoles.includes("ADMIN") && !userRoles.includes("HR") && !userRoles.includes("MANAGER")) {
      if (currentUserEmployeeId) {
        where.employeeId = currentUserEmployeeId;
      } else {
        return res.status(403).json({ message: "Employee record not found for user" });
      }
    } else if (query.employeeId) {
      where.employeeId = query.employeeId;
    }

    // Date filtering
    if (query.date) {
      where.date = new Date(query.date);
    } else if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = new Date(query.startDate);
      if (query.endDate) where.date.lte = new Date(query.endDate);
    } else if (query.week) {
      const { startDate, endDate } = getWeekDates(query.week);
      where.date = { gte: startDate, lte: endDate };
    } else if (query.month) {
      const { startDate, endDate } = getMonthDates(query.month);
      where.date = { gte: startDate, lte: endDate };
    } else if (query.year) {
      const { startDate, endDate } = getYearDates(query.year);
      where.date = { gte: startDate, lte: endDate };
    }

    // Status filtering
    if (query.status) {
      where.status = query.status;
    }

    const { skip, take } = paginate(query.page, query.pageSize);

    const [timesheets, total] = await Promise.all([
      prisma.timesheet.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeCode: true,
              designation: true,
              department: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          sessions: {
            orderBy: { startTime: "asc" },
          },
          approver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { date: "desc" },
        skip,
        take,
      }),
      prisma.timesheet.count({ where }),
    ]);

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

    const timesheet = await prisma.timesheet.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            designation: true,
            email: true,
            phone: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        sessions: {
          orderBy: { startTime: "asc" },
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

    if (!timesheet) {
      return res.status(404).json({ message: "Timesheet not found" });
    }

    // Access control: Non-admin users can only view their own timesheets
    if (!userRoles.includes("ADMIN") && !userRoles.includes("HR") && !userRoles.includes("MANAGER")) {
      if (currentUserEmployeeId && timesheet.employeeId !== currentUserEmployeeId) {
        return res.status(403).json({ message: "Access denied" });
      }
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

    // Check if timesheet already exists for this date
    const existingTimesheet = await prisma.timesheet.findUnique({
      where: {
        employeeId_date: {
          employeeId: currentUserEmployeeId,
          date: new Date(data.date),
        },
      },
    });

    if (existingTimesheet) {
      return res.status(409).json({ message: "Timesheet already exists for this date" });
    }

    // Calculate total hours from sessions
    const totalHours = data.sessions.reduce((total, session) => total + session.duration, 0) / 60;

    // Create timesheet with sessions in a transaction
    const timesheet = await prisma.$transaction(async (tx) => {
      const newTimesheet = await tx.timesheet.create({
        data: {
          employeeId: currentUserEmployeeId,
          date: new Date(data.date),
          totalHours: new Prisma.Decimal(totalHours),
          notes: data.notes,
          sessions: {
            create: data.sessions.map((session) => ({
              taskName: session.taskName,
              projectName: session.projectName,
              description: session.description,
              startTime: new Date(session.startTime),
              endTime: new Date(session.endTime),
              duration: session.duration,
            })),
          },
        },
        include: {
          sessions: {
            orderBy: { startTime: "asc" },
          },
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeCode: true,
              designation: true,
            },
          },
        },
      });

      return newTimesheet;
    });

    return res.status(201).json(timesheet);
  } catch (error: any) {
    console.error("Create timesheet error:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return res.status(409).json({ message: "Timesheet already exists for this date" });
      }
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

    const existingTimesheet = await prisma.timesheet.findUnique({
      where: { id },
      include: { sessions: true },
    });

    if (!existingTimesheet) {
      return res.status(404).json({ message: "Timesheet not found" });
    }

    // Access control: Only owner or admin/HR can update
    if (!userRoles.includes("ADMIN") && !userRoles.includes("HR")) {
      if (currentUserEmployeeId && existingTimesheet.employeeId !== currentUserEmployeeId) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    // Can only update draft timesheets
    if (existingTimesheet.status !== "DRAFT") {
      return res.status(400).json({ message: "Can only update draft timesheets" });
    }

    // Calculate total hours if sessions are provided
    let totalHours = parseFloat(existingTimesheet.totalHours.toString());
    if (data.sessions) {
      totalHours = data.sessions.reduce((total, session) => total + session.duration, 0) / 60;
    }

    const timesheet = await prisma.$transaction(async (tx) => {
      // Update timesheet
      const updatedTimesheet = await tx.timesheet.update({
        where: { id },
        data: {
          ...(data.date && { date: new Date(data.date) }),
          totalHours: new Prisma.Decimal(totalHours),
          ...(data.notes !== undefined && { notes: data.notes }),
        },
      });

      // Update sessions if provided
      if (data.sessions) {
        // Delete existing sessions
        await tx.timesheetSession.deleteMany({
          where: { timesheetId: id },
        });

        // Create new sessions
        await tx.timesheetSession.createMany({
          data: data.sessions.map((session) => ({
            timesheetId: id,
            taskName: session.taskName,
            projectName: session.projectName,
            description: session.description,
            startTime: new Date(session.startTime),
            endTime: new Date(session.endTime),
            duration: session.duration,
          })),
        });
      }

      return tx.timesheet.findUnique({
        where: { id },
        include: {
          sessions: {
            orderBy: { startTime: "asc" },
          },
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeCode: true,
              designation: true,
            },
          },
        },
      });
    });

    return res.status(200).json(timesheet);
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

    const timesheet = await prisma.timesheet.findUnique({
      where: { id },
    });

    if (!timesheet) {
      return res.status(404).json({ message: "Timesheet not found" });
    }

    // Only owner can submit
    if (timesheet.employeeId !== currentUserEmployeeId) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Can only submit draft timesheets
    if (timesheet.status !== "DRAFT") {
      return res.status(400).json({ message: "Can only submit draft timesheets" });
    }

    const updatedTimesheet = await prisma.timesheet.update({
      where: { id },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
        ...(data.notes && { notes: data.notes }),
      },
      include: {
        sessions: {
          orderBy: { startTime: "asc" },
        },
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            designation: true,
          },
        },
      },
    });

    return res.status(200).json(updatedTimesheet);
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

    const timesheet = await prisma.timesheet.findUnique({
      where: { id },
    });

    if (!timesheet) {
      return res.status(404).json({ message: "Timesheet not found" });
    }

    // Can only update submitted timesheets
    if (timesheet.status !== "SUBMITTED") {
      return res.status(400).json({ message: "Can only update submitted timesheets" });
    }

    const updatedTimesheet = await prisma.timesheet.update({
      where: { id },
      data: {
        status: data.status,
        ...(data.status === "APPROVED" && {
          approvedAt: new Date(),
          approvedBy: currentUserId,
        }),
        ...(data.status === "REJECTED" && {
          rejectionReason: data.rejectionReason,
        }),
        ...(data.notes && { notes: data.notes }),
      },
      include: {
        sessions: {
          orderBy: { startTime: "asc" },
        },
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
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

    return res.status(200).json(updatedTimesheet);
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

    const timesheet = await prisma.timesheet.findUnique({
      where: { id },
    });

    if (!timesheet) {
      return res.status(404).json({ message: "Timesheet not found" });
    }

    // Access control: Only owner or admin/HR can delete
    if (!userRoles.includes("ADMIN") && !userRoles.includes("HR")) {
      if (currentUserEmployeeId && timesheet.employeeId !== currentUserEmployeeId) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    // Can only delete draft timesheets
    if (timesheet.status !== "DRAFT") {
      return res.status(400).json({ message: "Can only delete draft timesheets" });
    }

    await prisma.timesheet.delete({
      where: { id },
    });

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

    // Build where clause
    const where: Prisma.TimesheetWhereInput = {};

    // Access control: Non-admin users can only see their own timesheets
    if (!userRoles.includes("ADMIN") && !userRoles.includes("HR") && !userRoles.includes("MANAGER")) {
      if (currentUserEmployeeId) {
        where.employeeId = currentUserEmployeeId;
      } else {
        return res.status(403).json({ message: "Employee record not found for user" });
      }
    } else if (query.employeeId) {
      where.employeeId = query.employeeId;
    }

    // Date filtering
    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = new Date(query.startDate);
      if (query.endDate) where.date.lte = new Date(query.endDate);
    } else if (query.week) {
      const { startDate, endDate } = getWeekDates(query.week);
      where.date = { gte: startDate, lte: endDate };
    } else if (query.month) {
      const { startDate, endDate } = getMonthDates(query.month);
      where.date = { gte: startDate, lte: endDate };
    } else if (query.year) {
      const { startDate, endDate } = getYearDates(query.year);
      where.date = { gte: startDate, lte: endDate };
    }

    const [timesheets, totalHours, statusCounts] = await Promise.all([
      prisma.timesheet.findMany({
        where,
        include: {
          sessions: true,
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeCode: true,
            },
          },
        },
        orderBy: { date: "desc" },
      }),
      prisma.timesheet.aggregate({
        where,
        _sum: { totalHours: true },
        _avg: { totalHours: true },
      }),
      prisma.timesheet.groupBy({
        by: ["status"],
        where,
        _count: { status: true },
      }),
    ]);

    const summary = {
      totalTimesheets: timesheets.length,
      totalHours: parseFloat(totalHours._sum.totalHours?.toString() || "0"),
      averageHours: parseFloat(totalHours._avg.totalHours?.toString() || "0"),
      statusBreakdown: statusCounts.reduce((acc, item) => {
        acc[item.status.toLowerCase()] = item._count.status;
        return acc;
      }, {} as Record<string, number>),
      timesheets: timesheets.slice(0, 10), // Latest 10 timesheets
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
    // In a real implementation, you might store this in Redis or a temporary table
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

    // This would typically receive the timer data from the frontend
    // For now, we'll just return a success message
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

    // Check if timesheet exists for this date
    let timesheet = await prisma.timesheet.findUnique({
      where: {
        employeeId_date: {
          employeeId: currentUserEmployeeId,
          date: new Date(data.date),
        },
      },
      include: { sessions: true },
    });

    if (timesheet) {
      // Add session to existing timesheet
      const newSession = await prisma.timesheetSession.create({
        data: {
          timesheetId: timesheet.id,
          taskName: data.taskName,
          projectName: data.projectName,
          description: data.description,
          startTime: startDateTime,
          endTime: endDateTime,
          duration,
        },
      });

      // Update total hours
      const updatedTotalHours = parseFloat(timesheet.totalHours.toString()) + totalHours;
      await prisma.timesheet.update({
        where: { id: timesheet.id },
        data: { totalHours: new Prisma.Decimal(updatedTotalHours) },
      });

      return res.status(200).json({
        message: "Manual time entry added to existing timesheet",
        session: newSession,
      });
    } else {
      // Create new timesheet with session
      const newTimesheet = await prisma.$transaction(async (tx) => {
        const timesheet = await tx.timesheet.create({
          data: {
            employeeId: currentUserEmployeeId,
            date: new Date(data.date),
            totalHours: new Prisma.Decimal(totalHours),
            notes: data.notes,
            sessions: {
              create: {
                taskName: data.taskName,
                projectName: data.projectName,
                description: data.description,
                startTime: startDateTime,
                endTime: endDateTime,
                duration,
              },
            },
          },
          include: {
            sessions: true,
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeCode: true,
                designation: true,
              },
            },
          },
        });

        return timesheet;
      });

      return res.status(201).json({
        message: "New timesheet created with manual time entry",
        timesheet: newTimesheet,
      });
    }
  } catch (error: any) {
    console.error("Add manual time entry error:", error);
    return res.status(500).json({ message: "Failed to add manual time entry" });
  }
}
