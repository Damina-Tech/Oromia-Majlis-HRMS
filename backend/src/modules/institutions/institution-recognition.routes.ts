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
  previewRecognitionCertificate,
  regenerateRecognitionCertificate,
} from "./institution-recognition.controller.js";

const router = Router();

// Public (Chapa redirect / server verify; no JWT)
router.get("/verify/:certificateNumber", verifyRecognitionCertificate);
router.get("/recognitions/:recognitionId/payment/chapa-callback", chapaCallback);

// Staff
router.post(
  "/institutions/:institutionId/recognitions",
  requireAuth,
  hasAnyPermission("majlis.institutions.write"),
  createRecognition
);
router.post(
  "/institutions/:institutionId/recognitions/preview",
  requireAuth,
  hasAnyPermission("majlis.institutions.write"),
  previewRecognitionCertificate
);
router.get(
  "/institutions/:institutionId/recognitions",
  requireAuth,
  hasAnyPermission("majlis.institutions.read", "majlis.institutions.write", "majlis.institutions.approve"),
  listRecognitionsForInstitution
);
router.get(
  "/recognitions/:recognitionId",
  requireAuth,
  hasAnyPermission("majlis.institutions.read", "majlis.institutions.write", "majlis.institutions.approve"),
  getRecognition
);
router.post(
  "/recognitions/:recognitionId/payment/chapa-init",
  requireAuth,
  hasAnyPermission("majlis.institutions.write"),
  initChapaPayment
);
router.post(
  "/recognitions/:recognitionId/payment/manual",
  requireAuth,
  hasAnyPermission("majlis.institutions.write"),
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
  hasAnyPermission("majlis.institutions.read", "majlis.institutions.write", "majlis.institutions.approve"),
  downloadCertificate
);
router.post(
  "/recognitions/:recognitionId/regenerate",
  requireAuth,
  hasAnyPermission("majlis.institutions.write"),
  regenerateRecognitionCertificate
);

export default router;
