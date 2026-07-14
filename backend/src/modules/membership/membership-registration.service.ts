import prisma from "../../db/client.js";
import {
  MembershipRegistrationDraftStatus,
  MembershipPaymentMethod,
  MembershipPaymentStatus,
  MembershipSubscriptionStatus,
  MemberCategory,
} from "@prisma/client";
import { RegisterMembershipDto } from "./membership.dto.js";
import { generateMembershipCertificatePDF } from "./membership-certificate-generator.js";
import { NotificationService } from "../notifications/notification.service.js";
import { NotificationModule, NotificationType } from "@prisma/client";
import { sendMembershipCertificateReadySms } from "./membership-sms.js";
import { resolvePlanFeeAmount } from "./membership-plans.constants.js";
import path from "path";

export type ParsedRegistration = {
  fullName: string;
  phone: string;
  email?: string;
  dateOfBirth?: Date;
  gender?: string;
  regionId?: string;
  zoneId?: string;
  woredaId?: string;
  addressLine?: string;
  nationalId?: string;
  category: MemberCategory;
  categoryData?: Record<string, unknown>;
  planId: string;
  password: string;
  feeAmount?: number;
  profilePhotoUrl?: string;
};

export function resolveRegistrationFeeAmount(
  planType: import("@prisma/client").MembershipPlanType,
  feeAmount?: number
): number {
  return resolvePlanFeeAmount(planType, feeAmount);
}

export function parseRegistrationMultipart(req: {
  body: Record<string, unknown>;
  file?: { filename?: string };
  files?: Record<string, Array<{ filename?: string }>>;
}): ParsedRegistration {
  const rawBody = { ...req.body };
  if (typeof rawBody.categoryData === "string") {
    try {
      rawBody.categoryData = rawBody.categoryData.trim()
        ? (JSON.parse(rawBody.categoryData as string) as object)
        : {};
    } catch {
      rawBody.categoryData = {};
    }
  }
  const body = RegisterMembershipDto.parse(rawBody);
  const email = body.email && body.email.trim() !== "" ? body.email.trim() : undefined;
  const dateOfBirth = body.dateOfBirth && body.dateOfBirth.trim() !== "" ? new Date(body.dateOfBirth) : undefined;
  const profileFile = req.file ?? req.files?.profilePhoto?.[0];
  const profilePhotoUrl = profileFile?.filename ? `/uploads/membership/${profileFile.filename}` : undefined;

  return {
    fullName: body.fullName,
    phone: body.phone,
    email,
    dateOfBirth,
    gender: body.gender || undefined,
    regionId: body.regionId || undefined,
    zoneId: body.zoneId || undefined,
    woredaId: body.woredaId || undefined,
    addressLine: body.addressLine || undefined,
    nationalId: body.nationalId || undefined,
    category: body.category,
    categoryData: (body.categoryData as Record<string, unknown> | undefined) ?? undefined,
    planId: body.planId,
    password: body.password,
    feeAmount: body.feeAmount,
    profilePhotoUrl,
  };
}

export async function assertRegistrationAvailable(data: Pick<ParsedRegistration, "phone" | "email">) {
  const existingMember = await prisma.member.findUnique({ where: { phone: data.phone } });
  if (existingMember) {
    throw new Error("A member with this phone number already exists");
  }
  if (!data.email) {
    throw new Error("Email is required to create your login account");
  }
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) {
    throw new Error("An account with this email already exists. Please sign in.");
  }
}

export async function hashRegistrationPassword(password: string): Promise<string> {
  const bcrypt = await import("bcrypt");
  return bcrypt.hash(password, 10);
}

async function nextCertificateId(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `MAJ-${year}-`;
  const latest = await prisma.membershipCertificate.findFirst({
    where: { certificateId: { startsWith: prefix } },
    orderBy: { certificateId: "desc" },
    select: { certificateId: true },
  });
  const maxNum = latest ? parseInt(latest.certificateId.slice(prefix.length), 10) || 0 : 0;
  return `${prefix}${String(maxNum + 1).padStart(4, "0")}`;
}

function daysUntil(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

async function getRolloverAndExpireOtherActives(
  memberId: string,
  planDurationMonths: number,
  excludeSubscriptionId: string
): Promise<{ newEndDate: Date }> {
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
  return { newEndDate };
}

async function createUserForMember(
  member: { id: string; email: string | null; fullName: string },
  passwordHash: string
): Promise<string> {
  if (!member.email?.trim()) {
    throw new Error("Member must have an email to create an account");
  }
  const memberRole = await prisma.role.findUnique({ where: { name: "MEMBER" } });
  if (!memberRole) throw new Error("Membership role not configured");

  const names = member.fullName.trim().split(" ");
  const firstName = names[0] || "Member";
  const lastName = names.slice(1).join(" ") || ".";

  const user = await prisma.user.create({
    data: {
      email: member.email,
      passwordHash,
      firstName,
      lastName,
      status: "ACTIVE",
      userRoles: { create: [{ roleId: memberRole.id }] },
    },
  });

  await prisma.member.update({
    where: { id: member.id },
    data: { userId: user.id },
  });

  return user.id;
}

async function issueCertificate(
  subscriptionId: string,
  member: { id: string; fullName: string; category: MemberCategory; profilePhotoUrl: string | null },
  expiresAt: Date
) {
  const certificateId = await nextCertificateId();
  const now = new Date();
  const photoPath = member.profilePhotoUrl
    ? path.join(process.cwd(), member.profilePhotoUrl.startsWith("/") ? member.profilePhotoUrl.slice(1) : member.profilePhotoUrl)
    : null;

  const { pdfUrl } = await generateMembershipCertificatePDF({
    certificateId,
    fullName: member.fullName,
    category: member.category,
    issuedAt: now,
    expiresAt,
    photoPath,
  });

  await prisma.membershipCertificate.create({
    data: {
      certificateId,
      subscriptionId,
      memberId: member.id,
      pdfUrl,
      issuedAt: now,
      expiresAt,
    },
  });
}

export async function createMemberFromRegistration(data: ParsedRegistration, passwordHash: string) {
  const plan = await prisma.membershipPlan.findUnique({ where: { id: data.planId } });
  if (!plan || !plan.isActive) throw new Error("Plan not found or inactive");

  await assertRegistrationAvailable(data);

  const now = new Date();
  const startDate = new Date(now);
  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + plan.durationMonths);

  const member = await prisma.member.create({
    data: {
      fullName: data.fullName,
      phone: data.phone,
      email: data.email,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      regionId: data.regionId,
      zoneId: data.zoneId,
      woredaId: data.woredaId,
      addressLine: data.addressLine,
      profilePhotoUrl: data.profilePhotoUrl,
      nationalId: data.nationalId,
      category: data.category,
      categoryData: data.categoryData as any,
    },
  });

  const subscription = await prisma.membershipSubscription.create({
    data: {
      memberId: member.id,
      planId: data.planId,
      status: MembershipSubscriptionStatus.PENDING_PAYMENT,
      startDate,
      endDate,
    },
    include: { member: true, plan: true },
  });

  const userId = await createUserForMember(member, passwordHash);

  await NotificationService.sendNotification({
    module: NotificationModule.MEMBERSHIP,
    type: NotificationType.INFO,
    title: "New membership registration",
    message: `${member.fullName} registered as ${member.category.replace(/_/g, " ")}`,
    resourceType: "Member",
    resourceId: member.id,
    targets: { roleNames: ["ADMIN"] },
  });

  return { member: { ...member, userId }, subscription, plan };
}

export async function finalizeChapaRegistrationFromDraft(draftId: string, chapaRefId?: string | null) {
  const draft = await prisma.membershipRegistrationDraft.findUnique({ where: { id: draftId } });
  if (!draft) throw new Error("Registration draft not found");
  if (draft.status === MembershipRegistrationDraftStatus.COMPLETED && draft.subscriptionId) {
    return draft.subscriptionId;
  }
  if (draft.status !== MembershipRegistrationDraftStatus.PENDING) {
    throw new Error("Registration draft is no longer valid");
  }

  const plan = await prisma.membershipPlan.findUnique({ where: { id: draft.planId } });
  if (!plan || !plan.isActive) throw new Error("Plan not found or inactive");

  const existingMember = await prisma.member.findUnique({ where: { phone: draft.phone } });
  if (existingMember) {
    await prisma.membershipRegistrationDraft.update({
      where: { id: draftId },
      data: { status: MembershipRegistrationDraftStatus.FAILED },
    });
    throw new Error("A member with this phone number already exists");
  }

  const now = new Date();

  const member = await prisma.member.create({
    data: {
      fullName: draft.fullName,
      phone: draft.phone,
      email: draft.email || undefined,
      dateOfBirth: draft.dateOfBirth || undefined,
      gender: draft.gender || undefined,
      regionId: draft.regionId || undefined,
      zoneId: draft.zoneId || undefined,
      woredaId: draft.woredaId || undefined,
      addressLine: draft.addressLine || undefined,
      profilePhotoUrl: draft.profilePhotoUrl || undefined,
      nationalId: draft.nationalId || undefined,
      category: draft.category,
      categoryData: draft.categoryData as any,
    },
  });

  const subscription = await prisma.membershipSubscription.create({
    data: {
      memberId: member.id,
      planId: draft.planId,
      status: MembershipSubscriptionStatus.PENDING_PAYMENT,
      chapaTxRef: draft.chapaTxRef || undefined,
    },
  });

  const payment = await prisma.membershipPayment.create({
    data: {
      subscriptionId: subscription.id,
      amount: resolveRegistrationFeeAmount(plan.planType),
      currency: "ETB",
      method: MembershipPaymentMethod.CHAPA,
      status: MembershipPaymentStatus.COMPLETED,
      chapaTxRef: draft.chapaTxRef || undefined,
      chapaRefId: chapaRefId || undefined,
      paidAt: now,
    },
  });

  const { newEndDate } = await getRolloverAndExpireOtherActives(member.id, plan.durationMonths, subscription.id);
  await prisma.membershipSubscription.update({
    where: { id: subscription.id },
    data: {
      status: MembershipSubscriptionStatus.ACTIVE,
      startDate: now,
      endDate: newEndDate,
    },
  });

  const userId = await createUserForMember(
    { id: member.id, email: member.email, fullName: member.fullName },
    draft.passwordHash
  );

  await issueCertificate(subscription.id, member, newEndDate);

  await prisma.membershipRegistrationDraft.update({
    where: { id: draftId },
    data: {
      status: MembershipRegistrationDraftStatus.COMPLETED,
      subscriptionId: subscription.id,
    },
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

  await NotificationService.sendNotification({
    module: NotificationModule.MEMBERSHIP,
    type: NotificationType.SUCCESS,
    title: "Membership payment successful",
    message: "Your certificate is ready. You can download it from your profile.",
    resourceType: "MembershipCertificate",
    resourceId: subscription.id,
    targets: { userIds: [userId] },
  });

  if (member.phone) {
    sendMembershipCertificateReadySms(member.phone).catch(() => {});
  }

  return subscription.id;
}

async function verifyChapaTransaction(verifyRef: string): Promise<void> {
  const secretKey = process.env.CHAPA_SECRET_KEY;
  if (!secretKey) throw new Error("Chapa payment is not configured");
  const verifyResp = await fetch(`https://api.chapa.co/v1/transaction/verify/${verifyRef}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  const verifyData = (await verifyResp.json()) as { status?: string; data?: { status?: string } };
  if (verifyData.status !== "success" || verifyData.data?.status !== "success") {
    throw new Error("Payment verification failed");
  }
}

/** Verify Chapa payment and finalize a registration draft (idempotent). */
export async function tryCompleteChapaRegistrationDraft(
  draftId: string,
  options?: { trxRef?: string | null; refId?: string | null }
): Promise<{ status: MembershipRegistrationDraftStatus; subscriptionId: string | null }> {
  const draft = await prisma.membershipRegistrationDraft.findUnique({ where: { id: draftId } });
  if (!draft) throw new Error("Registration draft not found");

  if (draft.status === MembershipRegistrationDraftStatus.COMPLETED && draft.subscriptionId) {
    return { status: draft.status, subscriptionId: draft.subscriptionId };
  }
  if (draft.status !== MembershipRegistrationDraftStatus.PENDING) {
    throw new Error("Registration draft is no longer valid");
  }

  const trxRef = options?.trxRef ?? draft.chapaTxRef;
  if (!trxRef) throw new Error("No payment reference for this registration");
  if (draft.chapaTxRef && trxRef !== draft.chapaTxRef) {
    throw new Error("Payment reference mismatch");
  }

  const verifyRef = options?.refId ?? trxRef;
  await verifyChapaTransaction(verifyRef);

  const subscriptionId = await finalizeChapaRegistrationFromDraft(draftId, options?.refId ?? null);
  return { status: MembershipRegistrationDraftStatus.COMPLETED, subscriptionId };
}

export async function registerMembershipManual(
  data: ParsedRegistration,
  passwordHash: string,
  receiptUrl?: string,
  bankName?: string
) {
  const { member, subscription, plan } = await createMemberFromRegistration(data, passwordHash);

  await prisma.membershipPayment.create({
    data: {
      subscriptionId: subscription.id,
      amount: resolveRegistrationFeeAmount(plan.planType, data.feeAmount),
      currency: "ETB",
      method: MembershipPaymentMethod.MANUAL,
      status: MembershipPaymentStatus.PENDING,
      receiptUrl: receiptUrl || undefined,
      bankName: bankName || undefined,
    },
  });

  return subscription;
}

export function draftExpiresAt(): Date {
  const expires = new Date();
  expires.setHours(expires.getHours() + 24);
  return expires;
}
