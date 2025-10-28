import { Request, Response } from "express";
/**
 * Generate payroll for employees
 */
export declare function generatePayroll(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * List payroll records
 */
export declare function listPayroll(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Get single payroll record
 */
export declare function getPayroll(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Update payroll record
 */
export declare function updatePayroll(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Process payroll (mark as processed)
 */
export declare function processPayroll(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Mark payroll as paid
 */
export declare function markAsPaid(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Delete payroll record
 */
export declare function deletePayroll(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Get payroll summary/statistics
 */
export declare function getPayrollSummary(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=payroll.controller.d.ts.map