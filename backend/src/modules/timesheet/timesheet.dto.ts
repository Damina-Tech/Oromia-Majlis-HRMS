import { z } from "zod";

// Timesheet Status
export const TimesheetStatusSchema = z.enum(["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"]);

// Create Timesheet Session DTO
export const CreateTimesheetSessionDto = z.object({
  taskName: z.string().min(1, "Task name is required").max(200, "Task name too long"),
  projectName: z.string().min(1, "Project name is required").max(200, "Project name too long"),
  description: z.string().optional(),
  startTime: z.string().datetime("Invalid start time format"),
  endTime: z.string().datetime("Invalid end time format"),
  duration: z.number().int().min(1, "Duration must be at least 1 minute").max(1440, "Duration cannot exceed 24 hours"), // Max 24 hours in minutes
});

// Update Timesheet Session DTO
export const UpdateTimesheetSessionDto = z.object({
  taskName: z.string().min(1).max(200).optional(),
  projectName: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  duration: z.number().int().min(1).max(1440).optional(),
});

// Create Timesheet DTO
export const CreateTimesheetDto = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  sessions: z.array(CreateTimesheetSessionDto).min(1, "At least one session is required"),
  notes: z.string().optional(),
});

// Update Timesheet DTO
export const UpdateTimesheetDto = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  sessions: z.array(CreateTimesheetSessionDto).optional(),
  notes: z.string().optional(),
});

// Submit Timesheet DTO
export const SubmitTimesheetDto = z.object({
  notes: z.string().optional(),
});

// Approve/Reject Timesheet DTO
export const UpdateTimesheetStatusDto = z.object({
  status: TimesheetStatusSchema,
  rejectionReason: z.string().optional(),
  notes: z.string().optional(),
});

// List Timesheet Query DTO
export const ListTimesheetQuery = z.object({
  employeeId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // YYYY-MM-DD
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: TimesheetStatusSchema.optional(),
  week: z.string().regex(/^\d{4}-W\d{2}$/).optional(), // YYYY-WXX format
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(), // YYYY-MM format
  year: z.string().regex(/^\d{4}$/).optional(), // YYYY format
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(1000).default(50),
});

// Get Timesheet Summary DTO
export const TimesheetSummaryQuery = z.object({
  employeeId: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  week: z.string().regex(/^\d{4}-W\d{2}$/).optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  year: z.string().regex(/^\d{4}$/).optional(),
});

// Start Timer DTO
export const StartTimerDto = z.object({
  taskName: z.string().min(1, "Task name is required").max(200),
  projectName: z.string().min(1, "Project name is required").max(200),
  description: z.string().optional(),
});

// Stop Timer DTO
export const StopTimerDto = z.object({
  notes: z.string().optional(),
});

// Manual Time Entry DTO
export const ManualTimeEntryDto = z.object({
  taskName: z.string().min(1, "Task name is required").max(200),
  projectName: z.string().min(1, "Project name is required").max(200),
  description: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Start time must be in HH:MM format"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "End time must be in HH:MM format"),
  notes: z.string().optional(),
});

export type CreateTimesheetSessionDto = z.infer<typeof CreateTimesheetSessionDto>;
export type UpdateTimesheetSessionDto = z.infer<typeof UpdateTimesheetSessionDto>;
export type CreateTimesheetDto = z.infer<typeof CreateTimesheetDto>;
export type UpdateTimesheetDto = z.infer<typeof UpdateTimesheetDto>;
export type SubmitTimesheetDto = z.infer<typeof SubmitTimesheetDto>;
export type UpdateTimesheetStatusDto = z.infer<typeof UpdateTimesheetStatusDto>;
export type ListTimesheetQuery = z.infer<typeof ListTimesheetQuery>;
export type TimesheetSummaryQuery = z.infer<typeof TimesheetSummaryQuery>;
export type StartTimerDto = z.infer<typeof StartTimerDto>;
export type StopTimerDto = z.infer<typeof StopTimerDto>;
export type ManualTimeEntryDto = z.infer<typeof ManualTimeEntryDto>;
export type TimesheetStatus = z.infer<typeof TimesheetStatusSchema>;
