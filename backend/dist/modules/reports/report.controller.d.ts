import { Request, Response } from "express";
/**
 * Generate report data based on module and filters
 */
export declare function generateReport(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get report templates
 */
export declare function getReportTemplates(req: Request, res: Response): Promise<void>;
/**
 * Get dashboard widgets/KPIs
 */
export declare function getDashboardWidgets(req: Request, res: Response): Promise<void>;
/**
 * Get report audit logs
 */
export declare function getReportAuditLogs(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=report.controller.d.ts.map