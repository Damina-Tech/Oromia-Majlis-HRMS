import api from "./api";
import { API_URL } from "@/config/api";
import type { Region } from "./institutions";

export type HalalBusinessCategory =
  | "FOOD"
  | "DRINKS"
  | "COSMETICS"
  | "MEDICINE"
  | "RESTAURANT"
  | "FACTORY"
  | "SLAUGHTERHOUSE"
  | "OTHER";

export type HalalApplicationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "REVIEW"
  | "PENDING_COMPETENCY_LINK"
  | "INSPECTION"
  | "APPROVED"
  | "REJECTED";

export type HalalCertificateStatus = "VALID" | "EXPIRED" | "REVOKED" | "SUSPENDED";

export type HalalBusinessStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

export interface HalalBusiness {
  id: string;
  name: string;
  category: HalalBusinessCategory;
  /** Free text when category is OTHER */
  categoryOther?: string | null;
  status?: HalalBusinessStatus;
  licenseUrl?: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  userId: string;
  regionId?: string;
  region?: Region & { zones?: { id: string; name: string; woredas?: { id: string; name: string }[] }[] };
  zoneId?: string;
  zone?: { id: string; name: string; woredas?: { id: string; name: string }[] };
  woredaId?: string;
  woreda?: { id: string; name: string };
  kebeleName?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  ownerNationalId?: string;
  ownerGender?: string;
  ownerDateOfBirth?: string;
  ownerHomeAddress?: string;
  ownerRole?: string;
  /** Multiple owners/managers from registration (JSON array) */
  ownersManagers?: Array<{
    fullName: string;
    email: string;
    phone: string;
    nationalId?: string;
    gender?: string;
    dateOfBirth?: string;
    homeAddress?: string;
    role?: string;
  }>;
  businessPhone?: string;
  businessEmail?: string;
  businessWebsite?: string;
  brandName?: string;
  yearEstablished?: number;
  businessType?: string;
  tinNumber?: string;
  /** Registration: facility scale and workforce */
  productionSystem?: {
    totalCompanyAreaSqKm: number;
    productionAreaSqKm: number;
    numProductionLines: number;
    numShifts: number;
    numEmployees: number;
  } | null;
  declarationSignature?: string;
  declarationSignedAt?: string;
  declarationChecklist?: {
    noAlcohol: boolean;
    noProhibited: boolean;
    majlisCompliance: boolean;
    dataAccurate: boolean;
  };
  productList?: { name: string; description?: string }[];
  documents?: { name: string; url: string; type?: string }[];
  approvalProgress?: {
    supervisorApproved: boolean;
    adminApproved: boolean;
    approvedBySupervisor?: { userId: string; name: string; email: string; at: string } | null;
    approvedByAdmin?: { userId: string; name: string; email: string; at: string } | null;
    logs?: Array<{
      id: string;
      role?: "SUPERVISOR" | "ADMIN";
      checklist?: Record<string, boolean>;
      note?: string;
      at: string;
      actor: { id: string; name: string; email: string };
    }>;
  };
  createdAt: string;
  updatedAt: string;
  applications?: HalalApplication[];
  /** Server-computed: business approved, no in-progress application, and no active cert still inside its 3-year cycle */
  canStartNewCertificationApplication?: boolean;
  /** halal.admin only: current valid cert + renewal history + cycle */
  halalCertificateLifecycle?: {
    certificate: HalalCertificate;
    lifecycle: HalalCertificateLifecycle;
  };
}

export interface HalalApplication {
  id: string;
  businessId: string;
  business?: HalalBusiness;
  status: HalalApplicationStatus;
  feeAmount?: number | string;
  feePaidAt?: string | null;
  paymentMethod?: string;
  paymentBankName?: string | null;
  paymentReceiptUrl?: string | null;
  /** Set when finance rejects a manual receipt; cleared when owner re-uploads or pays via Chapa. */
  manualPaymentRejectionReason?: string | null;
  manualPaymentRejectedAt?: string | null;
  /** Rejected receipt file URL (from payment record; not cleared when owner may re-upload). */
  manualPaymentRejectedReceiptUrl?: string | null;
  productList?: { name: string; description?: string }[];
  ingredients?: { name: string; source?: string; halalStatus?: string }[];
  supplierInfo?: { name: string; certification?: string }[];
  documents?: { name: string; url: string; type?: string }[];
  submittedAt?: string;
  reviewedById?: string;
  approvedById?: string;
  approvedAt?: string;
  rejectionReason?: string;
  /** Committee notes when approved (admin-only in API responses for business owners). */
  committeeNotes?: string | null;
  /** Meeting minutes file URL when approving (admin-only in API responses for business owners). */
  meetingMinutesUrl?: string | null;
  /** Blank agreement document URL (stored on application or from server env). */
  agreementTemplateUrl?: string | null;
  /** Resolved template URL for download (API may set from env when application field is empty). */
  agreementTemplateResolvedUrl?: string | null;
  agreementOwnerSignedUrl?: string | null;
  agreementOwnerSubmittedAt?: string | null;
  agreementMajlisSignedUrl?: string | null;
  agreementMajlisApprovedAt?: string | null;
  /** When set, workflow is frozen until an administrator resumes the application. */
  pausedAt?: string | null;
  /** Shown to the business owner while paused. */
  pausedReason?: string | null;
  pausedBy?: { id: string; firstName: string; lastName: string; email?: string } | null;
  createdAt: string;
  updatedAt: string;
  inspections?: HalalInspection[];
  certificate?: HalalCertificate;
  /** Linked issued Halal competency certificates (workers) for this certification application. */
  competencyWorkerLinks?: HalalApplicationCompetencyWorkerLink[];
  /** Owner-submitted worker registrations awaiting admin review (external competency certificates). */
  competencyWorkerProposals?: HalalApplicationCompetencyWorkerProposal[];
  /** Present for halal.admin when a certificate exists */
  certificateLifecycle?: HalalCertificateLifecycle;
}

export type HalalCompetencyWorkerProposalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface HalalApplicationCompetencyWorkerProposal {
  id: string;
  applicationId: string;
  fullName: string;
  dateOfBirth?: string | null;
  phone?: string | null;
  email?: string | null;
  jobTitle?: string | null;
  employerName: string;
  uploadedCertificateUrl: string;
  status: HalalCompetencyWorkerProposalStatus;
  rejectionReason?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: { id: string; firstName: string; lastName: string; email?: string } | null;
  competencyCertificate?: {
    id: string;
    fullName: string;
    certificateNumber?: string | null;
    status: string;
    employerName: string;
    jobTitle?: string | null;
    pdfUrl?: string | null;
    externalCertificateUrl?: string | null;
    businessRegisteredWorker?: boolean;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface HalalApplicationCompetencyWorkerProposalInput {
  fullName: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  jobTitle?: string;
  uploadedCertificateUrl: string;
}

export interface HalalBusinessWorkerCompetencyProgress {
  businessName: string;
  applications: Array<{
    id: string;
    fullName: string;
    status: HalalCompetencyStatus;
    certificateNumber: string | null;
    employerName: string;
    jobTitle?: string | null;
    email?: string | null;
    phone?: string | null;
    updatedAt: string;
    issuedAt?: string | null;
    expiresAt?: string | null;
    businessRegisteredWorker?: boolean;
  }>;
  registrations: Array<{
    id: string;
    fullName: string;
    email?: string | null;
    phone?: string | null;
    jobTitle?: string | null;
    status: HalalCompetencyWorkerProposalStatus;
    rejectionReason?: string | null;
    reviewedAt?: string | null;
    createdAt: string;
    uploadedCertificateUrl: string;
    competencyCertificate?: { id: string; status: string; certificateNumber?: string | null } | null;
  }>;
}

export interface HalalApplicationCompetencyWorkerLink {
  id: string;
  applicationId: string;
  competencyCertificateId: string;
  createdAt: string;
  competencyCertificate: {
    id: string;
    fullName: string;
    certificateNumber: string | null;
    employerName: string;
    jobTitle?: string | null;
    expiresAt?: string | null;
    issuedAt?: string | null;
    pdfUrl?: string | null;
    status: string;
  };
}

/** Issued competency certificate row for linking to a business certification application. */
export interface HalalCompetencyWorkerCandidate {
  id: string;
  fullName: string;
  certificateNumber: string | null;
  employerName: string;
  jobTitle?: string | null;
  expiresAt?: string | null;
  issuedAt?: string | null;
  businessRegisteredWorker?: boolean;
}

/** True once a signed agreement is on file; withdrawal/deletion of the application is blocked (server enforces too). */
export function isHalalApplicationWithdrawLockedByAgreement(
  app: Pick<HalalApplication, "agreementOwnerSubmittedAt" | "agreementMajlisApprovedAt" | "agreementOwnerSignedUrl">
): boolean {
  return !!(
    app.agreementOwnerSubmittedAt ||
    app.agreementMajlisApprovedAt ||
    app.agreementOwnerSignedUrl
  );
}

/**
 * Human-readable workflow status for list UIs — matches the header badge on the Halal application detail page
 * (same rules as raw `status` + agreement milestones).
 */
export function getHalalApplicationStatusBadgeLabel(app: HalalApplication): string {
  if (app.pausedAt) return "Paused";
  const agreementDone = !!app.agreementMajlisApprovedAt;
  switch (app.status) {
    case "PENDING_COMPETENCY_LINK":
      return "Competency workers";
    case "REVIEW":
      return "Payment pending";
    case "INSPECTION":
      return "Committee review";
    case "SUBMITTED":
      if (!agreementDone) {
        return app.agreementOwnerSubmittedAt ? "Agreement (Majlis)" : "Agreement";
      }
      return "Inspection";
    default:
      return app.status;
  }
}

export type HalalInspectionExpertRole = "TECHNICAL_EXPERT" | "SHARIA_EXPERT";

export function getHalalInspectionExpertRoleLabel(role: HalalInspectionExpertRole | string | undefined): string {
  if (role === "SHARIA_EXPERT") return "Sharia expert";
  return "Technical expert";
}

export interface HalalInspection {
  id: string;
  applicationId: string;
  application?: HalalApplication;
  inspectorId: string;
  inspector?: { id: string; firstName: string; lastName: string; email?: string };
  expertRole?: HalalInspectionExpertRole;
  scheduledAt?: string;
  completedAt?: string;
  checklistData?: Record<string, unknown>;
  evidence?: { url: string; type: string }[];
  gpsLat?: number;
  gpsLng?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssignInspectionsResponse {
  items: HalalInspection[];
  assignedCount: number;
  skippedInspectorIds: string[];
}

export interface HalalCertificateLifecycle {
  certificationCycleStartedAt: string;
  cycleEndsAt: string;
  annualRenewalsUsed: number;
  annualRenewalsRemaining: number;
  maxAnnualRenewalsPerCycle: number;
  cycleYears: number;
  withinCycle: boolean;
  fullRecertificationRequired: boolean;
  canRecordAnnualRenewal: boolean;
}

export interface HalalRenewalRecord {
  id: string;
  certificateId: string;
  renewedAt: string;
  previousExpiry: string;
  newExpiry: string;
  status: string;
  renewalKind?: string;
}

export interface HalalCertificate {
  id: string;
  certificateId: string;
  applicationId: string;
  businessId?: string;
  application?: HalalApplication;
  pdfUrl?: string;
  qrCode?: string;
  issuedAt: string;
  expiresAt: string;
  certificationCycleStartedAt?: string;
  annualRenewalCount?: number;
  status: HalalCertificateStatus;
  revokedAt?: string;
  revokedReason?: string;
  renewals?: HalalRenewalRecord[];
  lifecycle?: HalalCertificateLifecycle;
}

export interface HalalViolation {
  id: string;
  certificateId: string;
  certificate?: HalalCertificate;
  description: string;
  severity: string;
  recordedAt: string;
  resolvedAt?: string | null;
  action?: string | null;
}

export type HalalProductCertificateStatus = "PAYMENT_PENDING" | "ISSUED" | "CANCELLED";

export const HALAL_PRODUCT_CERTIFICATE_FEE_ETB = 3500;
export const HALAL_COMPETENCY_FEE_ETB = 1000;

export type HalalCompetencyStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "THEORETICAL_SCHEDULED"
  | "THEORETICAL_PASSED"
  | "THEORETICAL_FAILED"
  | "TECHNICAL_SCHEDULED"
  | "TECHNICAL_PASSED"
  | "TECHNICAL_FAILED"
  | "PAYMENT_PENDING"
  | "ISSUED"
  | "CANCELLED";

export interface HalalCompetencyReligiousAnswers {
  religionConfirmedMuslim: true;
  dailyPrayer: boolean;
  observesRamadanFasting: boolean;
  understandsTasmiyah: boolean;
  familiarHalalVsHaramAnimals: boolean;
  understandsProperSlaughterMethod: boolean;
  knowledgeAnimalAliveHealthy: boolean;
  knowledgeCorrectCuttingTechnique: boolean;
  knowledgeCompleteBloodDrainage: boolean;
}

export interface HalalCompetencyRenewal {
  id: string;
  competencyId: string;
  status: "PAYMENT_PENDING" | "COMPLETED" | "CANCELLED";
  feeAmount: number | string;
  feePaidAt?: string | null;
  paymentMethod?: string | null;
  paymentBankName?: string | null;
  paymentReceiptUrl?: string | null;
  chapaTxRef?: string | null;
  previousExpiry: string;
  newExpiry?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HalalCompetencyCertificate {
  id: string;
  userId: string;
  user?: { id: string; email: string; firstName: string; lastName: string };
  fullName: string;
  dateOfBirth?: string | null;
  phone?: string | null;
  email?: string | null;
  employerName: string;
  jobTitle?: string | null;
  religiousAnswers: HalalCompetencyReligiousAnswers;
  supportLetterUrl?: string | null;
  businessRegisteredWorker?: boolean;
  externalCertificateUrl?: string | null;
  status: HalalCompetencyStatus;
  theoreticalScheduledAt?: string | null;
  theoreticalNotes?: string | null;
  theoreticalPassed?: boolean | null;
  theoreticalRecordedAt?: string | null;
  technicalScheduledAt?: string | null;
  technicalNotes?: string | null;
  technicalPassed?: boolean | null;
  technicalRecordedAt?: string | null;
  feeAmount: number | string;
  feePaidAt?: string | null;
  paymentMethod?: string | null;
  paymentBankName?: string | null;
  paymentReceiptUrl?: string | null;
  chapaTxRef?: string | null;
  certificateNumber?: string | null;
  pdfUrl?: string | null;
  issuedAt?: string | null;
  expiresAt?: string | null;
  renewals?: HalalCompetencyRenewal[];
  createdAt: string;
  updatedAt: string;
  /** Present on GET /competency-certificates/:id */
  renewalEligible?: boolean;
  pendingRenewalId?: string | null;
}

export interface HalalProductCertificate {
  id: string;
  certificateNumber: string | null;
  halalCertificateId: string;
  halalCertificate?: { id: string; certificateId: string; status?: HalalCertificateStatus; expiresAt?: string };
  businessId: string;
  business?: { id: string; name: string; contactName?: string; contactEmail?: string; userId?: string };
  productName: string;
  productAmount: string;
  destination: string;
  notes?: string | null;
  status: HalalProductCertificateStatus;
  feeAmount: number | string;
  feePaidAt?: string | null;
  paymentMethod?: string | null;
  paymentBankName?: string | null;
  paymentReceiptUrl?: string | null;
  chapaTxRef?: string | null;
  pdfUrl?: string | null;
  issuedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export type HalalReportCertificateType =
  | "ALL"
  | "BUSINESS_CERTIFICATION"
  | "PRODUCT_CERTIFICATE"
  | "COMPETENCY";

export interface HalalReportBusinessWithActiveCert {
  id: string;
  name: string;
  halalCertificateNumber: string;
  expiresAt: string;
  issuedAt: string;
}

export interface HalalReportsBusinessDetail {
  businessId: string;
  businessName: string;
  halalBusinessCertificate: {
    id: string;
    certificateId: string;
    issuedAt: string;
    expiresAt: string;
    status: string;
  } | null;
  productCertificates: {
    totalCount: number;
    issuedCount: number;
    paymentPendingCount: number;
    cancelledCount: number;
    paidInPeriodAmount: number;
    paidInPeriodTransactionCount: number;
  };
  businessCertification: {
    certificationFeesPaidInPeriodAmount: number;
    certificationFeesPaidInPeriodCount: number;
  };
  combinedBusinessScopedPaidInPeriod: {
    amount: number;
    transactionCount: number;
  };
}

export interface HalalReportsOverview {
  generatedAt: string;
  filters: {
    dateFrom: string | null;
    dateTo: string | null;
    businessId: string | null;
    certificateType: HalalReportCertificateType;
    individualPaymentsIncluded: boolean;
  };
  businessDetail: HalalReportsBusinessDetail | null;
  activity: {
    businessesRegisteredInPeriod: number;
    applicationsByStatusInPeriod: Record<string, number>;
    inspectionsCompletedInPeriod: number;
    businessCertificatesIssuedInPeriod: number;
    productCertificatesIssuedInPeriod: number;
    competencyCertificatesIssuedInPeriod: number;
    violationsRecordedInPeriod: number;
  };
  snapshot: {
    approvedBusinessesTotal: number;
    productCertificatesAwaitingPayment: number;
    competencyAwaitingPayment: number;
  };
  workflow: {
    applicationsByStatus: Record<string, number>;
    competencyByStatus: Record<string, number>;
  };
  payments: {
    currency: string;
    totalAmount: number;
    transactionCount: number;
    byCertificateType: Array<{ type: string; amount: number; count: number }>;
    byPaymentMethod: Array<{ method: string; amount: number; count: number }>;
    byBusiness: Array<{ businessId: string; businessName: string; amount: number; count: number }>;
    monthlyTrend: Array<{
      month: string;
      BUSINESS_CERTIFICATION: number;
      PRODUCT_CERTIFICATE: number;
      COMPETENCY: number;
    }>;
  };
}

async function throwHalalPdfError(e: unknown, fallback: string): Promise<never> {
  const ax = e as { response?: { data?: unknown }; message?: string };
  if (ax.response?.data instanceof Blob) {
    try {
      const text = await ax.response.data.text();
      const parsed = JSON.parse(text) as { message?: string };
      throw new Error(parsed.message ?? fallback);
    } catch (inner) {
      if (inner instanceof Error && inner.message !== fallback) throw inner;
      throw new Error(fallback);
    }
  }
  const data = ax.response?.data;
  const msg =
    (typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof (data as { message?: string }).message === "string" &&
      (data as { message: string }).message) ||
    (e instanceof Error ? e.message : undefined) ||
    fallback;
  throw new Error(msg);
}

async function fetchHalalCertificatePdfBlob(path: string): Promise<Blob> {
  const { data } = await api.get(path, {
    responseType: "blob",
    params: { disposition: "inline" },
  });
  const isJson = data.type.includes("json") || (data.size < 512 && data.type !== "application/pdf");
  if (isJson) {
    const text = await data.text();
    try {
      const parsed = JSON.parse(text) as { message?: string };
      throw new Error(parsed.message ?? "Could not load certificate PDF");
    } catch (e) {
      if (e instanceof Error && e.message !== "Could not load certificate PDF") throw e;
      throw new Error(text || "Could not load certificate PDF");
    }
  }
  return new Blob([data], { type: "application/pdf" });
}

/** Returns an object URL for in-app PDF preview (caller must revoke when done). */
async function createPdfObjectUrl(blob: Blob): Promise<string> {
  return URL.createObjectURL(blob);
}

export const halalApi = {
  businesses: {
    list: (params?: { page?: number; limit?: number; category?: HalalBusinessCategory; search?: string; regionId?: string; status?: HalalBusinessStatus; employerDirectory?: boolean }) =>
      api.get<PaginatedResponse<HalalBusiness>>("/halal/businesses", { params }).then((r) => r.data),
    /** Approved Halal businesses for competency applicant employer selection. */
    listEmployerDirectory: () =>
      api
        .get<PaginatedResponse<HalalBusiness>>("/halal/businesses", {
          params: { employerDirectory: true, status: "APPROVED", limit: 500, page: 1 },
        })
        .then((r) => r.data),
    get: (id: string) => api.get<HalalBusiness>(`/halal/businesses/${id}`).then((r) => r.data),
    create: (data: Partial<HalalBusiness>) => api.post<HalalBusiness>("/halal/businesses", data).then((r) => r.data),
    update: (id: string, data: Partial<HalalBusiness>) => api.patch<HalalBusiness>(`/halal/businesses/${id}`, data).then((r) => r.data),
    delete: (id: string) => api.delete(`/halal/businesses/${id}`),
    approve: (
      id: string,
      data?: {
        role?: "SUPERVISOR" | "ADMIN";
        checklist?: Record<string, boolean>;
        note?: string;
        detailsConfirmed?: boolean;
      }
    ) => api.post<HalalBusiness>(`/halal/businesses/${id}/approve`, data ?? {}).then((r) => r.data),
    uploadLicense: (id: string, file: File) => {
      const form = new FormData();
      form.append("license", file);
      return api.post<HalalBusiness>(`/halal/businesses/${id}/license`, form, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
    },
    uploadDocument: (file: File) => {
      const form = new FormData();
      form.append("document", file);
      return api.post<{ url: string }>("/halal/documents/upload", form, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
    },
  },
  applications: {
    list: (params?: { page?: number; limit?: number; status?: HalalApplicationStatus; businessId?: string; search?: string }) =>
      api.get<PaginatedResponse<HalalApplication>>("/halal/applications", { params }).then((r) => r.data),
    get: (id: string) => api.get<HalalApplication>(`/halal/applications/${id}`).then((r) => r.data),
    create: (data: { businessId: string; productList?: any; ingredients?: any; supplierInfo?: any; documents?: any }) =>
      api.post<HalalApplication>("/halal/applications", data).then((r) => r.data),
    update: (id: string, data: Partial<HalalApplication>) => api.patch<HalalApplication>(`/halal/applications/${id}`, data).then((r) => r.data),
    delete: (id: string) => api.delete(`/halal/applications/${id}`),
    submit: (id: string) => api.post<HalalApplication>(`/halal/applications/${id}/submit`).then((r) => r.data),
    uploadAgreementOwnerDocument: (id: string, file: File) => {
      const form = new FormData();
      form.append("document", file);
      return api.post<HalalApplication>(`/halal/applications/${id}/agreement/owner`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      }).then((r) => r.data);
    },
    uploadAgreementMajlisDocument: (id: string, file: File) => {
      const form = new FormData();
      form.append("document", file);
      return api.post<HalalApplication>(`/halal/applications/${id}/agreement/majlis`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      }).then((r) => r.data);
    },
    confirmPayment: (id: string) => api.post<HalalApplication>(`/halal/applications/${id}/confirm-payment`).then((r) => r.data),
    initChapaPayment: (id: string) =>
      api.post<{ checkoutUrl: string; txRef: string }>(`/halal/applications/${id}/payment/chapa-init`).then((r) => r.data),
    confirmManualPayment: (id: string, data: { bankName: string; receipt: File }) => {
      const form = new FormData();
      form.append("bankName", data.bankName);
      form.append("receipt", data.receipt);
      return api.post<HalalApplication>(`/halal/applications/${id}/payment/manual`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      }).then((r) => r.data);
    },
    approveManualPayment: (id: string) =>
      api.post<HalalApplication>(`/halal/applications/${id}/payment/manual/approve`).then((r) => r.data),
    rejectManualPayment: (id: string, reason: string) =>
      api.post<HalalApplication>(`/halal/applications/${id}/payment/manual/reject`, { reason }).then((r) => r.data),
    approve: (id: string, data: { approved: boolean; notes?: string; rejectionReason?: string; meetingMinutesUrl?: string }) =>
      api.post<HalalApplication>(`/halal/applications/${id}/approve`, data).then((r) => r.data),
    competencyWorkerCandidates: (id: string) =>
      api.get<{ items: HalalCompetencyWorkerCandidate[] }>(`/halal/applications/${id}/competency-workers/candidates`).then((r) => r.data),
    businessWorkerCompetencyProgress: (id: string) =>
      api.get<HalalBusinessWorkerCompetencyProgress>(`/halal/applications/${id}/competency-workers/progress`).then((r) => r.data),
    submitCompetencyWorkers: (id: string, competencyCertificateIds: string[]) =>
      api.post<HalalApplication>(`/halal/applications/${id}/competency-workers`, { competencyCertificateIds }).then((r) => r.data),
    submitCompetencyWorkerProposals: (id: string, workers: HalalApplicationCompetencyWorkerProposalInput[]) =>
      api
        .post<HalalApplication>(`/halal/applications/${id}/competency-workers/proposals`, { workers })
        .then((r) => r.data),
    approveCompetencyWorkerProposal: (id: string, proposalId: string) =>
      api
        .post<HalalApplication>(`/halal/applications/${id}/competency-workers/proposals/${proposalId}/approve`)
        .then((r) => r.data),
    rejectCompetencyWorkerProposal: (id: string, proposalId: string, reason: string) =>
      api
        .post<HalalApplication>(`/halal/applications/${id}/competency-workers/proposals/${proposalId}/reject`, { reason })
        .then((r) => r.data),
    finalizeCompetencyWorkersFromProposals: (id: string) =>
      api.post<HalalApplication>(`/halal/applications/${id}/competency-workers/finalize-from-proposals`).then((r) => r.data),
    pause: (id: string, reason: string) =>
      api.post<HalalApplication>(`/halal/applications/${id}/pause`, { reason }).then((r) => r.data),
    resume: (id: string) => api.post<HalalApplication>(`/halal/applications/${id}/resume`).then((r) => r.data),
  },
  inspections: {
    list: (params?: { page?: number; limit?: number; inspectorId?: string; applicationId?: string; completed?: string }) =>
      api.get<PaginatedResponse<HalalInspection>>("/halal/inspections", { params }).then((r) => r.data),
    get: (id: string) => api.get<HalalInspection>(`/halal/inspections/${id}`).then((r) => r.data),
    assign: (data: {
      applicationId: string;
      scheduledAt?: string;
      assignments: { inspectorId: string; expertRole: HalalInspectionExpertRole }[];
    }) => api.post<AssignInspectionsResponse>("/halal/inspections", data).then((r) => r.data),
    update: (id: string, data: { inspectorId?: string; scheduledAt?: string | null }) =>
      api.patch<HalalInspection>(`/halal/inspections/${id}`, data).then((r) => r.data),
    delete: (id: string) => api.delete(`/halal/inspections/${id}`),
    complete: (id: string, data: { checklistData?: Record<string, unknown>; evidence?: { url: string; type: string }[]; gpsLat?: number; gpsLng?: number; notes?: string }) =>
      api.patch<HalalInspection>(`/halal/inspections/${id}/complete`, data).then((r) => r.data),
  },
  certificates: {
    list: (params?: { page?: number; limit?: number; status?: string }) =>
      api.get<PaginatedResponse<HalalCertificate>>("/halal/certificates", { params }).then((r) => r.data),
    get: (id: string) => api.get<HalalCertificate>(`/halal/certificates/${id}`).then((r) => r.data),
    getLifecycle: (id: string) =>
      api
        .get<{
          certificate: HalalCertificate;
          lifecycle: HalalCertificateLifecycle;
          rules: { oneCertificatePerBusiness: boolean; cycleYears: number; maxAnnualRenewalsPerCycle: number };
        }>(`/halal/certificates/${id}/lifecycle`)
        .then((r) => r.data),
    downloadUrl: (id: string) => `${API_URL}/halal/certificates/${id}/download`,
    /** Fetch PDF (document template when active, else stored file). */
    fetchPdfBlob: async (id: string) => {
      try {
        return await fetchHalalCertificatePdfBlob(`/halal/certificates/${id}/download`);
      } catch (e: unknown) {
        await throwHalalPdfError(e, "Could not load certificate");
      }
    },
    loadPdfPreviewUrl: async (id: string) => {
      const blob = await halalApi.certificates.fetchPdfBlob(id);
      return createPdfObjectUrl(blob);
    },
    download: async (id: string, certificateId: string) => {
      try {
        const { data } = await api.get(`/halal/certificates/${id}/download`, {
          responseType: "blob",
          params: { disposition: "attachment" },
        });
        const blob = new Blob([data], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `halal-certificate-${certificateId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      } catch (e: unknown) {
        await throwHalalPdfError(e, "Could not download certificate");
      }
    },
  },
  inspectors: {
    list: () => api.get<{ id: string; firstName: string; lastName: string; email: string }[]>("/halal/inspectors").then((r) => r.data),
  },
  renewals: {
    create: (data: { certificateId: string; newExpiry: string }) => api.post("/halal/renewals", data).then((r) => r.data),
  },
  violations: {
    list: (params?: { page?: number; limit?: number; certificateId?: string }) =>
      api.get<PaginatedResponse<HalalViolation>>("/halal/violations", { params }).then((r) => r.data),
    create: (data: { certificateId: string; description: string; severity: string; action?: string }) =>
      api.post("/halal/violations", data).then((r) => r.data),
  },
  reports: {
    businessesWithActiveCertificate: () =>
      api.get<{ items: HalalReportBusinessWithActiveCert[] }>("/halal/reports/businesses-with-active-certificate").then((r) => r.data),
    overview: (params?: {
      dateFrom?: string;
      dateTo?: string;
      businessId?: string;
      certificateType?: HalalReportCertificateType;
    }) => api.get<HalalReportsOverview>("/halal/reports/overview", { params }).then((r) => r.data),
  },
  productCertificates: {
    list: (params?: { page?: number; limit?: number; businessId?: string }) =>
      api.get<PaginatedResponse<HalalProductCertificate>>("/halal/product-certificates", { params }).then((r) => r.data),
    get: (id: string) => api.get<HalalProductCertificate>(`/halal/product-certificates/${id}`).then((r) => r.data),
    create: (data: {
      halalCertificateId: string;
      productName: string;
      productAmount: string;
      destination: string;
      notes?: string;
    }) => api.post<HalalProductCertificate>("/halal/product-certificates", data).then((r) => r.data),
    initChapaPayment: (id: string) =>
      api.post<{ checkoutUrl: string; txRef: string }>(`/halal/product-certificates/${id}/payment/chapa-init`).then((r) => r.data),
    confirmManualPayment: (id: string, data: { bankName: string; receipt: File }) => {
      const form = new FormData();
      form.append("bankName", data.bankName);
      form.append("receipt", data.receipt);
      return api.post<HalalProductCertificate>(`/halal/product-certificates/${id}/payment/manual`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      }).then((r) => r.data);
    },
    approveManualPayment: (id: string) =>
      api.post<HalalProductCertificate>(`/halal/product-certificates/${id}/payment/manual/approve`).then((r) => r.data),
    fetchPdfBlob: async (id: string) => {
      try {
        return await fetchHalalCertificatePdfBlob(`/halal/product-certificates/${id}/download`);
      } catch (e: unknown) {
        await throwHalalPdfError(e, "Could not load certificate");
      }
    },
    loadPdfPreviewUrl: async (id: string) => {
      const blob = await halalApi.productCertificates.fetchPdfBlob(id);
      return createPdfObjectUrl(blob);
    },
    download: async (id: string, certificateNumber: string) => {
      try {
        const { data } = await api.get(`/halal/product-certificates/${id}/download`, {
          responseType: "blob",
          params: { disposition: "attachment" },
        });
        const url = URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `halal-product-${certificateNumber}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      } catch (e: unknown) {
        await throwHalalPdfError(e, "Could not download certificate");
      }
    },
  },
  competencyCertificates: {
    list: (params?: { page?: number; limit?: number; status?: HalalCompetencyStatus }) =>
      api.get<PaginatedResponse<HalalCompetencyCertificate>>("/halal/competency-certificates", { params }).then((r) => r.data),
    get: (id: string) => api.get<HalalCompetencyCertificate>(`/halal/competency-certificates/${id}`).then((r) => r.data),
    create: (data: {
      fullName: string;
      dateOfBirth: string;
      phone: string;
      email: string;
      employerName: string;
      jobTitle?: string;
      religiousAnswers: HalalCompetencyReligiousAnswers;
      supportLetterUrl?: string;
    }) => api.post<HalalCompetencyCertificate>("/halal/competency-certificates", data).then((r) => r.data),
    update: (
      id: string,
      data: Partial<{
        fullName: string;
        dateOfBirth: string;
        phone: string;
        email: string;
        employerName: string;
        jobTitle: string;
        religiousAnswers: HalalCompetencyReligiousAnswers;
        supportLetterUrl: string;
      }>
    ) => api.patch<HalalCompetencyCertificate>(`/halal/competency-certificates/${id}`, data).then((r) => r.data),
    submit: (id: string) => api.post<HalalCompetencyCertificate>(`/halal/competency-certificates/${id}/submit`).then((r) => r.data),
    scheduleTheoretical: (id: string, scheduledAt: string) =>
      api.post<HalalCompetencyCertificate>(`/halal/competency-certificates/${id}/theoretical/schedule`, { scheduledAt }).then((r) => r.data),
    recordTheoretical: (id: string, body: { passed: boolean; notes?: string }) =>
      api.post<HalalCompetencyCertificate>(`/halal/competency-certificates/${id}/theoretical/record`, body).then((r) => r.data),
    scheduleTechnical: (id: string, scheduledAt: string) =>
      api.post<HalalCompetencyCertificate>(`/halal/competency-certificates/${id}/technical/schedule`, { scheduledAt }).then((r) => r.data),
    recordTechnical: (id: string, body: { passed: boolean; notes?: string }) =>
      api.post<HalalCompetencyCertificate>(`/halal/competency-certificates/${id}/technical/record`, body).then((r) => r.data),
    initChapaPayment: (id: string) =>
      api.post<{ checkoutUrl: string; txRef: string }>(`/halal/competency-certificates/${id}/payment/chapa-init`).then((r) => r.data),
    confirmManualPayment: (id: string, data: { bankName: string; receipt: File }) => {
      const form = new FormData();
      form.append("bankName", data.bankName);
      form.append("receipt", data.receipt);
      return api.post<HalalCompetencyCertificate>(`/halal/competency-certificates/${id}/payment/manual`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      }).then((r) => r.data);
    },
    approveManualPayment: (id: string) =>
      api.post<HalalCompetencyCertificate>(`/halal/competency-certificates/${id}/payment/manual/approve`).then((r) => r.data),
    download: async (id: string, certificateNumber: string) => {
      const { data } = await api.get(`/halal/competency-certificates/${id}/download`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `halal-competency-${certificateNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
    openPdfInNewTab: async (id: string) => {
      const { data } = await api.get(`/halal/competency-certificates/${id}/download`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    },
    createRenewal: (id: string) => api.post<HalalCompetencyRenewal>(`/halal/competency-certificates/${id}/renewals`).then((r) => r.data),
    initRenewalChapaPayment: (renewalId: string) =>
      api
        .post<{ checkoutUrl: string; txRef: string }>(`/halal/competency-renewals/${renewalId}/payment/chapa-init`)
        .then((r) => r.data),
    confirmRenewalManualPayment: (renewalId: string, data: { bankName: string; receipt: File }) => {
      const form = new FormData();
      form.append("bankName", data.bankName);
      form.append("receipt", data.receipt);
      return api.post<HalalCompetencyRenewal>(`/halal/competency-renewals/${renewalId}/payment/manual`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      }).then((r) => r.data);
    },
    approveRenewalManualPayment: (renewalId: string) =>
      api.post<HalalCompetencyRenewal>(`/halal/competency-renewals/${renewalId}/payment/manual/approve`).then((r) => r.data),
  },
};

// Public verification (no auth required)
export async function verifyHalalCertificate(certificateId: string): Promise<{
  valid: boolean;
  status: string;
  expiresAt: string;
  businessName: string;
  certificateId: string;
}> {
  const { data } = await api.get(`/halal/verify/${certificateId}`);
  return data;
}

export async function verifyHalalProductCertificate(certificateNumber: string): Promise<{
  valid: boolean;
  message?: string;
  certificateNumber?: string;
  businessName?: string;
  productName?: string;
  productAmount?: string;
  destination?: string;
  issuedAt?: string;
  parentCertificateId?: string;
  parentCertificateValid?: boolean;
}> {
  const { data } = await api.get(`/halal/verify-product/${encodeURIComponent(certificateNumber)}`);
  return data;
}

export async function verifyHalalCompetencyCertificate(certificateNumber: string): Promise<{
  valid: boolean;
  message?: string;
  certificateNumber?: string;
  holderName?: string;
  employerName?: string;
  jobTitle?: string | null;
  issuedAt?: string;
  expiresAt?: string;
  currentlyValid?: boolean;
}> {
  const { data } = await api.get(`/halal/verify-competency/${encodeURIComponent(certificateNumber)}`);
  return data;
}
