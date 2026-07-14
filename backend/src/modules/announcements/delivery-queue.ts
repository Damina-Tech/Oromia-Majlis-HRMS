import { NotificationModule, NotificationType } from "@prisma/client";
import prisma from "../../db/client.js";
import { NotificationService } from "../notifications/notification.service.js";

/**
 * Enqueue announcement delivery for all target users
 */
export async function enqueueAnnouncementDelivery(announcementId: string) {
  try {
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
      include: {
        attachments: true,
      },
    });

    if (!announcement || announcement.status !== "PUBLISHED") {
      return;
    }

    const target = announcement.target as any;
    const channels = announcement.channels;

    // Get target users based on target type
    let targetUsers: Array<{ userId: string; employeeId?: string; email?: string; phone?: string }> = [];

    if (target.type === "all") {
      // Get all active users
      const users = await prisma.user.findMany({
        where: { status: "ACTIVE" },
        include: {
          employee: {
            select: {
              id: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      targetUsers = users.map((user) => ({
        userId: user.id,
        employeeId: user.employee?.id,
        email: user.employee?.email || user.email,
        phone: user.employee?.phone || undefined,
      }));
    } else if (target.type === "role" && target.ids) {
      // Get users by roles
      const users = await prisma.user.findMany({
        where: {
          status: "ACTIVE",
          userRoles: {
            some: {
              roleId: { in: target.ids },
            },
          },
        },
        include: {
          employee: {
            select: {
              id: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      targetUsers = users.map((user) => ({
        userId: user.id,
        employeeId: user.employee?.id,
        email: user.employee?.email || user.email,
        phone: user.employee?.phone || undefined,
      }));
    } else if (target.type === "department" && target.ids) {
      // Get users by departments
      const employees = await prisma.employee.findMany({
        where: {
          status: "ACTIVE",
          departmentId: { in: target.ids },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });

      targetUsers = employees
        .filter((emp) => emp.user)
        .map((emp) => ({
          userId: emp.user!.id,
          employeeId: emp.id,
          email: emp.email,
          phone: emp.phone || undefined,
        }));
    } else if (target.type === "employees" && target.ids) {
      // Get specific employees
      const employees = await prisma.employee.findMany({
        where: {
          id: { in: target.ids },
          status: "ACTIVE",
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });

      targetUsers = employees
        .filter((emp) => emp.user)
        .map((emp) => ({
          userId: emp.user!.id,
          employeeId: emp.id,
          email: emp.email,
          phone: emp.phone || undefined,
        }));
    }

    const userIds = Array.from(
      new Set(
        targetUsers
          .map((targetUser) => targetUser.userId)
          .filter((userId): userId is string => Boolean(userId))
      )
    );

    if (userIds.length > 0) {
      try {
        await NotificationService.sendNotification({
          module: NotificationModule.ANNOUNCEMENT,
          type: announcement.urgency === "URGENT" ? NotificationType.WARNING : NotificationType.INFO,
          title: announcement.title,
          message:
            announcement.type === "MEETING"
              ? "New meeting announcement published."
              : announcement.body.slice(0, 160),
          resourceType: "ANNOUNCEMENT",
          resourceId: announcement.id,
          dedupKey: `announcement-${announcement.id}`,
          targets: {
            userIds,
          },
          data: {
            urgency: announcement.urgency,
            type: announcement.type,
          },
        });
      } catch (notifyError) {
        console.warn("Failed to send announcement notification:", notifyError);
      }
    }

    // Create delivery records for each channel and user
    for (const channel of channels) {
      for (const targetUser of targetUsers) {
        // Skip if user doesn't have required contact info for external channels
        if (channel !== "IN_APP") {
          if (channel === "EMAIL" && !targetUser.email) continue;
          if ((channel === "SMS" || channel === "WHATSAPP") && !targetUser.phone) continue;
        }

        await prisma.announcementDelivery.create({
          data: {
            announcementId,
            channel,
            status: "QUEUED",
            userId: channel === "IN_APP" ? targetUser.userId : undefined,
            employeeId: targetUser.employeeId,
            recipient: channel === "EMAIL" ? targetUser.email : channel === "SMS" || channel === "WHATSAPP" ? targetUser.phone : undefined,
          },
        });
      }
    }

    // Process deliveries immediately (in production, use a queue worker)
    await processDeliveryQueue(announcementId);
  } catch (error: any) {
    console.error("Error enqueueing announcement delivery:", error);
  }
}

/**
 * Process delivery queue for an announcement
 */
export async function processDeliveryQueue(announcementId: string) {
  const deliveries = await prisma.announcementDelivery.findMany({
    where: {
      announcementId,
      status: { in: ["QUEUED", "RETRYING"] },
    },
    include: {
      announcement: true,
    },
  });

  for (const delivery of deliveries) {
    try {
      await processDelivery(delivery);
    } catch (error: any) {
      console.error(`Error processing delivery ${delivery.id}:`, error);
    }
  }
}

/**
 * Process a single delivery
 */
async function processDelivery(delivery: any) {
  const maxAttempts = 3;

  if (delivery.attempts >= maxAttempts) {
    await prisma.announcementDelivery.update({
      where: { id: delivery.id },
      data: {
        status: "FAILED",
        errorMessage: "Max retry attempts reached",
      },
    });
    return;
  }

  try {
    await prisma.announcementDelivery.update({
      where: { id: delivery.id },
      data: {
        attempts: delivery.attempts + 1,
        lastAttemptAt: new Date(),
        status: "RETRYING",
      },
    });

    let success = false;
    let providerRef: string | null = null;
    let error: string | null = null;

    switch (delivery.channel) {
      case "IN_APP":
        // In-app delivery is always successful (notification will be sent via WebSocket/SSE)
        success = true;
        break;

      case "EMAIL":
        if (delivery.recipient) {
          try {
            const { sendAnnouncementEmail } = await import("./email-delivery.js");
            providerRef = await sendAnnouncementEmail(
              delivery.recipient,
              delivery.announcement.title,
              delivery.announcement.body,
              delivery.announcement.id
            );
            success = true;
          } catch (emailError: any) {
            error = emailError.message;
          }
        }
        break;

      case "SMS":
        if (delivery.recipient) {
          try {
            const { sendAnnouncementSMS } = await import("./sms-delivery.js");
            providerRef = await sendAnnouncementSMS(
              delivery.recipient,
              delivery.announcement.title,
              delivery.announcement.id
            );
            success = true;
          } catch (smsError: any) {
            error = smsError.message;
          }
        }
        break;

      case "WHATSAPP":
        if (delivery.recipient) {
          try {
            const { sendAnnouncementWhatsApp } = await import("./whatsapp-delivery.js");
            providerRef = await sendAnnouncementWhatsApp(
              delivery.recipient,
              delivery.announcement.title,
              delivery.announcement.body,
              delivery.announcement.id
            );
            success = true;
          } catch (whatsappError: any) {
            error = whatsappError.message;
          }
        }
        break;
    }

    if (success) {
      await prisma.announcementDelivery.update({
        where: { id: delivery.id },
        data: {
          status: "SENT",
          providerRef,
          deliveredAt: new Date(),
        },
      });
    } else {
      // Will retry on next queue run
      await prisma.announcementDelivery.update({
        where: { id: delivery.id },
        data: {
          status: delivery.attempts + 1 >= maxAttempts ? "FAILED" : "QUEUED",
          errorMessage: error,
        },
      });
    }
  } catch (error: any) {
    await prisma.announcementDelivery.update({
      where: { id: delivery.id },
      data: {
        status: "FAILED",
        errorMessage: error.message,
      },
    });
  }
}

/**
 * Retry failed deliveries
 */
export async function retryFailedDeliveries(announcementId?: string) {
  const where: any = {
    status: "FAILED",
  };

  if (announcementId) {
    where.announcementId = announcementId;
  }

  await prisma.announcementDelivery.updateMany({
    where,
    data: {
      status: "QUEUED",
      attempts: 0,
    },
  });

    if (announcementId) {
      await processDeliveryQueue(announcementId);
    } else {
      // Process all failed deliveries
      const failedDeliveries = await prisma.announcementDelivery.findMany({
        where: {
          status: "QUEUED",
        },
        include: {
          announcement: true,
        },
        take: 100, // Process in batches
      });

      for (const delivery of failedDeliveries) {
        try {
          await processDelivery(delivery);
        } catch (error: any) {
          console.error(`Error processing delivery ${delivery.id}:`, error);
        }
      }
    }
  }

