import { Request, Response } from "express";
export declare function listNotifications(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function markNotifications(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getNotificationPreferences(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateNotificationPreferences(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function sendTestNotification(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getDeliveryLogs(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function resendNotificationDelivery(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=notification.controller.d.ts.map