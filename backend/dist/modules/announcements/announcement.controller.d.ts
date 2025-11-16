import { Request, Response } from "express";
/**
 * Create announcement
 */
export declare function createAnnouncement(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * List announcements
 */
export declare function listAnnouncements(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Get announcement by ID
 */
export declare function getAnnouncement(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Update announcement
 */
export declare function updateAnnouncement(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Delete announcement
 */
export declare function deleteAnnouncement(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Publish announcement manually
 */
export declare function publishAnnouncement(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Acknowledge/Read announcement
 */
export declare function acknowledgeAnnouncement(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * List reads for an announcement (admin only)
 */
export declare function listAnnouncementReads(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Get announcement statistics (admin only)
 */
export declare function getAnnouncementStats(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=announcement.controller.d.ts.map