import prisma from "../../db/client.js";
import {
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationModule,
  NotificationType,
} from "@prisma/client";
import { enqueueNotificationDelivery } from "./notification.queue.js";

const DEFAULT_CHANNEL_PREFS = {
  inApp: true,
  email: false,
  push: false,
  sms: false,
  whatsapp: false,
};

const DEFAULT_MODULE_PREFS: Record<string, boolean> = {
  EMPLOYEE: true,
  DEPARTMENT: true,
  LEAVE: true,
  ATTENDANCE: true,
  PAYROLL: true,
  TASK: true,
  ASSET: true,
  EXPENSE: true,
  DOCUMENT: true,
  ANNOUNCEMENT: true,
  SYSTEM: true,
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

export class NotificationService {
  static async getOrCreatePreferences(userId: string) {
    let preference = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!preference) {
      preference = await prisma.notificationPreference.create({
        data: {
          userId,
          channels: DEFAULT_CHANNEL_PREFS,
          modules: DEFAULT_MODULE_PREFS,
        },
      });
    }

    return preference;
  }

  static async updatePreferences(
    userId: string,
    data: Partial<{
      channels: Record<string, boolean>;
      modules: Record<string, Record<string, boolean> | boolean>;
    }>
  ) {
    const current = await this.getOrCreatePreferences(userId);

    const updatedChannels = {
      ...DEFAULT_CHANNEL_PREFS,
      ...(typeof current.channels === "object" ? current.channels : {}),
      ...(data.channels ?? {}),
    };

    const currentModules =
      typeof current.modules === "object" ? current.modules : {};

    const normalizedModules = Object.keys(DEFAULT_MODULE_PREFS).reduce<
      Record<string, boolean>
    >((acc, key) => {
      const upperKey = key.toUpperCase();
      const incoming = data.modules?.[upperKey];
      if (typeof incoming === "object" && "inApp" in incoming) {
        acc[upperKey] = Boolean(incoming.inApp);
      } else if (typeof incoming === "boolean") {
        acc[upperKey] = incoming;
      } else if (upperKey in currentModules) {
        const value = currentModules[upperKey];
        acc[upperKey] =
          typeof value === "boolean"
            ? value
            : typeof value === "object"
            ? Boolean(value?.inApp)
            : true;
      } else {
        acc[upperKey] = DEFAULT_MODULE_PREFS[upperKey] ?? true;
      }
      return acc;
    }, {} as Record<string, boolean>);

    return prisma.notificationPreference.update({
      where: { userId },
      data: {
        channels: updatedChannels,
        modules: normalizedModules,
      },
    });
  }

  static async resolveRecipients(targets: NotificationTargets) {
    const userIds = new Set<string>();

    if (targets.userIds?.length) {
      targets.userIds.forEach((id) => userIds.add(id));
    }

    if (targets.roleNames?.length) {
      const roles = targets.roleNames.map((r) => r.toUpperCase());
      const usersWithRoles = await prisma.userRole.findMany({
        where: {
          role: {
            name: { in: roles },
          },
        },
        select: { userId: true },
      });
      usersWithRoles.forEach((userRole) => userIds.add(userRole.userId));
    }

    if (targets.departmentIds?.length) {
      const employees = await prisma.employee.findMany({
        where: {
          departmentId: { in: targets.departmentIds },
          userId: { not: null },
        },
        select: { userId: true },
      });
      employees.forEach((emp) => {
        if (emp.userId) {
          userIds.add(emp.userId);
        }
      });
    }

    if (targets.excludeUserIds?.length) {
      targets.excludeUserIds.forEach((id) => userIds.delete(id));
    }

    return Array.from(userIds);
  }

  static async sendNotification(params: SendNotificationParams) {
    const {
      module,
      type = NotificationType.INFO,
      title,
      message,
      resourceId,
      resourceType,
      data,
      dedupKey,
      channels,
      targets,
    } = params;

    const recipientIds = await this.resolveRecipients(targets);
    if (recipientIds.length === 0) {
      return [];
    }

    const notifications = [];

    for (const recipientId of recipientIds) {
      const preferences = await this.getOrCreatePreferences(recipientId);
      const channelPrefs = {
        ...DEFAULT_CHANNEL_PREFS,
        ...(preferences.channels as Record<string, boolean>),
        ...(channels ?? {}),
      };

      const modulePrefs =
        (preferences.modules as Record<string, boolean> | undefined) ?? {};
      const moduleKey = module.toString().toUpperCase();
      if (modulePrefs && moduleKey in modulePrefs && modulePrefs[moduleKey] === false) {
        continue;
      }

      let existingNotification = null;
      if (dedupKey) {
        existingNotification = await prisma.notification.findFirst({
          where: {
            recipientId,
            dedupKey,
            isRead: false,
          },
        });
      }

      if (existingNotification) {
        const existingData =
          (existingNotification.data as Record<string, unknown> | null) || {};
        const currentCount = Number(existingData?.count ?? 1);
        const baseTitle =
          (existingData?.baseTitle as string | undefined) ||
          existingNotification.title;
        const newCount = currentCount + 1;

        await prisma.notification.update({
          where: { id: existingNotification.id },
          data: {
            title: `${baseTitle} (${newCount})`,
            message,
            data: {
              ...existingData,
              baseTitle,
              count: newCount,
              lastUpdatedAt: new Date().toISOString(),
              resourceId,
            },
            updatedAt: new Date(),
          },
        });
        notifications.push(existingNotification);
        continue;
      }

      const notification = await prisma.notification.create({
        data: {
          recipientId,
          title,
          message,
          module,
          type,
          resourceType,
          resourceId,
          data,
          dedupKey,
        },
      });

      const deliveries = [];

      if (channelPrefs.email) {
        deliveries.push(NotificationChannel.EMAIL);
      }
      if (channelPrefs.push) {
        deliveries.push(NotificationChannel.PUSH);
      }
      if (channelPrefs.sms) {
        deliveries.push(NotificationChannel.SMS);
      }
      if (channelPrefs.whatsapp) {
        deliveries.push(NotificationChannel.WHATSAPP);
      }

      const createdDeliveries = await Promise.all(
        deliveries.map((channel) =>
          prisma.notificationDelivery.create({
            data: {
              notificationId: notification.id,
              channel,
              status: NotificationDeliveryStatus.QUEUED,
            },
          })
        )
      );

      for (const delivery of createdDeliveries) {
        await enqueueNotificationDelivery(delivery.id);
      }

      notifications.push(notification);
    }

    return notifications;
  }

  static async markNotifications({
    userId,
    notificationIds,
    read,
  }: {
    userId: string;
    notificationIds: string[];
    read: boolean;
  }) {
    const now = new Date();
    await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        recipientId: userId,
      },
      data: {
        isRead: read,
        readAt: read ? now : null,
      },
    });
  }
}

