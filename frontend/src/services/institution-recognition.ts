import api from "./api";
import { API_BASE_URL } from "@/config/api";

const base = "/institution-recognitions";

/** Fixed fee charged by the backend for recognition certificates (ETB). */
export const INSTITUTION_RECOGNITION_FEE_ETB = 10_000;

export type InstitutionRecognitionStatus =
  | "PENDING_PAYMENT"
  | "MANUAL_PENDING_APPROVAL"
  | "COMPLETED"
  | "CANCELLED";

export type InstitutionRecognitionPaymentMethod = "CHAPA" | "MANUAL";

export interface InstitutionRecognition {
  id: string;
  institutionId: string;
  status: InstitutionRecognitionStatus;
  amountEtb: string | number;
  institutionNameOnCert: string;
  zoneCityAdmin: string;
  districtSubcity: string;
  gandaKebele: string;
  issueDate: string;
  questionnaire: {
    applicantRole: string;
    operatingWithCommunityConsent: "yes" | "no";
    informationAccurate: boolean;
  };
  certificateNumber?: string | null;
  pdfUrl?: string | null;
  issuedAt?: string | null;
  paymentMethod?: InstitutionRecognitionPaymentMethod | null;
  chapaTxRef?: string | null;
  paymentReceiptUrl?: string | null;
  bankName?: string | null;
  manualPaymentApprovedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: string; firstName: string; lastName: string };
  manualPaymentApprovedBy?: { id: string; firstName: string; lastName: string } | null;
}

export interface CreateInstitutionRecognitionBody {
  institutionNameOnCert: string;
  zoneCityAdmin: string;
  districtSubcity: string;
  gandaKebele: string;
  issueDate: string;
  questionnaire: {
    applicantRole: string;
    operatingWithCommunityConsent: "yes" | "no";
    informationAccurate: boolean;
  };
}

export type PreviewInstitutionRecognitionBody = Omit<CreateInstitutionRecognitionBody, "questionnaire">;

export const institutionRecognitionApi = {
  list: async (institutionId: string): Promise<{ items: InstitutionRecognition[] }> => {
    const response = await api.get(`${base}/institutions/${institutionId}/recognitions`);
    return response.data;
  },
  create: async (institutionId: string, body: CreateInstitutionRecognitionBody): Promise<InstitutionRecognition> => {
    const response = await api.post(`${base}/institutions/${institutionId}/recognitions`, body);
    return response.data;
  },
  get: async (recognitionId: string): Promise<InstitutionRecognition> => {
    const response = await api.get(`${base}/recognitions/${recognitionId}`);
    return response.data;
  },
  initChapa: async (recognitionId: string): Promise<{ checkoutUrl: string; txRef: string }> => {
    const response = await api.post(`${base}/recognitions/${recognitionId}/payment/chapa-init`);
    return response.data;
  },
  submitManual: async (recognitionId: string, formData: FormData): Promise<InstitutionRecognition> => {
    const response = await api.post(`${base}/recognitions/${recognitionId}/payment/manual`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
  approveManual: async (recognitionId: string): Promise<InstitutionRecognition> => {
    const response = await api.post(`${base}/recognitions/${recognitionId}/payment/manual/approve`);
    return response.data;
  },
  /** Authenticated PDF download (Bearer token). Prefer this over opening a bare URL. */
  downloadBlob: async (recognitionId: string): Promise<Blob> => {
    const response = await api.get(`${base}/recognitions/${recognitionId}/download`, { responseType: "blob" });
    return response.data;
  },
  previewBlob: async (institutionId: string, body: PreviewInstitutionRecognitionBody): Promise<Blob> => {
    const response = await api.post(`${base}/institutions/${institutionId}/recognitions/preview`, body, {
      responseType: "blob",
    });
    return response.data;
  },
  regenerate: async (recognitionId: string): Promise<InstitutionRecognition> => {
    const response = await api.post(`${base}/recognitions/${recognitionId}/regenerate`);
    return response.data;
  },
  downloadUrl: (recognitionId: string): string =>
    `${API_BASE_URL}/api/v1${base}/recognitions/${recognitionId}/download`,
  verifyPublic: async (certificateNumber: string) => {
    const res = await fetch(`${API_BASE_URL}/api/v1${base}/verify/${encodeURIComponent(certificateNumber)}`);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error((body as { message?: string }).message || "Certificate not found");
    }
    return body as {
      valid: boolean;
      certificateNumber: string;
      institution: {
        id: string;
        name: string;
        institutionCode: string;
        type: string;
        status: string;
        region?: string | null;
        zone?: string | null;
        woreda?: string | null;
        kebele?: string | null;
      };
      recognition: {
        institutionNameOnCert: string;
        zoneCityAdmin: string;
        districtSubcity: string;
        gandaKebele: string;
        issueDate: string;
        issuedAt: string | null;
        paymentMethod: string | null;
        amountEtb: string;
      };
      verifiedAt: string;
    };
  },
};
