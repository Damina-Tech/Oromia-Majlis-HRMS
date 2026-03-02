/**
 * Smsethiopia API (https://smsethiopia.et) – shared SMS sender.
 * Used by Halal and Membership modules for notifications.
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
 * Errors are logged only; does not throw so callers are not blocked.
 */
export async function sendSms(phone: string, text: string): Promise<void> {
  if (!SMS_API_KEY) {
    console.warn("SMS: SMS_ETHIOPIA_API_KEY not set; skipping.");
    return;
  }
  const m = text.slice(0, 160);
  const body = { msisdn: toMsisdn(phone), text: m };
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
      console.error("SMS send failed:", res.status, t);
    }
  } catch (e) {
    console.error("SMS send error:", e);
  }
}
