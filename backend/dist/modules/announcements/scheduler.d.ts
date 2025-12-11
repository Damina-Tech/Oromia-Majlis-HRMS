/**
 * Process scheduled announcements (run via cron job every minute)
 */
export declare function processScheduledAnnouncements(): Promise<void>;
/**
 * Retry failed deliveries (run via cron job every 5 minutes)
 */
export declare function retryFailedDeliveries(): Promise<void>;
//# sourceMappingURL=scheduler.d.ts.map