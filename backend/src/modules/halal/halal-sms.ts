/**
 * Halal SMS notifications via Smsethiopia (shared lib).
 */
import { sendSms } from "../../lib/smsethiopia.js";

/** Notify business owner that their business registration was approved */
export async function sendBusinessApprovedSms(contactPhone: string, businessName: string): Promise<void> {
  const text = `Oromia Majlis: Your business "${businessName.slice(0, 30)}" has been approved. You can now apply for Halal certification.`;
  await sendSms(contactPhone, text);
}

/** Notify applicant that their Halal certificate is ready */
export async function sendCertificateReadySms(contactPhone: string, certificateId: string): Promise<void> {
  const text = `Oromia Majlis: Your Halal certificate is ready. Log in to the portal to view and download. Ref: ${certificateId}`;
  await sendSms(contactPhone, text);
}
