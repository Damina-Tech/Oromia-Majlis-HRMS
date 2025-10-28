import { Request, Response } from "express";
export declare function listEmployees(req: Request, res: Response): Promise<void>;
export declare function getEmployee(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function createEmployee(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateEmployee(req: Request, res: Response): Promise<void>;
export declare function deleteEmployee(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=employee.controller.d.ts.map