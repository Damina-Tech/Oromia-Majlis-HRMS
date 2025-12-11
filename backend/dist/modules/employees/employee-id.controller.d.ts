import { Request, Response } from "express";
export declare function listIdCardTemplates(req: Request, res: Response): Promise<void>;
export declare function createIdCardTemplate(req: Request, res: Response): Promise<void>;
export declare function updateIdCardTemplate(req: Request, res: Response): Promise<void>;
export declare function deleteIdCardTemplate(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function setDefaultIdCardTemplate(req: Request, res: Response): Promise<void>;
export declare function generateEmployeeIdCard(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function batchGenerateEmployeeIdCards(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=employee-id.controller.d.ts.map