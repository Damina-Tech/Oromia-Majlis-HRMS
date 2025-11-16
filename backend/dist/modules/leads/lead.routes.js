import { Router } from "express";
import { listLeads, getLead, createLead, updateLead, changeLeadStage, assignLead, addLeadNote, dispositionLead, importLeads, getLeadKanban, getLeadDashboard, } from "./lead.controller.js";
import { requireAuth, hasAnyPermission } from "../../middleware/auth.js";
import { uploadImport } from "../../lib/upload.js";
const router = Router();
router.get("/", requireAuth, hasAnyPermission("leads.read", "leads.write", "leads.manage"), listLeads);
router.get("/dashboard", requireAuth, hasAnyPermission("leads.read", "leads.write", "leads.manage"), getLeadDashboard);
router.get("/kanban", requireAuth, hasAnyPermission("leads.read", "leads.write"), getLeadKanban);
router.post("/", requireAuth, hasAnyPermission("leads.write", "leads.manage"), createLead);
router.post("/import", requireAuth, hasAnyPermission("leads.write", "leads.manage"), uploadImport.single("file"), importLeads);
router.get("/:id", requireAuth, hasAnyPermission("leads.read", "leads.write"), getLead);
router.patch("/:id", requireAuth, hasAnyPermission("leads.write", "leads.manage"), updateLead);
router.post("/:id/stage", requireAuth, hasAnyPermission("leads.write", "leads.manage"), changeLeadStage);
router.post("/:id/assign", requireAuth, hasAnyPermission("leads.write", "leads.manage"), assignLead);
router.post("/:id/notes", requireAuth, hasAnyPermission("leads.read", "leads.write", "leads.manage"), addLeadNote);
router.post("/:id/disposition", requireAuth, hasAnyPermission("leads.write", "leads.manage"), dispositionLead);
export default router;
//# sourceMappingURL=lead.routes.js.map