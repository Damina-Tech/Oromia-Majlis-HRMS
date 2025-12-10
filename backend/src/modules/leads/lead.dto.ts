import { z } from "zod";
import { LeadPriority, LeadStage, LeadStatus, LeadDispositionReason } from "@prisma/client";

export const LeadStageSchema = z.nativeEnum(LeadStage);
export const LeadStatusSchema = z.nativeEnum(LeadStatus);
export const LeadPrioritySchema = z.nativeEnum(LeadPriority);
export const LeadDispositionReasonSchema = z.nativeEnum(LeadDispositionReason);

const optionalString = (min = 1, message = "This field is required") =>
  z
    .string()
    .trim()
    .min(min, message)
    .max(120)
    .optional()
    .or(z.literal("").transform(() => undefined));

const contactField = optionalString();
const optionalIdField = z
  .string()
  .trim()
  .min(1)
  .optional()
  .or(z.literal("").transform(() => undefined));

export const CreateLeadDto = z
  .object({
    fullName: z.string().min(2).max(200),
    phone: contactField,
    email: contactField.refine(
      (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      "Invalid email address"
    ),
    location: z.string().optional(),
    address: z.string().optional(),
    gender: z.string().optional(),
    education: z.string().optional(),
    interest: z.string().optional(),
    source: z.string().optional(),
    companyName: z.string().optional(),
    website: z.string().url().optional(),
    assignedDepartmentId: optionalIdField,
    assignedToUserId: optionalIdField,
    priority: LeadPrioritySchema.optional().default(LeadPriority.MEDIUM),
    stage: LeadStageSchema.optional().default(LeadStage.NEW),
    status: LeadStatusSchema.optional().default(LeadStatus.ACTIVE),
    tags: z.array(z.string()).optional().default([]),
    timezone: z.string().optional(),
    potentialValue: z.coerce.number().positive().optional(),
    allowDuplicate: z.coerce.boolean().optional().default(false),
  })
  .superRefine((data, ctx) => {
    if (!data.phone && !data.email) {
      ctx.addIssue({
        path: ["phone"],
        code: z.ZodIssueCode.custom,
        message: "Either phone or email is required",
      });
      ctx.addIssue({
        path: ["email"],
        code: z.ZodIssueCode.custom,
        message: "Either phone or email is required",
      });
    }
  });

export const UpdateLeadDto = CreateLeadDto.partial().extend({
  lastContactedAt: z.string().datetime().optional(),
  nextFollowUpAt: z.string().datetime().optional(),
});

export const LeadFilterDto = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  pageSize: z.coerce.number().min(1).max(100).optional().default(10),
  search: z.string().optional(),
  stage: LeadStageSchema.optional(),
  status: LeadStatusSchema.optional(),
  priority: LeadPrioritySchema.optional(),
  assignedToUserId: z.string().optional(),
  assignedDepartmentId: z.string().optional(),
  source: z.string().optional(),
  createdFrom: z.string().datetime().optional(),
  createdTo: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
});

export const LeadStageChangeDto = z.object({
  stage: LeadStageSchema,
  note: z.string().optional(),
});

export const LeadAssignDto = z.object({
  assignedToUserId: z.string().min(1),
  assignedDepartmentId: z.string().optional(),
  priority: LeadPrioritySchema.optional(),
});

export const LeadNoteDto = z.object({
  content: z.string().min(2).max(2000),
  attachments: z.array(z.object({ name: z.string(), url: z.string() })).optional().default([]),
});

export const LeadDispositionDto = z.object({
  reason: LeadDispositionReasonSchema,
  note: z.string().optional(),
});

export const LeadKanbanQueryDto = z.object({
  assignedToUserId: z.string().optional(),
  priority: LeadPrioritySchema.optional(),
});

export type CreateLeadInput = z.infer<typeof CreateLeadDto>;
export type UpdateLeadInput = z.infer<typeof UpdateLeadDto>;
export type LeadFilterInput = z.infer<typeof LeadFilterDto>;
export type LeadStageChangeInput = z.infer<typeof LeadStageChangeDto>;
export type LeadAssignInput = z.infer<typeof LeadAssignDto>;
export type LeadNoteInput = z.infer<typeof LeadNoteDto>;
export type LeadDispositionInput = z.infer<typeof LeadDispositionDto>;
export type LeadKanbanQueryInput = z.infer<typeof LeadKanbanQueryDto>;

