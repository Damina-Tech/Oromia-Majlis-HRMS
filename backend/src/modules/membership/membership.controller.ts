import { Request, Response } from "express";
import prisma from "../../db/client.js";
import {
  MembershipSubscriptionStatus,
  MembershipPaymentMethod,
  MembershipPaymentStatus,
  MemberCategory,
} from "@prisma/client";
import { z } from "zod";
import { CreateMemberDto, CreateSubscriptionDto, RenewSubscriptionDto, ListMembersQuery, ListSubscriptionsQuery, ListPaymentsQuery, ConfirmManualPaymentDto, UpdateMemberDto, UpdateMyMemberDto } from "./membership.dto.js";
import { paginate } from "../../lib/paginate.js";
import { generateMembershipCertificatePDF } from "./membership-certificate-generator.js";
import path from "path";
import { fileURLToPath } from "url";
import { NotificationService } from "../notifications/notification.service.js";
import { NotificationModule, NotificationType } from "@prisma/client";
import { sendMembershipCertificateReadySms } from "./membership-sms.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getUserId(req: Request): string | null {
  return (req as any).user?.id ?? null;
}

function hasMembershipPermission(req: Request, permission: string): boolean {
  const perms = (req as any).user?.permissions as string[] | undefined;
  return perms?.includes(permission) ?? false;
}

function normalizeBaseUrl(raw: string | undefined, fallback: string): string {
  const candidate = (raw || fallback).trim();
  const withProtocol = /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`;
  try {
    const u = new URL(withProtocol);
    return u.origin;
  } catch {
    return fallback;
  }
}

/** Days from now until date (0 if in the past) */
function daysUntil(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

/**
 * Get rollover days from current active subscription(s) for this member and return
 * subscription ids to expire. Ensures single active plan: all other ACTIVE subs are expired
 * when the new one is activated; their remaining time is rolled over.
 */
async function getRolloverAndExpireOtherActives(
  memberId: string,
  planDurationMonths: number,
  excludeSubscriptionId: string
): Promise<{ rolloverDays: number; newEndDate: Date }> {
  const now = new Date();
  const activeSubs = await prisma.membershipSubscription.findMany({
    where: { memberId, status: MembershipSubscriptionStatus.ACTIVE, id: { not: excludeSubscriptionId } },
    orderBy: { endDate: "desc" },
  });

  let rolloverDays = 0;
  for (const sub of activeSubs) {
    if (sub.endDate) rolloverDays += daysUntil(sub.endDate);
  }

  if (activeSubs.length > 0) {
    await prisma.membershipSubscription.updateMany({
      where: { id: { in: activeSubs.map((s) => s.id) } },
      data: { status: MembershipSubscriptionStatus.EXPIRED },
    });
  }

  const newEndDate = new Date(now);
  newEndDate.setMonth(newEndDate.getMonth() + planDurationMonths);
  newEndDate.setDate(newEndDate.getDate() + rolloverDays);
  return { rolloverDays, newEndDate };
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
    // Multer parses multipart form fields as strings; parse categoryData if it's a JSON string
    const rawBody = req.body as Record<string, unknown>;
    if (typeof rawBody.categoryData === "string") {
      try {
        rawBody.categoryData = rawBody.categoryData.trim()
          ? (JSON.parse(rawBody.categoryData as string) as object)
          : {};
      } catch {
        rawBody.categoryData = {};
      }
    }
    const body = CreateMemberDto.parse(rawBody);
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
    if (q.membershipStatus === "ACTIVE") {
      where.subscriptions = { some: { status: "ACTIVE" } };
    } else if (q.membershipStatus === "PENDING_PAYMENT") {
      where.AND = [
        ...(where.AND ?? []),
        { subscriptions: { some: { status: "PENDING_PAYMENT" } } },
        { subscriptions: { none: { status: "ACTIVE" } } },
      ];
      delete where.subscriptions;
    } else if (q.membershipStatus === "EXPIRED") {
      where.AND = [
        ...(where.AND ?? []),
        { subscriptions: { some: { status: "EXPIRED" } } },
        { subscriptions: { none: { status: "ACTIVE" } } },
        { subscriptions: { none: { status: "PENDING_PAYMENT" } } },
      ];
      delete where.subscriptions;
    } else if (q.membershipStatus === "NONE") {
      where.subscriptions = { none: {} };
    }

    const [items, total] = await Promise.all([
      prisma.member.findMany({
        where,
        include: {
          region: true,
          zone: true,
          woreda: true,
          subscriptions: { include: { plan: true }, orderBy: { createdAt: "desc" } },
        },
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
      include: {
        region: true,
        zone: true,
        woreda: true,
        subscriptions: {
          include: {
            plan: true,
            certificate: true,
            payments: { orderBy: { createdAt: "desc" } },
          },
        },
      },
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
      include: {
        region: true,
        zone: true,
        woreda: true,
        subscriptions: {
          include: {
            plan: true,
            certificate: true,
            payments: { orderBy: { paidAt: "desc" }, take: 10 },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!member) return res.status(404).json({ message: "No member profile linked to your account" });
    res.json(member);
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to get member profile" });
  }
}

// Member: update own profile
export async function updateMyMember(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const member = await prisma.member.findUnique({ where: { userId } });
    if (!member) return res.status(404).json({ message: "No member profile linked to your account" });

    const rawBody = req.body as Record<string, unknown>;
    if (typeof rawBody.categoryData === "string") {
      try {
        rawBody.categoryData = rawBody.categoryData.trim()
          ? (JSON.parse(rawBody.categoryData as string) as object)
          : {};
      } catch {
        rawBody.categoryData = {};
      }
    }
    const body = UpdateMyMemberDto.parse(rawBody);
    const email = body.email && body.email.trim() !== "" ? body.email : undefined;
    const dateOfBirth = body.dateOfBirth && body.dateOfBirth.trim() !== "" ? new Date(body.dateOfBirth) : undefined;

    // If phone changed, ensure no other member has it
    if (body.phone && body.phone !== member.phone) {
      const existing = await prisma.member.findUnique({ where: { phone: body.phone } });
      if (existing) return res.status(400).json({ message: "A member with this phone number already exists" });
    }

    const updated = await prisma.member.update({
      where: { id: member.id },
      data: {
        ...(body.fullName !== undefined && { fullName: body.fullName }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.email !== undefined && { email }),
        ...(dateOfBirth !== undefined && { dateOfBirth }),
        ...(body.gender !== undefined && { gender: body.gender || undefined }),
        ...(body.regionId !== undefined && { regionId: body.regionId || undefined }),
        ...(body.zoneId !== undefined && { zoneId: body.zoneId || undefined }),
        ...(body.woredaId !== undefined && { woredaId: body.woredaId || undefined }),
        ...(body.addressLine !== undefined && { addressLine: body.addressLine || undefined }),
        ...(body.nationalId !== undefined && { nationalId: body.nationalId || undefined }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.categoryData !== undefined && { categoryData: body.categoryData as any }),
        ...((req as any).file?.filename && { profilePhotoUrl: `/uploads/membership/${(req as any).file.filename}` }),
      },
      include: { region: true, zone: true, woreda: true },
    });
    res.json(updated);
  } catch (e: any) {
    if (e.name === "ZodError") {
      return res.status(400).json({ message: e.errors?.[0]?.message ?? "Invalid input" });
    }
    res.status(500).json({ message: e.message || "Failed to update profile" });
  }
}

// Admin: delete member (cascades to subscriptions, payments, certificates) and associated user account
export async function deleteMember(req: Request, res: Response) {
  try {
    if (!hasMembershipPermission(req, "majlis.membership.admin")) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const { id } = req.params;
    const member = await prisma.member.findUnique({ where: { id } });
    if (!member) return res.status(404).json({ message: "Member not found" });
    const userId = member.userId;

    await prisma.$transaction(async (tx) => {
      if (userId) {
        await tx.user.delete({ where: { id: userId } });
      }
      await tx.member.delete({ where: { id } });
    });
    res.status(204).send();
  } catch (e: any) {
    res.status(400).json({ message: e.message || "Failed to delete member" });
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

// Admin: update member full profile (same fields as updateMyMember)
export async function updateMemberProfile(req: Request, res: Response) {
  try {
    if (!hasMembershipPermission(req, "majlis.membership.admin")) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const { id } = req.params;
    const member = await prisma.member.findUnique({ where: { id } });
    if (!member) return res.status(404).json({ message: "Member not found" });

    const rawBody = req.body as Record<string, unknown>;
    if (typeof rawBody.categoryData === "string") {
      try {
        rawBody.categoryData = rawBody.categoryData.trim()
          ? (JSON.parse(rawBody.categoryData as string) as object)
          : {};
      } catch {
        rawBody.categoryData = {};
      }
    }
    const body = UpdateMyMemberDto.parse(rawBody);
    const email = body.email && body.email.trim() !== "" ? body.email : undefined;
    const dateOfBirth = body.dateOfBirth && body.dateOfBirth.trim() !== "" ? new Date(body.dateOfBirth) : undefined;

    if (body.phone && body.phone !== member.phone) {
      const existing = await prisma.member.findUnique({ where: { phone: body.phone } });
      if (existing) return res.status(400).json({ message: "A member with this phone number already exists" });
    }

    const updated = await prisma.member.update({
      where: { id },
      data: {
        ...(body.fullName !== undefined && { fullName: body.fullName }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.email !== undefined && { email }),
        ...(dateOfBirth !== undefined && { dateOfBirth }),
        ...(body.gender !== undefined && { gender: body.gender || undefined }),
        ...(body.regionId !== undefined && { regionId: body.regionId || undefined }),
        ...(body.zoneId !== undefined && { zoneId: body.zoneId || undefined }),
        ...(body.woredaId !== undefined && { woredaId: body.woredaId || undefined }),
        ...(body.addressLine !== undefined && { addressLine: body.addressLine || undefined }),
        ...(body.nationalId !== undefined && { nationalId: body.nationalId || undefined }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.categoryData !== undefined && { categoryData: body.categoryData as any }),
        ...((req as any).file?.filename && { profilePhotoUrl: `/uploads/membership/${(req as any).file.filename}` }),
      },
      include: { region: true, zone: true, woreda: true, subscriptions: { include: { plan: true, certificate: true, payments: true } } },
    });
    res.json(updated);
  } catch (e: any) {
    if (e.name === "ZodError") {
      return res.status(400).json({ message: e.errors?.[0]?.message ?? "Invalid input" });
    }
    res.status(400).json({ message: e.message || "Failed to update profile" });
  }
}

// ---------- Subscriptions ----------
async function nextCertificateId(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `MAJ-${year}-`;
  const all = await prisma.membershipCertificate.findMany({
    where: { certificateId: { startsWith: prefix } },
    select: { certificateId: true },
  });
  let maxNum = 0;
  for (const c of all) {
    const num = parseInt(c.certificateId.replace(prefix, ""), 10);
    if (!Number.isNaN(num) && num > maxNum) maxNum = num;
  }
  const nextNum = maxNum + 1;
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

// Member portal: renew membership (create new subscription for own member)
export async function renewSubscription(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const member = await prisma.member.findUnique({ where: { userId }, include: { region: true } });
    if (!member) return res.status(404).json({ message: "No member profile linked to your account" });

    const body = RenewSubscriptionDto.parse(req.body);
    const plan = await prisma.membershipPlan.findUnique({ where: { id: body.planId } });
    if (!plan || !plan.isActive) return res.status(404).json({ message: "Plan not found or inactive" });

    const now = new Date();
    const startDate = new Date(now);
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + plan.durationMonths);

    const subscription = await prisma.membershipSubscription.create({
      data: {
        memberId: member.id,
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
    res.status(400).json({ message: e.message || "Failed to create renewal subscription" });
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
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Invalid plan amount" });
    }
    const apiBase = normalizeBaseUrl(process.env.APP_BASE_URL, "http://localhost:4000");
    const frontendUrl = normalizeBaseUrl(process.env.FRONTEND_URL, "http://localhost:8080");
    const txRef = `majlis-${id}-${Date.now()}`;
    const names = sub.member.fullName.trim().split(" ");
    const firstName = names[0] || "Member";
    const lastName = names.slice(1).join(" ") || ".";
    const phoneDigits = (sub.member.phone || "").replace(/\D/g, "").slice(-9);
    const phoneNumber = phoneDigits.length >= 9 ? `0${phoneDigits}` : "0911000000";

    const payload = {
      amount: String(Math.round(amount)),
      currency: "ETB",
      email: sub.member.email || `member-${sub.member.phone}@majlis.local`,
      first_name: firstName,
      last_name: lastName,
      phone_number: phoneNumber,
      tx_ref: txRef,
      callback_url: new URL(`/api/v1/membership/subscriptions/${id}/payment/chapa-callback`, apiBase).toString(),
      return_url: new URL(`/register/membership?step=success&subscriptionId=${id}`, frontendUrl).toString(),
      customization: {
        title: "Majlis Member",
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
      const errMsg =
        typeof data.message === "string"
          ? data.message
          : data.message && typeof data.message === "object"
            ? (data.message.customization?.title ?? data.message.message ?? JSON.stringify(data.message))
            : "Failed to initialize Chapa payment. Ensure CHAPA_SECRET_KEY is set and valid.";
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

    const now = new Date();
    const { newEndDate } = await getRolloverAndExpireOtherActives(sub.memberId, sub.plan.durationMonths, id);
    await prisma.membershipSubscription.update({
      where: { id },
      data: {
        status: MembershipSubscriptionStatus.ACTIVE,
        startDate: now,
        endDate: newEndDate,
      },
    });

    const certificateId = await nextCertificateId();
    const photoPath = sub.member.profilePhotoUrl
      ? path.join(process.cwd(), sub.member.profilePhotoUrl.startsWith("/") ? sub.member.profilePhotoUrl.slice(1) : sub.member.profilePhotoUrl)
      : null;

    const { pdfUrl } = await generateMembershipCertificatePDF({
      certificateId,
      fullName: sub.member.fullName,
      category: sub.member.category,
      issuedAt: now,
      expiresAt: newEndDate,
      photoPath,
    });

    await prisma.membershipCertificate.create({
      data: {
        certificateId,
        subscriptionId: id,
        memberId: sub.memberId,
        pdfUrl,
        issuedAt: now,
        expiresAt: newEndDate,
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
    if (sub.member.phone) {
      sendMembershipCertificateReadySms(sub.member.phone).catch(() => {});
    }
    res.status(200).send("OK");
  } catch (e: any) {
    console.error("Membership Chapa callback error:", e);
    res.status(500).send("Error");
  }
}

// ---------- Manual payment (admin or representative verifies and confirms) ----------
export async function confirmManualPayment(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const canConfirm =
      hasMembershipPermission(req, "majlis.membership.admin") ||
      hasMembershipPermission(req, "majlis.membership.register");
    if (!userId || !canConfirm) {
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

    const receiptUrl = (req as any).file?.filename ? `/uploads/membership/${(req as any).file.filename}` : undefined;
    const bankName = typeof (req as any).body?.bankName === "string" ? (req as any).body.bankName.trim() || undefined : undefined;
    const payment = await prisma.membershipPayment.findFirst({
      where: { subscriptionId: id, status: MembershipPaymentStatus.PENDING },
    });
    if (payment) {
      await prisma.membershipPayment.update({
        where: { id: payment.id },
        data: {
          method: MembershipPaymentMethod.MANUAL,
          status: MembershipPaymentStatus.COMPLETED,
          receiptUrl: receiptUrl ?? payment.receiptUrl ?? undefined,
          bankName: bankName ?? payment.bankName ?? undefined,
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
          bankName: bankName ?? undefined,
          paidAt: new Date(),
          processedById: userId,
        },
      });
    }

    const now = new Date();
    const { newEndDate } = await getRolloverAndExpireOtherActives(sub.memberId, sub.plan.durationMonths, id);
    await prisma.membershipSubscription.update({
      where: { id },
      data: {
        status: MembershipSubscriptionStatus.ACTIVE,
        startDate: now,
        endDate: newEndDate,
      },
    });

    const certificateId = await nextCertificateId();
    const photoPath = sub.member.profilePhotoUrl
      ? path.join(process.cwd(), sub.member.profilePhotoUrl.startsWith("/") ? sub.member.profilePhotoUrl.slice(1) : sub.member.profilePhotoUrl)
      : null;
    const { pdfUrl } = await generateMembershipCertificatePDF({
      certificateId,
      fullName: sub.member.fullName,
      category: sub.member.category,
      issuedAt: now,
      expiresAt: newEndDate,
      photoPath,
    });
    await prisma.membershipCertificate.create({
      data: {
        certificateId,
        subscriptionId: id,
        memberId: sub.memberId,
        pdfUrl,
        issuedAt: now,
        expiresAt: newEndDate,
      },
    });

    if (sub.member.phone) {
      sendMembershipCertificateReadySms(sub.member.phone).catch(() => {});
    }

    const updated = await prisma.membershipSubscription.findUnique({
      where: { id },
      include: { member: true, plan: true, certificate: true },
    });
    res.json(updated);
  } catch (e: any) {
    res.status(400).json({ message: e.message || "Failed to confirm payment" });
  }
}

// Public: submit manual payment with receipt (no auth). Leaves payment and subscription
// as PENDING so an admin or majlis representative can verify and confirm via confirmManualPayment.
export async function confirmManualPaymentPublic(req: Request, res: Response) {
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

    const receiptUrl = (req as any).file?.filename ? `/uploads/membership/${(req as any).file.filename}` : undefined;
    const bankName = typeof (req as any).body?.bankName === "string" ? (req as any).body.bankName.trim() || undefined : undefined;
    const payment = await prisma.membershipPayment.findFirst({
      where: { subscriptionId: id, status: MembershipPaymentStatus.PENDING },
    });
    if (payment) {
      await prisma.membershipPayment.update({
        where: { id: payment.id },
        data: {
          method: MembershipPaymentMethod.MANUAL,
          receiptUrl: receiptUrl || undefined,
          bankName: bankName ?? undefined,
          // Keep status PENDING so admin/representative can verify and confirm
        },
      });
    } else {
      await prisma.membershipPayment.create({
        data: {
          subscriptionId: id,
          amount: sub.plan.feeAmount,
          currency: "ETB",
          method: MembershipPaymentMethod.MANUAL,
          status: MembershipPaymentStatus.PENDING,
          receiptUrl: receiptUrl || undefined,
          bankName: bankName ?? undefined,
        },
      });
    }

    // Subscription stays PENDING_PAYMENT until admin/rep verifies and calls confirmManualPayment
    const updated = await prisma.membershipSubscription.findUnique({
      where: { id },
      include: { member: true, plan: true },
    });
    res.json(updated);
  } catch (e: any) {
    res.status(400).json({ message: e.message || "Failed to submit payment" });
  }
}

// Public: complete account (create user + link to member) after payment
export async function completeMembershipAccount(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { password } = (req.body as { password?: string }) || {};
    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const sub = await prisma.membershipSubscription.findUnique({
      where: { id },
      include: { member: true },
    });
    if (!sub) return res.status(404).json({ message: "Subscription not found" });
    // Allow account setup for ACTIVE or PENDING_PAYMENT (manual receipt submitted, awaiting admin verification)
    if (sub.status !== MembershipSubscriptionStatus.ACTIVE && sub.status !== MembershipSubscriptionStatus.PENDING_PAYMENT) {
      return res.status(400).json({ message: "Payment must be completed or submitted first" });
    }
    if (sub.member.userId) {
      return res.status(400).json({ message: "Account already exists. Please sign in." });
    }
    if (!sub.member.email || !sub.member.email.trim()) {
      return res.status(400).json({ message: "Member must have an email to create an account" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: sub.member.email } });
    if (existingUser) {
      await prisma.member.update({
        where: { id: sub.memberId },
        data: { userId: existingUser.id },
      });
      return res.json({ message: "Account linked. Please sign in with your existing email and password." });
    }

    const memberRole = await prisma.role.findUnique({ where: { name: "MEMBER" } });
    if (!memberRole) return res.status(500).json({ message: "Membership role not configured" });

    const names = sub.member.fullName.trim().split(" ");
    const firstName = names[0] || "Member";
    const lastName = names.slice(1).join(" ") || ".";

    const bcrypt = await import("bcrypt");
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: sub.member.email,
        passwordHash,
        firstName,
        lastName,
        status: "ACTIVE",
        userRoles: { create: [{ roleId: memberRole.id }] },
      },
    });

    await prisma.member.update({
      where: { id: sub.memberId },
      data: { userId: user.id },
    });

    res.json({ message: "Account created successfully. Please sign in.", email: sub.member.email });
  } catch (e: any) {
    res.status(400).json({ message: e.message || "Failed to create account" });
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
      include: {
        member: {
          include: {
            region: { select: { name: true } },
            zone: { select: { name: true } },
            woreda: { select: { name: true } },
          },
        },
        subscription: {
          include: {
            plan: true,
            payments: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });
    if (!cert) {
      return res.status(404).json({ valid: false, message: "Certificate not found" });
    }
    const now = new Date();
    const valid = cert.expiresAt >= now;
    const latestPayment = cert.subscription.payments[0] ?? null;
    res.json({
      valid,
      certificateId: cert.certificateId,
      fullName: cert.member.fullName,
      category: cert.member.category,
      issuedAt: cert.issuedAt,
      expiresAt: cert.expiresAt,
      status: valid ? "ACTIVE" : "EXPIRED",
      member: {
        phone: cert.member.phone,
        email: cert.member.email ?? null,
        region: cert.member.region?.name ?? null,
        zone: cert.member.zone?.name ?? null,
        woreda: cert.member.woreda?.name ?? null,
      },
      subscription: {
        id: cert.subscription.id,
        status: cert.subscription.status,
        planName: cert.subscription.plan.name,
        planType: cert.subscription.plan.planType,
      },
      payment: latestPayment
        ? {
            method: latestPayment.method,
            status: latestPayment.status,
            paidAt: latestPayment.paidAt,
          }
        : null,
      verifiedAt: now.toISOString(),
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
const AnalyticsQuery = z.object({
  category: z.nativeEnum(MemberCategory).optional(),
});
function parseAnalyticsQuery(req: Request): { category?: MemberCategory } {
  const parsed = AnalyticsQuery.safeParse(req.query);
  return parsed.success ? parsed.data : {};
}

export async function getAnalytics(req: Request, res: Response) {
  try {
    const { category: categoryFilter } = parseAnalyticsQuery(req);
    const memberWhere = categoryFilter ? { category: categoryFilter } : {};

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOf90Days = new Date(now);
    endOf90Days.setDate(endOf90Days.getDate() + 90);

    const [
      totalMembers,
      activeSubscriptions,
      expiredSubscriptions,
      expiredMembers,
      newRegistrationsToday,
      newRegistrationsMonth,
      paymentsCompleted,
      revenueResult,
      categoryCounts,
      completedPaymentsWithPlan,
      upcomingExpirySubs,
    ] = await Promise.all([
      prisma.member.count({ where: memberWhere }),
      prisma.membershipSubscription.count({ where: { status: MembershipSubscriptionStatus.ACTIVE, member: memberWhere } }),
      prisma.membershipSubscription.count({ where: { status: MembershipSubscriptionStatus.EXPIRED, member: memberWhere } }),
      prisma.member.count({
        where: {
          ...memberWhere,
          AND: [
            { subscriptions: { some: { status: MembershipSubscriptionStatus.EXPIRED } } },
            { subscriptions: { none: { status: MembershipSubscriptionStatus.ACTIVE } } },
          ],
        },
      }),
      prisma.member.count({ where: { ...memberWhere, createdAt: { gte: startOfDay } } }),
      prisma.member.count({ where: { ...memberWhere, createdAt: { gte: startOfMonth } } }),
      prisma.membershipPayment.count({
        where: { status: MembershipPaymentStatus.COMPLETED, subscription: { member: memberWhere } },
      }),
      prisma.membershipPayment.aggregate({
        where: { status: MembershipPaymentStatus.COMPLETED, subscription: { member: memberWhere } },
        _sum: { amount: true },
      }),
      prisma.member.groupBy({
        by: ["category"],
        _count: { id: true },
        where: memberWhere,
      }),
      prisma.membershipPayment.findMany({
        where: { status: MembershipPaymentStatus.COMPLETED, subscription: { member: memberWhere } },
        include: { subscription: { include: { plan: true } } },
      }),
      prisma.membershipSubscription.findMany({
        where: {
          status: MembershipSubscriptionStatus.ACTIVE,
          endDate: { gte: now, lte: endOf90Days },
          member: memberWhere,
        },
        include: { member: true, plan: true },
        orderBy: { endDate: "asc" },
        take: 6,
      }),
    ]);

    const revenue = Number(revenueResult._sum.amount ?? 0);
    const categoryDistribution = categoryCounts.map((c) => ({ category: c.category, count: c._count.id }));

    const revenueByPlanType: Record<string, number> = { MONTHLY: 0, QUARTERLY: 0, YEARLY: 0 };
    for (const p of completedPaymentsWithPlan) {
      const planType = p.subscription?.plan?.planType;
      if (planType) {
        revenueByPlanType[planType] = (revenueByPlanType[planType] ?? 0) + Number(p.amount);
      }
    }

    const upcomingExpiries = upcomingExpirySubs.map((s) => ({
      memberId: s.memberId,
      memberName: s.member.fullName,
      category: s.member.category,
      expiryDate: s.endDate,
      status: s.status,
      planName: s.plan?.name ?? null,
    }));

    res.json({
      totalMembers,
      activeSubscriptions,
      expiredSubscriptions,
      expiredMembers,
      newRegistrationsToday,
      newRegistrationsMonth,
      paymentsCompleted,
      revenue,
      revenueByPlanType,
      categoryDistribution,
      upcomingExpiries,
    });
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to get analytics" });
  }
}
