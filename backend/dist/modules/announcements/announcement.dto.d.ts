import { z } from "zod";
export declare const AnnouncementTypeSchema: z.ZodEnum<{
    HR: "HR";
    SYSTEM: "SYSTEM";
    FINANCE: "FINANCE";
    GENERAL: "GENERAL";
    MEETING: "MEETING";
}>;
export declare const AnnouncementUrgencySchema: z.ZodEnum<{
    NORMAL: "NORMAL";
    URGENT: "URGENT";
    IMPORTANT: "IMPORTANT";
}>;
export declare const AnnouncementStatusSchema: z.ZodEnum<{
    CANCELLED: "CANCELLED";
    DRAFT: "DRAFT";
    SCHEDULED: "SCHEDULED";
    PUBLISHED: "PUBLISHED";
    EXPIRED: "EXPIRED";
}>;
export declare const DeliveryChannelSchema: z.ZodEnum<{
    IN_APP: "IN_APP";
    EMAIL: "EMAIL";
    SMS: "SMS";
    WHATSAPP: "WHATSAPP";
}>;
export declare const TargetSchema: z.ZodObject<{
    type: z.ZodEnum<{
        role: "role";
        department: "department";
        all: "all";
        employees: "employees";
        group: "group";
    }>;
    ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const CreateAnnouncementDto: z.ZodObject<{
    title: z.ZodString;
    body: z.ZodString;
    type: z.ZodEnum<{
        HR: "HR";
        SYSTEM: "SYSTEM";
        FINANCE: "FINANCE";
        GENERAL: "GENERAL";
        MEETING: "MEETING";
    }>;
    urgency: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        NORMAL: "NORMAL";
        URGENT: "URGENT";
        IMPORTANT: "IMPORTANT";
    }>>>;
    publishAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    expireAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    target: z.ZodObject<{
        type: z.ZodEnum<{
            role: "role";
            department: "department";
            all: "all";
            employees: "employees";
            group: "group";
        }>;
        ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>;
    channels: z.ZodArray<z.ZodEnum<{
        IN_APP: "IN_APP";
        EMAIL: "EMAIL";
        SMS: "SMS";
        WHATSAPP: "WHATSAPP";
    }>>;
    requiresAck: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    requiresRSVP: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    attachmentIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    publish: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>;
export declare const UpdateAnnouncementDto: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    body: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<{
        HR: "HR";
        SYSTEM: "SYSTEM";
        FINANCE: "FINANCE";
        GENERAL: "GENERAL";
        MEETING: "MEETING";
    }>>;
    urgency: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        NORMAL: "NORMAL";
        URGENT: "URGENT";
        IMPORTANT: "IMPORTANT";
    }>>>>;
    publishAt: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    expireAt: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    target: z.ZodOptional<z.ZodObject<{
        type: z.ZodEnum<{
            role: "role";
            department: "department";
            all: "all";
            employees: "employees";
            group: "group";
        }>;
        ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
    channels: z.ZodOptional<z.ZodArray<z.ZodEnum<{
        IN_APP: "IN_APP";
        EMAIL: "EMAIL";
        SMS: "SMS";
        WHATSAPP: "WHATSAPP";
    }>>>;
    requiresAck: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
    requiresRSVP: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
    attachmentIds: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    publish: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
    status: z.ZodOptional<z.ZodEnum<{
        CANCELLED: "CANCELLED";
        DRAFT: "DRAFT";
        SCHEDULED: "SCHEDULED";
        PUBLISHED: "PUBLISHED";
        EXPIRED: "EXPIRED";
    }>>;
}, z.core.$strip>;
export declare const ListAnnouncementsQuery: z.ZodObject<{
    page: z.ZodDefault<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    pageSize: z.ZodDefault<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    status: z.ZodOptional<z.ZodEnum<{
        CANCELLED: "CANCELLED";
        DRAFT: "DRAFT";
        SCHEDULED: "SCHEDULED";
        PUBLISHED: "PUBLISHED";
        EXPIRED: "EXPIRED";
    }>>;
    type: z.ZodOptional<z.ZodEnum<{
        HR: "HR";
        SYSTEM: "SYSTEM";
        FINANCE: "FINANCE";
        GENERAL: "GENERAL";
        MEETING: "MEETING";
    }>>;
    urgency: z.ZodOptional<z.ZodEnum<{
        NORMAL: "NORMAL";
        URGENT: "URGENT";
        IMPORTANT: "IMPORTANT";
    }>>;
    search: z.ZodOptional<z.ZodString>;
    dateFrom: z.ZodOptional<z.ZodString>;
    dateTo: z.ZodOptional<z.ZodString>;
    unreadOnly: z.ZodDefault<z.ZodOptional<z.ZodCoercedBoolean<unknown>>>;
}, z.core.$strip>;
export declare const AcknowledgeAnnouncementDto: z.ZodObject<{
    acknowledged: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    deviceInfo: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, z.core.$strip>;
export declare const ListReadsQuery: z.ZodObject<{
    page: z.ZodDefault<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    pageSize: z.ZodDefault<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    acknowledgedOnly: z.ZodOptional<z.ZodCoercedBoolean<unknown>>;
}, z.core.$strip>;
export type CreateAnnouncementData = z.infer<typeof CreateAnnouncementDto>;
export type UpdateAnnouncementData = z.infer<typeof UpdateAnnouncementDto>;
export type ListAnnouncementsQueryData = z.infer<typeof ListAnnouncementsQuery>;
export type AcknowledgeAnnouncementData = z.infer<typeof AcknowledgeAnnouncementDto>;
export type ListReadsQueryData = z.infer<typeof ListReadsQuery>;
export type TargetData = z.infer<typeof TargetSchema>;
//# sourceMappingURL=announcement.dto.d.ts.map