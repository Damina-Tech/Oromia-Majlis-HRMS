import api from "./api";
import { API_BASE_URL } from "@/config/api";

export type MembershipPlanType = "MONTHLY" | "QUARTERLY" | "YEARLY";
export type MemberCategory = "REGULAR_MEMBER" | "BUSINESS_OWNER" | "YOUTH_WOMEN_COUNCIL" | "FARMER" | "ELDER_MOTHER";
export type SubscriptionStatus = "PENDING_PAYMENT" | "ACTIVE" | "EXPIRED";
export type PaymentMethod = "CHAPA" | "MANUAL" | "CASH";
export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED";

export interface MembershipPlan {
  id: string;
  name: string;
  planType: MembershipPlanType;
  feeAmount: number | string;
  durationMonths: number;
  isActive: boolean;
}

export interface Member {
  id: string;
  fullName: string;
  phone: string;
  email?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  regionId?: string | null;
  region?: { id: string; name: string };
  zoneId?: string | null;
  zone?: { id: string; name: string };
  woredaId?: string | null;
  woreda?: { id: string; name: string };
  addressLine?: string | null;
  profilePhotoUrl?: string | null;
  nationalId?: string | null;
  category: MemberCategory;
  categoryData?: Record<string, unknown> | null;
  userId?: string | null;
  subscriptions?: MembershipSubscription[];
  createdAt: string;
  updatedAt: string;
}

export interface MembershipSubscription {
  id: string;
  memberId: string;
  member?: Member;
  planId: string;
  plan?: MembershipPlan;
  status: SubscriptionStatus;
  startDate?: string | null;
  endDate?: string | null;
  chapaTxRef?: string | null;
  certificate?: MembershipCertificate | null;
  payments?: MembershipPayment[];
  createdAt: string;
  updatedAt: string;
}

export interface MembershipPayment {
  id: string;
  subscriptionId: string;
  amount: number | string;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  bankName?: string | null;
  paidAt?: string | null;
  receiptUrl?: string | null;
  createdAt: string;
}

export interface MembershipCertificate {
  id: string;
  certificateId: string;
  memberId: string;
  pdfUrl?: string | null;
  issuedAt: string;
  expiresAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface UpcomingExpiry {
  memberId: string;
  memberName: string;
  category: string;
  expiryDate: string | null;
  status: string;
  planName: string | null;
}

export interface MembershipAnalytics {
  totalMembers: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  expiredMembers: number;
  newRegistrationsToday: number;
  newRegistrationsMonth: number;
  paymentsCompleted: number;
  revenue: number;
  revenueByPlanType: Record<string, number>;
  categoryDistribution: { category: string; count: number }[];
  upcomingExpiries: UpcomingExpiry[];
}

const base = "/membership";
export const membershipApi = {
  regions: {
    list: () => api.get<Array<{ id: string; name: string; zones?: Array<{ id: string; name: string; woredas?: Array<{ id: string; name: string }> }> }>>(`${base}/regions`).then((r) => r.data),
  },
  plans: {
    listActive: () => api.get<MembershipPlan[]>(`${base}/plans/active`).then((r) => r.data),
    list: (params?: { active?: string }) => api.get<MembershipPlan[]>(`${base}/plans`, { params }).then((r) => r.data),
  },
  members: {
    create: (data: FormData | Record<string, unknown>) => {
      if (data instanceof FormData) {
        return api.post<Member>(`${base}/members`, data, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
      }
      return api.post<Member>(`${base}/members`, data).then((r) => r.data);
    },
    list: (params?: { page?: number; limit?: number; search?: string; category?: MemberCategory; membershipStatus?: "ACTIVE" | "PENDING_PAYMENT" | "EXPIRED" | "NONE" }) =>
      api.get<PaginatedResponse<Member>>(`${base}/members`, { params }).then((r) => r.data),
    get: (id: string) => api.get<Member>(`${base}/members/${id}`).then((r) => r.data),
    getMe: () => api.get<Member>(`${base}/me`).then((r) => r.data),
    updateMe: (data: FormData | Record<string, unknown>) => {
      if (data instanceof FormData) {
        return api.patch<Member>(`${base}/me`, data, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
      }
      return api.patch<Member>(`${base}/me`, data).then((r) => r.data);
    },
    update: (id: string, data: { userId?: string | null }) => api.patch<Member>(`${base}/members/${id}`, data).then((r) => r.data),
    updateProfile: (id: string, data: FormData | Record<string, unknown>) => {
      if (data instanceof FormData) {
        return api.patch<Member>(`${base}/members/${id}/profile`, data, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
      }
      return api.patch<Member>(`${base}/members/${id}/profile`, data).then((r) => r.data);
    },
    delete: (id: string) => api.delete(`${base}/members/${id}`).then(() => {}),
  },
  subscriptions: {
    create: (data: { memberId: string; planId: string }) =>
      api.post<{ subscription: MembershipSubscription; payment: MembershipPayment }>(`${base}/subscriptions`, data).then((r) => r.data),
    renew: (planId: string) =>
      api.post<{ subscription: MembershipSubscription; payment: MembershipPayment }>(`${base}/subscriptions/renew`, { planId }).then((r) => r.data),
    get: (id: string) => api.get<MembershipSubscription>(`${base}/subscriptions/${id}`).then((r) => r.data),
    list: (params?: { page?: number; limit?: number; memberId?: string; status?: string }) =>
      api.get<PaginatedResponse<MembershipSubscription>>(`${base}/subscriptions`, { params }).then((r) => r.data),
    initChapa: (subscriptionId: string) =>
      api.post<{ checkoutUrl: string; txRef: string }>(`${base}/subscriptions/${subscriptionId}/payment/chapa-init`).then((r) => r.data),
    confirmManual: (subscriptionId: string, formData: FormData) =>
      api.post<MembershipSubscription>(`${base}/subscriptions/${subscriptionId}/payment/manual`, formData).then((r) => r.data),
    confirmManualPublic: (subscriptionId: string, formData: FormData) =>
      api.post<MembershipSubscription>(`${base}/subscriptions/${subscriptionId}/payment/manual-public`, formData).then((r) => r.data),
    completeAccount: (subscriptionId: string, password: string) =>
      api.post<{ message: string; email?: string }>(`${base}/subscriptions/${subscriptionId}/complete-account`, { password }).then((r) => r.data),
  },
  certificates: {
    downloadUrl: (certificateIdOrId: string) => `${API_BASE_URL}/api/v1${base}/certificates/${certificateIdOrId}/download`,
    verify: (certificateId: string) =>
      api.get<{
        valid: boolean;
        certificateId: string;
        fullName: string;
        category: string;
        status: string;
        issuedAt: string;
        expiresAt: string;
        member?: {
          phone?: string | null;
          email?: string | null;
          region?: string | null;
          zone?: string | null;
          woreda?: string | null;
        };
        subscription?: {
          id: string;
          status: string;
          planName: string;
          planType: string;
        };
        payment?: {
          method?: string | null;
          status?: string | null;
          paidAt?: string | null;
        } | null;
        verifiedAt?: string;
      }>(
        `${base}/verify/${certificateId}`
      ).then((r) => r.data),
  },
  payments: {
    list: (params?: { page?: number; limit?: number; subscriptionId?: string }) =>
      api.get<PaginatedResponse<MembershipPayment>>(`${base}/payments`, { params }).then((r) => r.data),
  },
  analytics: (params?: { category?: MemberCategory }) =>
    api.get<MembershipAnalytics>(`${base}/analytics`, { params }).then((r) => r.data),
};
