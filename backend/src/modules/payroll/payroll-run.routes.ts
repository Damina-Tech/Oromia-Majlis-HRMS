import { Router } from "express";
import * as payrollRunController from "./payroll-run.controller.js";
import { requireAuth, hasAnyPermission } from "../../middleware/auth.js";

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Payroll run routes
router.post("/", hasAnyPermission("payroll.process"), payrollRunController.createPayrollRun);
router.get("/", hasAnyPermission("payroll.view", "payroll.process"), payrollRunController.listPayrollRuns);
router.get("/:id", hasAnyPermission("payroll.view", "payroll.process"), payrollRunController.getPayrollRun);
router.put("/:id", hasAnyPermission("payroll.process"), payrollRunController.updatePayrollRun);
router.post("/:id/review", hasAnyPermission("payroll.process"), payrollRunController.reviewPayrollRun);
router.post("/:id/approve", hasAnyPermission("payroll.process"), payrollRunController.approvePayrollRun);
router.post("/:id/process", hasAnyPermission("payroll.process"), payrollRunController.processPayrollRun);
router.delete("/:id", hasAnyPermission("payroll.process"), payrollRunController.deletePayrollRun);

// Payroll item routes
router.get("/:runId/items", hasAnyPermission("payroll.view", "payroll.process"), payrollRunController.listPayrollItems);
router.get("/items/:id", hasAnyPermission("payroll.view", "payroll.process"), payrollRunController.getPayrollItem);
router.put("/items/:id", hasAnyPermission("payroll.process"), payrollRunController.updatePayrollItem);

// Bank export route
router.get("/:id/export", hasAnyPermission("payroll.process"), payrollRunController.exportBankFile);

// Payslip routes
router.post("/items/:itemId/payslip", hasAnyPermission("payroll.view", "payroll.process"), payrollRunController.generatePayslip);
router.get("/items/:itemId/payslip", hasAnyPermission("payroll.view", "payroll.process"), payrollRunController.getPayslipData);
router.get("/items/:itemId/payslip/download", hasAnyPermission("payroll.view", "payroll.process"), payrollRunController.downloadPayslip);

export default router;

