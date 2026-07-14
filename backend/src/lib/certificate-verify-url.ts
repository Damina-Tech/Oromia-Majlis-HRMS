/**
 * Canonical public certificate verification URL used in all QR codes / PDFs.
 * Format: {FRONTEND_URL}/verify/{certificateCode}
 */
function frontendOrigin(): string {
  const fallback = "http://localhost:8080";
  const candidate = (process.env.FRONTEND_URL || fallback).trim();
  const withProtocol = /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`;
  try {
    return new URL(withProtocol).origin;
  } catch {
    return fallback;
  }
}

export function publicCertificateVerifyUrl(certificateCode: string): string {
  const code = String(certificateCode || "").trim();
  return `${frontendOrigin()}/verify/${encodeURIComponent(code)}`;
}
