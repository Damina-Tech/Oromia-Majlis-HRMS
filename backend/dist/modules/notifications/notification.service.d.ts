import { Prisma } from "@prisma/client";
import { NotificationModule, NotificationType } from "@prisma/client";
declare const DEFAULT_CHANNEL_PREFS: {
    inApp: boolean;
    email: boolean;
    push: boolean;
    sms: boolean;
    whatsapp: boolean;
};
type NotificationTargets = {
    userIds?: string[];
    roleNames?: string[];
    departmentIds?: string[];
    excludeUserIds?: string[];
};
type SendNotificationParams = {
    module: NotificationModule;
    type?: NotificationType;
    title: string;
    message: string;
    resourceType?: string;
    resourceId?: string;
    data?: Record<string, unknown>;
    dedupKey?: string;
    channels?: Partial<typeof DEFAULT_CHANNEL_PREFS>;
    targets: NotificationTargets;
    actorId?: string;
};
export declare class NotificationService {
    static getOrCreatePreferences(userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        channels: Prisma.JsonValue;
        modules: Prisma.JsonValue;
    }>;
    static updatePreferences(userId: string, data: Partial<{
        channels: Record<string, boolean>;
        modules: Record<string, Record<string, boolean> | boolean>;
    }>): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        channels: Prisma.JsonValue;
        modules: Prisma.JsonValue;
    }>;
    static resolveRecipients(targets: NotificationTargets): Promise<string[]>;
    static sendNotification(params: SendNotificationParams): Promise<{
        type: import(".prisma/client").$Enums.NotificationType;
        message: string;
        id: string;
        data: Prisma.JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
        module: import(".prisma/client").$Enums.NotificationModule;
        recipientId: string;
        title: string;
        resourceType: string | null;
        resourceId: string | null;
        dedupKey: string | null;
        isRead: boolean;
        readAt: Date | null;
    }[]>;
    static markNotifications({ userId, notificationIds, read, }: {
        userId: string;
        notificationIds: string[];
        read: boolean;
    }): Promise<void>;
}
export {};
//# sourceMappingURL=notification.service.d.ts.map