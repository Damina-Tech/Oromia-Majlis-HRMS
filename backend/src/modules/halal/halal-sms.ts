/**
 * Send SMS via Smsethiopia (https://smsethiopia.et)
 * Used for: business approval notice, Halal certificate ready notice.
 */
import fetch from "node-fetch";

const SMS_BASE_URL = process.env.SMS_ETHIOPIA_BASE_URL ?? "https://smsethiopia.et/api";
const SMS_API_KEY = process.env.SMS_ETHIOPIA_API_KEY;

/** Format phone for Smsethiopia: country code + number, no + or spaces (e.g. 251911234567) */
function toMsisdn(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("251")) return cleaned;
  if (cleaned.startsWith("0")) return "251" + cleaned.slice(1);
  return "251" + cleaned;
}

/**
 * Send one SMS. Text max 160 chars (standard SMS).
 * Fires and forgets; errors are logged only so approval flow is not blocked.
 */
export async function sendSmsethiopiaSms(msisdn: string, text: string): Promise<void> {
  if (!SMS_API_KEY) {
    console.warn("Halal SMS: SMS_ETHIOPIA_API_KEY not set; skipping SMS.");
    return;
  }
  const m = text.slice(0, 160);
  const body = { msisdn: toMsisdn(msisdn), text: m };
  try {
    const res = await fetch(`${SMS_BASE_URL}/sms/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        KEY: SMS_API_KEY,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const t = await res.text();
      console.error("Halal SMS send failed:", res.status, t);
    }
  } catch (e) {
    console.error("Halal SMS send error:", e);
  }
}

/** Notify business owner that their business registration was approved */
export async function sendBusinessApprovedSms(contactPhone: string, businessName: string): Promise<void> {
  const text = `Oromia Majlis: Your business "${businessName.slice(0, 30)}" has been approved. You can now apply for Halal certification.`;
  await sendSmsethiopiaSms(contactPhone, text);
}

/** Notify applicant that their Halal certificate is ready */
export async function sendCertificateReadySms(contactPhone: string, certificateId: string): Promise<void> {
  const text = `Oromia Majlis: Your Halal certificate is ready. Log in to the portal to view and download. Ref: ${certificateId}`;
  await sendSmsethiopiaSms(contactPhone, text);
}
