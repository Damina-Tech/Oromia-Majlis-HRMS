import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { AppDataSource } from "../../db/data-source.js";
import { Attendance, AttendanceStatus } from "../../entities/Attendance.js";
import {
  CheckInDto,
  CheckOutDto,
  ListAttendanceQuery,
  UpdateAttendanceDto,
} from "./attendance.dto.js";
import { getLocationInfo, parseLocationString } from "../../utils/location.js";

/**
 * Check in for the day
 */
export async function checkIn(req: Request, res: Response) {
  try {
    const employeeId = (req as any).user?.employeeId;
    if (!employeeId) {
      return res.status(400).json({ message: "Employee record not found for user" });
    }

    const body = CheckInDto.parse(req.body);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendanceRepo = AppDataSource.getRepository(Attendance);
    
    // Check if already checked in today
    const existing = await attendanceRepo.findOne({
      where: {
        employeeId,
        date: today,
      },
    });

    if (existing && existing.checkInTime) {
      return res.status(400).json({ 
        message: "Already checked in today",
        attendance: existing 
      });
    }

    const now = new Date();
    
    // Get location information
    const locationInfo = getLocationInfo(body.location);
    
    // Determine status based on check-in time
    const workStartHour = 9;
    const workStartMinute = 0;
    let status: AttendanceStatus = AttendanceStatus.PRESENT;
    
    if (now.getHours() > workStartHour || 
        (now.getHours() === workStartHour && now.getMinutes() > workStartMinute + 15)) {
      status = AttendanceStatus.LATE;
    }

    // Create or update attendance record
    if (existing) {
      existing.checkInTime = now;
      existing.checkInLocation = body.location;
      existing.status = status;
      await attendanceRepo.save(existing);
      
      const withRelations = await attendanceRepo.findOne({
        where: { id: existing.id },
        relations: ["employee"],
      });
      
      return res.status(200).json({
        ...withRelations,
        locationInfo: {
          type: locationInfo.type,
          displayName: locationInfo.displayName,
          isOffice: locationInfo.isOffice,
          officeName: (locationInfo as any).officeName,
          distanceMeters: (locationInfo as any).distanceMeters,
        }
      });
    } else {
      const attendance = new Attendance();
      attendance.id = uuidv4();
      attendance.employeeId = employeeId;
      attendance.date = today;
      attendance.checkInTime = now;
      attendance.checkInLocation = body.location;
      attendance.status = status;
      
      const saved = await attendanceRepo.save(attendance);
      const withRelations = await attendanceRepo.findOne({
        where: { id: saved.id },
        relations: ["employee"],
      });
      
      return res.status(200).json({
        ...withRelations,
        locationInfo: {
          type: locationInfo.type,
          displayName: locationInfo.displayName,
          isOffice: locationInfo.isOffice,
          officeName: (locationInfo as any).officeName,
          distanceMeters: (locationInfo as any).distanceMeters,
        }
      });
    }
  } catch (error: any) {
    console.error("Check-in error:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to check in" });
  }
}

/**
 * Check out for the day
 */
export async function checkOut(req: Request, res: Response) {
  try {
    const employeeId = (req as any).user?.employeeId;
    if (!employeeId) {
      return res.status(400).json({ message: "Employee record not found for user" });
    }

    const body = CheckOutDto.parse(req.body);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendanceRepo = AppDataSource.getRepository(Attendance);
    
    // Find today's attendance record
    const existing = await attendanceRepo.findOne({
      where: {
        employeeId,
        date: today,
      },
    });

    if (!existing) {
      return res.status(400).json({ message: "No check-in record found for today" });
    }

    if (existing.checkOutTime) {
      return res.status(400).json({ 
        message: "Already checked out today",
        attendance: existing 
      });
    }

    const now = new Date();
    
    // Calculate work hours
    let workHours = 0;
    if (existing.checkInTime) {
      const diffMs = now.getTime() - existing.checkInTime.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      workHours = diffHours - (existing.breakMinutes / 60);
    }

    // Update attendance record
    existing.checkOutTime = now;
    existing.checkOutLocation = body.location;
    existing.workHours = workHours.toFixed(2);
    
    const updated = await attendanceRepo.save(existing);
    const withRelations = await attendanceRepo.findOne({
      where: { id: updated.id },
      relations: ["employee"],
    });

    return res.status(200).json(withRelations);
  } catch (error: any) {
    console.error("Check-out error:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to check out" });
  }
}

/**
 * Get today's attendance status
 */
export async function getTodayStatus(req: Request, res: Response) {
  try {
    const employeeId = (req as any).user?.employeeId;
    if (!employeeId) {
      return res.status(400).json({ message: "Employee record not found for user" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendanceRepo = AppDataSource.getRepository(Attendance);
    const attendance = await attendanceRepo.findOne({
      where: {
        employeeId,
        date: today,
      },
      relations: ["employee"],
    });

    if (!attendance) {
      return res.status(200).json(null);
    }

    // Add location info
    const checkInLocationInfo = attendance.checkInLocation 
      ? getLocationInfo(attendance.checkInLocation)
      : null;
    
    const checkOutLocationInfo = attendance.checkOutLocation 
      ? getLocationInfo(attendance.checkOutLocation)
      : null;

    return res.status(200).json({
      ...attendance,
      checkInLocationInfo: checkInLocationInfo ? {
        type: checkInLocationInfo.type,
        displayName: checkInLocationInfo.displayName,
        isOffice: checkInLocationInfo.isOffice,
        officeName: (checkInLocationInfo as any).officeName,
        distanceMeters: (checkInLocationInfo as any).distanceMeters,
      } : null,
      checkOutLocationInfo: checkOutLocationInfo ? {
        type: checkOutLocationInfo.type,
        displayName: checkOutLocationInfo.displayName,
        isOffice: checkOutLocationInfo.isOffice,
      } : null,
    });
  } catch (error: any) {
    console.error("Get today status error:", error);
    return res.status(500).json({ message: "Failed to get today's status" });
  }
}

/**
 * List attendance records with filters
 */
export async function listAttendance(req: Request, res: Response) {
  try {
    const query = ListAttendanceQuery.parse(req.query);
    const currentUserEmployeeId = (req as any).user?.employeeId;
    
    const attendanceRepo = AppDataSource.getRepository(Attendance);
    const queryBuilder = attendanceRepo.createQueryBuilder("attendance")
      .leftJoinAndSelect("attendance.employee", "employee");

    if (query.employeeId) {
      queryBuilder.andWhere("attendance.employeeId = :employeeId", { employeeId: query.employeeId });
    } else if (currentUserEmployeeId) {
      queryBuilder.andWhere("attendance.employeeId = :employeeId", { employeeId: currentUserEmployeeId });
    }

    if (query.startDate) {
      queryBuilder.andWhere("attendance.date >= :startDate", { startDate: new Date(query.startDate) });
    }
    if (query.endDate) {
      queryBuilder.andWhere("attendance.date <= :endDate", { endDate: new Date(query.endDate) });
    }
    if (query.status) {
      queryBuilder.andWhere("attendance.status = :status", { status: query.status });
    }

    const skip = (query.page - 1) * query.pageSize;
    queryBuilder.orderBy("attendance.date", "DESC")
      .skip(skip)
      .take(query.pageSize);

    const [items, total] = await queryBuilder.getManyAndCount();

    // Enhance items with location info
    const enhancedItems = items.map(item => {
      const checkInLocationInfo = item.checkInLocation 
        ? getLocationInfo(item.checkInLocation)
        : null;
      
      const checkOutLocationInfo = item.checkOutLocation 
        ? getLocationInfo(item.checkOutLocation)
        : null;

      return {
        ...item,
        checkInLocationInfo: checkInLocationInfo ? {
          type: checkInLocationInfo.type,
          displayName: checkInLocationInfo.displayName,
          isOffice: checkInLocationInfo.isOffice,
          officeName: (checkInLocationInfo as any).officeName,
        } : null,
        checkOutLocationInfo: checkOutLocationInfo ? {
          type: checkOutLocationInfo.type,
          displayName: checkOutLocationInfo.displayName,
          isOffice: checkOutLocationInfo.isOffice,
        } : null,
      };
    });

    return res.status(200).json({
      items: enhancedItems,
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.ceil(total / query.pageSize),
    });
  } catch (error: any) {
    console.error("List attendance error:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid query parameters", errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to list attendance records" });
  }
}

/**
 * Get attendance statistics
 */
export async function getAttendanceStats(req: Request, res: Response) {
  try {
    const employeeId = (req as any).user?.employeeId;
    if (!employeeId) {
      return res.status(400).json({ message: "Employee record not found for user" });
    }

    // Get current month's stats
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const attendanceRepo = AppDataSource.getRepository(Attendance);
    const records = await attendanceRepo
      .createQueryBuilder("attendance")
      .where("attendance.employeeId = :employeeId", { employeeId })
      .andWhere("attendance.date >= :startOfMonth", { startOfMonth })
      .andWhere("attendance.date <= :endOfMonth", { endOfMonth })
      .getMany();

    const stats = {
      totalDays: records.length,
      presentDays: records.filter(r => r.status === AttendanceStatus.PRESENT).length,
      lateDays: records.filter(r => r.status === AttendanceStatus.LATE).length,
      absentDays: records.filter(r => r.status === AttendanceStatus.ABSENT).length,
      halfDays: records.filter(r => r.status === AttendanceStatus.HALF_DAY).length,
      onLeaveDays: records.filter(r => r.status === AttendanceStatus.ON_LEAVE).length,
      totalWorkHours: records.reduce((sum, r) => sum + (r.workHours ? parseFloat(r.workHours) : 0), 0),
    };

    return res.status(200).json(stats);
  } catch (error: any) {
    console.error("Get attendance stats error:", error);
    return res.status(500).json({ message: "Failed to get attendance statistics" });
  }
}

/**
 * Update attendance record (for HR/Admin manual corrections)
 */
export async function updateAttendance(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const body = UpdateAttendanceDto.parse(req.body);

    const attendanceRepo = AppDataSource.getRepository(Attendance);
    const attendance = await attendanceRepo.findOne({ where: { id } });
    
    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    if (body.checkInTime !== undefined) attendance.checkInTime = new Date(body.checkInTime);
    if (body.checkOutTime !== undefined) attendance.checkOutTime = body.checkOutTime ? new Date(body.checkOutTime) : undefined;
    if (body.checkInLocation !== undefined) attendance.checkInLocation = body.checkInLocation;
    if (body.checkOutLocation !== undefined) attendance.checkOutLocation = body.checkOutLocation;
    if (body.status !== undefined) attendance.status = body.status as AttendanceStatus;
    if (body.workHours !== undefined) attendance.workHours = body.workHours.toString();
    if (body.breakMinutes !== undefined) attendance.breakMinutes = body.breakMinutes;
    if (body.notes !== undefined) attendance.notes = body.notes;

    const updated = await attendanceRepo.save(attendance);
    const withRelations = await attendanceRepo.findOne({
      where: { id: updated.id },
      relations: ["employee"],
    });

    return res.status(200).json(withRelations);
  } catch (error: any) {
    console.error("Update attendance error:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to update attendance" });
  }
}

/**
 * Delete attendance record
 */
export async function deleteAttendance(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const attendanceRepo = AppDataSource.getRepository(Attendance);
    const attendance = await attendanceRepo.findOne({ where: { id } });
    
    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    await attendanceRepo.remove(attendance);

    return res.status(204).send();
  } catch (error: any) {
    console.error("Delete attendance error:", error);
    return res.status(500).json({ message: "Failed to delete attendance" });
  }
}
