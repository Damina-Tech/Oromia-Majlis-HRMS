"use client";
import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const RequiredLabel = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <Label>
    {children}
    {required && <span className="text-destructive ml-0.5">*</span>}
  </Label>
);

const BANKS = [
  { id: "cbe", name: "Commercial Bank of Ethiopia", accountName: "Oromia Majlis", accountNumber: "1000123456789", swiftCode: "CBETETAA" },
  { id: "hijra", name: "Hijra Bank", accountName: "Oromia Majlis", accountNumber: "1000123456789", swiftCode: "HIJRAETAA" },
  { id: "awash", name: "Awash Bank", accountName: "Oromia Majlis", accountNumber: "0132081234567", swiftCode: "AWINETAA" },
  { id: "dashen", name: "Dashen Bank", accountName: "Oromia Majlis", accountNumber: "0168123456789", swiftCode: "DASHETAA" },
  { id: "boi", name: "Bank of Abyssinia", accountName: "Oromia Majlis", accountNumber: "1000123456789", swiftCode: "ABYSETAA" },
];

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
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const stepParam = searchParams.get("step");
  const subscriptionIdParam = searchParams.get("subscriptionId");

  const [showManualForm, setShowManualForm] = useState(false);
  const [manualSubscriptionId, setManualSubscriptionId] = useState<string | null>(null);
  const [manualBankId, setManualBankId] = useState<string>("");
  const [manualReceipt, setManualReceipt] = useState<File | null>(null);
  const [accountPassword, setAccountPassword] = useState("");
  const [accountPasswordConfirm, setAccountPasswordConfirm] = useState("");

  const [pendingSubscriptionId, setPendingSubscriptionId] = useState<string | null>(null);
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
    regionId: "",
    zoneId: "",
    woredaId: "",
    addressLine: "",
    nationalId: "",
    profilePhoto: null as File | null,
    category: "" as MemberCategory | "",
    categoryData: {} as Record<string, unknown>,
  });

  const { data: regions } = useQuery({
    queryKey: ["membership-regions"],
    queryFn: () => membershipApi.regions.list(),
  });
  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ["membership-plans-active"],
    queryFn: () => membershipApi.plans.listActive(),
    enabled: step >= 3,
  });
  const { data: subscription, isLoading: subLoading } = useQuery({
    queryKey: ["membership-subscription", subscriptionIdParam],
    queryFn: () => membershipApi.subscriptions.get(subscriptionIdParam!),
    enabled: !!subscriptionIdParam && stepParam === "success",
  });

  const createMemberMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("fullName", form.fullName);
      formData.append("phone", form.phone);
      if (form.email) formData.append("email", form.email);
      if (form.dateOfBirth) formData.append("dateOfBirth", form.dateOfBirth);
      if (form.gender) formData.append("gender", form.gender);
      if (form.regionId) formData.append("regionId", form.regionId);
      if (form.zoneId) formData.append("zoneId", form.zoneId);
      if (form.woredaId) formData.append("woredaId", form.woredaId);
      if (form.addressLine) formData.append("addressLine", form.addressLine);
      if (form.nationalId) formData.append("nationalId", form.nationalId);
      formData.append("category", form.category);
      formData.append("categoryData", JSON.stringify(form.categoryData));
      if (form.profilePhoto) formData.append("profilePhoto", form.profilePhoto);
      return membershipApi.members.create(formData);
    },
    onSuccess: (data) => {
      setMemberId(data.id);
      setStep(3);
      toast.success(canConfirmManual ? "Member registered. Select plan and payment method." : "Registration complete. Choose your plan.");
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message ?? "Registration failed");
    },
  });

  const chapaMutation = useMutation({
    mutationFn: (subId: string) => membershipApi.subscriptions.initChapa(subId),
    onSuccess: (data) => {
      window.location.href = data.checkoutUrl;
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message ?? "Payment initiation failed");
    },
  });

  const createSubMutation = useMutation({
    mutationFn: ({ planId }: { planId: string; isManual?: boolean; isStaff?: boolean }) =>
      membershipApi.subscriptions.create({ memberId: memberId!, planId }),
    onSuccess: (data, variables) => {
      const v = variables as { isManual?: boolean; isStaff?: boolean };
      if (v.isStaff) {
        setPendingSubscriptionId(data.subscription.id);
        toast.success("Subscription created. Choose payment: Chapa or mark manual.");
        return;
      }
      const isManual = v.isManual;
      if (isManual) {
        setManualSubscriptionId(data.subscription.id);
        setShowManualForm(true);
        toast.success("Transfer the amount and upload your receipt. Payment will stay pending until verified by the office.");
      } else {
        setSubscriptionId(data.subscription.id);
        toast.success("Redirecting to payment…");
        chapaMutation.mutate(data.subscription.id);
      }
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message ?? "Failed to create subscription");
    },
  });

  const manualPaymentMutation = useMutation({
    mutationFn: (subId: string) => {
      const formData = new FormData();
      if (manualReceipt) formData.append("receipt", manualReceipt);
      const bank = BANKS.find((b) => b.id === manualBankId);
      if (bank?.name) formData.append("bankName", bank.name);
      return membershipApi.subscriptions.confirmManualPublic(subId, formData);
    },
    onSuccess: (_, subId) => {
      setShowManualForm(false);
      setManualSubscriptionId(null);
      setManualBankId("");
      setManualReceipt(null);
      navigate(`/register/membership?step=success&subscriptionId=${subId}`);
      window.location.reload();
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message ?? "Failed to submit receipt");
    },
  });

  const completeAccountMutation = useMutation({
    mutationFn: (subId: string) => membershipApi.subscriptions.completeAccount(subId, accountPassword),
    onSuccess: () => {
      toast.success("Account created. Please sign in.");
      navigate("/login?registered=1");
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message ?? "Failed to create account");
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

  const selectedRegion = regions?.find((r) => r.id === form.regionId);
  const selectedZone = selectedRegion?.zones?.find((z) => z.id === form.zoneId);
  const woredas = selectedZone?.woredas ?? [];

  const handleNext = () => {
    if (step === 1) {
      if (!form.fullName.trim() || !form.phone.trim()) {
        toast.error("Full name and phone are required");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!form.category) {
        toast.error("Please select a category");
        return;
      }
      createMemberMutation.mutate();
    }
  };

  const handleSelectPlan = (plan: MembershipPlan, isManual = false) => {
    if (!memberId) return;
    if (canConfirmManual) {
      createSubMutation.mutate({ planId: plan.id, isStaff: true });
    } else {
      createSubMutation.mutate({ planId: plan.id, isManual });
    }
  };

  const handleManualSubmit = () => {
    if (!manualSubscriptionId) return;
    if (!manualBankId) {
      toast.error("Please select a bank");
      return;
    }
    if (!manualReceipt) {
      toast.error("Please upload your payment receipt");
      return;
    }
    manualPaymentMutation.mutate(manualSubscriptionId);
  };

  const handleCompleteAccount = () => {
    if (!subscriptionIdParam) return;
    if (!accountPassword || accountPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (accountPassword !== accountPasswordConfirm) {
      toast.error("Passwords do not match");
      return;
    }
    completeAccountMutation.mutate(subscriptionIdParam);
  };


  if (stepParam === "success" && subscriptionIdParam) {
    const member = subscription?.member;
    const hasEmail = member?.email && member.email.trim().length > 0;
    // Allow account setup immediately for ACTIVE or PENDING_PAYMENT (manual receipt submitted, awaiting admin verification)
    const needsAccount = hasEmail && !member?.userId && (subscription?.status === "ACTIVE" || subscription?.status === "PENDING_PAYMENT");

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50/30 to-indigo-100 dark:from-slate-900 dark:via-indigo-950/30 dark:to-slate-900 flex items-center justify-center p-4 sm:p-6">
        <Card className="w-full max-w-md shadow-xl border-indigo-200/60 dark:border-indigo-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-900 dark:text-indigo-100">
              {subLoading ? <Loader2 className="h-5 w-5 animate-spin text-indigo-600" /> : <Award className="h-5 w-5 text-emerald-600" />}
              {subLoading ? "Loading…" : subscription?.status === "ACTIVE" ? "Payment successful" : "Payment pending verification"}
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              {subLoading
                ? "Checking your payment status…"
                : subscription?.status === "ACTIVE"
                  ? "Your membership is active. You can download your certificate below."
                  : "Your receipt has been submitted. Set up your account below so you can sign in once the office verifies your payment. Return to this page later to check status or download your certificate once approved."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscription?.status === "ACTIVE" && subscription?.certificate && (
              <Button
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={() => window.open(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/v1/membership/certificates/by-id/${subscription.certificate!.certificateId}/download`, "_blank")}
              >
                Download Certificate
              </Button>
            )}
            {needsAccount && (
              <div className="rounded-lg border border-indigo-200/60 dark:border-indigo-800/50 p-4 space-y-3 bg-indigo-50/50 dark:bg-indigo-950/30">
                <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                  {subscription?.status === "PENDING_PAYMENT" ? "Set up your account now" : "Create account to access your member portal"}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {subscription?.status === "PENDING_PAYMENT"
                    ? "Create your password now. Once the office verifies your payment, you can sign in and access your member portal."
                    : "Sign in with your email after creating your password."}
                </p>
                {member?.email && (
                  <div className="grid gap-2">
                    <Label>Email</Label>
                    <Input value={member.email} readOnly className="bg-muted/50 cursor-not-allowed" />
                  </div>
                )}
                <div className="grid gap-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    placeholder="At least 6 characters"
                    value={accountPassword}
                    onChange={(e) => setAccountPassword(e.target.value)}
                    minLength={6}
                  />
                  <Label>Confirm password</Label>
                  <Input
                    type="password"
                    placeholder="Confirm password"
                    value={accountPasswordConfirm}
                    onChange={(e) => setAccountPasswordConfirm(e.target.value)}
                  />
                  <Button
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={handleCompleteAccount}
                    disabled={completeAccountMutation.isPending || !accountPassword || accountPassword.length < 6 || accountPassword !== accountPasswordConfirm}
                  >
                    {completeAccountMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Create account & sign in
                  </Button>
                </div>
              </div>
            )}
            {subscription?.status === "ACTIVE" && !needsAccount && hasEmail && member?.userId && (
              <Button className="w-full" variant="outline" onClick={() => navigate("/login")}>
                Sign in to your account
              </Button>
            )}
            {subscription?.status === "ACTIVE" && !hasEmail && (
              <p className="text-xs text-slate-600 dark:text-slate-400 text-center">
                Contact the office to link your account for portal access. Your certificate is ready for download above.
              </p>
            )}
            {canConfirmManual && (
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
                  <Label>Email (optional)</Label>
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
                <div className="grid gap-2">
                  <Label>Region</Label>
                  <Select value={form.regionId} onValueChange={(v) => setForm((f) => ({ ...f, regionId: v, zoneId: "", woredaId: "" }))}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select region" /></SelectTrigger>
                    <SelectContent>
                      {regions?.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {selectedRegion?.zones && selectedRegion.zones.length > 0 && (
                  <div className="grid gap-2">
                    <Label>Zone</Label>
                    <Select value={form.zoneId} onValueChange={(v) => setForm((f) => ({ ...f, zoneId: v, woredaId: "" }))}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select zone" /></SelectTrigger>
                      <SelectContent>
                        {selectedRegion.zones.map((z) => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {woredas.length > 0 && (
                  <div className="grid gap-2">
                    <Label>Woreda</Label>
                    <Select value={form.woredaId} onValueChange={(v) => setForm((f) => ({ ...f, woredaId: v }))}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select woreda" /></SelectTrigger>
                      <SelectContent>
                        {woredas.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid gap-2">
                  <Label>Kebele (optional)</Label>
                  <Textarea value={form.addressLine} onChange={(e) => setForm((f) => ({ ...f, addressLine: e.target.value }))} placeholder="Street, city..." rows={2} />
                </div>
                <div className="grid gap-2">
                  <Label>Profile photo</Label>
                  <Input type="file" accept="image/*" onChange={(e) => setForm((f) => ({ ...f, profilePhoto: e.target.files?.[0] ?? null }))} />
                </div>
                <div className="grid gap-2">
                  <Label>National ID (optional)</Label>
                  <Input value={form.nationalId} onChange={(e) => setForm((f) => ({ ...f, nationalId: e.target.value }))} placeholder="National ID" />
                </div>
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
                        onClick={() => chapaMutation.mutate(pendingSubscriptionId)}
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
                ) : showManualForm && manualSubscriptionId ? (
                  <div className="space-y-4 rounded-lg border border-indigo-200/60 dark:border-indigo-800/50 p-4 bg-indigo-50/50 dark:bg-indigo-950/30">
                    <div className="flex justify-between items-center">
                      <p className="font-medium text-indigo-900 dark:text-indigo-100">Bank transfer & receipt upload</p>
                      <Button variant="ghost" size="sm" onClick={() => { setShowManualForm(false); setManualSubscriptionId(null); setManualBankId(""); setManualReceipt(null); }}>Cancel</Button>
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
                      disabled={manualPaymentMutation.isPending || !manualBankId || !manualReceipt}
                    >
                      {manualPaymentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                      Submit receipt
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {plans?.map((plan) => (
                      <Card key={plan.id} className="hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors border-indigo-200/40 dark:border-indigo-800/40">
                        <CardContent className="pt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                          <div>
                            <p className="font-medium text-indigo-900 dark:text-indigo-100">{plan.name}</p>
                            <p className="text-sm text-muted-foreground">{plan.durationMonths} month(s) · {Number(plan.feeAmount)} ETB</p>
                          </div>
                          {canConfirmManual ? (
                            <Button
                              onClick={() => handleSelectPlan(plan)}
                              disabled={createSubMutation.isPending}
                            >
                              {createSubMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Select plan"}
                            </Button>
                          ) : (
                            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto shrink-0">
                              <Button
                                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white"
                                onClick={() => handleSelectPlan(plan, false)}
                                disabled={createSubMutation.isPending || chapaMutation.isPending}
                              >
                                {(createSubMutation.isPending || chapaMutation.isPending) ? <Loader2 className="h-4 w-4 animate-spin" /> : "Pay with Chapa"}
                              </Button>
                              <Button
                                variant="outline"
                                className="w-full sm:w-auto"
                                onClick={() => handleSelectPlan(plan, true)}
                                disabled={createSubMutation.isPending || manualPaymentMutation.isPending}
                              >
                                {createSubMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Pay manually"}
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
                      if (showManualForm) { setShowManualForm(false); setManualSubscriptionId(null); setManualBankId(""); setManualReceipt(null); }
                      if (canConfirmManual) setPendingSubscriptionId(null);
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
                  disabled={createMemberMutation.isPending}
                >
                  {createMemberMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {step === 1 ? "Next" : step === 2 ? "Complete registration" : null}
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
