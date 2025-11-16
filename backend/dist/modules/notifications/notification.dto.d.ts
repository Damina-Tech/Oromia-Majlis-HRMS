import { z } from "zod";
export declare const ListNotificationsQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    module: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<string | undefined, string | undefined>>;
    isRead: z.ZodPipe<z.ZodOptional<z.ZodEnum<{
        true: "true";
        false: "false";
    }>>, z.ZodTransform<boolean | undefined, "true" | "false" | undefined>>;
    search: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type ListNotificationsQuery = z.infer<typeof ListNotificationsQuerySchema>;
export declare const MarkNotificationsReadDto: z.ZodObject<{
    notificationIds: z.ZodArray<z.ZodString>;
    read: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export type MarkNotificationsReadDto = z.infer<typeof MarkNotificationsReadDto>;
export declare const UpdateNotificationPreferencesDto: z.ZodObject<{
    channels: z.ZodOptional<z.ZodObject<{
        inApp: z.ZodOptional<z.ZodBoolean>;
        email: z.ZodOptional<z.ZodBoolean>;
        push: z.ZodOptional<z.ZodBoolean>;
        sms: z.ZodOptional<z.ZodBoolean>;
        whatsapp: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>>;
    modules: z.ZodOptional<z.ZodRecord<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>, z.ZodObject<{
        inApp: z.ZodOptional<z.ZodBoolean>;
        email: z.ZodOptional<z.ZodBoolean>;
        push: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export type UpdateNotificationPreferencesDto = z.infer<typeof UpdateNotificationPreferencesDto>;
export declare const SendTestNotificationDto: z.ZodObject<{
    channel: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        IN_APP: "IN_APP";
        EMAIL: "EMAIL";
        PUSH: "PUSH";
        SMS: "SMS";
        WHATSAPP: "WHATSAPP";
    }>>>;
    title: z.ZodDefault<z.ZodString>;
    message: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export type SendTestNotificationDto = z.infer<typeof SendTestNotificationDto>;
//# sourceMappingURL=notification.dto.d.ts.map