import type { MembershipPlan, MembershipPlanType } from "@/services/membership";

/** Edit fees here — no seed or database update required. Sent to Chapa on payment. */
export const MEMBERSHIP_PLAN_FEES: Record<
  MembershipPlanType,
  { name: string; feeAmount: number; durationMonths: number }
> = {
  MONTHLY: { name: "Monthly", feeAmount: 5, durationMonths: 1 },
  QUARTERLY: { name: "Quarterly", feeAmount: 300, durationMonths: 3 },
  YEARLY: { name: "Yearly", feeAmount: 600, durationMonths: 12 },
};

/** Merge API plan ids with hardcoded display names and fees. */
export function getMembershipPlansWithHardcodedFees(apiPlans: MembershipPlan[] | undefined): MembershipPlan[] {
  if (!apiPlans?.length) return [];

  return (Object.keys(MEMBERSHIP_PLAN_FEES) as MembershipPlanType[])
    .map((planType): MembershipPlan | null => {
      const config = MEMBERSHIP_PLAN_FEES[planType];
      const apiPlan = apiPlans.find((p) => p.planType === planType);
      if (!apiPlan) return null;
      return {
        ...apiPlan,
        name: config.name,
        feeAmount: config.feeAmount,
        durationMonths: config.durationMonths,
      };
    })
    .filter((p): p is MembershipPlan => p !== null);
}
