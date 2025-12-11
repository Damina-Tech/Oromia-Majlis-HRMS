import { Request, Response } from "express";
/**
 * Check in for the day
 */
export declare function checkIn(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Check out for the day
 */
export declare function checkOut(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Get today's attendance status
 */
export declare function getTodayStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * List attendance records with filters
 */
export declare function listAttendance(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Get attendance statistics
 */
export declare function getAttendanceStats(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Create attendance record (for HR/Admin manual entry)
 */
export declare function createAttendance(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Update attendance record (for HR/Admin manual corrections)
 */
export declare function updateAttendance(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Delete attendance record
 */
export declare function deleteAttendance(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=attendance.controller.d.ts.map