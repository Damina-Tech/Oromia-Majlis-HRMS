import { Router } from "express";
import {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
<<<<<<< HEAD
  deleteEmployee
} from "./employee.controller.js";

const router = Router();

// GET /api/v1/employees - List employees with filtering and pagination
router.get("/", listEmployees);

// GET /api/v1/employees/:id - Get specific employee
router.get("/:id", getEmployee);

// POST /api/v1/employees - Create new employee
router.post("/", createEmployee);

// PUT /api/v1/employees/:id - Update employee
router.put("/:id", updateEmployee);

// DELETE /api/v1/employees/:id - Delete employee
router.delete("/:id", deleteEmployee);
=======
  deleteEmployee,
  uploadDocument,
  bulkImportEmployees,
  downloadSampleTemplate
} from "./employee.controller.js";
import { hasAnyPermission, hasPermission } from "../../middleware/auth.js";
import {
  batchGenerateEmployeeIdCards,
  createIdCardTemplate,
  deleteIdCardTemplate,
  generateEmployeeIdCard,
  listIdCardTemplates,
  setDefaultIdCardTemplate,
  updateIdCardTemplate,
} from "./employee-id.controller.js";

const router = Router();

// NOTE: The /upload-document route is registered in routes/index.ts
// before this router is mounted to ensure proper route matching

// ID card template routes
router.get(
  "/id-templates",
  hasAnyPermission("employees.id.generate", "employees.id.manage"),
  listIdCardTemplates
);
router.post("/id-templates", hasPermission("employees.id.manage"), createIdCardTemplate);
router.put("/id-templates/:templateId", hasPermission("employees.id.manage"), updateIdCardTemplate);
router.delete("/id-templates/:templateId", hasPermission("employees.id.manage"), deleteIdCardTemplate);
router.post(
  "/id-templates/:templateId/default",
  hasPermission("employees.id.manage"),
  setDefaultIdCardTemplate
);

// ID generation routes
router.post(
  "/:id/id-card",
  hasAnyPermission("employees.id.generate", "employees.id.manage"),
  generateEmployeeIdCard
);
router.post("/id-cards/batch", hasPermission("employees.id.batch"), batchGenerateEmployeeIdCards);

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
>>>>>>> dev

export default router;
