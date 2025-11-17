import { Router } from "express";
import * as payrollController from "./payroll.controller.js";

const router = Router();

// Get payroll summary/statistics
router.get("/summary", payrollController.getPayrollSummary);

// List payroll records
router.get("/", payrollController.listPayroll);

// Get single payroll record
router.get("/:id", payrollController.getPayroll);

// Generate payroll for employees
router.post("/generate", payrollController.generatePayroll);

// Process payroll (mark as processed)
router.post("/process", payrollController.processPayroll);

// Update payroll record
router.put("/:id", payrollController.updatePayroll);

// Mark payroll as paid
router.patch("/:id/paid", payrollController.markAsPaid);

// Delete payroll record
router.delete("/:id", payrollController.deletePayroll);

export default router;
