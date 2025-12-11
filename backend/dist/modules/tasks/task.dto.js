import { z } from "zod";
// Enums
export const TaskPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
export const TaskStatusSchema = z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE", "CANCELLED"]);
export const TaskRecurrenceTypeSchema = z.enum(["NONE", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"]);
// Create Task DTO
export const CreateTaskDto = z.object({
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().optional(),
    project: z.string().optional(),
    priority: TaskPrioritySchema.optional().default("MEDIUM"),
    status: TaskStatusSchema.optional().default("TODO"),
    startDate: z.string().date().optional().nullable(),
    dueDate: z.string().date().optional().nullable(),
    estimatedHours: z.coerce.number().positive().optional().nullable(),
    recurrenceType: TaskRecurrenceTypeSchema.optional().default("NONE"),
    recurrenceRule: z.record(z.any()).optional().nullable(),
    parentTaskId: z.string().optional().nullable(),
    tags: z.array(z.string()).optional().default([]),
    assigneeIds: z.array(z.string()).optional().default([]), // Employee IDs
    watcherIds: z.array(z.string()).optional().default([]), // User IDs
    dependencyTaskIds: z.array(z.string()).optional().default([]), // Task IDs that must complete first
});
// Update Task DTO
export const UpdateTaskDto = CreateTaskDto.partial().extend({
    status: TaskStatusSchema.optional(),
});
// List Tasks Query
export const ListTasksQuery = z.object({
    page: z.coerce.number().min(1).optional().default(1),
    pageSize: z.coerce.number().min(1).max(1000).optional().default(20),
    status: TaskStatusSchema.optional(),
    priority: TaskPrioritySchema.optional(),
    project: z.string().optional(),
    assigneeId: z.string().optional(),
    createdBy: z.string().optional(),
    dueDateFrom: z.string().date().optional(),
    dueDateTo: z.string().date().optional(),
    search: z.string().optional(),
    tag: z.string().optional(),
    overdueOnly: z.coerce.boolean().optional(),
    unreadOnly: z.coerce.boolean().optional(),
});
// Add Comment DTO
export const AddCommentDto = z.object({
    content: z.string().min(1, "Comment content is required"),
    mentions: z.array(z.string()).optional().default([]), // User IDs
});
// Add Time Log DTO
export const AddTimeLogDto = z.object({
    date: z.string().date(),
    hours: z.coerce.number().positive("Hours must be positive"),
    description: z.string().optional(),
});
// Bulk Update DTO
export const BulkUpdateTasksDto = z.object({
    taskIds: z.array(z.string()).min(1, "At least one task ID is required"),
    status: TaskStatusSchema.optional(),
    priority: TaskPrioritySchema.optional(),
    assigneeIds: z.array(z.string()).optional(),
    dueDate: z.string().date().optional().nullable(),
});
//# sourceMappingURL=task.dto.js.map