import { Request, Response } from "express";
/**
 * List timesheets with filtering and pagination
 */
export declare function listTimesheets(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Get single timesheet by ID
 */
export declare function getTimesheet(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Create new timesheet entry
 */
export declare function createTimesheet(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Update timesheet
 */
export declare function updateTimesheet(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Submit timesheet for approval
 */
export declare function submitTimesheet(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Update timesheet status (approve/reject)
 */
export declare function updateTimesheetStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Delete timesheet
 */
export declare function deleteTimesheet(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Get timesheet summary/statistics
 */
export declare function getTimesheetSummary(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Start timer (create a temporary session)
 */
export declare function startTimer(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Stop timer and create timesheet session
 */
export declare function stopTimer(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Add manual time entry
 */
export declare function addManualTimeEntry(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=timesheet.controller.d.ts.map