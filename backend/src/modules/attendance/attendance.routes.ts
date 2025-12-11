import { Router } from "express";
import * as attendanceController from "./attendance.controller.js";

const router = Router();

// Check in/out
router.post("/check-in", attendanceController.checkIn);
router.post("/check-out", attendanceController.checkOut);

// Get today's status
router.get("/today", attendanceController.getTodayStatus);

// Get attendance statistics
router.get("/stats", attendanceController.getAttendanceStats);

// List attendance records
router.get("/", attendanceController.listAttendance);

<<<<<<< HEAD
=======
// Create attendance record (for HR/Admin)
router.post("/", attendanceController.createAttendance);

>>>>>>> dev
// Update/delete attendance (for HR/Admin)
router.put("/:id", attendanceController.updateAttendance);
router.delete("/:id", attendanceController.deleteAttendance);

export default router;

