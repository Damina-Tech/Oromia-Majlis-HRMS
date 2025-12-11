import { Request, Response } from "express";
/**
 * Create expense
 */
export declare function createExpense(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * List expenses
 */
export declare function listExpenses(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Get expense detail
 */
export declare function getExpense(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Update expense (only allowed in DRAFT status or by admin/HR)
 */
export declare function updateExpense(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Submit expense for approval
 */
export declare function submitExpense(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Approve expense
 */
export declare function approveExpense(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Reject expense
 */
export declare function rejectExpense(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Mark expense as paid
 */
export declare function payExpense(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Upload receipt
 */
export declare function uploadReceipt(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=expense.controller.d.ts.map