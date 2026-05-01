import { z } from "zod";
export declare const CreateUserDto: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    roleIds: z.ZodArray<z.ZodString>;
    employeeId: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        ACTIVE: "ACTIVE";
        INACTIVE: "INACTIVE";
    }>>>;
}, z.core.$strip>;
export declare const UpdateUserDto: z.ZodObject<{
    email: z.ZodOptional<z.ZodString>;
    password: z.ZodOptional<z.ZodString>;
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    roleIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    employeeId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    status: z.ZodOptional<z.ZodEnum<{
        ACTIVE: "ACTIVE";
        INACTIVE: "INACTIVE";
    }>>;
    avatarUrl: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const UpdateSelfDto: z.ZodObject<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    password: z.ZodOptional<z.ZodString>;
    avatarUrl: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const UpdateUserPermissionsDto: z.ZodObject<{
    overrides: z.ZodDefault<z.ZodArray<z.ZodObject<{
        permissionId: z.ZodString;
        allowed: z.ZodBoolean;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export declare const ListUsersQuery: z.ZodObject<{
    search: z.ZodOptional<z.ZodString>;
    roleId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        ACTIVE: "ACTIVE";
        INACTIVE: "INACTIVE";
    }>>;
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export type CreateUserDto = z.infer<typeof CreateUserDto>;
export type UpdateUserDto = z.infer<typeof UpdateUserDto>;
export type ListUsersQuery = z.infer<typeof ListUsersQuery>;
export type UpdateSelfDto = z.infer<typeof UpdateSelfDto>;
export type UpdateUserPermissionsDto = z.infer<typeof UpdateUserPermissionsDto>;
//# sourceMappingURL=user.dto.d.ts.map