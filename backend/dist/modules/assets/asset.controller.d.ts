import { Request, Response } from "express";
/**
 * List assets with filtering and pagination
 */
export declare function listAssets(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Get single asset by ID
 */
export declare function getAsset(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Create new asset
 */
export declare function createAsset(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Update asset
 */
export declare function updateAsset(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Assign asset to employee
 */
export declare function assignAsset(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function returnAsset(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Revoke asset assignment
 */
export declare function revokeAsset(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Transfer asset to another employee
 */
export declare function transferAsset(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Update asset status
 */
export declare function updateAssetStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Delete asset
 */
export declare function deleteAsset(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Get asset statistics
 */
export declare function getAssetStats(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Get asset history
 */
export declare function getAssetHistory(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Bulk update assets
 */
export declare function bulkUpdateAssets(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=asset.controller.d.ts.map