import { Router } from "express";
import {
  listTimesheets,
  getTimesheet,
  createTimesheet,
  updateTimesheet,
  submitTimesheet,
  updateTimesheetStatus,
  deleteTimesheet,
  getTimesheetSummary,
  startTimer,
  stopTimer,
  addManualTimeEntry,
} from "./timesheet.controller.js";

const router = Router();

// Timesheet CRUD routes
router.get("/", listTimesheets); // GET /api/v1/timesheets
router.get("/summary", getTimesheetSummary); // GET /api/v1/timesheets/summary
router.get("/:id", getTimesheet); // GET /api/v1/timesheets/:id
router.post("/", createTimesheet); // POST /api/v1/timesheets
router.put("/:id", updateTimesheet); // PUT /api/v1/timesheets/:id
router.delete("/:id", deleteTimesheet); // DELETE /api/v1/timesheets/:id

// Timesheet workflow routes
router.post("/:id/submit", submitTimesheet); // POST /api/v1/timesheets/:id/submit
router.put("/:id/status", updateTimesheetStatus); // PUT /api/v1/timesheets/:id/status

// Timer routes
router.post("/timer/start", startTimer); // POST /api/v1/timesheets/timer/start
router.post("/timer/stop", stopTimer); // POST /api/v1/timesheets/timer/stop

// Manual time entry
router.post("/manual-entry", addManualTimeEntry); // POST /api/v1/timesheets/manual-entry

export default router;
