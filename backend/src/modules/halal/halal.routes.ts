import { Router } from "express";
import { requireAuth, hasPermission, hasAnyPermission } from "../../middleware/auth.js";
import {
  registerBusiness,
  listBusinesses,
  listInspectors,
  getBusiness,
  updateBusiness,
  uploadBusinessLicense,
  createApplication,
  listApplications,
  getApplication,
  updateApplication,
  submitApplication,
  approveApplication,
  assignInspection,
  listInspections,
  getInspection,
  completeInspection,
  listCertificates,
  getCertificate,
  downloadCertificate,
  createRenewal,
  createViolation,
} from "./halal.controller.js";
import { uploadHalalFile } from "../../lib/upload.js";
import { verifyCertificate } from "./halal.controller.js";

const router = Router();

// Public: verify certificate (no auth)
router.get("/verify/:certificateId", verifyCertificate);

// Business portal (business user)
router.post("/businesses", requireAuth, registerBusiness);
router.get("/businesses", requireAuth, listBusinesses);
router.get("/businesses/:id", requireAuth, getBusiness);
router.patch("/businesses/:id", requireAuth, updateBusiness);
router.post(
  "/businesses/:id/license",
  requireAuth,
  uploadHalalFile.single("license"),
  uploadBusinessLicense
);

// Applications
router.post("/applications", requireAuth, createApplication);
router.get("/applications", requireAuth, listApplications);
router.get("/applications/:id", requireAuth, getApplication);
router.patch("/applications/:id", requireAuth, updateApplication);
router.post("/applications/:id/submit", requireAuth, submitApplication);

// Admin: approve (halal.admin or similar)
router.post("/applications/:id/approve", requireAuth, hasAnyPermission("halal.admin", "halal.approve"), approveApplication);

// Inspectors list (for assignment dropdown)
router.get("/inspectors", requireAuth, hasAnyPermission("halal.inspector", "halal.admin", "halal.review"), listInspectors);

// Inspections (inspector + admin)
router.post("/inspections", requireAuth, hasAnyPermission("halal.inspector", "halal.admin"), assignInspection);
router.get("/inspections", requireAuth, hasAnyPermission("halal.inspector", "halal.admin", "halal.review"), listInspections);
router.get("/inspections/:id", requireAuth, hasAnyPermission("halal.inspector", "halal.admin", "halal.review"), getInspection);
router.patch("/inspections/:id/complete", requireAuth, hasAnyPermission("halal.inspector", "halal.admin"), completeInspection);

// Certificates (download before :id to avoid "download" as id)
router.get("/certificates", requireAuth, listCertificates);
router.get("/certificates/:id/download", requireAuth, downloadCertificate);
router.get("/certificates/:id", requireAuth, getCertificate);

// Renewals & violations (admin)
router.post("/renewals", requireAuth, hasAnyPermission("halal.admin", "halal.renew"), createRenewal);
router.post("/violations", requireAuth, hasAnyPermission("halal.admin"), createViolation);

export default router;
