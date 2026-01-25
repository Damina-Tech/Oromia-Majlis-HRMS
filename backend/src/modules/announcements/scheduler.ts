import { PrismaClient } from "@prisma/client";
import { enqueueAnnouncementDelivery } from "./delivery-queue.js";

const prisma = new PrismaClient();

/**
 * Process scheduled announcements (run via cron job every minute)
 */
export async function processScheduledAnnouncements() {
  try {
    // Check if database tables exist before proceeding
    try {
      await prisma.$queryRaw`SELECT 1 FROM "Announcement" LIMIT 1`;
    } catch (error: any) {
      // Table doesn't exist yet - skip processing
      if (error?.code === 'P2021' || error?.code === '42P01') {
        return; // Silently skip if tables don't exist
      }
      throw error; // Re-throw other errors
    }

    const now = new Date();

    // Publish scheduled announcements
    const toPublish = await prisma.announcement.findMany({
      where: {
        status: "SCHEDULED",
        publishAt: {
          lte: now,
        },
      },
    });

    for (const announcement of toPublish) {
      await prisma.announcement.update({
        where: { id: announcement.id },
        data: {
          status: "PUBLISHED",
          publishedAt: now,
        },
      });

      // Enqueue deliveries
      await enqueueAnnouncementDelivery(announcement.id);
    }

    // Expire old announcements
    await prisma.announcement.updateMany({
      where: {
        status: { in: ["SCHEDULED", "PUBLISHED"] },
        expireAt: {
          lte: now,
          not: null,
        },
      },
      data: {
        status: "EXPIRED",
      },
    });

    console.log(`Processed ${toPublish.length} scheduled announcements`);
  } catch (error: any) {
    console.error("Error processing scheduled announcements:", error);
  }
}

/**
 * Retry failed deliveries (run via cron job every 5 minutes)
 */
export async function retryFailedDeliveries() {
  try {
    const { retryFailedDeliveries } = await import("./delivery-queue.js");
    await retryFailedDeliveries();
  } catch (error: any) {
    console.error("Error retrying failed deliveries:", error);
  }
}

