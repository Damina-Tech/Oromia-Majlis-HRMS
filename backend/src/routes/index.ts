import { Router } from "express";
import { requireAuth, hasPermission, hasAnyPermission } from "../middleware/auth.js";
import authRoutes from "../modules/auth/auth.routes.js";
import usersRoutes from "../modules/users/users.routes.js";
import employeesRoutes from "../modules/employees/employees.routes.js";
import departmentsRoutes from "../modules/departments/departments.routes.js";
import leavesRoutes from "../modules/leaves/leaves.routes.js";
import attendanceRoutes from "../modules/attendance/attendance.routes.js";
import payrollRoutes from "../modules/payroll/payroll.routes.js";
import timesheetRoutes from "../modules/timesheet/timesheet.routes.js";
import assetRoutes from "../modules/assets/asset.routes.js";

const router = Router();

// Public routes
router.use("/v1/auth", authRoutes);

// Protected routes with permission-based access
router.use("/v1/departments", requireAuth, hasAnyPermission("departments.read", "departments.write"), departmentsRoutes);
router.use("/v1/users", requireAuth, hasPermission("users.read"), usersRoutes);
router.use("/v1/employees", requireAuth, hasPermission("employees.read"), employeesRoutes);
router.use("/v1/leaves", requireAuth, hasAnyPermission("leave.apply", "leave.view", "leave.approve"), leavesRoutes);
router.use("/v1/attendance", requireAuth, hasAnyPermission("attendance.mark", "attendance.view"), attendanceRoutes);
router.use("/v1/payroll", requireAuth, hasAnyPermission("payroll.view", "payroll.process"), payrollRoutes);
router.use("/v1/timesheets", requireAuth, hasAnyPermission("timesheet.create", "timesheet.view", "timesheet.approve"), timesheetRoutes);
router.use("/v1/assets", requireAuth, hasAnyPermission("assets.view", "assets.manage"), assetRoutes);

export default router;
