import { z } from "zod";
export declare const CheckInDto: z.ZodObject<{
    location: z.ZodString;
}, z.core.$strip>;
export declare const CheckOutDto: z.ZodObject<{
    location: z.ZodString;
}, z.core.$strip>;
export declare const ListAttendanceQuery: z.ZodObject<{
    employeeId: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        ON_LEAVE: "ON_LEAVE";
        PRESENT: "PRESENT";
        LATE: "LATE";
        ABSENT: "ABSENT";
        HALF_DAY: "HALF_DAY";
    }>>;
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const UpdateAttendanceDto: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<{
        ON_LEAVE: "ON_LEAVE";
        PRESENT: "PRESENT";
        LATE: "LATE";
        ABSENT: "ABSENT";
        HALF_DAY: "HALF_DAY";
    }>>;
    checkInTime: z.ZodOptional<z.ZodString>;
    checkOutTime: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CheckInDtoType = z.infer<typeof CheckInDto>;
export type CheckOutDtoType = z.infer<typeof CheckOutDto>;
export type ListAttendanceQueryType = z.infer<typeof ListAttendanceQuery>;
export type UpdateAttendanceDtoType = z.infer<typeof UpdateAttendanceDto>;
//# sourceMappingURL=attendance.dto.d.ts.map