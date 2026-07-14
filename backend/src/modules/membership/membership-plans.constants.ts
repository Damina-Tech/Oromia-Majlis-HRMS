import { MembershipPlanType } from "@prisma/client";

/** Keep in sync with frontend/src/constants/membership-plans.ts */
export const MEMBERSHIP_PLAN_FEES: Record<
  MembershipPlanType,
  { name: string; feeAmount: number; durationMonths: number }
> = {
  MONTHLY: { name: "Monthly", feeAmount: 5, durationMonths: 1 },
  QUARTERLY: { name: "Quarterly", feeAmount: 300, durationMonths: 3 },
  YEARLY: { name: "Yearly", feeAmount: 600, durationMonths: 12 },
};

export function getHardcodedPlanFee(planType: MembershipPlanType): number {
  return MEMBERSHIP_PLAN_FEES[planType].feeAmount;
}

/** Prefer client-supplied fee (from frontend constants); fall back to backend defaults. */
export function resolvePlanFeeAmount(planType: MembershipPlanType, requestedFee?: unknown): number {
  const parsed =
    typeof requestedFee === "string"
      ? Number(requestedFee)
      : typeof requestedFee === "number"
        ? requestedFee
        : NaN;
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return getHardcodedPlanFee(planType);
}

export function applyHardcodedPlanFees<T extends { planType: MembershipPlanType; name: string; feeAmount: unknown; durationMonths: number }>(
  plans: T[]
): T[] {
  return plans.map((plan) => {
    const config = MEMBERSHIP_PLAN_FEES[plan.planType];
    if (!config) return plan;
    return {
      ...plan,
      name: config.name,
      feeAmount: config.feeAmount,
      durationMonths: config.durationMonths,
    };
  });
}
