/**
 * Membership expiry and renewal reminders.
 * Run daily (e.g. via setInterval in server.ts).
 * Sends in-app notifications to members whose certificate expires soon (7 and 30 days).
 */
import prisma from "../../db/client.js";
import { NotificationService } from "../notifications/notification.service.js";
import { NotificationModule, NotificationType } from "@prisma/client";

const REMINDER_DAYS = [30, 7]; // Send reminder when certificate expires in 30 days and 7 days

export async function processMembershipExpiryReminders(): Promise<void> {
  const now = new Date();
  const sent = new Set<string>(); // certificate id + "30" or "7" to avoid duplicate in same run

  for (const days of REMINDER_DAYS) {
    const future = new Date(now);
    future.setDate(future.getDate() + days);
    const startOfDay = new Date(future.getFullYear(), future.getMonth(), future.getDate());
    const endOfDay = new Date(future.getFullYear(), future.getMonth(), future.getDate(), 23, 59, 59, 999);

    const certificates = await prisma.membershipCertificate.findMany({
      where: {
        expiresAt: { gte: startOfDay, lte: endOfDay },
      },
      include: { member: true },
    });

    for (const cert of certificates) {
      if (!cert.member.userId) continue; // Only notify if member has linked account
      const key = `${cert.id}-${days}`;
      if (sent.has(key)) continue;
      sent.add(key);

      await NotificationService.sendNotification({
        module: NotificationModule.MEMBERSHIP,
        type: days <= 7 ? NotificationType.WARNING : NotificationType.INFO,
        title: days <= 7 ? "Membership expiring soon" : "Membership renewal reminder",
        message:
          days <= 7
            ? `Your membership certificate (${cert.certificateId}) expires in ${days} day(s). Please renew to avoid lapse.`
            : `Your membership certificate (${cert.certificateId}) expires in ${days} days. Consider renewing.`,
        resourceType: "MembershipCertificate",
        resourceId: cert.id,
        targets: { userIds: [cert.member.userId] },
      });
    }
  }
}
