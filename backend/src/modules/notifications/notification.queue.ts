import { Queue, Worker, QueueEvents, JobsOptions } from "bullmq";
import IORedis from "ioredis";
import prisma from "../../db/client.js";
import {
  NotificationDeliveryStatus,
  NotificationChannel,
} from "@prisma/client";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
});

connection.on("error", (err) => {
  console.warn("⚠️  Redis connection error for notification queue:", err.message);
});

export const NOTIFICATION_QUEUE_NAME = "notification-deliveries";

export const notificationQueue = new Queue(NOTIFICATION_QUEUE_NAME, {
  connection,
});

export const notificationQueueEvents = new QueueEvents(NOTIFICATION_QUEUE_NAME, {
  connection,
});

export async function enqueueNotificationDelivery(
  deliveryId: string,
  options: JobsOptions = {}
) {
  await prisma.notificationDelivery.update({
    where: { id: deliveryId },
    data: {
      status: NotificationDeliveryStatus.QUEUED,
      errorMessage: null,
    },
  });

  await notificationQueue.add(
    "deliver",
    { deliveryId },
    {
      attempts: 5,
      backoff: {
        type: "exponential",
        delay: 60_000,
      },
      removeOnComplete: 1000,
      removeOnFail: 1000,
      ...options,
    }
  );
}

export async function startNotificationWorker() {
  try {
    await connection.ping();
  } catch (err: any) {
    console.warn(
      "⚠️  Redis is not available; skipping notification delivery worker.",
      err?.message ?? err
    );
    return null;
  }

  const worker = new Worker(
    NOTIFICATION_QUEUE_NAME,
    async (job) => {
      const { deliveryId } = job.data as { deliveryId: string };

      const delivery = await prisma.notificationDelivery.findUnique({
        where: { id: deliveryId },
        include: {
          notification: {
            include: { recipient: true },
          },
        },
      });

      if (!delivery) {
        return;
      }

      try {
        const attemptNumber = (delivery.attempts ?? 0) + 1;

        await prisma.notificationDelivery.update({
          where: { id: deliveryId },
          data: {
            status: NotificationDeliveryStatus.PENDING,
            attempts: attemptNumber,
            lastAttemptAt: new Date(),
          },
        });

        // Simulate channel delivery. Real implementation should integrate with
        // email/SMS/push providers. For now we log and mark as sent.
        const notification = delivery.notification;
        const recipient = notification.recipient;

        switch (delivery.channel) {
          case NotificationChannel.EMAIL:
            console.log(
              `📧 [Notification] Email to ${recipient.email}: ${notification.title}`
            );
            break;
          case NotificationChannel.PUSH:
            console.log(
              `📱 [Notification] Push to ${recipient.id}: ${notification.title}`
            );
            break;
          case NotificationChannel.SMS:
          case NotificationChannel.WHATSAPP:
            console.log(
              `📩 [Notification] ${delivery.channel} to ${recipient.id}: ${notification.title}`
            );
            break;
          default:
            console.log(
              `🔔 [Notification] In-app delivery queued for ${recipient.id}: ${notification.title}`
            );
            break;
        }

        await prisma.notificationDelivery.update({
          where: { id: deliveryId },
          data: {
            status: NotificationDeliveryStatus.SENT,
            attempts: attemptNumber,
            lastAttemptAt: new Date(),
          },
        });
      } catch (error: any) {
        const attempts = (delivery.attempts ?? 0) + 1;
        const maxAttempts = job.opts.attempts ?? 5;
        const hasMoreAttempts = attempts < maxAttempts;

        await prisma.notificationDelivery.update({
          where: { id: deliveryId },
          data: {
            status: hasMoreAttempts
              ? NotificationDeliveryStatus.QUEUED
              : NotificationDeliveryStatus.FAILED,
            attempts,
            lastAttemptAt: new Date(),
            errorMessage: error?.message ?? "Unknown delivery error",
          },
        });

        if (hasMoreAttempts) {
          await notificationQueue.add(
            "deliver",
            { deliveryId },
            {
              delay: Math.min(5, attempts) * 60_000,
            }
          );
        }

        throw error;
      }
    },
    {
      connection,
      concurrency: 5,
    }
  );

  worker.on("failed", (job, err) => {
    console.error(
      `❌ Notification delivery failed for job ${job?.id ?? 'unknown'}:`,
      err?.message
    );
  });

  worker.on("completed", (job) => {
    console.log(`✅ Notification delivery completed for job ${job.id}`);
  });

  return worker;
}

