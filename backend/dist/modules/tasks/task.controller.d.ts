import { Request, Response } from "express";
/**
 * Create task
 */
export declare function createTask(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * List tasks
 */
export declare function listTasks(req: Request, res: Response): Promise<void>;
/**
 * Get task by ID
 */
export declare function getTask(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Update task
 */
export declare function updateTask(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Delete task
 */
export declare function deleteTask(req: Request, res: Response): Promise<void>;
/**
 * Add comment to task
 */
export declare function addComment(req: Request, res: Response): Promise<void>;
/**
 * Add time log to task
 */
export declare function addTimeLog(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Bulk update tasks
 */
export declare function bulkUpdateTasks(req: Request, res: Response): Promise<void>;
/**
 * Get task statistics
 */
export declare function getTaskStats(req: Request, res: Response): Promise<void>;
/**
 * Upload attachment
 */
export declare function uploadAttachment(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Download attachment
 */
export declare function downloadAttachment(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Delete attachment
 */
export declare function deleteAttachment(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=task.controller.d.ts.map