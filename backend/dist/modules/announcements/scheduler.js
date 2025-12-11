import { PrismaClient } from "@prisma/client";
import { enqueueAnnouncementDelivery } from "./delivery-queue.js";
const prisma = new PrismaClient();
/**
 * Process scheduled announcements (run via cron job every minute)
 */
export async function processScheduledAnnouncements() {
    try {
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
    }
    catch (error) {
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
    }
    catch (error) {
        console.error("Error retrying failed deliveries:", error);
    }
}
//# sourceMappingURL=scheduler.js.map