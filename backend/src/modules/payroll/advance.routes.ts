import { Router } from "express";
import * as advanceController from "./advance.controller.js";
import { requireAuth, hasAnyPermission } from "../../middleware/auth.js";

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Advance routes
router.post("/", hasAnyPermission("payroll.process", "payroll.view"), advanceController.createAdvance);
router.get("/", advanceController.listAdvances); // Employees can view their own advances
router.get("/:id", advanceController.getAdvance);
router.put("/:id", hasAnyPermission("payroll.process", "payroll.view"), advanceController.updateAdvance);
router.post("/:id/approve", hasAnyPermission("payroll.process"), advanceController.approveAdvance);
router.post("/:id/repayment", hasAnyPermission("payroll.process", "payroll.view"), advanceController.addAdvanceRepayment);
router.delete("/:id", hasAnyPermission("payroll.process"), advanceController.deleteAdvance);

export default router;

