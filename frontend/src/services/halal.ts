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
  | "SLAUGHTERHOUSE";

export type HalalApplicationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "REVIEW"
  | "INSPECTION"
  | "APPROVED"
  | "REJECTED";

export type HalalCertificateStatus = "VALID" | "EXPIRED" | "REVOKED" | "SUSPENDED";

export type HalalBusinessStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

export interface HalalBusiness {
  id: string;
  name: string;
  category: HalalBusinessCategory;
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
  brandName?: string;
  yearEstablished?: number;
  businessType?: string;
  tinNumber?: string;
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
  productList?: { name: string; description?: string }[];
  ingredients?: { name: string; source?: string; halalStatus?: string }[];
  supplierInfo?: { name: string; certification?: string }[];
  documents?: { name: string; url: string; type?: string }[];
  submittedAt?: string;
  reviewedById?: string;
  approvedById?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  inspections?: HalalInspection[];
  certificate?: HalalCertificate;
}

export interface HalalInspection {
  id: string;
  applicationId: string;
  application?: HalalApplication;
  inspectorId: string;
  inspector?: { id: string; firstName: string; lastName: string };
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

export interface HalalCertificate {
  id: string;
  certificateId: string;
  applicationId: string;
  application?: HalalApplication;
  pdfUrl?: string;
  qrCode?: string;
  issuedAt: string;
  expiresAt: string;
  status: HalalCertificateStatus;
  revokedAt?: string;
  revokedReason?: string;
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

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export const halalApi = {
  businesses: {
    list: (params?: { page?: number; limit?: number; category?: HalalBusinessCategory; search?: string; regionId?: string; status?: HalalBusinessStatus }) =>
      api.get<PaginatedResponse<HalalBusiness>>("/halal/businesses", { params }).then((r) => r.data),
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
    approve: (id: string, data: { approved: boolean; notes?: string; rejectionReason?: string; meetingMinutesUrl?: string }) =>
      api.post<HalalApplication>(`/halal/applications/${id}/approve`, data).then((r) => r.data),
  },
  inspections: {
    list: (params?: { page?: number; limit?: number; inspectorId?: string; applicationId?: string; completed?: string }) =>
      api.get<PaginatedResponse<HalalInspection>>("/halal/inspections", { params }).then((r) => r.data),
    get: (id: string) => api.get<HalalInspection>(`/halal/inspections/${id}`).then((r) => r.data),
    assign: (data: { applicationId: string; inspectorIds: string[]; scheduledAt?: string }) =>
      api.post<AssignInspectionsResponse>("/halal/inspections", data).then((r) => r.data),
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
    downloadUrl: (id: string) => `${API_URL}/halal/certificates/${id}/download`,
    download: async (id: string, certificateId: string) => {
      const { data } = await api.get(`/halal/certificates/${id}/download`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `halal-certificate-${certificateId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
    /** Load certificate PDF and open in a new tab (no verify page). */
    openInNewTab: async (id: string) => {
      const { data } = await api.get(`/halal/certificates/${id}/download`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
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
