import { Queue, Worker, QueueEvents, JobsOptions } from "bullmq";
export declare const NOTIFICATION_QUEUE_NAME = "notification-deliveries";
export declare const notificationQueue: Queue<any, any, string, any, any, string>;
export declare const notificationQueueEvents: QueueEvents;
export declare function enqueueNotificationDelivery(deliveryId: string, options?: JobsOptions): Promise<void>;
export declare function startNotificationWorker(): Promise<Worker<any, any, string> | null>;
//# sourceMappingURL=notification.queue.d.ts.map