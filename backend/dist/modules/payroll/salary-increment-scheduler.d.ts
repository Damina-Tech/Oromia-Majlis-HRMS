/**
 * Annual salary increment scheduler
 * This function should be called periodically (e.g., via cron job)
 * It checks employees whose last increment was more than 12 months ago
 * and applies the configured increment percentage
 */
export interface IncrementConfig {
    incrementPercentage: number;
    reason?: string;
    notes?: string;
    employeeIds?: string[];
    departmentId?: string;
}
/**
 * Run annual salary increment job
 * This should be scheduled to run annually (e.g., every January 1st)
 */
export declare function runAnnualIncrementJob(config: IncrementConfig): Promise<{
    successful: number;
    failed: number;
    errors: Array<{
        employeeId: string;
        error: string;
    }>;
}>;
/**
 * Schedule annual increment (to be used with a cron library like node-cron or cron)
 * Example usage:
 *
 * import cron from 'node-cron';
 *
 * // Run on January 1st at midnight every year
 * cron.schedule('0 0 1 1 *', async () => {
 *   await runAnnualIncrementJob({
 *     incrementPercentage: 5, // 5% annual increment
 *     reason: 'Annual salary increment',
 *     notes: 'Automatic annual increment for all eligible employees',
 *   });
 * });
 */
export declare function scheduleAnnualIncrement(cronExpression: string, config: IncrementConfig, cronLib?: any): any;
//# sourceMappingURL=salary-increment-scheduler.d.ts.map