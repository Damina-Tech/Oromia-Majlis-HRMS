import { Request, Response } from "express";
export declare function listLeaveRequests(req: Request, res: Response): Promise<void>;
export declare function getLeaveRequest(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function createLeaveRequest(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateLeaveStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getLeaveBalance(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function cancelLeaveRequest(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=leave.controller.d.ts.map