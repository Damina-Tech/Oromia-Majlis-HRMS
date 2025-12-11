import { z } from "zod";
export declare const TimesheetStatusSchema: z.ZodEnum<{
    APPROVED: "APPROVED";
    REJECTED: "REJECTED";
    DRAFT: "DRAFT";
    SUBMITTED: "SUBMITTED";
}>;
export declare const CreateTimesheetSessionDto: z.ZodObject<{
    taskName: z.ZodString;
    projectName: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    startTime: z.ZodString;
    endTime: z.ZodString;
    duration: z.ZodNumber;
}, z.core.$strip>;
export declare const UpdateTimesheetSessionDto: z.ZodObject<{
    taskName: z.ZodOptional<z.ZodString>;
    projectName: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    startTime: z.ZodOptional<z.ZodString>;
    endTime: z.ZodOptional<z.ZodString>;
    duration: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const CreateTimesheetDto: z.ZodObject<{
    date: z.ZodString;
    sessions: z.ZodArray<z.ZodObject<{
        taskName: z.ZodString;
        projectName: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        startTime: z.ZodString;
        endTime: z.ZodString;
        duration: z.ZodNumber;
    }, z.core.$strip>>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const UpdateTimesheetDto: z.ZodObject<{
    date: z.ZodOptional<z.ZodString>;
    sessions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        taskName: z.ZodString;
        projectName: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        startTime: z.ZodString;
        endTime: z.ZodString;
        duration: z.ZodNumber;
    }, z.core.$strip>>>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const SubmitTimesheetDto: z.ZodObject<{
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const UpdateTimesheetStatusDto: z.ZodObject<{
    status: z.ZodEnum<{
        APPROVED: "APPROVED";
        REJECTED: "REJECTED";
        DRAFT: "DRAFT";
        SUBMITTED: "SUBMITTED";
    }>;
    rejectionReason: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const ListTimesheetQuery: z.ZodObject<{
    employeeId: z.ZodOptional<z.ZodString>;
    date: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        APPROVED: "APPROVED";
        REJECTED: "REJECTED";
        DRAFT: "DRAFT";
        SUBMITTED: "SUBMITTED";
    }>>;
    week: z.ZodOptional<z.ZodString>;
    month: z.ZodOptional<z.ZodString>;
    year: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const TimesheetSummaryQuery: z.ZodObject<{
    employeeId: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    week: z.ZodOptional<z.ZodString>;
    month: z.ZodOptional<z.ZodString>;
    year: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const StartTimerDto: z.ZodObject<{
    taskName: z.ZodString;
    projectName: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const StopTimerDto: z.ZodObject<{
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const ManualTimeEntryDto: z.ZodObject<{
    taskName: z.ZodString;
    projectName: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    date: z.ZodString;
    startTime: z.ZodString;
    endTime: z.ZodString;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
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
//# sourceMappingURL=timesheet.dto.d.ts.map