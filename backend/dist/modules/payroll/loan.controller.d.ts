import { Request, Response } from "express";
export declare function createLoan(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function listLoans(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getLoan(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function updateLoan(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function approveLoan(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function addLoanRepayment(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function deleteLoan(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=loan.controller.d.ts.map