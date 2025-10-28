import { Router } from "express";
import { listEmployees, getEmployee, createEmployee, updateEmployee, deleteEmployee } from "./employee.controller.js";
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
export default router;
//# sourceMappingURL=employees.routes.js.map