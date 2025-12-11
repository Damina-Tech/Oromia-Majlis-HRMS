import { Request, Response } from "express";
import {
  NotificationModule,
  NotificationType,
  NotificationDeliveryStatus,
} from "@prisma/client";
import prisma from "../../db/client.js";
import {
  ListNotificationsQuerySchema,
  MarkNotificationsReadDto,
  SendTestNotificationDto,
  UpdateNotificationPreferencesDto,
} from "./notification.dto.js";
import { NotificationService } from "./notification.service.js";
import { enqueueNotificationDelivery } from "./notification.queue.js";

function getCurrentUserId(req: Request): string {
  return (req as any).user?.id;
}

export async function listNotifications(req: Request, res: Response) {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const query = ListNotificationsQuerySchema.parse(req.query);

    const where: any = {
      recipientId: userId,
    };

    if (typeof query.isRead === "boolean") {
      where.isRead = query.isRead;
    }
    if (query.module) {
      where.module = query.module as NotificationModule;
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { message: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const skip = (query.page - 1) * query.pageSize;
    const take = query.pageSize;

    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.notification.count({ where }),
    ]);

    res.json({
      items,
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.ceil(total / query.pageSize),
    });
  } catch (error: any) {
    console.error("Failed to list notifications:", error);
    res
      .status(500)
      .json({ message: error?.message ?? "Failed to list notifications" });
  }
}

export async function markNotifications(req: Request, res: Response) {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const dto = MarkNotificationsReadDto.parse(req.body);

    await NotificationService.markNotifications({
      userId,
      notificationIds: dto.notificationIds,
      read: dto.read,
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error("Failed to mark notifications:", error);
    res
      .status(500)
      .json({ message: error?.message ?? "Failed to update notifications" });
  }
}

export async function getNotificationPreferences(req: Request, res: Response) {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const preferences = await NotificationService.getOrCreatePreferences(
      userId
    );
    res.json(preferences);
  } catch (error: any) {
    console.error("Failed to load notification preferences:", error);
    res
      .status(500)
      .json({ message: error?.message ?? "Failed to load preferences" });
  }
}

export async function updateNotificationPreferences(
  req: Request,
  res: Response
) {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const dto = UpdateNotificationPreferencesDto.parse(req.body);
    const updated = await NotificationService.updatePreferences(userId, dto);
    res.json(updated);
  } catch (error: any) {
    console.error("Failed to update notification preferences:", error);
    res
      .status(500)
      .json({ message: error?.message ?? "Failed to update preferences" });
  }
}

export async function sendTestNotification(req: Request, res: Response) {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const dto = SendTestNotificationDto.parse(req.body ?? {});

    await NotificationService.sendNotification({
      module: NotificationModule.SYSTEM,
      type: NotificationType.INFO,
      title: dto.title,
      message: dto.message,
      targets: { userIds: [userId] },
      channels: {
        inApp: true,
        email: dto.channel === "EMAIL",
        push: dto.channel === "PUSH",
        sms: dto.channel === "SMS",
        whatsapp: dto.channel === "WHATSAPP",
      },
      data: {
        test: true,
        channel: dto.channel,
      },
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error("Failed to send test notification:", error);
    res
      .status(500)
      .json({ message: error?.message ?? "Failed to send test notification" });
  }
}

export async function getDeliveryLogs(req: Request, res: Response) {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const query = ListNotificationsQuerySchema.parse(req.query);

    const where: any = {};
    if (typeof query.isRead === "boolean") {
      where.status =
        query.isRead === true
          ? NotificationDeliveryStatus.SENT
          : NotificationDeliveryStatus.FAILED;
    }
    if (query.module) {
      where.notification = { module: query.module as NotificationModule };
    }

    const skip = (query.page - 1) * query.pageSize;
    const take = query.pageSize;

    const [items, total] = await Promise.all([
      prisma.notificationDelivery.findMany({
        where,
        include: {
          notification: {
            select: {
              id: true,
              title: true,
              module: true,
              recipient: {
                select: { id: true, email: true, firstName: true, lastName: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.notificationDelivery.count({ where }),
    ]);

    res.json({
      items,
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.ceil(total / query.pageSize),
    });
  } catch (error: any) {
    console.error("Failed to fetch delivery logs:", error);
    res
      .status(500)
      .json({ message: error?.message ?? "Failed to load delivery logs" });
  }
}

export async function resendNotificationDelivery(req: Request, res: Response) {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { deliveryId } = req.params as { deliveryId: string };
    const delivery = await prisma.notificationDelivery.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery) {
      return res.status(404).json({ message: "Delivery not found" });
    }

    await prisma.notificationDelivery.update({
      where: { id: deliveryId },
      data: {
        status: NotificationDeliveryStatus.QUEUED,
        errorMessage: null,
      },
    });

    await enqueueNotificationDelivery(deliveryId);

    res.json({ success: true });
  } catch (error: any) {
    console.error("Failed to resend notification:", error);
    res
      .status(500)
      .json({ message: error?.message ?? "Failed to resend notification" });
  }
}

