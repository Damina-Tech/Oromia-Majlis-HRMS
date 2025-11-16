import { Request, Response } from "express";
export declare function listLeaveBalances(req: Request, res: Response): Promise<void>;
export declare function getLeaveBalance(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function createLeaveBalance(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateLeaveBalance(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function deleteLeaveBalance(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function carryOverLeave(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=leave-balance.controller.d.ts.map