import { Request, Response } from "express";
export declare function listLeads(req: Request, res: Response): Promise<void>;
export declare function getLead(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function createLead(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateLead(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function changeLeadStage(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function assignLead(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function addLeadNote(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function dispositionLead(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function importLeads(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function downloadSampleTemplate(req: Request, res: Response): Promise<void>;
export declare function getLeadKanban(req: Request, res: Response): Promise<void>;
export declare function deleteAllLeads(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getLeadDashboard(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=lead.controller.d.ts.map