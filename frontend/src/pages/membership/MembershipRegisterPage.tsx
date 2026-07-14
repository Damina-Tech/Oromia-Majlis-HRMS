"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate, Link, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, UserPlus, CreditCard, Loader2, Award, Building2, Upload, Banknote, ArrowLeft } from "lucide-react";
import { membershipApi, type MemberCategory, type MembershipPlan } from "@/services/membership";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { MAJLIS_MANUAL_PAYMENT_BANKS as BANKS } from "@/constants/majlis-banks";
import { getMembershipPlansWithHardcodedFees } from "@/constants/membership-plans";
import OromiaLocationPicker from "@/components/location/OromiaLocationPicker";
import { resolveOromiaLocationIds } from "@/services/oromia-location";
import {
  clearRegistrationDraft,
  dataUrlToFile,
  fileToDataUrl,
  loadRegistrationDraft,
  saveRegistrationDraft,
  serializeFormForStorage,
} from "@/lib/membership-registration-storage";
import {
  isMembershipRegisterSuccessRoute,
  parseMembershipRegisterQueryParams,
} from "@/lib/membership-register-url";

const RequiredLabel = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <Label>
    {children}
    {required && <span className="text-destructive ml-0.5">*</span>}
  </Label>
);

const CATEGORIES: { value: MemberCategory; label: string }[] = [
  { value: "REGULAR_MEMBER", label: "Regular Member" },
  { value: "BUSINESS_OWNER", label: "Business Owner" },
  { value: "YOUTH_WOMEN_COUNCIL", label: "Youth/Women Council" },
  { value: "FARMER", label: "Farmer" },
  { value: "ELDER_MOTHER", label: "Elder / Mother" },
];

const CATEGORY_FIELDS: Record<MemberCategory, { name: string; label: string; type: string; options?: string[] }[]> = {
  REGULAR_MEMBER: [
    { name: "religiousEducationLevel", label: "Religious Education Level", type: "text" },
    { name: "placeOfStudy", label: "Place of Study", type: "text" },
    { name: "teachingLocation", label: "Teaching Location", type: "text" },
    { name: "academicQualification", label: "Academic (Science) Qualification Level", type: "text" },
  ],
  BUSINESS_OWNER: [
    { name: "businessType", label: "Business Type", type: "text" },
    { name: "businessSector", label: "Business Sector", type: "text" },
    { name: "contributionType", label: "Contribution Type", type: "select", options: ["Financial", "Advisory", "Material Support"] },
  ],
  YOUTH_WOMEN_COUNCIL: [
    { name: "skills", label: "Skills", type: "multiselect", options: ["Technology", "Communication", "Leadership", "Organization", "Other"] },
    { name: "leadershipExperience", label: "Leadership Experience", type: "text" },
    { name: "communityParticipation", label: "Community Participation", type: "text" },
  ],
  FARMER: [
    { name: "mainProduct", label: "Main Product", type: "select", options: ["Crops", "Coffee", "Livestock", "Other"] },
    { name: "farmSize", label: "Farm Size (optional)", type: "text" },
  ],
  ELDER_MOTHER: [
    { name: "mediationExperience", label: "Mediation Experience", type: "text" },
    { name: "communityRole", label: "Community Role", type: "text" },
    { name: "advisoryAreas", label: "Advisory Areas", type: "text" },
  ],
};

export default function MembershipRegisterPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canConfirmManual =
    hasPermission("majlis.membership.register") || hasPermission("majlis.membership.admin");

  const [step, setStep] = useState(1);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const queryClient = useQueryClient();
  const registerQuery = useMemo(
    () => parseMembershipRegisterQueryParams(location.search || `?${searchParams.toString()}`),
    [location.search, searchParams]
  );
  const {
    step: stepParam,
    draftToken: draftTokenParam,
    subscriptionId: subscriptionIdParam,
    trxRef,
    refId,
  } = registerQuery;
  const isSuccessPage = isMembershipRegisterSuccessRoute(registerQuery);

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [hydrated, setHydrated] = useState(false);

  const [showManualForm, setShowManualForm] = useState(false);
  const [selectedManualPlan, setSelectedManualPlan] = useState<MembershipPlan | null>(null);
  const [manualBankId, setManualBankId] = useState<string>("");
  const [manualReceipt, setManualReceipt] = useState<File | null>(null);

  const [pendingSubscriptionId, setPendingSubscriptionId] = useState<string | null>(null);
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);
  const [staffManualModalOpen, setStaffManualModalOpen] = useState(false);
  const [staffManualPaymentType, setStaffManualPaymentType] = useState<"cash" | "transfer">("cash");
  const [staffManualBankId, setStaffManualBankId] = useState("");
  const [staffManualReceipt, setStaffManualReceipt] = useState<File | null>(null);

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    dateOfBirth: "",
    gender: "",
    oromiaZone: "",
    oromiaDistrict: "",
    addressLine: "",
    nationalId: "",
    profilePhoto: null as File | null,
    category: "" as MemberCategory | "",
    categoryData: {} as Record<string, unknown>,
  });

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ["membership-plans-active"],
    queryFn: () => membershipApi.plans.listActive(),
    enabled: step >= 3 && !isSuccessPage,
  });
  const registrationPlans = useMemo(
    () => getMembershipPlansWithHardcodedFees(plans),
    [plans]
  );
  const { data: draftStatus } = useQuery({
    queryKey: ["membership-registration-draft", draftTokenParam],
    queryFn: () => membershipApi.register.draftStatus(draftTokenParam!),
    enabled: !!draftTokenParam && isSuccessPage && !subscriptionIdParam,
    refetchInterval: (query) => (query.state.data?.status === "PENDING" ? 3000 : false),
  });

  const {
    mutate: completeChapaPayment,
    isPending: completingChapa,
    isError: completeChapaErrored,
    error: completeChapaError,
  } = useMutation({
    mutationFn: () =>
      membershipApi.register.completeChapa(draftTokenParam!, {
        ...(trxRef ? { trx_ref: trxRef } : {}),
        ...(refId ? { ref_id: refId } : {}),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(["membership-registration-draft", draftTokenParam], data);
      if (data.status === "COMPLETED" && data.subscriptionId) {
        clearRegistrationDraft();
        navigate(`/register/membership?step=success&subscriptionId=${data.subscriptionId}`, { replace: true });
      }
    },
  });

  useEffect(() => {
    if (!isSuccessPage || !draftTokenParam || subscriptionIdParam) return;
    if (draftStatus?.status === "COMPLETED") return;

    const tick = () => {
      if (!completingChapa) completeChapaPayment();
    };
    tick();
    const timer = window.setInterval(tick, 3000);
    return () => window.clearInterval(timer);
  }, [
    isSuccessPage,
    draftTokenParam,
    subscriptionIdParam,
    draftStatus?.status,
    trxRef,
    refId,
    completingChapa,
    completeChapaPayment,
  ]);
  const resolvedSubscriptionId =
    subscriptionIdParam ??
    (draftStatus?.status === "COMPLETED" ? draftStatus.subscriptionId ?? null : null);

  const { data: subscription, isLoading: subLoading } = useQuery({
    queryKey: ["membership-subscription", resolvedSubscriptionId],
    queryFn: () => membershipApi.subscriptions.get(resolvedSubscriptionId!),
    enabled: !!resolvedSubscriptionId && isSuccessPage,
  });

  useEffect(() => {
    if (isSuccessPage) return;
    const saved = loadRegistrationDraft();
    if (!saved) {
      setHydrated(true);
      return;
    }
    setStep(saved.step);
    setPassword(saved.password);
    setPasswordConfirm(saved.passwordConfirm);
    setForm((f) => ({
      ...f,
      fullName: saved.form.fullName,
      phone: saved.form.phone,
      email: saved.form.email,
      dateOfBirth: saved.form.dateOfBirth,
      gender: saved.form.gender,
      oromiaZone: saved.form.oromiaZone,
      oromiaDistrict: saved.form.oromiaDistrict,
      addressLine: saved.form.addressLine,
      nationalId: saved.form.nationalId,
      category: saved.form.category,
      categoryData: saved.form.categoryData,
    }));
    if (saved.form.profilePhotoDataUrl && saved.form.profilePhotoName) {
      dataUrlToFile(saved.form.profilePhotoDataUrl, saved.form.profilePhotoName)
        .then((file) => setForm((f) => ({ ...f, profilePhoto: file })))
        .finally(() => setHydrated(true));
    } else {
      setHydrated(true);
    }
  }, [isSuccessPage]);

  useEffect(() => {
    if (!hydrated || isSuccessPage) return;
    const persist = async () => {
      let profilePhotoDataUrl: string | undefined;
      let profilePhotoName: string | undefined;
      if (form.profilePhoto) {
        try {
          profilePhotoDataUrl = await fileToDataUrl(form.profilePhoto);
          profilePhotoName = form.profilePhoto.name;
        } catch {
          // skip photo if conversion fails
        }
      }
      saveRegistrationDraft({
        step,
        password,
        passwordConfirm,
        form: {
          ...serializeFormForStorage(form),
          profilePhotoDataUrl,
          profilePhotoName,
        },
      });
    };
    void persist();
  }, [form, step, password, passwordConfirm, hydrated, isSuccessPage]);

  useEffect(() => {
    if (draftStatus?.status === "COMPLETED" && draftStatus.subscriptionId) {
      clearRegistrationDraft();
      navigate(`/register/membership?step=success&subscriptionId=${draftStatus.subscriptionId}`, { replace: true });
    }
  }, [draftStatus, navigate]);

  useEffect(() => {
    if (isSuccessPage && subscriptionIdParam && subscription?.status) {
      clearRegistrationDraft();
    }
  }, [isSuccessPage, subscriptionIdParam, subscription?.status]);

  const buildRegistrationFormData = useCallback(
    async (plan: Pick<MembershipPlan, "id" | "feeAmount">) => {
      let regionId: string | undefined;
      let zoneId: string | undefined;
      let woredaId: string | undefined;
      if (form.oromiaZone.trim() && form.oromiaDistrict.trim()) {
        const resolved = await resolveOromiaLocationIds(form.oromiaZone, form.oromiaDistrict, "membership");
        regionId = resolved.regionId;
        zoneId = resolved.zoneId;
        woredaId = resolved.woredaId;
      }

      const formData = new FormData();
      formData.append("planId", plan.id);
      formData.append("feeAmount", String(Number(plan.feeAmount)));
      formData.append("password", password);
      formData.append("fullName", form.fullName);
      formData.append("phone", form.phone);
      formData.append("email", form.email);
      if (form.dateOfBirth) formData.append("dateOfBirth", form.dateOfBirth);
      if (form.gender) formData.append("gender", form.gender);
      if (regionId) formData.append("regionId", regionId);
      if (zoneId) formData.append("zoneId", zoneId);
      if (woredaId) formData.append("woredaId", woredaId);
      if (form.addressLine) formData.append("addressLine", form.addressLine);
      if (form.nationalId) formData.append("nationalId", form.nationalId);
      formData.append("category", form.category);
      formData.append("categoryData", JSON.stringify(form.categoryData));
      if (form.profilePhoto) formData.append("profilePhoto", form.profilePhoto);
      return formData;
    },
    [form, password]
  );

  const createMemberMutation = useMutation({
    mutationFn: async () => {
      let regionId: string | undefined;
      let zoneId: string | undefined;
      let woredaId: string | undefined;
      if (form.oromiaZone.trim() && form.oromiaDistrict.trim()) {
        const resolved = await resolveOromiaLocationIds(
          form.oromiaZone,
          form.oromiaDistrict,
          "membership"
        );
        regionId = resolved.regionId;
        zoneId = resolved.zoneId;
        woredaId = resolved.woredaId;
      }

      const formData = new FormData();
      formData.append("fullName", form.fullName);
      formData.append("phone", form.phone);
      if (form.email) formData.append("email", form.email);
      if (form.dateOfBirth) formData.append("dateOfBirth", form.dateOfBirth);
      if (form.gender) formData.append("gender", form.gender);
      if (regionId) formData.append("regionId", regionId);
      if (zoneId) formData.append("zoneId", zoneId);
      if (woredaId) formData.append("woredaId", woredaId);
      if (form.addressLine) formData.append("addressLine", form.addressLine);
      if (form.nationalId) formData.append("nationalId", form.nationalId);
      formData.append("category", form.category);
      formData.append("categoryData", JSON.stringify(form.categoryData));
      if (form.profilePhoto) formData.append("profilePhoto", form.profilePhoto);
      return membershipApi.members.create(formData);
    },
    onSuccess: (data) => {
      setMemberId(data.id);
      toast.success("Member registered. Select plan and payment method.");
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message ?? "Registration failed");
    },
  });

  const registerChapaMutation = useMutation({
    mutationFn: async (plan: MembershipPlan) => {
      const formData = await buildRegistrationFormData(plan);
      return membershipApi.register.chapaInit(formData);
    },
    onSuccess: (data) => {
      window.location.href = data.checkoutUrl;
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message ?? "Payment initiation failed");
    },
  });

  const registerManualMutation = useMutation({
    mutationFn: async (plan: MembershipPlan) => {
      const formData = await buildRegistrationFormData(plan);
      if (manualReceipt) formData.append("receipt", manualReceipt);
      const bank = BANKS.find((b) => b.id === manualBankId);
      if (bank?.name) formData.append("bankName", bank.name);
      return membershipApi.register.manual(formData);
    },
    onSuccess: (sub) => {
      clearRegistrationDraft();
      setShowManualForm(false);
      setSelectedManualPlan(null);
      setManualBankId("");
      setManualReceipt(null);
      navigate(`/register/membership?step=success&subscriptionId=${sub.id}`);
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message ?? "Failed to submit registration");
    },
  });

  const chapaMutation = useMutation({
    mutationFn: ({ subscriptionId, feeAmount }: { subscriptionId: string; feeAmount: number }) =>
      membershipApi.subscriptions.initChapa(subscriptionId, feeAmount),
    onSuccess: (data) => {
      window.location.href = data.checkoutUrl;
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message ?? "Payment initiation failed");
    },
  });

  const createSubMutation = useMutation({
    mutationFn: ({ planId, memberId: mid }: { planId: string; memberId: string }) =>
      membershipApi.subscriptions.create({ memberId: mid, planId }),
    onSuccess: (data, variables) => {
      setPendingSubscriptionId(data.subscription.id);
      setPendingPlanId(variables.planId);
      toast.success("Subscription created. Choose payment: Chapa or mark manual.");
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message ?? "Failed to create subscription");
    },
  });

  const confirmManualMutation = useMutation({
    mutationFn: (subId: string) => {
      const formData = new FormData();
      if (staffManualReceipt) formData.append("receipt", staffManualReceipt);
      if (staffManualPaymentType === "transfer" && staffManualBankId) {
        const bank = BANKS.find((b) => b.id === staffManualBankId);
        if (bank?.name) formData.append("bankName", bank.name);
      }
      return membershipApi.subscriptions.confirmManual(subId, formData);
    },
    onSuccess: () => {
      toast.success("Payment confirmed. Certificate generated.");
      setStaffManualModalOpen(false);
      setStaffManualPaymentType("cash");
      setStaffManualBankId("");
      setStaffManualReceipt(null);
      setPendingSubscriptionId(null);
      navigate("/majlis/membership/members");
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message ?? "Failed to confirm payment");
    },
  });

  const handleNext = () => {
    if (step === 1) {
      if (!form.fullName.trim() || !form.phone.trim()) {
        toast.error("Full name and phone are required");
        return;
      }
      if (!canConfirmManual) {
        if (!form.email.trim()) {
          toast.error("Email is required to create your login account");
          return;
        }
        if (!password || password.length < 6) {
          toast.error("Password must be at least 6 characters");
          return;
        }
        if (password !== passwordConfirm) {
          toast.error("Passwords do not match");
          return;
        }
      }
      setStep(2);
    } else if (step === 2) {
      if (!form.category) {
        toast.error("Please select a category");
        return;
      }
      setStep(3);
    }
  };

  const handleStaffSelectPlan = (plan: MembershipPlan) => {
    if (memberId) {
      createSubMutation.mutate({ planId: plan.id, memberId });
      return;
    }
    createMemberMutation.mutate(undefined, {
      onSuccess: (data) => {
        setMemberId(data.id);
        createSubMutation.mutate({ planId: plan.id, memberId: data.id });
      },
    });
  };

  const handlePublicChapa = (plan: MembershipPlan) => {
    registerChapaMutation.mutate(plan);
  };

  const handlePublicManual = (plan: MembershipPlan) => {
    setSelectedManualPlan(plan);
    setShowManualForm(true);
  };

  const handleManualSubmit = () => {
    if (!selectedManualPlan) return;
    if (!manualBankId) {
      toast.error("Please select a bank");
      return;
    }
    if (!manualReceipt) {
      toast.error("Please upload your payment receipt");
      return;
    }
    registerManualMutation.mutate(selectedManualPlan);
  };


  if (isSuccessPage) {
    if (!subscriptionIdParam && !draftTokenParam) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50/30 to-indigo-100 dark:from-slate-900 dark:via-indigo-950/30 dark:to-slate-900 flex items-center justify-center p-4 sm:p-6">
          <Card className="w-full max-w-md shadow-xl border-indigo-200/60 dark:border-indigo-900/50">
            <CardHeader>
              <CardTitle className="text-indigo-900 dark:text-indigo-100">Completing registration…</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                We received your return from payment but could not read the confirmation reference. Please wait a moment and refresh, or sign in if you already completed payment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={() => window.location.reload()}>
                Refresh
              </Button>
              <Button className="w-full" variant="outline" asChild>
                <Link to="/login">Go to Login</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    const completeErrorMessage =
      completeChapaErrored && (completeChapaError as { response?: { status?: number; data?: { message?: string } } })?.response?.status !== 402
        ? (completeChapaError as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Could not complete registration after payment."
        : null;

    const waitingForChapa =
      !!draftTokenParam &&
      !subscriptionIdParam &&
      !completeErrorMessage &&
      (completingChapa || !draftStatus || draftStatus.status === "PENDING");
    const chapaFailed = !!draftTokenParam && !subscriptionIdParam && draftStatus?.status === "FAILED";
    const isActive = subscription?.status === "ACTIVE";
    const isPendingManual = subscription?.status === "PENDING_PAYMENT";
    const registrationComplete = isActive || isPendingManual || draftStatus?.status === "COMPLETED";

    if (chapaFailed || completeErrorMessage) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50/30 to-indigo-100 dark:from-slate-900 dark:via-indigo-950/30 dark:to-slate-900 flex items-center justify-center p-4 sm:p-6">
          <Card className="w-full max-w-md shadow-xl border-indigo-200/60 dark:border-indigo-900/50">
            <CardHeader>
              <CardTitle className="text-indigo-900 dark:text-indigo-100">
                {chapaFailed ? "Payment not completed" : "Registration could not be completed"}
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                {chapaFailed
                  ? "Your payment was not completed. Your registration details are still saved — return to the form to try again."
                  : completeErrorMessage}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" asChild>
                <Link to="/register/membership">Continue registration</Link>
              </Button>
              <Button className="w-full" variant="outline" asChild>
                <Link to="/login">Go to Login</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50/30 to-indigo-100 dark:from-slate-900 dark:via-indigo-950/30 dark:to-slate-900 flex items-center justify-center p-4 sm:p-6">
        <Card className="w-full max-w-md shadow-xl border-indigo-200/60 dark:border-indigo-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-900 dark:text-indigo-100">
              {(subLoading || waitingForChapa) ? (
                <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
              ) : (
                <Award className="h-5 w-5 text-emerald-600" />
              )}
              {(subLoading || waitingForChapa)
                ? "Processing registration…"
                : registrationComplete
                  ? "Registration successful"
                  : "Registration submitted"}
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              {(subLoading || waitingForChapa)
                ? "Please wait while we confirm your payment and complete your registration."
                : registrationComplete
                  ? "Your membership registration is complete. Sign in with the email and password you provided during registration."
                  : "Your receipt has been submitted. Sign in with your email and password. Your membership will activate once the office verifies your payment."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isActive && subscription?.certificate && (
              <Button
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={() =>
                  window.open(
                    `${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/v1/membership/certificates/by-id/${subscription.certificate!.certificateId}/download`,
                    "_blank"
                  )
                }
              >
                Download Certificate
              </Button>
            )}
            {!subLoading && !waitingForChapa && registrationComplete && !canConfirmManual && (
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" asChild>
                <Link to="/login?registered=1">Go to Login</Link>
              </Button>
            )}
            {canConfirmManual && subscriptionIdParam && (
              <Button variant="outline" className="w-full" onClick={() => navigate("/majlis/membership/members")}>
                Back to members list
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50/30 to-indigo-100 dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-900 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-xl space-y-4 sm:space-y-6">
        {!canConfirmManual && (
          <div className="flex justify-center sm:justify-end w-full">
            <p className="text-sm text-indigo-700/80 dark:text-indigo-300/80">
              Already registered?{" "}
              <Link
                to="/login"
                className="font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        )}
        {canConfirmManual && (
          <div className="flex items-center gap-4 w-full">
            <Button variant="ghost" size="sm" onClick={() => navigate("/majlis/membership")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-bold text-indigo-900 dark:text-indigo-100">Register member</h1>
          </div>
        )}
        {!canConfirmManual && (
          <div className="text-center px-2">
            <h1 className="text-xl sm:text-2xl font-bold text-indigo-900 dark:text-indigo-100">Majlis Membership Registration</h1>
            <p className="text-indigo-700/80 dark:text-indigo-300/80 text-sm mt-1">Oromia Regional Islamic Affairs Supreme Council</p>
          </div>
        )}
        <div className="space-y-2">
          <div className="flex justify-between text-xs sm:text-sm text-indigo-700/80 dark:text-indigo-300/80 font-medium">
            <span>Step {step} of 3</span>
            <span>{Math.round((step / 3) * 100)}%</span>
          </div>
          <Progress
            value={(step / 3) * 100}
            className="h-2.5 bg-indigo-200/60 dark:bg-indigo-900/30 [&>div]:bg-gradient-to-r [&>div]:from-indigo-500 [&>div]:to-indigo-600"
          />
        </div>
        <Card className="shadow-xl border-indigo-200/60 dark:border-indigo-900/50 overflow-hidden">
          <CardHeader className="bg-indigo-50/50 dark:bg-indigo-950/30 border-b border-indigo-200/40 dark:border-indigo-800/40">
            <CardTitle className="flex items-center gap-2 text-indigo-900 dark:text-indigo-100 text-lg sm:text-xl">
              {step === 1 && <UserPlus className="h-5 w-5 text-indigo-600" />}
              {step === 2 && <UserPlus className="h-5 w-5 text-indigo-600" />}
              {step === 3 && <CreditCard className="h-5 w-5 text-indigo-600" />}
              {step === 1 && "Step 1: Basic information"}
              {step === 2 && "Step 2: Category & details"}
              {step === 3 && "Step 3: Choose plan & pay"}
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              {step === 1 && (canConfirmManual ? "Enter member details (same as public form)." : "Enter your personal and contact details.")}
              {step === 2 && (canConfirmManual ? "Select category and fill required fields." : "Select your membership category and fill the required fields.")}
              {step === 3 && (canConfirmManual ? "Select a plan, then pay via Chapa or mark manual/cash payment." : "Select a plan and complete payment to activate your membership.")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 sm:pt-6">
            {step === 1 && (
              <>
                <div className="grid gap-2">
                  <RequiredLabel required>Full Name</RequiredLabel>
                  <Input value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} placeholder="Full name" className="w-full" />
                </div>
                <div className="grid gap-2">
                  <RequiredLabel required>Phone Number</RequiredLabel>
                  <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="09xxxxxxxx" className="w-full" />
                </div>
                <div className="grid gap-2">
                  {!canConfirmManual ? (
                    <RequiredLabel required>Email</RequiredLabel>
                  ) : (
                    <Label>Email (optional)</Label>
                  )}
                  <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="email@example.com" className="w-full" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Date of Birth</Label>
                    <Input type="date" value={form.dateOfBirth} onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))} className="w-full" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Gender</Label>
                    <Select value={form.gender} onValueChange={(v) => setForm((f) => ({ ...f, gender: v }))}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <OromiaLocationPicker
                  value={{ zone: form.oromiaZone, district: form.oromiaDistrict }}
                  onChange={(loc) =>
                    setForm((f) => ({ ...f, oromiaZone: loc.zone, oromiaDistrict: loc.district }))
                  }
                  districtLabel="District / Woreda"
                />
                <div className="grid gap-2">
                  <Label>Kebele(Ganda) / address</Label>
                  <Textarea value={form.addressLine} onChange={(e) => setForm((f) => ({ ...f, addressLine: e.target.value }))} placeholder="Kebele, street, or other address details..." rows={2} />
                </div>
                <div className="grid gap-2">
                  <Label>Profile photo</Label>
                  <Input type="file" accept="image/*" onChange={(e) => setForm((f) => ({ ...f, profilePhoto: e.target.files?.[0] ?? null }))} />
                </div>
                <div className="grid gap-2">
                  <Label>National ID FAN (optional)</Label>
                  <Input value={form.nationalId} onChange={(e) => setForm((f) => ({ ...f, nationalId: e.target.value }))} placeholder="National ID" />
                </div>
                {!canConfirmManual && (
                  <>
                    <div className="grid gap-2">
                      <RequiredLabel required>Password</RequiredLabel>
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        minLength={6}
                        className="w-full"
                      />
                    </div>
                    <div className="grid gap-2">
                      <RequiredLabel required>Confirm password</RequiredLabel>
                      <Input
                        type="password"
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        placeholder="Confirm password"
                        className="w-full"
                      />
                    </div>
                  </>
                )}
              </>
            )}
            {step === 2 && (
              <>
                <div className="grid gap-2">
                  <RequiredLabel required>Category</RequiredLabel>
                  <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v as MemberCategory, categoryData: {} }))}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {form.category && CATEGORY_FIELDS[form.category]?.map((field) => (
                  <div key={field.name} className="grid gap-2">
                    <Label>{field.label}</Label>
                    {field.type === "text" && (
                      <Input
                        value={(form.categoryData[field.name] as string) ?? ""}
                        onChange={(e) => setForm((f) => ({ ...f, categoryData: { ...f.categoryData, [field.name]: e.target.value } }))}
                        placeholder={field.label}
                      />
                    )}
                    {field.type === "select" && (
                      <Select
                        value={(form.categoryData[field.name] as string) ?? ""}
                        onValueChange={(v) => setForm((f) => ({ ...f, categoryData: { ...f.categoryData, [field.name]: v } }))}
                      >
                        <SelectTrigger className="w-full"><SelectValue placeholder={`Select ${field.label}`} /></SelectTrigger>
                        <SelectContent>
                          {field.options?.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                    {field.type === "multiselect" && (
                      <div className="flex flex-wrap gap-2">
                        {field.options?.map((o) => {
                          const arr = ((form.categoryData[field.name] as string[]) ?? []);
                          const checked = arr.includes(o);
                          return (
                            <Button
                              key={o}
                              type="button"
                              variant={checked ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                const next = checked ? arr.filter((x) => x !== o) : [...arr, o];
                                setForm((f) => ({ ...f, categoryData: { ...f.categoryData, [field.name]: next } }));
                              }}
                            >
                              {o}
                            </Button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
            {step === 3 && (
              <div className="space-y-4">
                {plansLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                ) : canConfirmManual && pendingSubscriptionId ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">Subscription created. Choose payment method:</p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => {
                          const pendingPlan = registrationPlans.find((p) => p.id === pendingPlanId);
                          if (!pendingSubscriptionId || !pendingPlan) return;
                          chapaMutation.mutate({
                            subscriptionId: pendingSubscriptionId,
                            feeAmount: Number(pendingPlan.feeAmount),
                          });
                        }}
                        disabled={chapaMutation.isPending}
                      >
                        {chapaMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Pay with Chapa
                      </Button>
                      <Button variant="outline" onClick={() => setStaffManualModalOpen(true)}>
                        <Banknote className="h-4 w-4 mr-2" />
                        Mark manual / cash payment
                      </Button>
                      <Button variant="ghost" onClick={() => setPendingSubscriptionId(null)}>
                        Change plan
                      </Button>
                    </div>
                  </div>
                ) : showManualForm && selectedManualPlan ? (
                  <div className="space-y-4 rounded-lg border border-indigo-200/60 dark:border-indigo-800/50 p-4 bg-indigo-50/50 dark:bg-indigo-950/30">
                    <div className="flex justify-between items-center">
                      <p className="font-medium text-indigo-900 dark:text-indigo-100">
                        Bank transfer & receipt — {selectedManualPlan.name}
                      </p>
                      <Button variant="ghost" size="sm" onClick={() => { setShowManualForm(false); setSelectedManualPlan(null); setManualBankId(""); setManualReceipt(null); }}>Cancel</Button>
                    </div>
                    <div className="grid gap-2">
                      <RequiredLabel required>Select bank</RequiredLabel>
                      <Select value={manualBankId} onValueChange={setManualBankId}>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Choose bank" /></SelectTrigger>
                        <SelectContent>
                          {BANKS.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    {manualBankId && (
                      <div className="rounded-md bg-white dark:bg-slate-900/50 p-3 text-sm border border-indigo-200/40 dark:border-indigo-800/40">
                        <p className="font-medium text-indigo-900 dark:text-indigo-100 mb-2 flex items-center gap-1"><Building2 className="h-4 w-4" /> Bank details</p>
                        {(() => {
                          const bank = BANKS.find((b) => b.id === manualBankId);
                          if (!bank) return null;
                          return (
                            <dl className="space-y-1 text-slate-600 dark:text-slate-400">
                              <div><dt className="inline font-medium">Bank:</dt> <dd className="inline">{bank.name}</dd></div>
                              <div><dt className="inline font-medium">Account name:</dt> <dd className="inline">{bank.accountName}</dd></div>
                              <div><dt className="inline font-medium">Account number:</dt> <dd className="inline font-mono">{bank.accountNumber}</dd></div>
                            </dl>
                          );
                        })()}
                        <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">Transfer the plan amount to the above account, then upload your receipt below.</p>
                      </div>
                    )}
                    <div className="grid gap-2">
                      <RequiredLabel required>Upload receipt</RequiredLabel>
                      <Input type="file" accept="image/*,.pdf" onChange={(e) => setManualReceipt(e.target.files?.[0] ?? null)} />
                    </div>
                    <Button
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                      onClick={handleManualSubmit}
                      disabled={registerManualMutation.isPending || !manualBankId || !manualReceipt}
                    >
                      {registerManualMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                      Submit registration
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {registrationPlans.map((plan) => (
                      <Card key={plan.id} className="hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors border-indigo-200/40 dark:border-indigo-800/40">
                        <CardContent className="pt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                          <div>
                            <p className="font-medium text-indigo-900 dark:text-indigo-100">{plan.name}</p>
                            <p className="text-sm text-muted-foreground">{plan.durationMonths} month(s) · {Number(plan.feeAmount)} ETB</p>
                          </div>
                          {canConfirmManual ? (
                            <Button
                              onClick={() => handleStaffSelectPlan(plan)}
                              disabled={createMemberMutation.isPending || createSubMutation.isPending}
                            >
                              {(createMemberMutation.isPending || createSubMutation.isPending) ? <Loader2 className="h-4 w-4 animate-spin" /> : "Select plan"}
                            </Button>
                          ) : (
                            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto shrink-0">
                              <Button
                                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white"
                                onClick={() => handlePublicChapa(plan)}
                                disabled={registerChapaMutation.isPending}
                              >
                                {registerChapaMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Pay with Chapa"}
                              </Button>
                              <Button
                                variant="outline"
                                className="w-full sm:w-auto"
                                onClick={() => handlePublicManual(plan)}
                                disabled={registerManualMutation.isPending}
                              >
                                Pay manually
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                {!showManualForm && !(canConfirmManual && pendingSubscriptionId) && (
                  <p className="text-xs text-muted-foreground text-center">
                    {canConfirmManual
                      ? "Select a plan, then choose Chapa or mark manual/cash payment."
                      : "Choose Chapa for online payment, or Pay manually to transfer to a bank and upload your receipt."}
                  </p>
                )}
              </div>
            )}
            <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-6 border-t border-indigo-200/40 dark:border-indigo-800/40 mt-6">
              {step > 1 ? (
                <Button
                  variant="outline"
                  className="w-full sm:w-auto order-2 sm:order-1"
                  onClick={() => {
                    if (step === 3) {
                      if (showManualForm) { setShowManualForm(false); setSelectedManualPlan(null); setManualBankId(""); setManualReceipt(null); }
                      if (canConfirmManual) {
                        setPendingSubscriptionId(null);
                        setPendingPlanId(null);
                      }
                    }
                    setStep((s) => s - 1);
                  }}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
              ) : (
                <div className="order-2 sm:order-1" />
              )}
              {step < 3 ? (
                <Button
                  className="w-full sm:w-auto ml-auto order-1 sm:order-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={handleNext}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={staffManualModalOpen}
        onOpenChange={(open) => {
          setStaffManualModalOpen(open);
          if (!open) {
            setStaffManualPaymentType("cash");
            setStaffManualBankId("");
            setStaffManualReceipt(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark manual payment</DialogTitle>
            <DialogDescription>
              Select payment type (Cash or Bank transfer). For bank transfer, choose the bank and upload the receipt. Certificate will be generated after confirmation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Payment type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={staffManualPaymentType === "cash" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStaffManualPaymentType("cash")}
                >
                  <Banknote className="h-4 w-4 mr-1.5" />
                  Cash
                </Button>
                <Button
                  type="button"
                  variant={staffManualPaymentType === "transfer" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStaffManualPaymentType("transfer")}
                >
                  <Building2 className="h-4 w-4 mr-1.5" />
                  Bank transfer
                </Button>
              </div>
            </div>

            {staffManualPaymentType === "transfer" && (
              <>
                <div className="grid gap-2">
                  <Label>Bank</Label>
                  <Select value={staffManualBankId} onValueChange={setStaffManualBankId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {BANKS.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {staffManualBankId && (
                  <div className="rounded-md bg-muted/50 p-3 text-sm border">
                    <p className="font-medium mb-2 flex items-center gap-1">
                      <Building2 className="h-4 w-4" /> Bank details
                    </p>
                    {(() => {
                      const bank = BANKS.find((b) => b.id === staffManualBankId);
                      if (!bank) return null;
                      return (
                        <dl className="space-y-1 text-muted-foreground">
                          <div><dt className="inline font-medium text-foreground">Bank:</dt> <dd className="inline">{bank.name}</dd></div>
                          <div><dt className="inline font-medium text-foreground">Account name:</dt> <dd className="inline">{bank.accountName}</dd></div>
                          <div><dt className="inline font-medium text-foreground">Account number:</dt> <dd className="inline font-mono">{bank.accountNumber}</dd></div>
                        </dl>
                      );
                    })()} 
                  </div>
                )}
              </>
            )}

            <div className="grid gap-2">
              <Label>
                Receipt {staffManualPaymentType === "transfer" ? "(required for bank transfer)" : "(optional)"}
              </Label>
              <Input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setStaffManualReceipt(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStaffManualModalOpen(false)}>Cancel</Button>
            <Button
              onClick={() => pendingSubscriptionId && confirmManualMutation.mutate(pendingSubscriptionId)}
              disabled={
                confirmManualMutation.isPending ||
                (staffManualPaymentType === "transfer" && (!staffManualBankId || !staffManualReceipt))
              }
            >
              {confirmManualMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
