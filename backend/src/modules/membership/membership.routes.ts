import { Router } from "express";
import { requireAuth, hasAnyPermission } from "../../middleware/auth.js";
import {
  listRegions,
  listPlans,
  listPlansPublic,
  createMember,
  listMembers,
  getMember,
  getMyMember,
  updateMember,
  createSubscription,
  listSubscriptions,
  getSubscription,
  initChapaPayment,
  chapaCallback,
  confirmManualPayment,
  downloadCertificate,
  downloadCertificatePublic,
  verifyCertificate,
  listPayments,
  getAnalytics,
} from "./membership.controller.js";
import { uploadMembershipFile } from "../../lib/upload.js";

const router = Router();

// Public (no auth)
router.get("/regions", listRegions);
router.get("/plans/active", listPlansPublic);
router.post("/members", uploadMembershipFile.single("profilePhoto"), createMember);
router.post("/subscriptions", createSubscription);
router.get("/subscriptions/:id/payment/chapa-callback", chapaCallback);
router.post("/subscriptions/:id/payment/chapa-init", initChapaPayment);
router.get("/subscriptions/:id", getSubscription); // Public so success page can show status
router.get("/verify/:certificateId", verifyCertificate);
router.get("/certificates/by-id/:certificateId/download", downloadCertificatePublic); // Public download for success page

// Protected: admin / representative
router.get("/plans", requireAuth, hasAnyPermission("majlis.membership.view", "majlis.membership.register", "majlis.membership.admin"), listPlans);
router.get("/members", requireAuth, hasAnyPermission("majlis.membership.view", "majlis.membership.register", "majlis.membership.admin"), listMembers);
router.get("/me", requireAuth, hasAnyPermission("majlis.member"), getMyMember);
router.get("/members/:id", requireAuth, hasAnyPermission("majlis.membership.view", "majlis.membership.register", "majlis.membership.admin"), getMember);
router.patch("/members/:id", requireAuth, hasAnyPermission("majlis.membership.admin"), updateMember);
router.get("/subscriptions", requireAuth, hasAnyPermission("majlis.membership.view", "majlis.membership.register", "majlis.membership.admin"), listSubscriptions);
router.post(
  "/subscriptions/:id/payment/manual",
  requireAuth,
  hasAnyPermission("majlis.membership.admin", "majlis.membership.register"),
  uploadMembershipFile.single("receipt"),
  confirmManualPayment
);
router.get("/certificates/:id/download", requireAuth, downloadCertificate);
router.get("/payments", requireAuth, hasAnyPermission("majlis.membership.view", "majlis.membership.admin"), listPayments);
router.get("/analytics", requireAuth, hasAnyPermission("majlis.membership.view", "majlis.membership.admin"), getAnalytics);

export default router;
