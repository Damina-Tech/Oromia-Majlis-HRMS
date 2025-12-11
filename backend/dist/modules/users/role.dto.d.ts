import { z } from "zod";
export declare const CreateRoleDto: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    permissionIds: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export declare const UpdateRoleDto: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    permissionIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export type CreateRoleDto = z.infer<typeof CreateRoleDto>;
export type UpdateRoleDto = z.infer<typeof UpdateRoleDto>;
//# sourceMappingURL=role.dto.d.ts.map