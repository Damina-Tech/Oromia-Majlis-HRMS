/**
 * Enqueue announcement delivery for all target users
 */
export declare function enqueueAnnouncementDelivery(announcementId: string): Promise<void>;
/**
 * Process delivery queue for an announcement
 */
export declare function processDeliveryQueue(announcementId: string): Promise<void>;
/**
 * Retry failed deliveries
 */
export declare function retryFailedDeliveries(announcementId?: string): Promise<void>;
//# sourceMappingURL=delivery-queue.d.ts.map