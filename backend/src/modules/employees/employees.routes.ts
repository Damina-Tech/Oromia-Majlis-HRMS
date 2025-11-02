import { Router } from "express";
import {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  uploadDocument,
  bulkImportEmployees,
  downloadSampleTemplate
} from "./employee.controller.js";
import { hasPermission } from "../../middleware/auth.js";

const router = Router();

// NOTE: The /upload-document route is registered in routes/index.ts
// before this router is mounted to ensure proper route matching

// GET /api/v1/employees - List employees with filtering and pagination
router.get("/", listEmployees);

// POST /api/v1/employees - Create new employee (requires write permission)
router.post("/", hasPermission("employees.write"), createEmployee);

// GET /api/v1/employees/sample-template - Download sample CSV template
// NOTE: This MUST come BEFORE /:id route
router.get("/sample-template", downloadSampleTemplate);

// GET /api/v1/employees/:id - Get specific employee
// NOTE: This MUST come AFTER static routes like /upload-document
router.get("/:id", getEmployee);

// PUT /api/v1/employees/:id - Update employee (requires write permission)
router.put("/:id", hasPermission("employees.write"), updateEmployee);

// DELETE /api/v1/employees/:id - Delete employee (requires write permission)
router.delete("/:id", hasPermission("employees.write"), deleteEmployee);

// Note: bulk-import route is registered in routes/index.ts before this router

export default router;
