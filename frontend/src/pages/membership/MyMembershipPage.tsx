"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  User,
  Award,
  CreditCard,
  ExternalLink,
  AlertTriangle,
  FileText,
  Banknote,
  Loader2,
  Upload,
  Pencil,
  Eye,
} from "lucide-react";
import { membershipApi, type MembershipPlan, type MembershipPayment, type MemberCategory } from "@/services/membership";
import api from "@/services/api";
import { API_BASE_URL, resolveFileUrl, resolveAvatarUrl } from "@/config/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

const CATEGORY_LABELS: Record<string, string> = {
  REGULAR_MEMBER: "Regular Member",
  BUSINESS_OWNER: "Business Owner",
  YOUTH_WOMEN_COUNCIL: "Youth/Women Council",
  FARMER: "Farmer",
  ELDER_MOTHER: "Elder/Mother",
};

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

const BANKS = [
  { id: "cbe", name: "Commercial Bank of Ethiopia", accountName: "Oromia Majlis", accountNumber: "1000123456789" },
  { id: "awash", name: "Awash Bank", accountName: "Oromia Majlis", accountNumber: "0132081234567" },
  { id: "dashen", name: "Dashen Bank", accountName: "Oromia Majlis", accountNumber: "0168123456789" },
  { id: "boi", name: "Bank of Abyssinia", accountName: "Oromia Majlis", accountNumber: "1000123456789" },
];

function daysUntil(date: string | null | undefined): number | null {
  if (!date) return null;
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function paymentStatusBadgeClass(status: string) {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-600 hover:bg-emerald-600 text-white";
    case "PENDING":
      return "bg-amber-600 hover:bg-amber-600 text-white";
    case "FAILED":
      return "bg-red-600 hover:bg-red-600 text-white";
    default:
      return "bg-slate-600 hover:bg-slate-600 text-white";
  }
}

function certificateStatusBadgeClass(status: "ACTIVE" | "EXPIRED" | "UNKNOWN") {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-600 hover:bg-emerald-600 text-white";
    case "EXPIRED":
      return "bg-red-600 hover:bg-red-600 text-white";
    default:
      return "bg-slate-600 hover:bg-slate-600 text-white";
  }
}

export default function MyMembershipPage() {
  const queryClient = useQueryClient();
  const [renewPlanId, setRenewPlanId] = useState<string>("");
  const [showManualForm, setShowManualForm] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [manualSubscriptionId, setManualSubscriptionId] = useState<string | null>(null);
  const [manualBankId, setManualBankId] = useState("");
  const [manualReceipt, setManualReceipt] = useState<File | null>(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [showCertPreview, setShowCertPreview] = useState(false);
  const [certPreviewBlobUrl, setCertPreviewBlobUrl] = useState<string | null>(null);
  const [certPreviewLoading, setCertPreviewLoading] = useState(false);
  const [certPreviewError, setCertPreviewError] = useState<string | null>(null);
  const profilePhotoInputRef = React.useRef<HTMLInputElement | null>(null);
  const certPreviewBlobUrlRef = React.useRef<string | null>(null);
  const [editForm, setEditForm] = useState({
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
    category: "" as MemberCategory | "",
    categoryData: {} as Record<string, unknown>,
  });

  const { data: member, isLoading, error } = useQuery({
    queryKey: ["membership-me"],
    queryFn: () => membershipApi.members.getMe(),
    retry: false,
  });

  const { data: plans = [] } = useQuery({
    queryKey: ["membership-plans-active"],
    queryFn: () => membershipApi.plans.listActive(),
    enabled: !!member,
  });

  const { data: regions } = useQuery({
    queryKey: ["membership-regions"],
    queryFn: () => membershipApi.regions.list(),
    enabled: showEditModal,
  });

  const renewMutation = useMutation({
    mutationFn: ({ planId, isManual }: { planId: string; isManual?: boolean }) =>
      membershipApi.subscriptions.renew(planId),
    onSuccess: (data, variables) => {
      const isManual = variables.isManual;
      if (isManual) {
        setManualSubscriptionId(data.subscription.id);
        setShowManualForm(true);
        toast.success("Transfer the amount and upload your receipt. Payment will stay pending until verified by the office.");
      } else {
        toast.success("Redirecting to payment…");
        membershipApi.subscriptions.initChapa(data.subscription.id).then((r) => {
          window.location.href = r.checkoutUrl;
        }).catch((e: any) => toast.error(e.response?.data?.message ?? "Payment failed"));
      }
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message ?? "Failed to create renewal");
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: Record<string, unknown> | FormData) => membershipApi.members.updateMe(data),
    onSuccess: () => {
      setShowEditModal(false);
      setProfilePhotoFile(null);
      setProfilePhotoPreview(null);
      queryClient.invalidateQueries({ queryKey: ["membership-me"] });
      toast.success("Profile updated successfully");
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message ?? "Failed to update profile");
    },
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("fullName", member!.fullName);
      formData.append("phone", member!.phone);
      if (member!.email) formData.append("email", member!.email);
      if (member!.dateOfBirth) formData.append("dateOfBirth", member!.dateOfBirth);
      if (member!.gender) formData.append("gender", member!.gender);
      if (member!.regionId) formData.append("regionId", member!.regionId);
      if (member!.zoneId) formData.append("zoneId", member!.zoneId);
      if (member!.woredaId) formData.append("woredaId", member!.woredaId);
      if (member!.addressLine) formData.append("addressLine", member!.addressLine);
      if (member!.nationalId) formData.append("nationalId", member!.nationalId);
      formData.append("category", member!.category);
      formData.append("categoryData", JSON.stringify(member!.categoryData ?? {}));
      formData.append("profilePhoto", file);
      return membershipApi.members.updateMe(formData);
    },
    onSuccess: () => {
      setProfilePhotoFile(null);
      setProfilePhotoPreview(null);
      queryClient.invalidateQueries({ queryKey: ["membership-me"] });
      toast.success("Profile photo updated");
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message ?? "Failed to update photo");
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
    onSuccess: () => {
      setShowManualForm(false);
      setShowRenewModal(false);
      setManualSubscriptionId(null);
      setManualBankId("");
      setManualReceipt(null);
      queryClient.invalidateQueries({ queryKey: ["membership-me"] });
      toast.success("Receipt submitted. Your payment is pending verification by the office. You will be notified when it is approved.");
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message ?? "Failed to submit receipt");
    },
  });

  const selectedRegion = regions?.find((r) => r.id === editForm.regionId);
  const selectedZone = selectedRegion?.zones?.find((z) => z.id === editForm.zoneId);
  const woredas = selectedZone?.woredas ?? [];

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !member) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    const preview = URL.createObjectURL(file);
    setProfilePhotoPreview(preview);
    setProfilePhotoFile(file);
    uploadPhotoMutation.mutate(file);
    e.target.value = "";
  };

  useEffect(() => {
    return () => {
      if (profilePhotoPreview?.startsWith("blob:")) URL.revokeObjectURL(profilePhotoPreview);
    };
  }, [profilePhotoPreview]);

  // Certificate ID for preview modal (derived from member so effect can run before early returns)
  const subscriptionsForCert = member?.subscriptions ?? [];
  const activeSubForCert = subscriptionsForCert.find((s) => s.status === "ACTIVE");
  const activeCertForCert = activeSubForCert?.certificate;
  const latestCertSubForCert = subscriptionsForCert
    .filter((s) => s.certificate)
    .sort((a, b) => {
      const aExp = a.certificate?.expiresAt ? new Date(a.certificate.expiresAt).getTime() : 0;
      const bExp = b.certificate?.expiresAt ? new Date(b.certificate.expiresAt).getTime() : 0;
      return bExp - aExp;
    })[0];
  const previewCertId = latestCertSubForCert?.certificate?.certificateId ?? activeCertForCert?.certificateId;

  // Load certificate PDF as blob for modal preview (so it displays in iframe instead of downloading)
  useEffect(() => {
    if (!showCertPreview || !previewCertId) {
      if (certPreviewBlobUrlRef.current) {
        URL.revokeObjectURL(certPreviewBlobUrlRef.current);
        certPreviewBlobUrlRef.current = null;
      }
      setCertPreviewBlobUrl(null);
      setCertPreviewError(null);
      return;
    }
    let cancelled = false;
    setCertPreviewLoading(true);
    setCertPreviewError(null);
    api
      .get(`/membership/certificates/by-id/${previewCertId}/download`, { responseType: "blob" })
      .then((res) => {
        if (cancelled) return;
        const blob = res.data as Blob;
        const url = URL.createObjectURL(blob);
        certPreviewBlobUrlRef.current = url;
        setCertPreviewBlobUrl(url);
        setCertPreviewLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setCertPreviewError(err.response?.data?.message ?? "Failed to load certificate");
        setCertPreviewLoading(false);
      });
    return () => {
      cancelled = true;
      if (certPreviewBlobUrlRef.current) {
        URL.revokeObjectURL(certPreviewBlobUrlRef.current);
        certPreviewBlobUrlRef.current = null;
      }
      setCertPreviewBlobUrl(null);
    };
  }, [showCertPreview, previewCertId]);

  useEffect(() => {
    if (showEditModal && member) {
      setEditForm({
        fullName: member.fullName ?? "",
        phone: member.phone ?? "",
        email: member.email ?? "",
        dateOfBirth: member.dateOfBirth ? new Date(member.dateOfBirth).toISOString().slice(0, 10) : "",
        gender: member.gender ?? "",
        regionId: member.regionId ?? "",
        zoneId: member.zoneId ?? "",
        woredaId: member.woredaId ?? "",
        addressLine: member.addressLine ?? "",
        nationalId: member.nationalId ?? "",
        category: member.category ?? "",
        categoryData: (member.categoryData as Record<string, unknown>) ?? {},
      });
    }
  }, [showEditModal, member]);

  const handleEditSave = () => {
    if (!editForm.fullName.trim() || !editForm.phone.trim()) {
      toast.error("Full name and phone are required");
      return;
    }
    if (!editForm.category) {
      toast.error("Please select a category");
      return;
    }
    updateProfileMutation.mutate({
      fullName: editForm.fullName,
      phone: editForm.phone,
      email: editForm.email || undefined,
      dateOfBirth: editForm.dateOfBirth || undefined,
      gender: editForm.gender || undefined,
      regionId: editForm.regionId || undefined,
      zoneId: editForm.zoneId || undefined,
      woredaId: editForm.woredaId || undefined,
      addressLine: editForm.addressLine || undefined,
      nationalId: editForm.nationalId || undefined,
      category: editForm.category,
      categoryData: editForm.categoryData,
    });
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="p-4 sm:p-6 max-w-xl mx-auto">
        <Card className="border-indigo-200/50 dark:border-indigo-800/30">
          <CardHeader>
            <CardTitle>My Membership</CardTitle>
            <CardDescription>
              No member profile is linked to your account. If you have registered for Majlis membership, ask an administrator to link your account to your member record.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <a href="/register/membership" target="_blank" rel="noopener noreferrer">
                Register for membership <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const subscriptions = member.subscriptions ?? [];
  const activeSub = subscriptions.find((s) => s.status === "ACTIVE");
  const activeCert = activeSub?.certificate;
  const latestCertSub = subscriptions
    .filter((s) => s.certificate)
    .sort((a, b) => {
      const aExp = a.certificate?.expiresAt ? new Date(a.certificate.expiresAt).getTime() : 0;
      const bExp = b.certificate?.expiresAt ? new Date(b.certificate.expiresAt).getTime() : 0;
      return bExp - aExp;
    })[0];
  const previewCert = latestCertSub?.certificate ?? activeCert;

  // Merge subscriptions with payments into flat rows for the table
  type MergedRow = {
    sub: typeof subscriptions[0];
    pay?: MembershipPayment;
    key: string;
  };
  const mergedRows: MergedRow[] = [];
  for (const sub of subscriptions) {
    const pays = sub.payments ?? [];
    if (pays.length === 0) {
      mergedRows.push({ sub, key: sub.id });
    } else {
      for (const pay of pays) {
        mergedRows.push({ sub, pay, key: `${sub.id}-${pay.id}` });
      }
    }
  }
  mergedRows.sort((a, b) => {
    const aDate = a.pay?.paidAt ?? a.pay?.createdAt ?? a.sub.createdAt;
    const bDate = b.pay?.paidAt ?? b.pay?.createdAt ?? b.sub.createdAt;
    return new Date(bDate || 0).getTime() - new Date(aDate || 0).getTime();
  });

  const daysLeft = activeCert ? daysUntil(activeCert.expiresAt) : null;
  const showRenewalNotification = daysLeft !== null && daysLeft <= 30 && daysLeft > 0;

  const handleRenewChapa = () => {
    if (!renewPlanId) {
      toast.error("Please select a plan");
      return;
    }
    renewMutation.mutate({ planId: renewPlanId, isManual: false });
  };

  const handleRenewManual = () => {
    if (!renewPlanId) {
      toast.error("Please select a plan");
      return;
    }
    renewMutation.mutate({ planId: renewPlanId, isManual: true });
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

  const verifyUrl =
    typeof window !== "undefined" && previewCert?.certificateId
      ? `${window.location.origin}/verify/membership/${previewCert.certificateId}`
      : "";

  const certDaysLeft = previewCert ? daysUntil(previewCert.expiresAt) : null;
  const certStatus: "ACTIVE" | "EXPIRED" | "UNKNOWN" =
    previewCert && latestCertSub?.status === "ACTIVE" && (certDaysLeft ?? 0) > 0
      ? "ACTIVE"
      : previewCert
        ? "EXPIRED"
        : "UNKNOWN";

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 sm:space-y-8">
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-500/15 via-purple-500/10 to-transparent dark:from-indigo-600/25 dark:via-purple-600/15 border border-indigo-200/50 dark:border-indigo-800/30 p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-indigo-900 dark:text-indigo-100">
          My Membership
        </h1>
        <p className="text-indigo-700/80 dark:text-indigo-300/80 text-sm sm:text-base mt-1">
          Your Majlis membership profile, certificates, and renewal
        </p>
      </div>

      {showRenewalNotification && (
        <Card className="border-amber-200 dark:border-amber-800/60 bg-amber-50/80 dark:bg-amber-950/30">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200 text-lg">
              <AlertTriangle className="h-5 w-5" />
              Renewal reminder
            </CardTitle>
            <CardDescription className="text-amber-700 dark:text-amber-300/90">
              Your membership expires in <strong>{daysLeft} day{daysLeft !== 1 ? "s" : ""}</strong>.
              Renew now to avoid interruption.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => setShowRenewModal(true)}
            >
              Renew now
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="lg:col-span-2 border-indigo-200/50 dark:border-indigo-800/30">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-indigo-900 dark:text-indigo-100">
                <User className="h-5 w-5" /> Profile
              </CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowEditModal(true)} className="shrink-0">
              <Pencil className="h-4 w-4 mr-1.5" />
              Edit
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-2">
              <input
                ref={profilePhotoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoSelect}
              />
              <button
                type="button"
                onClick={() => !uploadPhotoMutation.isPending && profilePhotoInputRef.current?.click()}
                disabled={uploadPhotoMutation.isPending}
                className="relative shrink-0 rounded-full overflow-hidden border-2 border-indigo-200/50 dark:border-indigo-800/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70 group"
              >
                {profilePhotoPreview ? (
                  <img
                    src={profilePhotoPreview}
                    alt={member.fullName}
                    className="h-24 w-24 object-cover"
                  />
                ) : member.profilePhotoUrl ? (
                  <img
                    src={resolveAvatarUrl(member.profilePhotoUrl)}
                    alt={member.fullName}
                    className="h-24 w-24 object-cover"
                  />
                ) : (
                  <div className="h-24 w-24 bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                    <User className="h-12 w-12 text-indigo-500 dark:text-indigo-400" />
                  </div>
                )}
                {uploadPhotoMutation.isPending && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors rounded-full">
                  <Pencil className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
              <div className="flex flex-col gap-1 text-center sm:text-left">
                <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">{member.fullName}</h3>
                <Badge variant="secondary" className="w-fit bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200">
                  {CATEGORY_LABELS[member.category] ?? member.category}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">Click photo to change</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Phone</p>
                <p className="font-medium">{member.phone}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Email</p>
                <p className="font-medium">{member.email ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Date of birth</p>
                <p className="font-medium">{member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString() : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Gender</p>
                <p className="font-medium">{member.gender ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">National ID</p>
                <p className="font-medium">{member.nationalId ?? "—"}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Address</p>
                <p className="font-medium">
                  {member.region
                    ? `${member.region.name}${member.zone ? ` / ${member.zone.name}` : ""}${member.woreda ? ` / ${member.woreda.name}` : ""}${member.addressLine ? ` / ${member.addressLine}` : ""}`
                    : "—"}
                </p>
              </div>
            </div>
            {member.category && CATEGORY_FIELDS[member.category]?.length > 0 && (
              <div className="pt-2 border-t border-indigo-200/30 dark:border-indigo-800/20">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Category details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {CATEGORY_FIELDS[member.category].map((field) => {
                    const val = member.categoryData?.[field.name];
                    const display =
                      val === undefined || val === null
                        ? "—"
                        : Array.isArray(val)
                          ? (val as string[]).join(", ")
                          : String(val);
                    return (
                      <div key={field.name}>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">{field.label}</p>
                        <p className="font-medium">{display}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="pt-2 border-t border-indigo-200/30 dark:border-indigo-800/20 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div>
                <p className="uppercase tracking-wider">Member since</p>
                <p>{new Date(member.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="uppercase tracking-wider">Last updated</p>
                <p>{new Date(member.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {previewCert && (
          <Card className="border-indigo-200/50 dark:border-indigo-800/30 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-indigo-900 dark:text-indigo-100 text-base">
                <Award className="h-4 w-4" /> Certificate preview
              </CardTitle>
              <CardDescription className="text-xs">Scan to verify</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-4">
                <div className="w-24 h-24 flex items-center justify-center rounded bg-white dark:bg-slate-900 border border-indigo-200/50 dark:border-indigo-800/50 p-2">
                  <QRCodeSVG value={verifyUrl} size={80} level="M" />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Certificate ID</p>
                      <p className="font-mono font-medium truncate">{previewCert.certificateId}</p>
                    </div>
                    <Badge className={certificateStatusBadgeClass(certStatus)}>{certStatus}</Badge>
                  </div>

                  {certStatus === "ACTIVE" && (
                    <div className="text-xs text-muted-foreground">
                      Valid: {new Date(previewCert.issuedAt).toLocaleDateString()} – {new Date(previewCert.expiresAt).toLocaleDateString()}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => setShowCertPreview(true)}>
                      <Eye className="h-4 w-4 mr-1.5" />
                      Preview
                    </Button>
                    {certStatus === "ACTIVE" ? (
                      <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" asChild>
                        <a
                          href={`${API_BASE_URL}/api/v1/membership/certificates/by-id/${previewCert.certificateId}/download`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Award className="h-4 w-4 mr-1.5" />
                          Download
                        </a>
                      </Button>
                    ) : (
                      <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" disabled title={certStatus === "EXPIRED" ? "Certificate has expired" : "Download available when plan is active"}>
                        <Award className="h-4 w-4 mr-1.5" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="border-indigo-200/50 dark:border-indigo-800/30">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-indigo-900 dark:text-indigo-100">
              <CreditCard className="h-5 w-5" /> Membership & payments
            </CardTitle>
            <CardDescription>
              Plan details, subscription status, payment history (method, status), and receipts
            </CardDescription>
          </div>
          {previewCert && (
            <Button variant="outline" size="sm" onClick={() => setShowCertPreview(true)} className="shrink-0">
              <Eye className="h-4 w-4 mr-1.5" />
              Preview certificate
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {mergedRows.length === 0 ? (
            <p className="text-muted-foreground text-sm">No subscriptions or payments yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-indigo-200/50 dark:border-indigo-800/30">
              <Table>
                <TableHeader>
                  <TableRow className="border-indigo-200/50 dark:border-indigo-800/30">
                    <TableHead className="whitespace-nowrap">Plan</TableHead>
                    <TableHead className="whitespace-nowrap">Period</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="whitespace-nowrap">Method</TableHead>
                    <TableHead className="whitespace-nowrap">Payment</TableHead>
                    <TableHead className="whitespace-nowrap">Receipt</TableHead>
                    <TableHead className="whitespace-nowrap">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mergedRows.map((row) => (
                    <TableRow key={row.key} className="border-indigo-200/30 dark:border-indigo-800/20">
                      <TableCell className="font-medium">{row.sub.plan?.name ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.sub.startDate && row.sub.endDate
                          ? `${new Date(row.sub.startDate).toLocaleDateString()} – ${new Date(row.sub.endDate).toLocaleDateString()}`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={row.sub.status === "ACTIVE" ? "default" : row.sub.status === "PENDING_PAYMENT" ? "secondary" : "outline"}>
                          {row.sub.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>{row.pay ? row.pay.method : "—"}</TableCell>
                      <TableCell>
                        {row.pay ? (
                          <Badge className={paymentStatusBadgeClass(row.pay.status)}>{row.pay.status}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Awaiting</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {row.pay?.method === "MANUAL" && row.pay?.receiptUrl ? (
                          <a
                            href={resolveFileUrl(row.pay.receiptUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:underline text-sm flex items-center gap-1"
                          >
                            <ExternalLink className="h-4 w-4" />
                            View
                          </a>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {row.pay?.paidAt
                          ? new Date(row.pay.paidAt).toLocaleDateString(undefined, { dateStyle: "medium" })
                          : row.pay?.createdAt
                            ? new Date(row.pay.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })
                            : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCertPreview} onOpenChange={setShowCertPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col border-indigo-200/50 dark:border-indigo-800/30 p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-indigo-900 dark:text-indigo-100">Membership certificate</DialogTitle>
            <DialogDescription>Preview your certificate below. Download is available only for active, non-expired plans.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 px-6 overflow-hidden flex flex-col min-h-[60vh]">
            {certPreviewLoading && (
              <div className="flex-1 flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent" />
              </div>
            )}
            {certPreviewError && !certPreviewLoading && (
              <div className="flex-1 flex items-center justify-center py-12 text-destructive text-sm">
                {certPreviewError}
              </div>
            )}
            {certPreviewBlobUrl && !certPreviewLoading && !certPreviewError && (
              <iframe
                title="Certificate preview"
                src={certPreviewBlobUrl}
                className="w-full h-[60vh] min-h-[400px] rounded-lg border border-indigo-200/50 dark:border-indigo-800/30 bg-white dark:bg-slate-900"
              />
            )}
          </div>
          <DialogFooter className="px-6 py-4 border-t border-indigo-200/30 dark:border-indigo-800/20">
            <Button variant="outline" onClick={() => setShowCertPreview(false)}>Close</Button>
            {previewCert && (certStatus === "ACTIVE" ? (
              <Button className="bg-indigo-600 hover:bg-indigo-700" asChild>
                <a
                  href={`${API_BASE_URL}/api/v1/membership/certificates/by-id/${previewCert.certificateId}/download`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Award className="h-4 w-4 mr-2" />
                  Download certificate
                </a>
              </Button>
            ) : (
              <Button className="bg-indigo-600 hover:bg-indigo-700" disabled title={certStatus === "EXPIRED" ? "Certificate has expired" : "Download available when plan is active"}>
                <Award className="h-4 w-4 mr-2" />
                Download certificate
              </Button>
            ))}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRenewModal} onOpenChange={(open) => {
        setShowRenewModal(open);
        if (!open) {
          setShowManualForm(false);
          setManualSubscriptionId(null);
          setManualBankId("");
          setManualReceipt(null);
        }
      }}>
        <DialogContent className="max-w-md border-indigo-200/50 dark:border-indigo-800/30">
          <DialogHeader>
            <DialogTitle className="text-indigo-900 dark:text-indigo-100">Renew membership</DialogTitle>
            <DialogDescription>
              Choose a plan and pay online (Chapa) or transfer to our bank and upload your receipt. Manual payments stay pending until verified by the office.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {showManualForm && manualSubscriptionId ? (
              <div className="rounded-lg border border-indigo-200/60 dark:border-indigo-800/50 p-4 space-y-4 bg-indigo-50/30 dark:bg-indigo-950/20">
                <p className="text-sm font-medium">Upload payment receipt</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Bank</Label>
                    <Select value={manualBankId} onValueChange={setManualBankId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select bank" />
                      </SelectTrigger>
                      <SelectContent>
                        {BANKS.map((b) => (
                          <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {manualBankId && (
                    <div className="rounded-md bg-muted/50 p-3 text-sm border col-span-2">
                      {(() => {
                        const bank = BANKS.find((b) => b.id === manualBankId);
                        if (!bank) return null;
                        return (
                          <dl className="space-y-1 text-muted-foreground">
                            <div><dt className="inline font-medium">Bank:</dt> <dd className="inline ml-1">{bank.name}</dd></div>
                            <div><dt className="inline font-medium">Account:</dt> <dd className="inline ml-1">{bank.accountName}</dd></div>
                            <div><dt className="inline font-medium">Number:</dt> <dd className="inline ml-1 font-mono">{bank.accountNumber}</dd></div>
                          </dl>
                        );
                      })()}
                    </div>
                  )}
                  <div>
                    <Label>Receipt</Label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="flex-1 w-full text-sm file:mr-2 file:py-2 file:px-4 file:rounded file:border-0 file:bg-indigo-100 file:text-indigo-700 dark:file:bg-indigo-900/50 dark:file:text-indigo-200"
                      onChange={(e) => setManualReceipt(e.target.files?.[0] ?? null)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowRenewModal(false)}>Cancel</Button>
                  <Button
                    onClick={handleManualSubmit}
                    disabled={manualPaymentMutation.isPending || !manualReceipt || !manualBankId}
                  >
                    {manualPaymentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                    Submit receipt
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <>
                <div>
                  <Label>Select plan</Label>
                  <Select value={renewPlanId} onValueChange={setRenewPlanId}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Choose a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((p: MembershipPlan) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} – {String(p.feeAmount)} ETB ({p.durationMonths} mo)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button variant="outline" onClick={() => setShowRenewModal(false)} className="w-full sm:w-auto">Cancel</Button>
                  <Button
                    onClick={handleRenewChapa}
                    disabled={renewMutation.isPending || !renewPlanId}
                    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700"
                  >
                    {renewMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}
                    Pay with Chapa
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleRenewManual}
                    disabled={renewMutation.isPending || !renewPlanId}
                    className="w-full sm:w-auto"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Pay manually
                  </Button>
                </DialogFooter>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto border-indigo-200/50 dark:border-indigo-800/30">
          <DialogHeader>
            <DialogTitle className="text-indigo-900 dark:text-indigo-100">Edit profile</DialogTitle>
            <DialogDescription>
              Update your membership profile information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label>Full name *</Label>
              <Input value={editForm.fullName} onChange={(e) => setEditForm((f) => ({ ...f, fullName: e.target.value }))} placeholder="Full name" />
            </div>
            <div className="grid gap-2">
              <Label>Phone *</Label>
              <Input value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} placeholder="09xxxxxxxx" />
            </div>
            <div className="grid gap-2">
              <Label>Email (optional)</Label>
              <Input type="email" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Date of birth</Label>
                <Input type="date" value={editForm.dateOfBirth} onChange={(e) => setEditForm((f) => ({ ...f, dateOfBirth: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Gender</Label>
                <Select value={editForm.gender} onValueChange={(v) => setEditForm((f) => ({ ...f, gender: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Category *</Label>
              <Select value={editForm.category} onValueChange={(v) => setEditForm((f) => ({ ...f, category: v as MemberCategory, categoryData: {} }))}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {editForm.category && CATEGORY_FIELDS[editForm.category]?.map((field) => (
              <div key={field.name} className="grid gap-2">
                <Label>{field.label}</Label>
                {field.type === "text" && (
                  <Input
                    value={(editForm.categoryData[field.name] as string) ?? ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, categoryData: { ...f.categoryData, [field.name]: e.target.value } }))}
                    placeholder={field.label}
                  />
                )}
                {field.type === "select" && (
                  <Select
                    value={(editForm.categoryData[field.name] as string) ?? ""}
                    onValueChange={(v) => setEditForm((f) => ({ ...f, categoryData: { ...f.categoryData, [field.name]: v } }))}
                  >
                    <SelectTrigger><SelectValue placeholder={`Select ${field.label}`} /></SelectTrigger>
                    <SelectContent>
                      {field.options?.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                {field.type === "multiselect" && (
                  <div className="flex flex-wrap gap-2">
                    {field.options?.map((o) => {
                      const arr = ((editForm.categoryData[field.name] as string[]) ?? []);
                      const checked = arr.includes(o);
                      return (
                        <Button
                          key={o}
                          type="button"
                          variant={checked ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            const next = checked ? arr.filter((x) => x !== o) : [...arr, o];
                            setEditForm((f) => ({ ...f, categoryData: { ...f.categoryData, [field.name]: next } }));
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
            <div className="grid gap-2">
              <Label>Region</Label>
              <Select value={editForm.regionId} onValueChange={(v) => setEditForm((f) => ({ ...f, regionId: v, zoneId: "", woredaId: "" }))}>
                <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                <SelectContent>
                  {regions?.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {selectedRegion?.zones && selectedRegion.zones.length > 0 && (
              <div className="grid gap-2">
                <Label>Zone</Label>
                <Select value={editForm.zoneId} onValueChange={(v) => setEditForm((f) => ({ ...f, zoneId: v, woredaId: "" }))}>
                  <SelectTrigger><SelectValue placeholder="Select zone" /></SelectTrigger>
                  <SelectContent>
                    {selectedRegion.zones.map((z) => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {woredas.length > 0 && (
              <div className="grid gap-2">
                <Label>Woreda</Label>
                <Select value={editForm.woredaId} onValueChange={(v) => setEditForm((f) => ({ ...f, woredaId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select woreda" /></SelectTrigger>
                  <SelectContent>
                    {woredas.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid gap-2">
              <Label>Address</Label>
              <Textarea value={editForm.addressLine} onChange={(e) => setEditForm((f) => ({ ...f, addressLine: e.target.value }))} placeholder="Street, city..." rows={2} />
            </div>
            <div className="grid gap-2">
              <Label>National ID</Label>
              <Input value={editForm.nationalId} onChange={(e) => setEditForm((f) => ({ ...f, nationalId: e.target.value }))} placeholder="National ID" />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
              <Button
                onClick={handleEditSave}
                disabled={updateProfileMutation.isPending || !editForm.fullName.trim() || !editForm.phone.trim() || !editForm.category}
              >
                {updateProfileMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save changes
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
