import { z } from "zod";
export declare const TaskPrioritySchema: z.ZodEnum<{
    LOW: "LOW";
    HIGH: "HIGH";
    URGENT: "URGENT";
    MEDIUM: "MEDIUM";
}>;
export declare const TaskStatusSchema: z.ZodEnum<{
    CANCELLED: "CANCELLED";
    REVIEW: "REVIEW";
    IN_PROGRESS: "IN_PROGRESS";
    TODO: "TODO";
    DONE: "DONE";
}>;
export declare const TaskRecurrenceTypeSchema: z.ZodEnum<{
    MONTHLY: "MONTHLY";
    WEEKLY: "WEEKLY";
    NONE: "NONE";
    DAILY: "DAILY";
    YEARLY: "YEARLY";
}>;
export declare const CreateTaskDto: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    project: z.ZodOptional<z.ZodString>;
    priority: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        LOW: "LOW";
        HIGH: "HIGH";
        URGENT: "URGENT";
        MEDIUM: "MEDIUM";
    }>>>;
    status: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        CANCELLED: "CANCELLED";
        REVIEW: "REVIEW";
        IN_PROGRESS: "IN_PROGRESS";
        TODO: "TODO";
        DONE: "DONE";
    }>>>;
    startDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    dueDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    estimatedHours: z.ZodNullable<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    recurrenceType: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        MONTHLY: "MONTHLY";
        WEEKLY: "WEEKLY";
        NONE: "NONE";
        DAILY: "DAILY";
        YEARLY: "YEARLY";
    }>>>;
    recurrenceRule: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodAny, z.core.SomeType>>>;
    parentTaskId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    tags: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    assigneeIds: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    watcherIds: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    dependencyTaskIds: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString>>>;
}, z.core.$strip>;
export declare const UpdateTaskDto: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    project: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    priority: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        LOW: "LOW";
        HIGH: "HIGH";
        URGENT: "URGENT";
        MEDIUM: "MEDIUM";
    }>>>>;
    startDate: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    dueDate: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    estimatedHours: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodCoercedNumber<unknown>>>>;
    recurrenceType: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        MONTHLY: "MONTHLY";
        WEEKLY: "WEEKLY";
        NONE: "NONE";
        DAILY: "DAILY";
        YEARLY: "YEARLY";
    }>>>>;
    recurrenceRule: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodAny, z.core.SomeType>>>>;
    parentTaskId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    tags: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString>>>>;
    assigneeIds: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString>>>>;
    watcherIds: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString>>>>;
    dependencyTaskIds: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString>>>>;
    status: z.ZodOptional<z.ZodEnum<{
        CANCELLED: "CANCELLED";
        REVIEW: "REVIEW";
        IN_PROGRESS: "IN_PROGRESS";
        TODO: "TODO";
        DONE: "DONE";
    }>>;
}, z.core.$strip>;
export declare const ListTasksQuery: z.ZodObject<{
    page: z.ZodDefault<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    pageSize: z.ZodDefault<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    status: z.ZodOptional<z.ZodEnum<{
        CANCELLED: "CANCELLED";
        REVIEW: "REVIEW";
        IN_PROGRESS: "IN_PROGRESS";
        TODO: "TODO";
        DONE: "DONE";
    }>>;
    priority: z.ZodOptional<z.ZodEnum<{
        LOW: "LOW";
        HIGH: "HIGH";
        URGENT: "URGENT";
        MEDIUM: "MEDIUM";
    }>>;
    project: z.ZodOptional<z.ZodString>;
    assigneeId: z.ZodOptional<z.ZodString>;
    createdBy: z.ZodOptional<z.ZodString>;
    dueDateFrom: z.ZodOptional<z.ZodString>;
    dueDateTo: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    tag: z.ZodOptional<z.ZodString>;
    overdueOnly: z.ZodOptional<z.ZodCoercedBoolean<unknown>>;
    unreadOnly: z.ZodOptional<z.ZodCoercedBoolean<unknown>>;
}, z.core.$strip>;
export declare const AddCommentDto: z.ZodObject<{
    content: z.ZodString;
    mentions: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString>>>;
}, z.core.$strip>;
export declare const AddTimeLogDto: z.ZodObject<{
    date: z.ZodString;
    hours: z.ZodCoercedNumber<unknown>;
    description: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const BulkUpdateTasksDto: z.ZodObject<{
    taskIds: z.ZodArray<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        CANCELLED: "CANCELLED";
        REVIEW: "REVIEW";
        IN_PROGRESS: "IN_PROGRESS";
        TODO: "TODO";
        DONE: "DONE";
    }>>;
    priority: z.ZodOptional<z.ZodEnum<{
        LOW: "LOW";
        HIGH: "HIGH";
        URGENT: "URGENT";
        MEDIUM: "MEDIUM";
    }>>;
    assigneeIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    dueDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export type CreateTaskData = z.infer<typeof CreateTaskDto>;
export type UpdateTaskData = z.infer<typeof UpdateTaskDto>;
export type ListTasksQueryData = z.infer<typeof ListTasksQuery>;
export type AddCommentData = z.infer<typeof AddCommentDto>;
export type AddTimeLogData = z.infer<typeof AddTimeLogDto>;
export type BulkUpdateTasksData = z.infer<typeof BulkUpdateTasksDto>;
//# sourceMappingURL=task.dto.d.ts.map