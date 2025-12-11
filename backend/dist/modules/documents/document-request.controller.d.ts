import { Request, Response } from "express";
/**
 * Create document request
 */
export declare function createDocumentRequest(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * List document requests
 */
export declare function listDocumentRequests(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Get document request by ID
 */
export declare function getDocumentRequest(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Update document request (approve/reject/generate)
 */
export declare function updateDocumentRequest(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Delete/Cancel document request
 */
export declare function deleteDocumentRequest(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=document-request.controller.d.ts.map