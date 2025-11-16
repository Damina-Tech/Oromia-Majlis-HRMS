import { Request, Response } from "express";
/**
 * List document templates
 */
export declare function listTemplates(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Get single template
 */
export declare function getTemplate(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Create new template
 */
export declare function createTemplate(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Update template
 */
export declare function updateTemplate(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Delete template
 */
export declare function deleteTemplate(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Preview template with sample or real data
 */
export declare function previewTemplate(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Generate document(s) from template
 */
export declare function generateDocument(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * List generated documents
 */
export declare function listGeneratedDocuments(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Download generated document
 */
export declare function downloadDocument(req: Request, res: Response): Promise<void | Response<any, Record<string, any>>>;
/**
 * Get available merge fields
 */
export declare function getMergeFields(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=document.controller.d.ts.map