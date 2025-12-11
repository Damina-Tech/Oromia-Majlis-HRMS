import { z } from "zod";

export const LeaveTypeEnum = z.enum(["CASUAL", "SICK", "VACATION", "MATERNITY", "PERSONAL"]);
export const LeaveStatusEnum = z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"]);

export const CreateLeaveRequestDto = z.object({
<<<<<<< HEAD
=======
  employeeId: z.string().optional(), // Optional: if provided, create for that employee (admin/manager only)
>>>>>>> dev
  type: LeaveTypeEnum,
  startDate: z.string(), // ISO date string
  endDate: z.string(), // ISO date string
  reason: z.string().min(10, "Reason must be at least 10 characters"),
<<<<<<< HEAD
=======
  halfDay: z.boolean().optional().default(false),
>>>>>>> dev
});

export const UpdateLeaveStatusDto = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  rejectionReason: z.string().optional(),
<<<<<<< HEAD
=======
  comment: z.string().optional(), // Comment from approver
});

export const UpdateLeaveRequestDto = z.object({
  type: LeaveTypeEnum.optional(),
  startDate: z.string().optional(), // ISO date string
  endDate: z.string().optional(), // ISO date string
  reason: z.string().min(10, "Reason must be at least 10 characters").optional(),
  halfDay: z.boolean().optional(),
>>>>>>> dev
});

export const ListLeaveRequestsQuery = z.object({
  status: LeaveStatusEnum.optional(),
  employeeId: z.string().optional(),
<<<<<<< HEAD
=======
  search: z.string().optional(), // Search by employee name or email
  startDate: z.string().optional(), // Filter by start date (YYYY-MM-DD)
  endDate: z.string().optional(), // Filter by end date (YYYY-MM-DD)
  type: LeaveTypeEnum.optional(), // Filter by leave type
  sortBy: z.enum(["createdAt", "startDate", "endDate", "days", "status"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
>>>>>>> dev
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(1000).default(50),
});

export type CreateLeaveRequestInput = z.infer<typeof CreateLeaveRequestDto>;
export type UpdateLeaveStatusInput = z.infer<typeof UpdateLeaveStatusDto>;
export type ListLeaveRequestsInput = z.infer<typeof ListLeaveRequestsQuery>;

