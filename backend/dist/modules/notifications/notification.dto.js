import { z } from "zod";
export const ListNotificationsQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce
        .number()
        .int()
        .positive()
        .max(100)
        .default(20),
    module: z
        .string()
        .optional()
        .transform((val) => (val ? val.toUpperCase() : undefined)),
    isRead: z
        .enum(["true", "false"])
        .optional()
        .transform((val) => (val ? val === "true" : undefined)),
    search: z.string().optional(),
});
export const MarkNotificationsReadDto = z.object({
    notificationIds: z.array(z.string().min(1)).min(1),
    read: z.boolean().default(true),
});
export const UpdateNotificationPreferencesDto = z.object({
    channels: z
        .object({
        inApp: z.boolean().optional(),
        email: z.boolean().optional(),
        push: z.boolean().optional(),
        sms: z.boolean().optional(),
        whatsapp: z.boolean().optional(),
    })
        .optional(),
    modules: z
        .record(z.string().transform((val) => val.toUpperCase()), z.object({
        inApp: z.boolean().optional(),
        email: z.boolean().optional(),
        push: z.boolean().optional(),
    }))
        .optional(),
});
export const SendTestNotificationDto = z.object({
    channel: z
        .enum(["IN_APP", "EMAIL", "PUSH", "SMS", "WHATSAPP"])
        .optional()
        .default("IN_APP"),
    title: z.string().min(1).default("Test Notification"),
    message: z.string().min(1).default("This is a test notification."),
});
//# sourceMappingURL=notification.dto.js.map