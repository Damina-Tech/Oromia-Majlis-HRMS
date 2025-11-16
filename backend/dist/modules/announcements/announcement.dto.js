import { z } from "zod";
// Enums
export const AnnouncementTypeSchema = z.enum(["GENERAL", "HR", "FINANCE", "MEETING", "SYSTEM"]);
export const AnnouncementUrgencySchema = z.enum(["NORMAL", "IMPORTANT", "URGENT"]);
export const AnnouncementStatusSchema = z.enum(["DRAFT", "SCHEDULED", "PUBLISHED", "EXPIRED", "CANCELLED"]);
export const DeliveryChannelSchema = z.enum(["IN_APP", "EMAIL", "SMS", "WHATSAPP"]);
// Target schema
export const TargetSchema = z.object({
    type: z.enum(["all", "role", "department", "employees", "group"]),
    ids: z.array(z.string()).optional(),
});
// Create Announcement DTO
export const CreateAnnouncementDto = z.object({
    title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
    body: z.string().min(1, "Body is required"),
    type: AnnouncementTypeSchema,
    urgency: AnnouncementUrgencySchema.optional().default("NORMAL"),
    publishAt: z.string().datetime().optional().nullable(),
    expireAt: z.string().datetime().optional().nullable(),
    target: TargetSchema,
    channels: z.array(DeliveryChannelSchema).min(1, "At least one delivery channel is required"),
    requiresAck: z.boolean().optional().default(false),
    requiresRSVP: z.boolean().optional().default(false),
    attachmentIds: z.array(z.string()).optional(),
    publish: z.boolean().optional().default(false), // Explicit publish flag
});
// Update Announcement DTO
export const UpdateAnnouncementDto = CreateAnnouncementDto.partial().extend({
    status: AnnouncementStatusSchema.optional(),
});
// List Announcements Query
export const ListAnnouncementsQuery = z.object({
    page: z.coerce.number().min(1).optional().default(1),
    pageSize: z.coerce.number().min(1).max(1000).optional().default(20), // Increased for dashboard needs
    status: AnnouncementStatusSchema.optional(),
    type: AnnouncementTypeSchema.optional(),
    urgency: AnnouncementUrgencySchema.optional(),
    search: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    unreadOnly: z.coerce.boolean().optional().default(false),
});
// Acknowledge/Read Announcement DTO
export const AcknowledgeAnnouncementDto = z.object({
    acknowledged: z.boolean().optional().default(true),
    deviceInfo: z.record(z.any()).optional(),
});
// List Reads Query
export const ListReadsQuery = z.object({
    page: z.coerce.number().min(1).optional().default(1),
    pageSize: z.coerce.number().min(1).max(100).optional().default(20),
    acknowledgedOnly: z.coerce.boolean().optional(),
});
//# sourceMappingURL=announcement.dto.js.map