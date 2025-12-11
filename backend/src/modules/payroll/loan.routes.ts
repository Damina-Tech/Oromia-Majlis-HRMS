import { Router } from "express";
import * as loanController from "./loan.controller.js";
import { requireAuth, hasAnyPermission } from "../../middleware/auth.js";

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Loan routes
router.post("/", hasAnyPermission("payroll.process", "payroll.view"), loanController.createLoan);
router.get("/", loanController.listLoans); // Employees can view their own loans
router.get("/:id", loanController.getLoan);
router.put("/:id", hasAnyPermission("payroll.process", "payroll.view"), loanController.updateLoan);
router.post("/:id/approve", hasAnyPermission("payroll.process"), loanController.approveLoan);
router.post("/:id/repayment", hasAnyPermission("payroll.process", "payroll.view"), loanController.addLoanRepayment);
router.delete("/:id", hasAnyPermission("payroll.process"), loanController.deleteLoan);

export default router;

