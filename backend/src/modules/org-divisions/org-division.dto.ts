import { z } from "zod";
import { OrgDivisionCode } from "@prisma/client";

export const UpdateOrgDivisionDto = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional().nullable(),
  headUserId: z.string().min(1).optional().nullable(),
  active: z.boolean().optional(),
});

export const CreateDivisionAssignmentDto = z.object({
  userId: z.string().min(1),
  divisionId: z.string().min(1),
  roleId: z.string().min(1),
  isPrimary: z.boolean().optional(),
});

export const UpdateDivisionAssignmentDto = z.object({
  roleId: z.string().min(1).optional(),
  isPrimary: z.boolean().optional(),
});

export const ListDivisionAssignmentsQuery = z.object({
  divisionId: z.string().optional(),
  userId: z.string().optional(),
});

export type OrgDivisionCodeValue = (typeof OrgDivisionCode)[keyof typeof OrgDivisionCode];
