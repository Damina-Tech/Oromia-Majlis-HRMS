import { Router } from "express";
import { requireAuth, hasPermission, hasAnyPermission } from "../middleware/auth.js";
import authRoutes from "../modules/auth/auth.routes.js";
import usersRoutes from "../modules/users/users.routes.js";
import employeesRoutes from "../modules/employees/employees.routes.js";
import departmentsRoutes from "../modules/departments/departments.routes.js";
import leavesRoutes from "../modules/leaves/leaves.routes.js";
<<<<<<< HEAD
=======
import leaveBalancesRoutes from "../modules/leaves/leave-balances.routes.js";
>>>>>>> dev
import attendanceRoutes from "../modules/attendance/attendance.routes.js";
import payrollRoutes from "../modules/payroll/payroll.routes.js";
import timesheetRoutes from "../modules/timesheet/timesheet.routes.js";
import assetRoutes from "../modules/assets/asset.routes.js";
<<<<<<< HEAD
=======
import documentRoutes from "../modules/documents/document.routes.js";
import announcementRoutes from "../modules/announcements/announcement.routes.js";
import taskRoutes from "../modules/tasks/task.routes.js";
import expenseRoutes from "../modules/expenses/expense.routes.js";
import reportRoutes from "../modules/reports/report.routes.js";
import dashboardRoutes from "../modules/dashboard/dashboard.routes.js";
import leadsRoutes from "../modules/leads/lead.routes.js";
import notificationRoutes from "../modules/notifications/notification.routes.js";
import { uploadDocument, bulkImportEmployees } from "../modules/employees/employee.controller.js";
import { upload, uploadImport } from "../lib/upload.js";
>>>>>>> dev

const router = Router();

// Public routes
router.use("/v1/auth", authRoutes);

// Protected routes with permission-based access
router.use("/v1/departments", requireAuth, hasAnyPermission("departments.read", "departments.write"), departmentsRoutes);
<<<<<<< HEAD
router.use("/v1/users", requireAuth, hasPermission("users.read"), usersRoutes);
router.use("/v1/employees", requireAuth, hasPermission("employees.read"), employeesRoutes);
router.use("/v1/leaves", requireAuth, hasAnyPermission("leave.apply", "leave.view", "leave.approve"), leavesRoutes);
=======
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
>>>>>>> dev
router.use("/v1/attendance", requireAuth, hasAnyPermission("attendance.mark", "attendance.view"), attendanceRoutes);
router.use("/v1/payroll", requireAuth, hasAnyPermission("payroll.view", "payroll.process"), payrollRoutes);
router.use("/v1/timesheets", requireAuth, hasAnyPermission("timesheet.create", "timesheet.view", "timesheet.approve"), timesheetRoutes);
router.use("/v1/assets", requireAuth, hasAnyPermission("assets.view", "assets.manage"), assetRoutes);
<<<<<<< HEAD
=======
router.use("/v1/documents", requireAuth, hasAnyPermission("documents.view", "documents.manage"), documentRoutes);
router.use("/v1/announcements", requireAuth, announcementRoutes);
router.use("/v1/tasks", requireAuth, hasAnyPermission("tasks.view", "tasks.create", "tasks.edit"), taskRoutes);
router.use("/v1/expenses", expenseRoutes);
router.use("/v1/reports", reportRoutes);
router.use("/v1/dashboard", dashboardRoutes);
router.use(
  "/v1/leads",
  requireAuth,
  hasAnyPermission("leads.read", "leads.write", "leads.manage"),
  leadsRoutes
);
router.use(
  "/v1/notifications",
  requireAuth,
  notificationRoutes
);
>>>>>>> dev

export default router;
