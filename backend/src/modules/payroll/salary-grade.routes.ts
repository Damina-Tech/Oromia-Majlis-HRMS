import { Router } from "express";
import * as salaryGradeController from "./salary-grade.controller.js";
import { requireAuth, hasPermission } from "../../middleware/auth.js";

const router = Router();

// All routes require authentication and payroll.process permission
router.use(requireAuth, hasPermission("payroll.process"));

// Salary Step routes (must come before /:id to avoid conflicts)
router.post("/steps", salaryGradeController.createSalaryStep);
router.get("/steps", salaryGradeController.listSalarySteps);
router.get("/steps/:id", salaryGradeController.getSalaryStep);
router.put("/steps/:id", salaryGradeController.updateSalaryStep);
router.delete("/steps/:id", salaryGradeController.deleteSalaryStep);

// Salary Grade routes
router.post("/", salaryGradeController.createSalaryGrade);
router.get("/", salaryGradeController.listSalaryGrades);
router.get("/:id", salaryGradeController.getSalaryGrade);
router.put("/:id", salaryGradeController.updateSalaryGrade);
router.delete("/:id", salaryGradeController.deleteSalaryGrade);

export default router;

