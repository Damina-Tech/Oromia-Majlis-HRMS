import { PrismaClient, Prisma } from "@prisma/client";
import { CheckInDto, CheckOutDto, ListAttendanceQuery, UpdateAttendanceDto, } from "./attendance.dto.js";
import { getLocationInfo } from "../../utils/location.js";
const prisma = new PrismaClient();
/**
 * Check in for the day
 */
export async function checkIn(req, res) {
    try {
        const employeeId = req.user?.employeeId;
        if (!employeeId) {
            return res.status(400).json({ message: "Employee record not found for user" });
        }
        const body = CheckInDto.parse(req.body);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // Check if already checked in today
        const existing = await prisma.attendance.findUnique({
            where: {
                employeeId_date: {
                    employeeId,
                    date: today,
                },
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
        // Assuming work starts at 9:00 AM
        const workStartHour = 9;
        const workStartMinute = 0;
        let status = "PRESENT";
        if (now.getHours() > workStartHour ||
            (now.getHours() === workStartHour && now.getMinutes() > workStartMinute + 15)) {
            status = "LATE";
        }
        // Create or update attendance record
        const attendance = await prisma.attendance.upsert({
            where: {
                employeeId_date: {
                    employeeId,
                    date: today,
                },
            },
            update: {
                checkInTime: now,
                checkInLocation: body.location,
                status,
            },
            create: {
                employeeId,
                date: today,
                checkInTime: now,
                checkInLocation: body.location,
                status,
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        employeeCode: true,
                    },
                },
            },
        });
        // Return attendance with enhanced location info
        return res.status(200).json({
            ...attendance,
            locationInfo: {
                type: locationInfo.type,
                displayName: locationInfo.displayName,
                isOffice: locationInfo.isOffice,
                officeName: locationInfo.officeName,
                distanceMeters: locationInfo.distanceMeters,
            }
        });
    }
    catch (error) {
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
export async function checkOut(req, res) {
    try {
        const employeeId = req.user?.employeeId;
        if (!employeeId) {
            return res.status(400).json({ message: "Employee record not found for user" });
        }
        const body = CheckOutDto.parse(req.body);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // Find today's attendance record
        const existing = await prisma.attendance.findUnique({
            where: {
                employeeId_date: {
                    employeeId,
                    date: today,
                },
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
            // Subtract break time (convert minutes to hours)
            workHours = diffHours - (existing.breakMinutes / 60);
        }
        // Update attendance record
        const attendance = await prisma.attendance.update({
            where: {
                id: existing.id,
            },
            data: {
                checkOutTime: now,
                checkOutLocation: body.location,
                workHours: new Prisma.Decimal(workHours.toFixed(2)),
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        employeeCode: true,
                    },
                },
            },
        });
        return res.status(200).json(attendance);
    }
    catch (error) {
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
export async function getTodayStatus(req, res) {
    try {
        const employeeId = req.user?.employeeId;
        if (!employeeId) {
            return res.status(400).json({ message: "Employee record not found for user" });
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const attendance = await prisma.attendance.findUnique({
            where: {
                employeeId_date: {
                    employeeId,
                    date: today,
                },
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        employeeCode: true,
                    },
                },
            },
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
                officeName: checkInLocationInfo.officeName,
                distanceMeters: checkInLocationInfo.distanceMeters,
            } : null,
            checkOutLocationInfo: checkOutLocationInfo ? {
                type: checkOutLocationInfo.type,
                displayName: checkOutLocationInfo.displayName,
                isOffice: checkOutLocationInfo.isOffice,
            } : null,
        });
    }
    catch (error) {
        console.error("Get today status error:", error);
        return res.status(500).json({ message: "Failed to get today's status" });
    }
}
/**
 * List attendance records with filters
 */
export async function listAttendance(req, res) {
    try {
        const query = ListAttendanceQuery.parse(req.query);
        const currentUserEmployeeId = req.user?.employeeId;
        // Build where clause
        const where = {};
        // If employeeId is provided in query, use it (for managers/HR viewing team attendance)
        // Otherwise, show current user's attendance
        if (query.employeeId) {
            where.employeeId = query.employeeId;
        }
        else if (currentUserEmployeeId) {
            where.employeeId = currentUserEmployeeId;
        }
        if (query.startDate) {
            where.date = { ...where.date, gte: new Date(query.startDate) };
        }
        if (query.endDate) {
            where.date = { ...where.date, lte: new Date(query.endDate) };
        }
        if (query.status) {
            where.status = query.status;
        }
        const skip = (query.page - 1) * query.pageSize;
        const [items, total] = await Promise.all([
            prisma.attendance.findMany({
                where,
                skip,
                take: query.pageSize,
                orderBy: { date: "desc" },
                include: {
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
            }),
            prisma.attendance.count({ where }),
        ]);
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
                    officeName: checkInLocationInfo.officeName,
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
    }
    catch (error) {
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
export async function getAttendanceStats(req, res) {
    try {
        const employeeId = req.user?.employeeId;
        if (!employeeId) {
            return res.status(400).json({ message: "Employee record not found for user" });
        }
        // Get current month's stats
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const records = await prisma.attendance.findMany({
            where: {
                employeeId,
                date: {
                    gte: startOfMonth,
                    lte: endOfMonth,
                },
            },
        });
        const stats = {
            totalDays: records.length,
            presentDays: records.filter(r => r.status === "PRESENT").length,
            lateDays: records.filter(r => r.status === "LATE").length,
            absentDays: records.filter(r => r.status === "ABSENT").length,
            halfDays: records.filter(r => r.status === "HALF_DAY").length,
            onLeaveDays: records.filter(r => r.status === "ON_LEAVE").length,
            totalWorkHours: records.reduce((sum, r) => sum + (r.workHours ? parseFloat(r.workHours.toString()) : 0), 0),
        };
        return res.status(200).json(stats);
    }
    catch (error) {
        console.error("Get attendance stats error:", error);
        return res.status(500).json({ message: "Failed to get attendance statistics" });
    }
}
/**
 * Update attendance record (for HR/Admin manual corrections)
 */
export async function updateAttendance(req, res) {
    try {
        const { id } = req.params;
        const body = UpdateAttendanceDto.parse(req.body);
        const attendance = await prisma.attendance.update({
            where: { id },
            data: body,
            include: {
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        employeeCode: true,
                    },
                },
            },
        });
        return res.status(200).json(attendance);
    }
    catch (error) {
        console.error("Update attendance error:", error);
        if (error.name === "ZodError") {
            return res.status(400).json({ message: "Invalid input", errors: error.errors });
        }
        if (error.code === "P2025") {
            return res.status(404).json({ message: "Attendance record not found" });
        }
        return res.status(500).json({ message: "Failed to update attendance" });
    }
}
/**
 * Delete attendance record
 */
export async function deleteAttendance(req, res) {
    try {
        const { id } = req.params;
        await prisma.attendance.delete({
            where: { id },
        });
        return res.status(204).send();
    }
    catch (error) {
        console.error("Delete attendance error:", error);
        if (error.code === "P2025") {
            return res.status(404).json({ message: "Attendance record not found" });
        }
        return res.status(500).json({ message: "Failed to delete attendance" });
    }
}
//# sourceMappingURL=attendance.controller.js.map