import { z } from "zod";
import { MemberCategory, MembershipPlanType } from "@prisma/client";

export const CreateMemberDto = z.object({
  fullName: z.string().min(1, "Full name is required"),
  phone: z.string().min(9, "Valid phone is required"),
  email: z.string().email().optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  gender: z.string().optional(),
  regionId: z.string().optional(),
  zoneId: z.string().optional(),
  woredaId: z.string().optional(),
  addressLine: z.string().optional(),
  nationalId: z.string().optional(),
  category: z.nativeEnum(MemberCategory),
  categoryData: z.record(z.string(), z.any()).optional(),
});

export const CreateSubscriptionDto = z.object({
  memberId: z.string(),
  planId: z.string(),
});

export const RenewSubscriptionDto = z.object({
  planId: z.string(),
});

export const ListMembersQuery = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  category: z.nativeEnum(MemberCategory).optional(),
  membershipStatus: z.enum(["ACTIVE", "PENDING_PAYMENT", "EXPIRED", "NONE"]).optional(),
});

export const ListSubscriptionsQuery = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  memberId: z.string().optional(),
  status: z.string().optional(),
});

export const ListPaymentsQuery = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  subscriptionId: z.string().optional(),
});

export const ConfirmManualPaymentDto = z.object({
  bankName: z.string().optional(),
});

export const UpdateMemberDto = z.object({
  userId: z.string().nullable().optional(),
});

export const UpdateMyMemberDto = z.object({
  fullName: z.string().min(1, "Full name is required").optional(),
  phone: z.string().min(9, "Valid phone is required").optional(),
  email: z.string().email().optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  gender: z.string().optional(),
  regionId: z.string().optional(),
  zoneId: z.string().optional(),
  woredaId: z.string().optional(),
  addressLine: z.string().optional(),
  nationalId: z.string().optional(),
  category: z.nativeEnum(MemberCategory).optional(),
  categoryData: z.record(z.string(), z.any()).optional(),
});
