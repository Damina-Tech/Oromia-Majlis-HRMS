import { z } from "zod";
export const CreateUserDto = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    roleIds: z.array(z.string()).min(1, "At least one role is required"),
    employeeId: z.string().optional(), // Optional link to employee
    status: z.enum(["ACTIVE", "INACTIVE"]).optional().default("ACTIVE"),
});
export const UpdateUserDto = z.object({
    email: z.string().email("Invalid email address").optional(),
    password: z.string().min(6, "Password must be at least 6 characters").optional(),
    firstName: z.string().min(1, "First name is required").optional(),
    lastName: z.string().min(1, "Last name is required").optional(),
    roleIds: z.array(z.string()).min(1, "At least one role is required").optional(),
    employeeId: z.string().nullable().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
    avatarUrl: z.string().min(1).optional(),
});
export const UpdateSelfDto = z.object({
    firstName: z.string().min(1, "First name is required").optional(),
    lastName: z.string().min(1, "Last name is required").optional(),
    password: z.string().min(6, "Password must be at least 6 characters").optional(),
    avatarUrl: z.string().min(1).optional(),
});
export const UpdateUserPermissionsDto = z.object({
    overrides: z
        .array(z.object({
        permissionId: z.string().min(1, "permissionId is required"),
        allowed: z.boolean(),
    }))
        .default([]),
});
export const ListUsersQuery = z.object({
    search: z.string().optional(),
    roleId: z.string().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(1000).default(10),
});
//# sourceMappingURL=user.dto.js.map