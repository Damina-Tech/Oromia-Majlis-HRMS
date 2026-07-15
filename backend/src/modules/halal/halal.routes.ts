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
  uploadApplicationAgreementOwner,
  uploadApplicationAgreementMajlis,
  confirmPayment,
  initChapaPayment,
  chapaCallback,
  confirmChapaPayment,
  confirmManualPayment,
  approveManualPayment,
  rejectManualPayment,
  listApplicationCompetencyWorkerCandidates,
  listApplicationBusinessCompetencyProgress,
  submitApplicationCompetencyWorkers,
  submitApplicationCompetencyWorkerProposals,
  approveCompetencyWorkerProposal,
  rejectCompetencyWorkerProposal,
  finalizeApplicationCompetencyWorkersFromProposals,
  pauseApplication,
  resumeApplication,
  approveApplication,
  assignInspection,
  listInspections,
  getInspection,
  updateInspection,
  deleteInspection,
  completeInspection,
  submitOwnerInspectionEvidence,
  listCertificates,
  getCertificate,
  getCertificateLifecycle,
  downloadCertificate,
  createRenewal,
  listViolations,
  createViolation,
} from "./halal.controller.js";
import { uploadHalalFile } from "../../lib/upload.js";
import { verifyCertificate } from "./halal.controller.js";
import {
  createProductCertificate,
  listProductCertificates,
  getProductCertificate,
  initProductChapaPayment,
  productChapaCallback,
  confirmProductManualPayment,
  approveProductManualPayment,
  approveProductCertificateDetails,
  downloadProductCertificate,
  verifyProductCertificatePublic,
} from "./halal-product-certificate.controller.js";
import { getHalalReportsOverview, listBusinessesWithActiveHalalCertificate } from "./halal-reports.controller.js";
import {
  createCompetencyCertificate,
  updateCompetencyCertificate,
  submitCompetencyCertificate,
  listCompetencyCertificates,
  getCompetencyCertificate,
  scheduleCompetencyTheoretical,
  recordCompetencyTheoretical,
  scheduleCompetencyTechnical,
  recordCompetencyTechnical,
  initCompetencyChapaPayment,
  competencyChapaCallback,
  confirmCompetencyManualPayment,
  approveCompetencyManualPayment,
  downloadCompetencyCertificate,
  verifyCompetencyCertificatePublic,
  createCompetencyRenewal,
  initCompetencyRenewalChapaPayment,
  competencyRenewalChapaCallback,
  confirmCompetencyRenewalManualPayment,
  approveCompetencyRenewalManualPayment,
} from "./halal-competency.controller.js";

const router = Router();
const HALAL_MODULE_ACCESS = [
  "halal.business",
  "halal.competency",
  "halal.admin",
  "halal.supervisor",
  "halal.inspector",
  "halal.renew",
  "halal.committee",
  "halal.audit",
  "halal.finance",
];

const HALAL_COMPETENCY_ACCESS = [
  "halal.competency",
  "halal.admin",
  "halal.supervisor",
  "halal.committee",
  "halal.review",
  "halal.finance",
  "halal.audit",
];

const HALAL_REPORTS_ACCESS = [
  "halal.admin",
  "halal.supervisor",
  "halal.finance",
  "halal.audit",
  "halal.committee",
  "halal.review",
];

// Public: verify certificate (no auth)
router.get("/verify/:certificateId", verifyCertificate);
router.get("/verify-product/:certificateNumber", verifyProductCertificatePublic);
router.get("/verify-competency/:certificateNumber", verifyCompetencyCertificatePublic);

router.get(
  "/reports/businesses-with-active-certificate",
  requireAuth,
  hasAnyPermission(...HALAL_REPORTS_ACCESS),
  listBusinessesWithActiveHalalCertificate
);
router.get("/reports/overview", requireAuth, hasAnyPermission(...HALAL_REPORTS_ACCESS), getHalalReportsOverview);

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
  hasAnyPermission(
    "halal.business",
    "halal.competency",
    "halal.admin",
    "halal.supervisor",
    "halal.inspector",
    "halal.committee"
  ),
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
router.get(
  "/applications/:id/competency-workers/candidates",
  requireAuth,
  hasAnyPermission(...HALAL_MODULE_ACCESS),
  listApplicationCompetencyWorkerCandidates
);
router.get(
  "/applications/:id/competency-workers/progress",
  requireAuth,
  hasAnyPermission(...HALAL_MODULE_ACCESS),
  listApplicationBusinessCompetencyProgress
);
router.post(
  "/applications/:id/competency-workers",
  requireAuth,
  hasAnyPermission("halal.business"),
  submitApplicationCompetencyWorkers
);
router.post(
  "/applications/:id/competency-workers/proposals",
  requireAuth,
  hasAnyPermission("halal.business"),
  submitApplicationCompetencyWorkerProposals
);
router.post(
  "/applications/:id/competency-workers/proposals/:proposalId/approve",
  requireAuth,
  hasAnyPermission("halal.admin", "halal.supervisor"),
  approveCompetencyWorkerProposal
);
router.post(
  "/applications/:id/competency-workers/proposals/:proposalId/reject",
  requireAuth,
  hasAnyPermission("halal.admin", "halal.supervisor"),
  rejectCompetencyWorkerProposal
);
router.post(
  "/applications/:id/competency-workers/finalize-from-proposals",
  requireAuth,
  hasAnyPermission("halal.business"),
  finalizeApplicationCompetencyWorkersFromProposals
);
router.post("/applications/:id/pause", requireAuth, hasPermission("halal.admin"), pauseApplication);
router.post("/applications/:id/resume", requireAuth, hasPermission("halal.admin"), resumeApplication);
router.get("/applications/:id", requireAuth, hasAnyPermission(...HALAL_MODULE_ACCESS), getApplication);
router.patch("/applications/:id", requireAuth, hasAnyPermission("halal.business", "halal.admin", "halal.supervisor"), updateApplication);
router.delete("/applications/:id", requireAuth, hasAnyPermission("halal.business", "halal.admin", "halal.supervisor"), deleteApplication);
router.post("/applications/:id/submit", requireAuth, hasAnyPermission("halal.business"), submitApplication);
router.post(
  "/applications/:id/agreement/owner",
  requireAuth,
  hasAnyPermission("halal.business"),
  uploadHalalFile.single("document"),
  uploadApplicationAgreementOwner
);
router.post(
  "/applications/:id/agreement/majlis",
  requireAuth,
  hasAnyPermission("halal.admin", "halal.supervisor", "halal.committee"),
  uploadHalalFile.single("document"),
  uploadApplicationAgreementMajlis
);
router.post("/applications/:id/confirm-payment", requireAuth, hasAnyPermission("halal.admin", "halal.finance"), confirmPayment);
router.post("/applications/:id/payment/chapa-init", requireAuth, hasAnyPermission("halal.business", "halal.admin", "halal.supervisor"), initChapaPayment);
router.get("/applications/:id/payment/chapa-callback", chapaCallback); // Public - Chapa calls this
router.post(
  "/applications/:id/payment/chapa-confirm",
  requireAuth,
  hasAnyPermission("halal.business", "halal.admin", "halal.supervisor"),
  confirmChapaPayment
);
router.post(
  "/applications/:id/payment/manual",
  requireAuth,
  hasAnyPermission("halal.business", "halal.admin", "halal.supervisor"),
  uploadHalalFile.single("receipt"),
  confirmManualPayment
);
router.post(
  "/applications/:id/payment/manual/approve",
  requireAuth,
  hasAnyPermission("halal.admin", "halal.finance"),
  approveManualPayment
);
router.post(
  "/applications/:id/payment/manual/reject",
  requireAuth,
  hasAnyPermission("halal.admin", "halal.finance"),
  rejectManualPayment
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
router.patch(
  "/inspections/:id/owner-evidence",
  requireAuth,
  hasAnyPermission("halal.business"),
  submitOwnerInspectionEvidence
);

// Certificates (download before :id to avoid "download" as id)
router.get("/certificates", requireAuth, hasAnyPermission(...HALAL_MODULE_ACCESS), listCertificates);
router.get("/certificates/:id/lifecycle", requireAuth, hasPermission("halal.admin"), getCertificateLifecycle);
router.get("/certificates/:id/download", requireAuth, hasAnyPermission(...HALAL_MODULE_ACCESS), downloadCertificate);
router.get("/certificates/:id", requireAuth, hasAnyPermission(...HALAL_MODULE_ACCESS), getCertificate);

// Product-specific Halal certificates (linked to business certificate; fee 3,500 ETB)
router.get(
  "/product-certificates",
  requireAuth,
  hasAnyPermission(...HALAL_MODULE_ACCESS),
  listProductCertificates
);
router.post("/product-certificates", requireAuth, hasAnyPermission("halal.business"), createProductCertificate);
router.get("/product-certificates/:id/payment/chapa-callback", productChapaCallback);
router.post(
  "/product-certificates/:id/payment/chapa-init",
  requireAuth,
  hasAnyPermission("halal.business", "halal.admin", "halal.supervisor"),
  initProductChapaPayment
);
router.post(
  "/product-certificates/:id/payment/manual",
  requireAuth,
  hasAnyPermission("halal.business", "halal.admin", "halal.supervisor"),
  uploadHalalFile.single("receipt"),
  confirmProductManualPayment
);
router.post(
  "/product-certificates/:id/payment/manual/approve",
  requireAuth,
  hasAnyPermission("halal.admin", "halal.supervisor", "halal.finance"),
  approveProductManualPayment
);
router.post(
  "/product-certificates/:id/details/approve",
  requireAuth,
  hasAnyPermission("halal.admin", "halal.supervisor"),
  approveProductCertificateDetails
);
router.get(
  "/product-certificates/:id/download",
  requireAuth,
  hasAnyPermission(...HALAL_MODULE_ACCESS),
  downloadProductCertificate
);
router.get("/product-certificates/:id", requireAuth, hasAnyPermission(...HALAL_MODULE_ACCESS), getProductCertificate);

// Halal Competency Certificate (individual; fee 1,000 ETB)
router.post("/competency-certificates", requireAuth, hasPermission("halal.competency"), createCompetencyCertificate);
router.get("/competency-certificates", requireAuth, hasAnyPermission(...HALAL_COMPETENCY_ACCESS), listCompetencyCertificates);
router.get("/competency-certificates/:id", requireAuth, hasAnyPermission(...HALAL_COMPETENCY_ACCESS), getCompetencyCertificate);
router.patch("/competency-certificates/:id", requireAuth, hasPermission("halal.competency"), updateCompetencyCertificate);
router.post("/competency-certificates/:id/submit", requireAuth, hasPermission("halal.competency"), submitCompetencyCertificate);
router.post(
  "/competency-certificates/:id/theoretical/schedule",
  requireAuth,
  hasAnyPermission("halal.admin", "halal.supervisor", "halal.committee", "halal.review"),
  scheduleCompetencyTheoretical
);
router.post(
  "/competency-certificates/:id/theoretical/record",
  requireAuth,
  hasAnyPermission("halal.admin", "halal.supervisor", "halal.committee", "halal.review"),
  recordCompetencyTheoretical
);
router.post(
  "/competency-certificates/:id/technical/schedule",
  requireAuth,
  hasAnyPermission("halal.admin", "halal.supervisor", "halal.committee", "halal.review"),
  scheduleCompetencyTechnical
);
router.post(
  "/competency-certificates/:id/technical/record",
  requireAuth,
  hasAnyPermission("halal.admin", "halal.supervisor", "halal.committee", "halal.review"),
  recordCompetencyTechnical
);
router.get("/competency-certificates/:id/payment/chapa-callback", competencyChapaCallback);
router.post(
  "/competency-certificates/:id/payment/chapa-init",
  requireAuth,
  hasAnyPermission("halal.competency", "halal.admin", "halal.supervisor"),
  initCompetencyChapaPayment
);
router.post(
  "/competency-certificates/:id/payment/manual",
  requireAuth,
  hasPermission("halal.competency"),
  uploadHalalFile.single("receipt"),
  confirmCompetencyManualPayment
);
router.post(
  "/competency-certificates/:id/payment/manual/approve",
  requireAuth,
  hasAnyPermission("halal.admin", "halal.supervisor", "halal.finance"),
  approveCompetencyManualPayment
);
router.get(
  "/competency-certificates/:id/download",
  requireAuth,
  hasAnyPermission(...HALAL_COMPETENCY_ACCESS),
  downloadCompetencyCertificate
);
router.post("/competency-certificates/:id/renewals", requireAuth, hasPermission("halal.competency"), createCompetencyRenewal);
router.get("/competency-renewals/:renewalId/payment/chapa-callback", competencyRenewalChapaCallback);
router.post(
  "/competency-renewals/:renewalId/payment/chapa-init",
  requireAuth,
  hasAnyPermission("halal.competency", "halal.admin", "halal.supervisor"),
  initCompetencyRenewalChapaPayment
);
router.post(
  "/competency-renewals/:renewalId/payment/manual",
  requireAuth,
  hasPermission("halal.competency"),
  uploadHalalFile.single("receipt"),
  confirmCompetencyRenewalManualPayment
);
router.post(
  "/competency-renewals/:renewalId/payment/manual/approve",
  requireAuth,
  hasAnyPermission("halal.admin", "halal.supervisor", "halal.finance"),
  approveCompetencyRenewalManualPayment
);

// Renewals & violations (admin)
router.post("/renewals", requireAuth, hasPermission("halal.admin"), createRenewal);
router.get("/violations", requireAuth, hasAnyPermission("halal.admin", "halal.audit", "halal.committee"), listViolations);
router.post("/violations", requireAuth, hasAnyPermission("halal.admin", "halal.audit"), createViolation);

export default router;
