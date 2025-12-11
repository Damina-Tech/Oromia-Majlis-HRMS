import { Router } from "express";
import { requireAuth, hasPermission, hasAnyPermission } from "../../middleware/auth.js";
import { createExpense, listExpenses, getExpense, updateExpense, submitExpense, approveExpense, rejectExpense, payExpense, uploadReceipt, } from "./expense.controller.js";
import { uploadExpenseReceipt } from "../../lib/upload.js";
const router = Router();
// All routes require authentication
router.use(requireAuth);
// Create expense - any employee with expense.create permission
router.post("/", hasAnyPermission("expense.create", "expense.submit"), createExpense);
// List expenses - any employee with expense.view permission
router.get("/", hasAnyPermission("expense.view", "expense.view_all"), listExpenses);
// Get expense detail
router.get("/:id", hasAnyPermission("expense.view", "expense.view_all"), getExpense);
// Update expense - only submitter or admin/HR with expense.edit permission
router.put("/:id", hasAnyPermission("expense.edit", "expense.create"), updateExpense);
// Submit expense for approval
router.post("/:id/submit", hasPermission("expense.submit"), submitExpense);
// Approve expense - requires expense.approve permission
router.post("/:id/approve", hasPermission("expense.approve"), approveExpense);
// Reject expense - requires expense.approve permission
router.post("/:id/reject", hasPermission("expense.approve"), rejectExpense);
// Mark expense as paid - requires expense.pay permission
router.post("/:id/pay", hasPermission("expense.pay"), payExpense);
// Upload receipt
router.post("/:id/receipt", hasAnyPermission("expense.create", "expense.edit"), uploadExpenseReceipt.single("receipt"), uploadReceipt);
export default router;
//# sourceMappingURL=expense.routes.js.map