import { Router } from "express";
import {
  generateReport,
  getReportTemplates,
  getDashboardWidgets,
  getReportAuditLogs,
} from "./report.controller.js";
import { requireAuth, hasPermission } from "../../middleware/auth.js";

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Generate report
router.post("/generate", hasPermission("reports.generate"), generateReport);

// Get report templates
router.get("/templates", hasPermission("reports.view"), getReportTemplates);

// Get dashboard widgets/KPIs
router.get("/dashboard/widgets", hasPermission("reports.view"), getDashboardWidgets);

// Get audit logs
router.get("/audit-logs", hasPermission("reports.view"), getReportAuditLogs);

export default router;

