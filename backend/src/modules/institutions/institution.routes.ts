import { Router } from "express";
import {
  createInstitution,
  listInstitutions,
  getInstitution,
  updateInstitution,
  approveInstitution,
  createAssignment,
  listAssignments,
  approveAssignment,
  endAssignment,
  getInstitutionStats,
  createRegion,
  listRegions,
  createZone,
  createWoreda,
  createKebele,
  resolveOromiaGeographyHandler,
} from "./institution.controller.js";

const router = Router();

// Geographic hierarchy routes
router.post("/regions", createRegion);
router.get("/regions", listRegions);
router.post("/geography/resolve", resolveOromiaGeographyHandler);
router.post("/zones", createZone);
router.post("/woredas", createWoreda);
router.post("/kebeles", createKebele);

// Institution routes
router.post("/", createInstitution);
router.get("/", listInstitutions);
router.get("/stats", getInstitutionStats);

// Assignment routes (must come before /:id route to avoid route conflicts)
router.post("/assignments", createAssignment);
router.get("/assignments", listAssignments);
router.post("/assignments/:id/approve", approveAssignment);
router.post("/assignments/:id/end", endAssignment);

// Institution-specific routes (must come after specific routes)
router.get("/:id", getInstitution);
router.patch("/:id", updateInstitution);
router.post("/:id/approve", approveInstitution);

export default router;

