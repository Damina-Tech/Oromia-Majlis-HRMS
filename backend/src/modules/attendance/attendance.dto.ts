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
  endDate: z.string().optional(),   // YYYY-MM-DD
  status: z.enum(["PRESENT", "LATE", "ABSENT", "HALF_DAY", "ON_LEAVE"]).optional(),
  search: z.string().optional(), // Search by employee name or email
  sortBy: z.enum(["date", "checkInTime", "checkOutTime", "status", "createdAt"]).optional().default("date"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(1000).default(50),
  allEmployees: z.coerce.boolean().optional().default(false), // If true, show all employees (for admins/HR/managers)
});

// Create attendance record DTO (for HR/Admin manual entry)
export const CreateAttendanceDto = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  date: z.string(), // ISO date string (YYYY-MM-DD)
  checkInTime: z.string().optional(), // ISO datetime string
  checkOutTime: z.string().optional(), // ISO datetime string
  checkInLocation: z.string().optional(),
  checkOutLocation: z.string().optional(),
  status: z.enum(["PRESENT", "LATE", "ABSENT", "HALF_DAY", "ON_LEAVE"]).default("PRESENT"),
  notes: z.string().optional(),
});

// Update attendance DTO (for manual corrections by HR/Admin)
export const UpdateAttendanceDto = z.object({
  status: z.enum(["PRESENT", "LATE", "ABSENT", "HALF_DAY", "ON_LEAVE"]).optional(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  checkInLocation: z.string().optional(),
  checkOutLocation: z.string().optional(),
  notes: z.string().optional(),
});

export type CheckInDtoType = z.infer<typeof CheckInDto>;
export type CheckOutDtoType = z.infer<typeof CheckOutDto>;
export type ListAttendanceQueryType = z.infer<typeof ListAttendanceQuery>;
export type CreateAttendanceDtoType = z.infer<typeof CreateAttendanceDto>;
export type UpdateAttendanceDtoType = z.infer<typeof UpdateAttendanceDto>;

