import { z } from "zod";

export const LeaveTypeEnum = z.enum(["CASUAL", "SICK", "VACATION", "MATERNITY", "PERSONAL"]);
export const LeaveStatusEnum = z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"]);

export const CreateLeaveRequestDto = z.object({
  type: LeaveTypeEnum,
  startDate: z.string(), // ISO date string
  endDate: z.string(), // ISO date string
  reason: z.string().min(10, "Reason must be at least 10 characters"),
});

export const UpdateLeaveStatusDto = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  rejectionReason: z.string().optional(),
});

export const ListLeaveRequestsQuery = z.object({
  status: LeaveStatusEnum.optional(),
  employeeId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(1000).default(50),
});

export type CreateLeaveRequestInput = z.infer<typeof CreateLeaveRequestDto>;
export type UpdateLeaveStatusInput = z.infer<typeof UpdateLeaveStatusDto>;
export type ListLeaveRequestsInput = z.infer<typeof ListLeaveRequestsQuery>;

