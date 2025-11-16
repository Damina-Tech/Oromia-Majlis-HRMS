import { z } from "zod";
export declare const LeaveTypeEnum: z.ZodEnum<{
    CASUAL: "CASUAL";
    SICK: "SICK";
    VACATION: "VACATION";
    MATERNITY: "MATERNITY";
    PERSONAL: "PERSONAL";
}>;
export declare const LeaveStatusEnum: z.ZodEnum<{
    PENDING: "PENDING";
    APPROVED: "APPROVED";
    REJECTED: "REJECTED";
    CANCELLED: "CANCELLED";
}>;
export declare const CreateLeaveRequestDto: z.ZodObject<{
    employeeId: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<{
        CASUAL: "CASUAL";
        SICK: "SICK";
        VACATION: "VACATION";
        MATERNITY: "MATERNITY";
        PERSONAL: "PERSONAL";
    }>;
    startDate: z.ZodString;
    endDate: z.ZodString;
    reason: z.ZodString;
    halfDay: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>;
export declare const UpdateLeaveStatusDto: z.ZodObject<{
    status: z.ZodEnum<{
        APPROVED: "APPROVED";
        REJECTED: "REJECTED";
    }>;
    rejectionReason: z.ZodOptional<z.ZodString>;
    comment: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const UpdateLeaveRequestDto: z.ZodObject<{
    type: z.ZodOptional<z.ZodEnum<{
        CASUAL: "CASUAL";
        SICK: "SICK";
        VACATION: "VACATION";
        MATERNITY: "MATERNITY";
        PERSONAL: "PERSONAL";
    }>>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    reason: z.ZodOptional<z.ZodString>;
    halfDay: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const ListLeaveRequestsQuery: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<{
        PENDING: "PENDING";
        APPROVED: "APPROVED";
        REJECTED: "REJECTED";
        CANCELLED: "CANCELLED";
    }>>;
    employeeId: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<{
        CASUAL: "CASUAL";
        SICK: "SICK";
        VACATION: "VACATION";
        MATERNITY: "MATERNITY";
        PERSONAL: "PERSONAL";
    }>>;
    sortBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        days: "days";
        status: "status";
        createdAt: "createdAt";
        startDate: "startDate";
        endDate: "endDate";
    }>>>;
    sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        desc: "desc";
        asc: "asc";
    }>>>;
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export type CreateLeaveRequestInput = z.infer<typeof CreateLeaveRequestDto>;
export type UpdateLeaveStatusInput = z.infer<typeof UpdateLeaveStatusDto>;
export type ListLeaveRequestsInput = z.infer<typeof ListLeaveRequestsQuery>;
//# sourceMappingURL=leave.dto.d.ts.map