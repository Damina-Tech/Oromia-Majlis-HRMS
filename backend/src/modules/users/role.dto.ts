import { z } from "zod";

export const CreateRoleDto = z.object({
  name: z.string().min(1, "Role name is required").max(100),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).min(1, "At least one permission is required"),
});

export const UpdateRoleDto = z.object({
  name: z.string().min(1, "Role name is required").max(100).optional(),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).min(1, "At least one permission is required").optional(),
});

export type CreateRoleDto = z.infer<typeof CreateRoleDto>;
export type UpdateRoleDto = z.infer<typeof UpdateRoleDto>;

