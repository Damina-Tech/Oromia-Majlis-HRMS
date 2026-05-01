import { Worker, JobsOptions } from "bullmq";
export declare const NOTIFICATION_QUEUE_NAME = "notification-deliveries";
export declare function enqueueNotificationDelivery(deliveryId: string, options?: JobsOptions): Promise<void>;
export declare function processPendingNotifications(): Promise<void>;
export declare function startNotificationWorker(): Promise<Worker<any, any, string> | null>;
//# sourceMappingURL=notification.queue.d.ts.map