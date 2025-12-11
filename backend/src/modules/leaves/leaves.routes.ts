import { Router } from "express";
import {
  listLeaveRequests,
  getLeaveRequest,
  createLeaveRequest,
  updateLeaveStatus,
  updateLeaveRequest,
  getLeaveBalance,
  cancelLeaveRequest,
} from "./leave.controller.js";

const router = Router();

// GET /api/v1/leaves - List leave requests
router.get("/", listLeaveRequests);

// GET /api/v1/leaves/balance/:employeeId - Get leave balance
router.get("/balance/:employeeId", getLeaveBalance);

// GET /api/v1/leaves/:id - Get specific leave request
router.get("/:id", getLeaveRequest);

// POST /api/v1/leaves - Create new leave request
router.post("/", createLeaveRequest);

// PUT /api/v1/leaves/:id/status - Approve/reject leave
router.put("/:id/status", updateLeaveStatus);

// PUT /api/v1/leaves/:id - Update leave request (admins/managers only)
router.put("/:id", updateLeaveRequest);

// DELETE /api/v1/leaves/:id - Cancel leave request
router.delete("/:id", cancelLeaveRequest);

export default router;

