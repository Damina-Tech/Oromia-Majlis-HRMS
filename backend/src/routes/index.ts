import { Router } from "express";
import { requireAuth, hasPermission, hasAnyPermission } from "../middleware/auth.js";
import authRoutes from "../modules/auth/auth.routes.js";
import usersRoutes from "../modules/users/users.routes.js";
import employeesRoutes from "../modules/employees/employees.routes.js";
import departmentsRoutes from "../modules/departments/departments.routes.js";
import leavesRoutes from "../modules/leaves/leaves.routes.js";
import leaveBalancesRoutes from "../modules/leaves/leave-balances.routes.js";
import attendanceRoutes from "../modules/attendance/attendance.routes.js";
import payrollRoutes from "../modules/payroll/payroll.routes.js";
import timesheetRoutes from "../modules/timesheet/timesheet.routes.js";
import assetRoutes from "../modules/assets/asset.routes.js";
import documentRoutes from "../modules/documents/document.routes.js";
import announcementRoutes from "../modules/announcements/announcement.routes.js";
import taskRoutes from "../modules/tasks/task.routes.js";
import expenseRoutes from "../modules/expenses/expense.routes.js";
import { uploadDocument, bulkImportEmployees } from "../modules/employees/employee.controller.js";
import { upload, uploadImport } from "../lib/upload.js";

const router = Router();

// Public routes
router.use("/v1/auth", authRoutes);

// Protected routes with permission-based access
router.use("/v1/departments", requireAuth, hasAnyPermission("departments.read", "departments.write"), departmentsRoutes);
router.use("/v1/users", usersRoutes);
// Register upload-document route BEFORE mounting employeesRoutes to ensure it's matched first
router.post("/v1/employees/upload-document",
  requireAuth,
  hasPermission("employees.write"),
  upload.single("document"),
  uploadDocument
);

// Register bulk-import route BEFORE mounting employeesRoutes
router.post("/v1/employees/bulk-import",
  requireAuth,
  hasPermission("employees.write"),
  uploadImport.single("file"),
  bulkImportEmployees
);

router.use("/v1/employees", 
  (req, res, next) => {
    console.log(`📋 [ROUTES] Employees route matched: ${req.method} ${req.path}`);
    next();
  },
  requireAuth, 
  hasAnyPermission("employees.read", "employees.write"), 
  employeesRoutes
);
router.use("/v1/leaves", requireAuth, hasAnyPermission("leave.apply", "leave.view", "leave.approve"), leavesRoutes);
router.use("/v1/leave-balances", requireAuth, leaveBalancesRoutes);
router.use("/v1/attendance", requireAuth, hasAnyPermission("attendance.mark", "attendance.view"), attendanceRoutes);
router.use("/v1/payroll", requireAuth, hasAnyPermission("payroll.view", "payroll.process"), payrollRoutes);
router.use("/v1/timesheets", requireAuth, hasAnyPermission("timesheet.create", "timesheet.view", "timesheet.approve"), timesheetRoutes);
router.use("/v1/assets", requireAuth, hasAnyPermission("assets.view", "assets.manage"), assetRoutes);
router.use("/v1/documents", requireAuth, hasAnyPermission("documents.view", "documents.manage"), documentRoutes);
router.use("/v1/announcements", requireAuth, announcementRoutes);
router.use("/v1/tasks", requireAuth, hasAnyPermission("tasks.view", "tasks.create", "tasks.edit"), taskRoutes);
router.use("/v1/expenses", expenseRoutes);

export default router;
