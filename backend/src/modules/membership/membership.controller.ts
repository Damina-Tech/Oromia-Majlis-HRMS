import { Request, Response } from "express";
import prisma from "../../db/client.js";
import {
  MembershipSubscriptionStatus,
  MembershipPaymentMethod,
  MembershipPaymentStatus,
  MemberCategory,
} from "@prisma/client";
import { CreateMemberDto, CreateSubscriptionDto, ListMembersQuery, ListSubscriptionsQuery, ListPaymentsQuery, ConfirmManualPaymentDto, UpdateMemberDto } from "./membership.dto.js";
import { paginate } from "../../lib/paginate.js";
import { generateMembershipCertificatePDF } from "./membership-certificate-generator.js";
import path from "path";
import { fileURLToPath } from "url";
import { NotificationService } from "../notifications/notification.service.js";
import { NotificationModule, NotificationType } from "@prisma/client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getUserId(req: Request): string | null {
  return (req as any).user?.id ?? null;
}

function hasMembershipPermission(req: Request, permission: string): boolean {
  const perms = (req as any).user?.permissions as string[] | undefined;
  return perms?.includes(permission) ?? false;
}

// ---------- Public: regions for registration form ----------
export async function listRegions(req: Request, res: Response) {
  try {
    const regions = await prisma.region.findMany({
      include: { zones: { include: { woredas: true } } },
      orderBy: { name: "asc" },
    });
    res.json(regions);
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to list regions" });
  }
}

// ---------- Plans ----------
export async function listPlans(req: Request, res: Response) {
  try {
    const activeOnly = req.query.active === "true";
    const where = activeOnly ? { isActive: true } : {};
    const plans = await prisma.membershipPlan.findMany({
      where,
      orderBy: { durationMonths: "asc" },
    });
    res.json(plans);
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to list plans" });
  }
}

// Public: active plans only (for registration page)
export async function listPlansPublic(req: Request, res: Response) {
  try {
    const plans = await prisma.membershipPlan.findMany({
      where: { isActive: true },
      orderBy: { durationMonths: "asc" },
    });
    res.json(plans);
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to list plans" });
  }
}

// ---------- Members ----------
export async function createMember(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const body = CreateMemberDto.parse(req.body);
    const email = body.email && body.email.trim() !== "" ? body.email : undefined;
    const dateOfBirth = body.dateOfBirth && body.dateOfBirth.trim() !== "" ? new Date(body.dateOfBirth) : undefined;

    const existing = await prisma.member.findUnique({ where: { phone: body.phone } });
    if (existing) {
      return res.status(400).json({ message: "A member with this phone number already exists" });
    }

    const member = await prisma.member.create({
      data: {
        fullName: body.fullName,
        phone: body.phone,
        email,
        dateOfBirth,
        gender: body.gender || undefined,
        regionId: body.regionId || undefined,
        zoneId: body.zoneId || undefined,
        woredaId: body.woredaId || undefined,
        addressLine: body.addressLine || undefined,
        profilePhotoUrl: (req as any).file?.filename ? `/uploads/membership/${(req as any).file.filename}` : undefined,
        nationalId: body.nationalId || undefined,
        category: body.category,
        categoryData: body.categoryData as any,
        registeredById: userId || undefined,
      },
      include: { region: true, zone: true, woreda: true },
    });

    await NotificationService.sendNotification({
      module: NotificationModule.MEMBERSHIP,
      type: NotificationType.INFO,
      title: "New membership registration",
      message: `${member.fullName} registered as ${member.category.replace(/_/g, " ")}`,
      resourceType: "Member",
      resourceId: member.id,
      targets: { roleNames: ["ADMIN"] },
    });
    res.status(201).json(member);
  } catch (e: any) {
    res.status(400).json({ message: e.message || "Failed to create member" });
  }
}

export async function listMembers(req: Request, res: Response) {
  try {
    const q = ListMembersQuery.parse(req.query);
    const where: any = {};
    if (q.search) {
      where.OR = [
        { fullName: { contains: q.search, mode: "insensitive" } },
        { phone: { contains: q.search, mode: "insensitive" } },
        { email: { contains: q.search, mode: "insensitive" } },
      ];
    }
    if (q.category) where.category = q.category;

    const [items, total] = await Promise.all([
      prisma.member.findMany({
        where,
        include: { region: true, zone: true, woreda: true },
        ...paginate(q.page, q.limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.member.count({ where }),
    ]);
    res.json({ items, total, page: q.page, limit: q.limit });
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to list members" });
  }
}

export async function getMember(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const member = await prisma.member.findUnique({
      where: { id },
      include: { region: true, zone: true, woreda: true, subscriptions: { include: { plan: true, certificate: true } } },
    });
    if (!member) return res.status(404).json({ message: "Member not found" });
    res.json(member);
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to get member" });
  }
}

// Member portal: get current user's linked member profile
export async function getMyMember(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const member = await prisma.member.findUnique({
      where: { userId },
      include: { region: true, zone: true, woreda: true, subscriptions: { include: { plan: true, certificate: true } } },
    });
    if (!member) return res.status(404).json({ message: "No member profile linked to your account" });
    res.json(member);
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to get member profile" });
  }
}

// Admin: link member to user (set userId)
export async function updateMember(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const body = UpdateMemberDto.parse(req.body);
    const member = await prisma.member.findUnique({ where: { id } });
    if (!member) return res.status(404).json({ message: "Member not found" });
    if (body.userId !== undefined) {
      if (!hasMembershipPermission(req, "majlis.membership.admin")) {
        return res.status(403).json({ message: "Only admin can link member to user" });
      }
      // If linking to a user, ensure that user is not already linked to another member
      if (body.userId) {
        const existing = await prisma.member.findFirst({ where: { userId: body.userId } });
        if (existing && existing.id !== id) {
          return res.status(400).json({ message: "That user is already linked to another member" });
        }
      }
    }
    const updated = await prisma.member.update({
      where: { id },
      data: { userId: body.userId ?? undefined },
      include: { region: true, zone: true, woreda: true, subscriptions: { include: { plan: true, certificate: true } } },
    });
    res.json(updated);
  } catch (e: any) {
    res.status(400).json({ message: e.message || "Failed to update member" });
  }
}

// ---------- Subscriptions ----------
async function nextCertificateId(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `MAJ-${year}-`;
  const last = await prisma.membershipCertificate.findFirst({
    where: { certificateId: { startsWith: prefix } },
    orderBy: { certificateId: "desc" },
  });
  const nextNum = last ? parseInt(last.certificateId.replace(prefix, ""), 10) + 1 : 1;
  return `${prefix}${String(nextNum).padStart(4, "0")}`;
}

export async function createSubscription(req: Request, res: Response) {
  try {
    const body = CreateSubscriptionDto.parse(req.body);
    const member = await prisma.member.findUnique({ where: { id: body.memberId }, include: { region: true } });
    if (!member) return res.status(404).json({ message: "Member not found" });
    const plan = await prisma.membershipPlan.findUnique({ where: { id: body.planId } });
    if (!plan || !plan.isActive) return res.status(404).json({ message: "Plan not found or inactive" });

    const now = new Date();
    const startDate = new Date(now);
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + plan.durationMonths);

    const subscription = await prisma.membershipSubscription.create({
      data: {
        memberId: body.memberId,
        planId: body.planId,
        status: MembershipSubscriptionStatus.PENDING_PAYMENT,
        startDate,
        endDate,
      },
      include: { member: true, plan: true },
    });

    const payment = await prisma.membershipPayment.create({
      data: {
        subscriptionId: subscription.id,
        amount: plan.feeAmount,
        currency: "ETB",
        method: MembershipPaymentMethod.CHAPA,
        status: MembershipPaymentStatus.PENDING,
      },
    });

    res.status(201).json({ subscription, payment });
  } catch (e: any) {
    res.status(400).json({ message: e.message || "Failed to create subscription" });
  }
}

export async function listSubscriptions(req: Request, res: Response) {
  try {
    const q = ListSubscriptionsQuery.parse(req.query);
    const where: any = {};
    if (q.memberId) where.memberId = q.memberId;
    if (q.status) where.status = q.status;

    const [items, total] = await Promise.all([
      prisma.membershipSubscription.findMany({
        where,
        include: { member: true, plan: true, certificate: true },
        ...paginate(q.page, q.limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.membershipSubscription.count({ where }),
    ]);
    res.json({ items, total, page: q.page, limit: q.limit });
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to list subscriptions" });
  }
}

export async function getSubscription(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const sub = await prisma.membershipSubscription.findUnique({
      where: { id },
      include: { member: true, plan: true, certificate: true, payments: true },
    });
    if (!sub) return res.status(404).json({ message: "Subscription not found" });
    res.json(sub);
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to get subscription" });
  }
}

// ---------- Chapa ----------
export async function initChapaPayment(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const sub = await prisma.membershipSubscription.findUnique({
      where: { id },
      include: { member: true, plan: true },
    });
    if (!sub) return res.status(404).json({ message: "Subscription not found" });
    if (sub.status !== MembershipSubscriptionStatus.PENDING_PAYMENT) {
      return res.status(400).json({ message: "Subscription is not pending payment" });
    }
    const pendingPayment = await prisma.membershipPayment.findFirst({
      where: { subscriptionId: id, status: MembershipPaymentStatus.PENDING },
    });
    if (!pendingPayment) return res.status(400).json({ message: "No pending payment for this subscription" });

    const secretKey = process.env.CHAPA_SECRET_KEY;
    if (!secretKey) return res.status(500).json({ message: "Chapa payment is not configured" });

    const amount = Number(sub.plan.feeAmount);
    const apiBase = process.env.APP_BASE_URL || "http://localhost:4000";
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8080";
    const txRef = `majlis-${id}-${Date.now()}`;
    const names = sub.member.fullName.trim().split(" ");
    const firstName = names[0] || "Member";
    const lastName = names.slice(1).join(" ") || ".";

    const payload = {
      amount: String(amount),
      currency: "ETB",
      email: sub.member.email || `member-${sub.member.phone}@majlis.local`,
      first_name: firstName,
      last_name: lastName,
      phone_number: sub.member.phone.replace(/\D/g, "").slice(-9) ? `0${sub.member.phone.replace(/\D/g, "").slice(-9)}` : undefined,
      tx_ref: txRef,
      callback_url: `${apiBase}/api/v1/membership/subscriptions/${id}/payment/chapa-callback`,
      return_url: `${frontendUrl}/register/membership?step=success&subscriptionId=${id}`,
      customization: {
        title: "Majlis Membership",
        description: `${sub.member.fullName} - ${sub.plan.name}`,
      },
    };

    const resp = await fetch("https://api.chapa.co/v1/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = (await resp.json()) as any;
    if (!data.status || data.status !== "success" || !data.data?.checkout_url) {
      const errMsg = typeof data.message === "string" ? data.message : "Failed to initialize Chapa payment";
      return res.status(400).json({ message: errMsg });
    }

    await prisma.membershipSubscription.update({
      where: { id },
      data: { chapaTxRef: txRef },
    });
    res.json({ checkoutUrl: data.data.checkout_url, txRef });
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to initialize payment" });
  }
}

export async function chapaCallback(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { trx_ref, ref_id, status } = req.query as { trx_ref?: string; ref_id?: string; status?: string };
    if (!id || !trx_ref || status !== "success") {
      return res.status(400).send("Invalid callback");
    }
    const sub = await prisma.membershipSubscription.findUnique({
      where: { id },
      include: { member: true, plan: true },
    });
    if (!sub || sub.chapaTxRef !== trx_ref) {
      return res.status(404).send("Subscription not found");
    }
    if (sub.status === MembershipSubscriptionStatus.ACTIVE) {
      return res.status(200).send("OK");
    }
    const secretKey = process.env.CHAPA_SECRET_KEY;
    if (!secretKey) return res.status(500).send("Config error");
    const verifyResp = await fetch(`https://api.chapa.co/v1/transaction/verify/${ref_id}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    const verifyData = (await verifyResp.json()) as any;
    if (verifyData.status !== "success" || verifyData.data?.status !== "success") {
      return res.status(400).send("Verification failed");
    }

    const payment = await prisma.membershipPayment.findFirst({
      where: { subscriptionId: id, status: MembershipPaymentStatus.PENDING },
    });
    if (payment) {
      await prisma.membershipPayment.update({
        where: { id: payment.id },
        data: { status: MembershipPaymentStatus.COMPLETED, chapaRefId: ref_id || null, paidAt: new Date() },
      });
    }
    await prisma.membershipSubscription.update({
      where: { id },
      data: { status: MembershipSubscriptionStatus.ACTIVE },
    });

    const certificateId = await nextCertificateId();
    const photoPath = sub.member.profilePhotoUrl
      ? path.join(process.cwd(), sub.member.profilePhotoUrl.startsWith("/") ? sub.member.profilePhotoUrl.slice(1) : sub.member.profilePhotoUrl)
      : null;

    const { pdfUrl } = await generateMembershipCertificatePDF({
      certificateId,
      fullName: sub.member.fullName,
      category: sub.member.category,
      issuedAt: sub.startDate!,
      expiresAt: sub.endDate!,
      photoPath,
    });

    await prisma.membershipCertificate.create({
      data: {
        certificateId,
        subscriptionId: id,
        memberId: sub.memberId,
        pdfUrl,
        issuedAt: sub.startDate!,
        expiresAt: sub.endDate!,
      },
    });

    if (sub.member.userId) {
      await NotificationService.sendNotification({
        module: NotificationModule.MEMBERSHIP,
        type: NotificationType.SUCCESS,
        title: "Membership payment successful",
        message: "Your certificate is ready. You can download it from your profile.",
        resourceType: "MembershipCertificate",
        resourceId: id,
        targets: { userIds: [sub.member.userId] },
      });
    }
    res.status(200).send("OK");
  } catch (e: any) {
    console.error("Membership Chapa callback error:", e);
    res.status(500).send("Error");
  }
}

// ---------- Manual payment ----------
export async function confirmManualPayment(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    if (!userId || !hasMembershipPermission(req, "majlis.membership.admin")) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const { id } = req.params;
    const sub = await prisma.membershipSubscription.findUnique({
      where: { id },
      include: { member: true, plan: true },
    });
    if (!sub) return res.status(404).json({ message: "Subscription not found" });
    if (sub.status !== MembershipSubscriptionStatus.PENDING_PAYMENT) {
      return res.status(400).json({ message: "Subscription is not pending payment" });
    }

    const receiptUrl = (req as any).file?.path ? `/uploads/membership/${(req as any).file.filename}` : undefined;
    const payment = await prisma.membershipPayment.findFirst({
      where: { subscriptionId: id, status: MembershipPaymentStatus.PENDING },
    });
    if (payment) {
      await prisma.membershipPayment.update({
        where: { id: payment.id },
        data: {
          method: MembershipPaymentMethod.MANUAL,
          status: MembershipPaymentStatus.COMPLETED,
          receiptUrl: receiptUrl || undefined,
          paidAt: new Date(),
          processedById: userId,
        },
      });
    } else {
      await prisma.membershipPayment.create({
        data: {
          subscriptionId: id,
          amount: sub.plan.feeAmount,
          currency: "ETB",
          method: MembershipPaymentMethod.MANUAL,
          status: MembershipPaymentStatus.COMPLETED,
          receiptUrl: receiptUrl || undefined,
          paidAt: new Date(),
          processedById: userId,
        },
      });
    }

    await prisma.membershipSubscription.update({
      where: { id },
      data: { status: MembershipSubscriptionStatus.ACTIVE },
    });

    const certificateId = await nextCertificateId();
    const photoPath = sub.member.profilePhotoUrl
      ? path.join(process.cwd(), sub.member.profilePhotoUrl.startsWith("/") ? sub.member.profilePhotoUrl.slice(1) : sub.member.profilePhotoUrl)
      : null;
    const { pdfUrl } = await generateMembershipCertificatePDF({
      certificateId,
      fullName: sub.member.fullName,
      category: sub.member.category,
      issuedAt: sub.startDate!,
      expiresAt: sub.endDate!,
      photoPath,
    });
    await prisma.membershipCertificate.create({
      data: {
        certificateId,
        subscriptionId: id,
        memberId: sub.memberId,
        pdfUrl,
        issuedAt: sub.startDate!,
        expiresAt: sub.endDate!,
      },
    });

    const updated = await prisma.membershipSubscription.findUnique({
      where: { id },
      include: { member: true, plan: true, certificate: true },
    });
    res.json(updated);
  } catch (e: any) {
    res.status(400).json({ message: e.message || "Failed to confirm payment" });
  }
}

// ---------- Certificates ----------
export async function downloadCertificate(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const cert = await prisma.membershipCertificate.findFirst({
      where: { OR: [{ id }, { certificateId: id }] },
      include: { member: true },
    });
    if (!cert) return res.status(404).json({ message: "Certificate not found" });
    if (!cert.pdfUrl) return res.status(404).json({ message: "PDF not generated yet" });
    const pathModule = await import("path");
    const fs = await import("fs");
    const relPath = cert.pdfUrl.startsWith("/") ? cert.pdfUrl.slice(1) : cert.pdfUrl;
    const fullPath = pathModule.default.join(process.cwd(), relPath);
    if (!fs.existsSync(fullPath)) return res.status(404).json({ message: "PDF file not found" });
    res.download(fullPath, `membership-certificate-${cert.certificateId}.pdf`);
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to download certificate" });
  }
}

// Public download by certificateId (for success page without auth)
export async function downloadCertificatePublic(req: Request, res: Response) {
  try {
    const { certificateId } = req.params;
    const cert = await prisma.membershipCertificate.findUnique({
      where: { certificateId },
    });
    if (!cert) return res.status(404).json({ message: "Certificate not found" });
    if (!cert.pdfUrl) return res.status(404).json({ message: "PDF not generated yet" });
    const pathModule = await import("path");
    const fs = await import("fs");
    const relPath = cert.pdfUrl.startsWith("/") ? cert.pdfUrl.slice(1) : cert.pdfUrl;
    const fullPath = pathModule.default.join(process.cwd(), relPath);
    if (!fs.existsSync(fullPath)) return res.status(404).json({ message: "PDF file not found" });
    res.download(fullPath, `membership-certificate-${cert.certificateId}.pdf`);
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to download certificate" });
  }
}

export async function verifyCertificate(req: Request, res: Response) {
  try {
    const { certificateId } = req.params;
    const cert = await prisma.membershipCertificate.findUnique({
      where: { certificateId },
      include: { member: true, subscription: { include: { plan: true } } },
    });
    if (!cert) {
      return res.status(404).json({ valid: false, message: "Certificate not found" });
    }
    const now = new Date();
    const valid = cert.expiresAt >= now;
    res.json({
      valid,
      certificateId: cert.certificateId,
      fullName: cert.member.fullName,
      category: cert.member.category,
      issuedAt: cert.issuedAt,
      expiresAt: cert.expiresAt,
      status: valid ? "ACTIVE" : "EXPIRED",
    });
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Verification failed" });
  }
}

// ---------- Payments list ----------
export async function listPayments(req: Request, res: Response) {
  try {
    const q = ListPaymentsQuery.parse(req.query);
    const where: any = {};
    if (q.subscriptionId) where.subscriptionId = q.subscriptionId;

    const [items, total] = await Promise.all([
      prisma.membershipPayment.findMany({
        where,
        include: { subscription: { include: { member: true, plan: true } } },
        ...paginate(q.page, q.limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.membershipPayment.count({ where }),
    ]);
    res.json({ items, total, page: q.page, limit: q.limit });
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to list payments" });
  }
}

// ---------- Analytics ----------
export async function getAnalytics(req: Request, res: Response) {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [totalMembers, activeSubscriptions, expiredSubscriptions, newRegistrationsToday, newRegistrationsMonth, paymentsCompleted, revenueResult, categoryCounts] = await Promise.all([
      prisma.member.count(),
      prisma.membershipSubscription.count({ where: { status: MembershipSubscriptionStatus.ACTIVE } }),
      prisma.membershipSubscription.count({ where: { status: MembershipSubscriptionStatus.EXPIRED } }),
      prisma.member.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.member.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.membershipPayment.count({ where: { status: MembershipPaymentStatus.COMPLETED } }),
      prisma.membershipPayment.aggregate({
        where: { status: MembershipPaymentStatus.COMPLETED },
        _sum: { amount: true },
      }),
      prisma.member.groupBy({
        by: ["category"],
        _count: { id: true },
      }),
    ]);

    const revenue = Number(revenueResult._sum.amount ?? 0);
    const categoryDistribution = categoryCounts.map((c) => ({ category: c.category, count: c._count.id }));

    res.json({
      totalMembers,
      activeSubscriptions,
      expiredSubscriptions,
      newRegistrationsToday,
      newRegistrationsMonth,
      paymentsCompleted,
      revenue,
      categoryDistribution,
    });
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to get analytics" });
  }
}
