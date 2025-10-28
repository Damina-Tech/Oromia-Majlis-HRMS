/**
 * Get start and end dates for a given week (YYYY-WXX format)
 */
export declare function getWeekDates(weekString: string): {
    startDate: Date;
    endDate: Date;
};
/**
 * Get start and end dates for a given month (YYYY-MM format)
 */
export declare function getMonthDates(monthString: string): {
    startDate: Date;
    endDate: Date;
};
/**
 * Get start and end dates for a given year (YYYY format)
 */
export declare function getYearDates(yearString: string): {
    startDate: Date;
    endDate: Date;
};
/**
 * Get current week in YYYY-WXX format
 */
export declare function getCurrentWeek(): string;
/**
 * Get current month in YYYY-MM format
 */
export declare function getCurrentMonth(): string;
/**
 * Get current year in YYYY format
 */
export declare function getCurrentYear(): string;
/**
 * Format date to YYYY-MM-DD string
 */
export declare function formatDate(date: Date): string;
/**
 * Format time to HH:MM string
 */
export declare function formatTime(date: Date): string;
/**
 * Parse YYYY-MM-DD string to Date
 */
export declare function parseDate(dateString: string): Date;
/**
 * Parse HH:MM string to Date (for today)
 */
export declare function parseTime(timeString: string): Date;
//# sourceMappingURL=date-utils.d.ts.map