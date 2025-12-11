import { sendDocumentEmail } from "../documents/email-service.js";

/**
 * Send announcement via email
 */
export async function sendAnnouncementEmail(
  to: string,
  title: string,
  body: string,
  announcementId: string
): Promise<string> {
  const subject = `Announcement: ${title}`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        .button { display: inline-block; padding: 10px 20px; background: #1e40af; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Announcement</h1>
        </div>
        <div class="content">
          <h2>${title}</h2>
          <div>${body}</div>
          <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/announcements/${announcementId}" class="button">View Full Announcement</a>
        </div>
        <div class="footer">
          <p>This is an automated message from Chiro HRMS. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendDocumentEmail(to, subject, htmlBody);
  return `email-${Date.now()}`; // Return a reference ID
}

