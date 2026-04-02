import { Router } from "express";
import { requireAuth, hasPermission, hasAnyPermission } from "../../middleware/auth.js";
import {
  registerBusiness,
  listBusinesses,
  listInspectors,
  getBusiness,
  updateBusiness,
  deleteBusiness,
  approveBusiness,
  uploadBusinessLicense,
  uploadHalalDocument,
  createApplication,
  listApplications,
  getApplication,
  updateApplication,
  deleteApplication,
  submitApplication,
  confirmPayment,
  initChapaPayment,
  chapaCallback,
  confirmManualPayment,
  approveApplication,
  assignInspection,
  listInspections,
  getInspection,
  updateInspection,
  deleteInspection,
  completeInspection,
  listCertificates,
  getCertificate,
  downloadCertificate,
  createRenewal,
  listViolations,
  createViolation,
} from "./halal.controller.js";
import { uploadHalalFile } from "../../lib/upload.js";
import { verifyCertificate } from "./halal.controller.js";

const router = Router();
const HALAL_MODULE_ACCESS = [
  "halal.business",
  "halal.admin",
  "halal.supervisor",
  "halal.inspector",
  "halal.renew",
  "halal.committee",
  "halal.audit",
];

// Public: verify certificate (no auth)
router.get("/verify/:certificateId", verifyCertificate);

// Business portal (business user)
router.post("/businesses", requireAuth, hasAnyPermission("halal.business"), registerBusiness);
router.get("/businesses", requireAuth, hasAnyPermission(...HALAL_MODULE_ACCESS), listBusinesses);
router.get("/businesses/:id", requireAuth, hasAnyPermission(...HALAL_MODULE_ACCESS), getBusiness);
router.patch("/businesses/:id", requireAuth, hasAnyPermission("halal.business", "halal.admin", "halal.supervisor"), updateBusiness);
router.delete("/businesses/:id", requireAuth, hasAnyPermission("halal.business", "halal.admin", "halal.supervisor"), deleteBusiness);
router.post("/businesses/:id/approve", requireAuth, hasAnyPermission("halal.admin", "halal.supervisor"), approveBusiness);
router.post(
  "/documents/upload",
  requireAuth,
  hasAnyPermission("halal.business", "halal.admin", "halal.supervisor", "halal.inspector", "halal.committee"),
  uploadHalalFile.single("document"),
  uploadHalalDocument
);
router.post(
  "/businesses/:id/license",
  requireAuth,
  hasAnyPermission("halal.business", "halal.admin", "halal.supervisor"),
  uploadHalalFile.single("license"),
  uploadBusinessLicense
);

// Applications
router.post("/applications", requireAuth, hasAnyPermission(...HALAL_MODULE_ACCESS), createApplication);
router.get("/applications", requireAuth, hasAnyPermission(...HALAL_MODULE_ACCESS), listApplications);
router.get("/applications/:id", requireAuth, hasAnyPermission(...HALAL_MODULE_ACCESS), getApplication);
router.patch("/applications/:id", requireAuth, hasAnyPermission("halal.business", "halal.admin", "halal.supervisor"), updateApplication);
router.delete("/applications/:id", requireAuth, hasAnyPermission("halal.business", "halal.admin", "halal.supervisor"), deleteApplication);
router.post("/applications/:id/submit", requireAuth, hasAnyPermission("halal.business"), submitApplication);
router.post("/applications/:id/confirm-payment", requireAuth, hasAnyPermission("halal.business", "halal.admin", "halal.supervisor"), confirmPayment);
router.post("/applications/:id/payment/chapa-init", requireAuth, hasAnyPermission("halal.business", "halal.admin", "halal.supervisor"), initChapaPayment);
router.get("/applications/:id/payment/chapa-callback", chapaCallback); // Public - Chapa calls this
router.post(
  "/applications/:id/payment/manual",
  requireAuth,
  hasAnyPermission("halal.business", "halal.admin", "halal.supervisor"),
  uploadHalalFile.single("receipt"),
  confirmManualPayment
);

// Admin: approve (halal.admin or similar)
router.post(
  "/applications/:id/approve",
  requireAuth,
  hasAnyPermission("halal.admin", "halal.supervisor", "halal.committee"),
  approveApplication
);

// Inspectors list (for assignment dropdown)
router.get("/inspectors", requireAuth, hasAnyPermission("halal.inspector", "halal.admin", "halal.supervisor", "halal.committee"), listInspectors);

// Inspections (inspector + admin)
router.post("/inspections", requireAuth, hasAnyPermission("halal.inspector", "halal.admin", "halal.supervisor", "halal.committee"), assignInspection);
router.get("/inspections", requireAuth, hasAnyPermission("halal.inspector", "halal.admin", "halal.supervisor"), listInspections);
router.get("/inspections/:id", requireAuth, hasAnyPermission("halal.inspector", "halal.admin", "halal.supervisor"), getInspection);
router.patch("/inspections/:id", requireAuth, hasAnyPermission("halal.inspector", "halal.admin", "halal.supervisor", "halal.committee"), updateInspection);
router.delete("/inspections/:id", requireAuth, hasAnyPermission("halal.inspector", "halal.admin", "halal.supervisor", "halal.committee"), deleteInspection);
router.patch("/inspections/:id/complete", requireAuth, hasAnyPermission("halal.inspector", "halal.admin"), completeInspection);

// Certificates (download before :id to avoid "download" as id)
router.get("/certificates", requireAuth, hasAnyPermission(...HALAL_MODULE_ACCESS), listCertificates);
router.get("/certificates/:id/download", requireAuth, hasAnyPermission(...HALAL_MODULE_ACCESS), downloadCertificate);
router.get("/certificates/:id", requireAuth, hasAnyPermission(...HALAL_MODULE_ACCESS), getCertificate);

// Renewals & violations (admin)
router.post("/renewals", requireAuth, hasAnyPermission("halal.admin", "halal.renew"), createRenewal);
router.get("/violations", requireAuth, hasAnyPermission("halal.admin", "halal.audit", "halal.committee"), listViolations);
router.post("/violations", requireAuth, hasAnyPermission("halal.admin", "halal.audit"), createViolation);

export default router;
