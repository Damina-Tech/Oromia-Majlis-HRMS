import { z } from "zod";
export declare const CreateAllowanceDto: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodEnum<{
        OTHER: "OTHER";
        TRANSPORT: "TRANSPORT";
        HOUSING: "HOUSING";
        MEAL: "MEAL";
        COMMUNICATION: "COMMUNICATION";
        MEDICAL: "MEDICAL";
    }>;
    description: z.ZodOptional<z.ZodString>;
    amount: z.ZodCoercedNumber<unknown>;
    isPercentage: z.ZodDefault<z.ZodBoolean>;
    percentage: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare const UpdateAllowanceDto: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<{
        OTHER: "OTHER";
        TRANSPORT: "TRANSPORT";
        HOUSING: "HOUSING";
        MEAL: "MEAL";
        COMMUNICATION: "COMMUNICATION";
        MEDICAL: "MEDICAL";
    }>>;
    description: z.ZodOptional<z.ZodString>;
    amount: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    isPercentage: z.ZodOptional<z.ZodBoolean>;
    percentage: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const AssignEmployeeAllowanceDto: z.ZodObject<{
    employeeId: z.ZodString;
    allowanceId: z.ZodString;
    month: z.ZodString;
    amount: z.ZodCoercedNumber<unknown>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const ListAllowanceQuery: z.ZodObject<{
    type: z.ZodOptional<z.ZodEnum<{
        OTHER: "OTHER";
        TRANSPORT: "TRANSPORT";
        HOUSING: "HOUSING";
        MEAL: "MEAL";
        COMMUNICATION: "COMMUNICATION";
        MEDICAL: "MEDICAL";
    }>>;
    isActive: z.ZodOptional<z.ZodCoercedBoolean<unknown>>;
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export type CreateAllowanceDtoType = z.infer<typeof CreateAllowanceDto>;
export type UpdateAllowanceDtoType = z.infer<typeof UpdateAllowanceDto>;
export type AssignEmployeeAllowanceDtoType = z.infer<typeof AssignEmployeeAllowanceDto>;
export type ListAllowanceQueryType = z.infer<typeof ListAllowanceQuery>;
//# sourceMappingURL=allowance.dto.d.ts.map