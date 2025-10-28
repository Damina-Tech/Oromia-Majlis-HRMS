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
}, z.core.$strip>;
export declare const UpdateLeaveStatusDto: z.ZodObject<{
    status: z.ZodEnum<{
        APPROVED: "APPROVED";
        REJECTED: "REJECTED";
    }>;
    rejectionReason: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const ListLeaveRequestsQuery: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<{
        PENDING: "PENDING";
        APPROVED: "APPROVED";
        REJECTED: "REJECTED";
        CANCELLED: "CANCELLED";
    }>>;
    employeeId: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export type CreateLeaveRequestInput = z.infer<typeof CreateLeaveRequestDto>;
export type UpdateLeaveStatusInput = z.infer<typeof UpdateLeaveStatusDto>;
export type ListLeaveRequestsInput = z.infer<typeof ListLeaveRequestsQuery>;
//# sourceMappingURL=leave.dto.d.ts.map