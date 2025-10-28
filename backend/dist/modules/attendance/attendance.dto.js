import { z } from "zod";
// Check-in DTO
export const CheckInDto = z.object({
    location: z.string().min(1, "Location is required"),
});
// Check-out DTO
export const CheckOutDto = z.object({
    location: z.string().min(1, "Location is required"),
});
// List attendance query
export const ListAttendanceQuery = z.object({
    employeeId: z.string().optional(),
    startDate: z.string().optional(), // YYYY-MM-DD
    endDate: z.string().optional(), // YYYY-MM-DD
    status: z.enum(["PRESENT", "LATE", "ABSENT", "HALF_DAY", "ON_LEAVE"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(1000).default(50),
});
// Update attendance DTO (for manual corrections by HR/Admin)
export const UpdateAttendanceDto = z.object({
    status: z.enum(["PRESENT", "LATE", "ABSENT", "HALF_DAY", "ON_LEAVE"]).optional(),
    checkInTime: z.string().optional(),
    checkOutTime: z.string().optional(),
    notes: z.string().optional(),
});
//# sourceMappingURL=attendance.dto.js.map