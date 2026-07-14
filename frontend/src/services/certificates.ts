import { API_BASE_URL } from "@/config/api";

export type CertificateVerifyType =
  | "HALAL_BUSINESS"
  | "HALAL_PRODUCT"
  | "HALAL_COMPETENCY"
  | "MEMBERSHIP"
  | "INSTITUTION_RECOGNITION";

export type UnifiedCertificateVerifyResult = {
  found: boolean;
  valid: boolean;
  status: "Verified" | "Expired" | "Invalid" | "Not found";
  type: CertificateVerifyType | null;
  typeLabel: string | null;
  certificateCode: string;
  subjectName: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  fields: Array<{ label: string; value: string }>;
  verifiedAt: string;
  message?: string;
};

/** Canonical public verification path used in QR codes across the app. */
export function publicCertificateVerifyPath(certificateCode: string): string {
  const code = String(certificateCode || "").trim();
  return `/verify/${encodeURIComponent(code)}`;
}

export function publicCertificateVerifyUrl(certificateCode: string, origin = typeof window !== "undefined" ? window.location.origin : ""): string {
  const path = publicCertificateVerifyPath(certificateCode);
  return origin ? `${origin.replace(/\/$/, "")}${path}` : path;
}

export async function verifyCertificatePublic(code: string): Promise<UnifiedCertificateVerifyResult> {
  const trimmed = String(code || "").trim();
  const res = await fetch(`${API_BASE_URL}/api/v1/certificates/verify/${encodeURIComponent(trimmed)}`);
  const body = (await res.json().catch(() => ({}))) as UnifiedCertificateVerifyResult;
  if (!res.ok) {
    return {
      found: false,
      valid: false,
      status: "Not found",
      type: null,
      typeLabel: null,
      certificateCode: trimmed,
      subjectName: null,
      issuedAt: null,
      expiresAt: null,
      fields: [],
      verifiedAt: new Date().toISOString(),
      message: body.message || "Certificate not found",
    };
  }
  return body;
}
