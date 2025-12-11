import { Router } from "express";
import * as allowanceController from "./allowance.controller.js";
import { requireAuth, hasPermission } from "../../middleware/auth.js";

const router = Router();

// All routes require authentication and payroll.process permission
router.use(requireAuth, hasPermission("payroll.process"));

// Allowance configuration routes
router.post("/", allowanceController.createAllowance);
router.get("/", allowanceController.listAllowances);
router.get("/:id", allowanceController.getAllowance);
router.put("/:id", allowanceController.updateAllowance);
router.delete("/:id", allowanceController.deleteAllowance);

// Employee allowance assignment routes
router.post("/assign", allowanceController.assignEmployeeAllowance);
router.get("/assign/list", allowanceController.listEmployeeAllowances);
router.delete("/assign/:id", allowanceController.removeEmployeeAllowance);

export default router;

