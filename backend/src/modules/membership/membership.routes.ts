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
  updateMyMember,
  syncMeAsMember,
  syncUserAsMember,
  updateMember,
  updateMemberProfile,
  deleteMember,
  createSubscription,
  renewSubscription,
  listSubscriptions,
  getSubscription,
  initChapaPayment,
  chapaCallback,
  confirmManualPayment,
  confirmManualPaymentPublic,
  completeMembershipAccount,
  downloadCertificate,
  downloadCertificatePublic,
  verifyCertificate,
  listPayments,
  getAnalytics,
  registerMembershipChapaInit,
  registerMembershipChapaCallback,
  completeRegistrationChapa,
  getRegistrationDraftStatus,
  registerMembershipManual,
} from "./membership.controller.js";
import { resolveOromiaGeographyHandler } from "../institutions/institution.controller.js";
import { uploadMembershipFile } from "../../lib/upload.js";

const router = Router();

// Public (no auth)
router.get("/regions", listRegions);
router.post("/geography/resolve", resolveOromiaGeographyHandler);
router.get("/plans/active", listPlansPublic);
router.post("/members", uploadMembershipFile.single("profilePhoto"), createMember);
router.post("/register/chapa-init", uploadMembershipFile.single("profilePhoto"), registerMembershipChapaInit);
router.post(
  "/register/manual",
  uploadMembershipFile.fields([
    { name: "receipt", maxCount: 1 },
    { name: "profilePhoto", maxCount: 1 },
  ]),
  registerMembershipManual
);
router.get("/register/draft/:token/chapa-callback", registerMembershipChapaCallback);
router.post("/register/draft/:token/complete-chapa", completeRegistrationChapa);
router.get("/register/draft/:token/status", getRegistrationDraftStatus);
router.post("/subscriptions", createSubscription);
router.get("/subscriptions/:id/payment/chapa-callback", chapaCallback);
router.post("/subscriptions/:id/payment/chapa-init", initChapaPayment);
router.post("/subscriptions/:id/payment/manual-public", uploadMembershipFile.single("receipt"), confirmManualPaymentPublic);
router.post("/subscriptions/:id/complete-account", completeMembershipAccount);
router.get("/subscriptions/:id", getSubscription); // Public so success page can show status
router.get("/verify/:certificateId", verifyCertificate);
router.get("/certificates/by-id/:certificateId/download", downloadCertificatePublic); // Public download for success page

// Protected: admin / representative
router.get("/plans", requireAuth, hasAnyPermission("majlis.membership.view", "majlis.membership.register", "majlis.membership.admin"), listPlans);
router.get("/members", requireAuth, hasAnyPermission("majlis.membership.view", "majlis.membership.register", "majlis.membership.admin"), listMembers);
router.get("/me", requireAuth, hasAnyPermission("majlis.member", "majlis.membership.view", "majlis.membership.register", "majlis.membership.admin"), getMyMember);
router.patch("/me", requireAuth, hasAnyPermission("majlis.member"), uploadMembershipFile.single("profilePhoto"), updateMyMember);
router.post("/me/sync-as-member", requireAuth, hasAnyPermission("majlis.membership.admin", "majlis.membership.register"), syncMeAsMember);
router.post("/users/:userId/sync-as-member", requireAuth, hasAnyPermission("majlis.membership.admin"), syncUserAsMember);
router.post("/subscriptions/renew", requireAuth, hasAnyPermission("majlis.member"), renewSubscription);
router.get("/members/:id", requireAuth, hasAnyPermission("majlis.membership.view", "majlis.membership.register", "majlis.membership.admin"), getMember);
router.patch("/members/:id", requireAuth, hasAnyPermission("majlis.membership.admin"), updateMember);
router.patch("/members/:id/profile", requireAuth, hasAnyPermission("majlis.membership.admin"), uploadMembershipFile.single("profilePhoto"), updateMemberProfile);
router.delete("/members/:id", requireAuth, hasAnyPermission("majlis.membership.admin"), deleteMember);
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
