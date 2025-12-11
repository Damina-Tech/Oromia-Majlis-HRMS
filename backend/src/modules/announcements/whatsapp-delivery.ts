/**
 * Send announcement via WhatsApp
 * TODO: Integrate with WhatsApp Business API (e.g., 360dialog, Twilio, etc.)
 */
export async function sendAnnouncementWhatsApp(
  phone: string,
  title: string,
  body: string,
  announcementId: string
): Promise<string> {
  // Format phone number for Ethiopia
  const formattedPhone = formatEthiopianPhone(phone);

  // TODO: Integrate with WhatsApp Business API
  // Example with 360dialog:
  // const axios = require('axios');
  // const response = await axios.post(
  //   `https://waba.360dialog.io/v1/messages`,
  //   {
  //     to: formattedPhone,
  //     type: 'text',
  //     text: {
  //       body: `*${title}*\n\n${body}\n\nView: ${process.env.FRONTEND_URL}/announcements/${announcementId}`
  //     }
  //   },
  //   {
  //     headers: {
  //       'D360-API-KEY': process.env.WHATSAPP_API_KEY
  //     }
  //   }
  // );
  // return response.data.messages[0].id;

  // For now, just log and return a mock reference
  console.log(`WhatsApp would be sent to ${formattedPhone}: ${title}`);
  return `whatsapp-${Date.now()}`;
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

