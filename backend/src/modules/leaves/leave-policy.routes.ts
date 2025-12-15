import { Router } from "express";
import {
  listLeavePolicies,
  getLeavePolicy,
  createLeavePolicy,
  updateLeavePolicy,
  deleteLeavePolicy,
  renewLeaveBalances,
} from "./leave-policy.controller.js";

const router = Router();

// Note: Authentication and permission checks are handled in routes/index.ts

// GET /api/v1/leave-policies - List all leave policies
router.get("/", listLeavePolicies);

// GET /api/v1/leave-policies/:id - Get specific leave policy
router.get("/:id", getLeavePolicy);

// POST /api/v1/leave-policies - Create new leave policy
router.post("/", createLeavePolicy);

// PUT /api/v1/leave-policies/:id - Update leave policy
router.put("/:id", updateLeavePolicy);

// DELETE /api/v1/leave-policies/:id - Delete leave policy
router.delete("/:id", deleteLeavePolicy);

// POST /api/v1/leave-policies/renew - Renew leave balances
router.post("/renew", renewLeaveBalances);

export default router;

