import { Request, Response } from "express";
/**
 * Create a new payroll run and generate items for employees
 */
export declare function createPayrollRun(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * List payroll runs
 */
export declare function listPayrollRuns(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Get single payroll run with items
 */
export declare function getPayrollRun(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Update payroll run (status, comments, notes)
 */
export declare function updatePayrollRun(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Review payroll run
 */
export declare function reviewPayrollRun(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Approve payroll run
 */
export declare function approvePayrollRun(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Process payroll run (mark as processed/paid)
 */
export declare function processPayrollRun(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * List payroll items for a run
 */
export declare function listPayrollItems(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Update payroll item
 */
export declare function updatePayrollItem(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Get single payroll item
 */
export declare function getPayrollItem(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Delete payroll run (only if DRAFT)
 */
export declare function deletePayrollRun(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Export bank file for payroll run
 */
export declare function exportBankFile(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Generate payslip for a payroll item
 */
export declare function generatePayslip(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Download payslip PDF
 */
export declare function downloadPayslip(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get payslip data (for frontend rendering)
 */
export declare function getPayslipData(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=payroll-run.controller.d.ts.map