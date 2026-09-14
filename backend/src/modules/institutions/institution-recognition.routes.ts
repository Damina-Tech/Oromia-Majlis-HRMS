import { Router } from "express";
import { requireAuth, hasAnyPermission } from "../../middleware/auth.js";
import { uploadMembershipFile } from "../../lib/upload.js";
import {
  verifyRecognitionCertificate,
  chapaCallback,
  createRecognition,
  listRecognitionsForInstitution,
  getRecognition,
  initChapaPayment,
  submitManualPayment,
  approveManualPayment,
  downloadCertificate,
  getActiveMosqueTemplate,
  previewRecognitionCertificate,
  regenerateRecognitionCertificate,
  deleteRecognitionCertificate,
} from "./institution-recognition.controller.js";

const router = Router();

// Public (Chapa redirect / server verify; no JWT)
router.get("/verify/:certificateNumber", verifyRecognitionCertificate);
router.get("/recognitions/:recognitionId/payment/chapa-callback", chapaCallback);

// Active mosque template metadata (owners + staff who can issue recognition)
router.get(
  "/mosque-template/active",
  requireAuth,
  hasAnyPermission("majlis.institutions.write", "majlis.institution.owner", "majlis.institutions.read"),
  getActiveMosqueTemplate
);

// Staff + institution owners (ownership enforced in controller)
router.post(
  "/institutions/:institutionId/recognitions",
  requireAuth,
  hasAnyPermission("majlis.institutions.write", "majlis.institution.owner"),
  createRecognition
);
router.post(
  "/institutions/:institutionId/recognitions/preview",
  requireAuth,
  hasAnyPermission("majlis.institutions.write", "majlis.institution.owner"),
  previewRecognitionCertificate
);
router.get(
  "/institutions/:institutionId/recognitions",
  requireAuth,
  hasAnyPermission("majlis.institutions.read", "majlis.institutions.write", "majlis.institutions.approve", "majlis.institution.owner"),
  listRecognitionsForInstitution
);
router.get(
  "/recognitions/:recognitionId",
  requireAuth,
  hasAnyPermission("majlis.institutions.read", "majlis.institutions.write", "majlis.institutions.approve", "majlis.institution.owner"),
  getRecognition
);
router.post(
  "/recognitions/:recognitionId/payment/chapa-init",
  requireAuth,
  hasAnyPermission("majlis.institutions.write", "majlis.institution.owner"),
  initChapaPayment
);
router.post(
  "/recognitions/:recognitionId/payment/manual",
  requireAuth,
  hasAnyPermission("majlis.institutions.write", "majlis.institution.owner"),
  uploadMembershipFile.single("receipt"),
  submitManualPayment
);
router.post(
  "/recognitions/:recognitionId/payment/manual/approve",
  requireAuth,
  hasAnyPermission("majlis.institutions.approve", "majlis.membership.admin"),
  approveManualPayment
);
router.get(
  "/recognitions/:recognitionId/download",
  requireAuth,
  hasAnyPermission("majlis.institutions.read", "majlis.institutions.write", "majlis.institutions.approve", "majlis.institution.owner"),
  downloadCertificate
);
router.post(
  "/recognitions/:recognitionId/regenerate",
  requireAuth,
  hasAnyPermission("majlis.institutions.write", "majlis.institution.owner"),
  regenerateRecognitionCertificate
);
router.delete(
  "/recognitions/:recognitionId",
  requireAuth,
  hasAnyPermission("majlis.institutions.write", "majlis.institutions.approve", "majlis.membership.admin"),
  deleteRecognitionCertificate
);

export default router;
