import nodemailer from "nodemailer";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Email configuration from environment variables
const emailConfig = {
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER || "",
        pass: process.env.EMAIL_PASSWORD || "", // App password for Gmail
    },
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER || "",
    fromName: process.env.EMAIL_FROM_NAME || "Chiro HRMS",
};
// Create transporter
let transporter = null;
function getTransporter() {
    if (!transporter) {
        if (!emailConfig.auth.user || !emailConfig.auth.pass) {
            throw new Error("Email configuration missing. Please set EMAIL_USER and EMAIL_PASSWORD in .env file");
        }
        transporter = nodemailer.createTransport({
            host: emailConfig.host,
            port: emailConfig.port,
            secure: emailConfig.secure,
            auth: emailConfig.auth,
        });
    }
    return transporter;
}
/**
 * Verify email configuration
 */
export async function verifyEmailConfig() {
    try {
        const transport = getTransporter();
        await transport.verify();
        return true;
    }
    catch (error) {
        console.error("Email configuration verification failed:", error);
        return false;
    }
}
/**
 * Send document via email
 */
export async function sendDocumentEmail(to, subject, body, attachmentPath, attachmentName) {
    try {
        const transport = getTransporter();
        const mailOptions = {
            from: `"${emailConfig.fromName}" <${emailConfig.from}>`,
            to,
            subject,
            html: body,
        };
        // Add attachment if provided
        if (attachmentPath && fs.existsSync(attachmentPath)) {
            mailOptions.attachments = [
                {
                    filename: attachmentName || path.basename(attachmentPath),
                    path: attachmentPath,
                },
            ];
        }
        const info = await transport.sendMail(mailOptions);
        console.log("Email sent successfully:", info.messageId);
    }
    catch (error) {
        console.error("Failed to send email:", error);
        throw new Error(`Email sending failed: ${error.message}`);
    }
}
/**
 * Send generated document to employee
 */
export async function sendGeneratedDocument(employeeEmail, employeeName, documentName, templateName, filePath, fileName) {
    const subject = `Your ${templateName} - ${documentName}`;
    const body = `
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
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Chiro HRMS</h1>
        </div>
        <div class="content">
          <p>Dear ${employeeName},</p>
          <p>Please find attached your <strong>${templateName}</strong> document.</p>
          <p>Document: <strong>${documentName}</strong></p>
          <p>This is an automated email from Chiro HRMS. Please keep this document for your records.</p>
          <p>If you have any questions, please contact the HR department.</p>
          <p>Best regards,<br><strong>Chiro HRMS Team</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>${process.env.EMAIL_FROM_NAME || "Chiro HRMS"} | ${process.env.EMAIL_FROM || ""}</p>
        </div>
      </div>
    </body>
    </html>
  `;
    // Resolve full file path
    // Remove leading slash if present and resolve relative to project root
    const cleanPath = filePath.startsWith("/") ? filePath.substring(1) : filePath;
    const fullPath = path.isAbsolute(filePath)
        ? filePath
        : path.join(__dirname, "../../../", cleanPath);
    await sendDocumentEmail(employeeEmail, subject, body, fullPath, fileName);
}
/**
 * Test email configuration
 */
export async function testEmailConnection() {
    try {
        const verified = await verifyEmailConfig();
        if (verified) {
            return {
                success: true,
                message: "Email configuration is valid and connection successful",
            };
        }
        else {
            return {
                success: false,
                message: "Email configuration verification failed",
            };
        }
    }
    catch (error) {
        return {
            success: false,
            message: `Email configuration error: ${error.message}`,
        };
    }
}
//# sourceMappingURL=email-service.js.map