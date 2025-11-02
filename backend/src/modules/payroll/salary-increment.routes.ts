import { Router } from "express";
import * as salaryIncrementController from "./salary-increment.controller.js";
import { requireAuth, hasAnyPermission } from "../../middleware/auth.js";

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Salary increment routes
router.post("/", hasAnyPermission("payroll.process"), salaryIncrementController.createSalaryIncrement);
router.post("/bulk", hasAnyPermission("payroll.process"), salaryIncrementController.bulkIncrement);
router.get("/", salaryIncrementController.listSalaryIncrements); // Employees can view their own increments
router.get("/:id", salaryIncrementController.getSalaryIncrement);

export default router;

