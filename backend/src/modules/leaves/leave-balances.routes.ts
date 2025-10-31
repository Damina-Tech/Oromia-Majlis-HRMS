import { Router } from "express";
import { requireAuth, hasPermission, hasAnyPermission } from "../../middleware/auth.js";
import {
  listLeaveBalances,
  getLeaveBalance,
  createLeaveBalance,
  updateLeaveBalance,
  deleteLeaveBalance,
  carryOverLeave,
} from "./leave-balance.controller.js";

const router = Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/v1/leave-balances - List all leave balances (requires leave.read or leave.manage permission)
router.get(
  "/",
  hasAnyPermission("leave.read", "leave.manage"),
  listLeaveBalances
);

// GET /api/v1/leave-balances/:id - Get specific leave balance
router.get(
  "/:id",
  hasAnyPermission("leave.read", "leave.manage"),
  getLeaveBalance
);

// POST /api/v1/leave-balances - Create new leave balance (requires leave.manage permission)
router.post(
  "/",
  hasPermission("leave.manage"),
  createLeaveBalance
);

// PUT /api/v1/leave-balances/:id - Update leave balance (requires leave.manage permission)
router.put(
  "/:id",
  hasPermission("leave.manage"),
  updateLeaveBalance
);

// DELETE /api/v1/leave-balances/:id - Delete leave balance (requires leave.manage permission)
router.delete(
  "/:id",
  hasPermission("leave.manage"),
  deleteLeaveBalance
);

// POST /api/v1/leave-balances/carry-over - Carry over leave to next year (requires leave.manage permission)
router.post(
  "/carry-over",
  hasPermission("leave.manage"),
  carryOverLeave
);

export default router;

