import { Queue, Worker, QueueEvents } from "bullmq";
import IORedis from "ioredis";
import prisma from "../../db/client.js";
import { NotificationDeliveryStatus, NotificationChannel, } from "@prisma/client";
// Try to get Redis URL from environment, with fallback to common ports
function getRedisUrl() {
    if (process.env.REDIS_URL) {
        return process.env.REDIS_URL;
    }
    // Try common Redis ports
    const commonPorts = [6379, 6378];
    // Default to standard Redis port
    return "redis://127.0.0.1:6379";
}
const redisUrl = getRedisUrl();
let connection = null;
let notificationQueue = null;
let notificationQueueEvents = null;
// Lazy initialization of Redis connection
function getRedisConnection() {
    if (connection) {
        return connection;
    }
    try {
        connection = new IORedis(redisUrl, {
            maxRetriesPerRequest: null,
            retryStrategy: (times) => {
                // Stop retrying after 3 attempts
                if (times > 3) {
                    return null;
                }
                return Math.min(times * 50, 2000);
            },
            lazyConnect: true, // Don't connect immediately
            connectTimeout: 5000, // 5 second timeout
            enableReadyCheck: true,
        });
        connection.on("error", (err) => {
            // Only log if it's not a connection refused (expected when Redis is down)
            if (!err.message.includes("ECONNREFUSED")) {
                console.warn("⚠️  Redis connection error for notification queue:", err.message);
            }
        });
        connection.on("connect", () => {
            console.log("✅ Redis connected for notification queue");
        });
        connection.on("ready", () => {
            console.log("✅ Redis ready for notification queue");
        });
        connection.on("close", () => {
            console.log("⚠️  Redis connection closed");
        });
        // Try to connect, but don't fail if it doesn't work
        connection.connect().catch((err) => {
            // Silently fail - Redis is optional, notifications will be processed directly
            if (!err.message.includes("ECONNREFUSED")) {
                console.warn("⚠️  Redis connection attempt failed:", err.message);
            }
        });
    }
    catch (err) {
        console.warn("⚠️  Failed to initialize Redis connection:", err);
        return null;
    }
    return connection;
}
export const NOTIFICATION_QUEUE_NAME = "notification-deliveries";
function getNotificationQueue() {
    if (notificationQueue) {
        return notificationQueue;
    }
    const conn = getRedisConnection();
    if (!conn) {
        return null;
    }
    try {
        notificationQueue = new Queue(NOTIFICATION_QUEUE_NAME, {
            connection: conn,
        });
    }
    catch (err) {
        console.warn("⚠️  Failed to create notification queue:", err);
        return null;
    }
    return notificationQueue;
}
function getNotificationQueueEvents() {
    if (notificationQueueEvents) {
        return notificationQueueEvents;
    }
    const conn = getRedisConnection();
    if (!conn) {
        return null;
    }
    try {
        notificationQueueEvents = new QueueEvents(NOTIFICATION_QUEUE_NAME, {
            connection: conn,
        });
    }
    catch (err) {
        console.warn("⚠️  Failed to create notification queue events:", err);
        return null;
    }
    return notificationQueueEvents;
}
// Process notification delivery directly (fallback when Redis is unavailable)
async function processNotificationDeliveryDirectly(deliveryId) {
    let delivery = null;
    try {
        delivery = await prisma.notificationDelivery.findUnique({
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
        const attemptNumber = (delivery.attempts ?? 0) + 1;
        await prisma.notificationDelivery.update({
            where: { id: deliveryId },
            data: {
                status: NotificationDeliveryStatus.PENDING,
                attempts: attemptNumber,
                lastAttemptAt: new Date(),
            },
        });
        // Simulate channel delivery
        const notification = delivery.notification;
        const recipient = notification.recipient;
        switch (delivery.channel) {
            case NotificationChannel.EMAIL:
                console.log(`📧 [Notification] Email to ${recipient.email}: ${notification.title}`);
                break;
            case NotificationChannel.PUSH:
                console.log(`📱 [Notification] Push to ${recipient.id}: ${notification.title}`);
                break;
            case NotificationChannel.SMS:
            case NotificationChannel.WHATSAPP:
                console.log(`📩 [Notification] ${delivery.channel} to ${recipient.id}: ${notification.title}`);
                break;
            default:
                console.log(`🔔 [Notification] In-app delivery for ${recipient.id}: ${notification.title}`);
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
    }
    catch (error) {
        await prisma.notificationDelivery.update({
            where: { id: deliveryId },
            data: {
                status: NotificationDeliveryStatus.FAILED,
                attempts: (delivery?.attempts ?? 0) + 1,
                lastAttemptAt: new Date(),
                errorMessage: error?.message ?? "Unknown delivery error",
            },
        });
        throw error;
    }
}
export async function enqueueNotificationDelivery(deliveryId, options = {}) {
    const queue = getNotificationQueue();
    if (!queue) {
        // If Redis is not available, process directly
        console.log("ℹ️  Redis not available, processing notification delivery directly");
        await processNotificationDeliveryDirectly(deliveryId);
        return;
    }
    await prisma.notificationDelivery.update({
        where: { id: deliveryId },
        data: {
            status: NotificationDeliveryStatus.QUEUED,
            errorMessage: null,
        },
    });
    try {
        await queue.add("deliver", { deliveryId }, {
            attempts: 5,
            backoff: {
                type: "exponential",
                delay: 60_000,
            },
            removeOnComplete: 1000,
            removeOnFail: 1000,
            ...options,
        });
    }
    catch (err) {
        console.warn("⚠️  Failed to enqueue notification, processing directly:", err);
        await processNotificationDeliveryDirectly(deliveryId);
    }
}
// Process pending notifications directly (fallback mode)
export async function processPendingNotifications() {
    try {
        const pendingDeliveries = await prisma.notificationDelivery.findMany({
            where: {
                status: NotificationDeliveryStatus.PENDING,
            },
            take: 10, // Process 10 at a time
            include: {
                notification: {
                    include: { recipient: true },
                },
            },
        });
        for (const delivery of pendingDeliveries) {
            await processNotificationDeliveryDirectly(delivery.id);
        }
        if (pendingDeliveries.length > 0) {
            console.log(`✅ Processed ${pendingDeliveries.length} pending notifications directly`);
        }
    }
    catch (error) {
        console.error("Error processing pending notifications:", error);
    }
}
export async function startNotificationWorker() {
    const conn = getRedisConnection();
    if (!conn) {
        console.log("ℹ️  Redis is not available; notifications will be processed directly.");
        // Start a fallback processor that runs every 30 seconds
        setInterval(() => {
            processPendingNotifications().catch(console.error);
        }, 30 * 1000);
        // Process immediately
        processPendingNotifications().catch(console.error);
        return null;
    }
    try {
        await conn.ping();
    }
    catch (err) {
        console.warn("⚠️  Redis is not available; skipping notification delivery worker.", err?.message ?? err);
        return null;
    }
    try {
        const worker = new Worker(NOTIFICATION_QUEUE_NAME, async (job) => {
            const { deliveryId } = job.data;
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
                        console.log(`📧 [Notification] Email to ${recipient.email}: ${notification.title}`);
                        break;
                    case NotificationChannel.PUSH:
                        console.log(`📱 [Notification] Push to ${recipient.id}: ${notification.title}`);
                        break;
                    case NotificationChannel.SMS:
                    case NotificationChannel.WHATSAPP:
                        console.log(`📩 [Notification] ${delivery.channel} to ${recipient.id}: ${notification.title}`);
                        break;
                    default:
                        console.log(`🔔 [Notification] In-app delivery queued for ${recipient.id}: ${notification.title}`);
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
            }
            catch (error) {
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
                    const queue = getNotificationQueue();
                    if (queue) {
                        await queue.add("deliver", { deliveryId }, {
                            delay: Math.min(5, attempts) * 60_000,
                        });
                    }
                }
                throw error;
            }
        }, {
            connection: conn,
            concurrency: 5,
        });
        worker.on("failed", (job, err) => {
            console.error(`❌ Notification delivery failed for job ${job?.id ?? 'unknown'}:`, err?.message);
        });
        worker.on("completed", (job) => {
            console.log(`✅ Notification delivery completed for job ${job.id}`);
        });
        return worker;
    }
    catch (err) {
        console.warn("⚠️  Failed to start notification worker:", err?.message ?? err);
        return null;
    }
}
//# sourceMappingURL=notification.queue.js.map