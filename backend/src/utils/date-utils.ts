/**
 * Get start and end dates for a given week (YYYY-WXX format)
 */
export function getWeekDates(weekString: string): { startDate: Date; endDate: Date } {
  const [year, week] = weekString.split("-W").map(Number);
  
  // Create a date for the first day of the year
  const firstDay = new Date(year, 0, 1);
  
  // Find the first Monday of the year (ISO week starts on Monday)
  const firstMonday = new Date(firstDay);
  const dayOfWeek = firstDay.getDay();
  const daysToMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek; // Sunday is 0, Monday is 1
  firstMonday.setDate(firstDay.getDate() + daysToMonday);
  
  // Calculate the start date of the requested week
  const startDate = new Date(firstMonday);
  startDate.setDate(firstMonday.getDate() + (week - 1) * 7);
  
  // Calculate the end date (6 days after start date)
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  
  // Set time to end of day for end date
  endDate.setHours(23, 59, 59, 999);
  
  return { startDate, endDate };
}

/**
 * Get start and end dates for a given month (YYYY-MM format)
 */
export function getMonthDates(monthString: string): { startDate: Date; endDate: Date } {
  const [year, month] = monthString.split("-").map(Number);
  
  const startDate = new Date(year, month - 1, 1); // month is 0-indexed
  const endDate = new Date(year, month, 0); // Last day of the month
  endDate.setHours(23, 59, 59, 999);
  
  return { startDate, endDate };
}

/**
 * Get start and end dates for a given year (YYYY format)
 */
export function getYearDates(yearString: string): { startDate: Date; endDate: Date } {
  const year = Number(yearString);
  
  const startDate = new Date(year, 0, 1); // January 1st
  const endDate = new Date(year, 11, 31); // December 31st
  endDate.setHours(23, 59, 59, 999);
  
  return { startDate, endDate };
}

/**
 * Get current week in YYYY-WXX format
 */
export function getCurrentWeek(): string {
  const now = new Date();
  const year = now.getFullYear();
  
  // Get the ISO week number
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  
  return `${year}-W${weekNumber.toString().padStart(2, "0")}`;
}

/**
 * Get current month in YYYY-MM format
 */
export function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  
  return `${year}-${month}`;
}

/**
 * Get current year in YYYY format
 */
export function getCurrentYear(): string {
  return new Date().getFullYear().toString();
}

/**
 * Format date to YYYY-MM-DD string
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  
  return `${year}-${month}-${day}`;
}

/**
 * Format time to HH:MM string
 */
export function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  
  return `${hours}:${minutes}`;
}

/**
 * Parse YYYY-MM-DD string to Date
 */
export function parseDate(dateString: string): Date {
  return new Date(dateString + "T00:00:00");
}

/**
 * Parse HH:MM string to Date (for today)
 */
export function parseTime(timeString: string): Date {
  const today = new Date();
  const [hours, minutes] = timeString.split(":").map(Number);
  
  return new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
}
