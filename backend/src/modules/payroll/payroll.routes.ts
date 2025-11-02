import { Router } from "express";
import * as payrollController from "./payroll.controller.js";
import salaryGradeRoutes from "./salary-grade.routes.js";
import loanRoutes from "./loan.routes.js";
import advanceRoutes from "./advance.routes.js";
import allowanceRoutes from "./allowance.routes.js";
import taxPensionRoutes from "./tax-pension.routes.js";
import salaryIncrementRoutes from "./salary-increment.routes.js";
import payrollRunRoutes from "./payroll-run.routes.js";

const router = Router();

// New payroll module routes (mount before legacy routes to avoid conflicts)
router.use("/runs", payrollRunRoutes);
router.use("/salary-grades", salaryGradeRoutes);
router.use("/loans", loanRoutes);
router.use("/advances", advanceRoutes);
router.use("/allowances", allowanceRoutes);
router.use("/tax-pension", taxPensionRoutes);
router.use("/salary-increments", salaryIncrementRoutes);

// Legacy payroll routes (using old Payroll model - keep for backward compatibility)
router.get("/summary", payrollController.getPayrollSummary);
router.get("/", payrollController.listPayroll);
router.get("/:id", payrollController.getPayroll);
router.post("/generate", payrollController.generatePayroll);
router.post("/process", payrollController.processPayroll);
router.put("/:id", payrollController.updatePayroll);
router.patch("/:id/paid", payrollController.markAsPaid);
router.delete("/:id", payrollController.deletePayroll);

export default router;
