/**
 * Send announcement via SMS
 * TODO: Integrate with local SMS gateway (e.g., Ethio Telecom, Twilio, etc.)
 */
export async function sendAnnouncementSMS(
  phone: string,
  title: string,
  announcementId: string
): Promise<string> {
  // Format phone number for Ethiopia (add +251 if needed)
  const formattedPhone = formatEthiopianPhone(phone);

  // TODO: Integrate with SMS provider
  // Example with Twilio:
  // const client = require('twilio')(accountSid, authToken);
  // const message = await client.messages.create({
  //   body: `Announcement: ${title}\nView: ${process.env.FRONTEND_URL}/announcements/${announcementId}`,
  //   from: process.env.SMS_FROM_NUMBER,
  //   to: formattedPhone
  // });
  // return message.sid;

  // For now, just log and return a mock reference
  console.log(`SMS would be sent to ${formattedPhone}: ${title}`);
  return `sms-${Date.now()}`;
}

/**
 * Format Ethiopian phone number
 */
function formatEthiopianPhone(phone: string): string {
  // Remove any non-digit characters
  const cleaned = phone.replace(/\D/g, "");

  // If starts with 0, replace with +251
  if (cleaned.startsWith("0")) {
    return `+251${cleaned.substring(1)}`;
  }

  // If starts with 251, add +
  if (cleaned.startsWith("251")) {
    return `+${cleaned}`;
  }

  // If already has +, return as is
  if (phone.startsWith("+")) {
    return phone;
  }

  // Default: assume local format and add +251
  return `+251${cleaned}`;
}

