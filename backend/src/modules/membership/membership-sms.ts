/**
 * Membership SMS notifications via Smsethiopia (shared lib).
 * Sent when payment is approved and the membership certificate is ready.
 */
import { sendSms } from "../../lib/smsethiopia.js";

/** Notify member that their registration is complete and certificate is ready */
export async function sendMembershipCertificateReadySms(phone: string): Promise<void> {
  const text =
    "Oromia Majlis: Thank you for becoming an OM member. Your membership certificate is ready. Log in to the system to get your certificate.";
  await sendSms(phone, text);
}
