import { Router } from "express";
import { requireAuth, hasAnyPermission } from "../../middleware/auth.js";
import {
  createDivisionAssignment,
  deleteDivisionAssignment,
  getOrgDivision,
  listDivisionAssignments,
  listOrgDivisions,
  updateDivisionAssignment,
  updateOrgDivision,
} from "./org-division.controller.js";

const router = Router();

const ACCESS_READ = hasAnyPermission("divisions.read", "divisions.manage", "system.admin");
const ACCESS_MANAGE = hasAnyPermission("divisions.manage", "system.admin");

router.use(requireAuth);

router.get("/", ACCESS_READ, listOrgDivisions);
router.get("/assignments", ACCESS_READ, listDivisionAssignments);
router.get("/:id", ACCESS_READ, getOrgDivision);
router.patch("/:id", ACCESS_MANAGE, updateOrgDivision);

router.post("/assignments", ACCESS_MANAGE, createDivisionAssignment);
router.patch("/assignments/:id", ACCESS_MANAGE, updateDivisionAssignment);
router.delete("/assignments/:id", ACCESS_MANAGE, deleteDivisionAssignment);

export default router;
