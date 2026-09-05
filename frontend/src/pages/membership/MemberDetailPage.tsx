"use client";
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, User, CreditCard, Award, Banknote, Loader2, Pencil, ExternalLink, Eye, RefreshCw } from "lucide-react";
import { membershipApi, type MembershipPayment, type MemberCategory } from "@/services/membership";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { API_BASE_URL, resolveFileUrl } from "@/config/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [manualSubId, setManualSubId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
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
    profilePhoto: null as File | null,
    category: "" as MemberCategory | "",
    categoryData: {} as Record<string, unknown>,
  });

  const isAdmin = hasPermission("majlis.membership.admin");
  const canConfirmManual = isAdmin || hasPermission("majlis.membership.register");

  const { data: member, isLoading } = useQuery({
    queryKey: ["membership-member", id],
    queryFn: () => membershipApi.members.get(id!),
    enabled: !!id,
  });

  const { data: regions } = useQuery({
    queryKey: ["membership-regions"],
    queryFn: () => membershipApi.regions.list(),
    enabled: showEditModal,
  });

  const { data: subscriptionDetail, isLoading: subscriptionDetailLoading } = useQuery({
    queryKey: ["membership-subscription", manualSubId],
    queryFn: () => membershipApi.subscriptions.get(manualSubId!),
    enabled: !!manualSubId,
  });

  const manualPaymentMutation = useMutation({
    mutationFn: (subId: string) => {
      const formData = new FormData();
      return membershipApi.subscriptions.confirmManual(subId, formData);
    },
    onSuccess: () => {
      toast.success("Payment confirmed. Certificate generated.");
      setManualSubId(null);
      queryClient.invalidateQueries({ queryKey: ["membership-member", id] });
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message ?? "Failed to confirm payment");
    },
  });

  const regenerateCertificateMutation = useMutation({
    mutationFn: (certificateId: string) => membershipApi.certificates.regenerate(certificateId),
    onSuccess: () => {
      toast.success("Membership ID regenerated from the active template");
      queryClient.invalidateQueries({ queryKey: ["membership-member", id] });
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message ?? "Failed to regenerate membership ID");
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: Record<string, unknown> | FormData) => membershipApi.members.updateProfile(id!, data),
    onSuccess: () => {
      setShowEditModal(false);
      setEditForm((f) => ({ ...f, profilePhoto: null }));
      queryClient.invalidateQueries({ queryKey: ["membership-member", id] });
      toast.success("Profile updated successfully");
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message ?? "Failed to update profile");
    },
  });

  const selectedRegion = regions?.find((r) => r.id === editForm.regionId);
  const selectedZone = selectedRegion?.zones?.find((z) => z.id === editForm.zoneId);
  const woredas = selectedZone?.woredas ?? [];

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
        profilePhoto: null,
        category: (member.category as MemberCategory) ?? "",
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
    if (editForm.profilePhoto) {
      const formData = new FormData();
      formData.append("fullName", editForm.fullName);
      formData.append("phone", editForm.phone);
      if (editForm.email) formData.append("email", editForm.email);
      if (editForm.dateOfBirth) formData.append("dateOfBirth", editForm.dateOfBirth);
      if (editForm.gender) formData.append("gender", editForm.gender);
      if (editForm.regionId) formData.append("regionId", editForm.regionId);
      if (editForm.zoneId) formData.append("zoneId", editForm.zoneId);
      if (editForm.woredaId) formData.append("woredaId", editForm.woredaId);
      if (editForm.addressLine) formData.append("addressLine", editForm.addressLine);
      if (editForm.nationalId) formData.append("nationalId", editForm.nationalId);
      formData.append("category", editForm.category);
      formData.append("categoryData", JSON.stringify(editForm.categoryData));
      formData.append("profilePhoto", editForm.profilePhoto);
      updateProfileMutation.mutate(formData);
    } else {
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
    }
  };

  if (isLoading || !member) {
    return (
      <div className="p-6 flex justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent dark:from-indigo-600/20 dark:via-purple-600/10 border border-indigo-200/50 dark:border-indigo-800/30 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/majlis/membership/members")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-indigo-900 dark:text-indigo-100">
                Member details
              </h1>
              <p className="text-indigo-700/80 dark:text-indigo-300/80 text-sm mt-0.5">
                Full profile, subscriptions, and certificates
              </p>
            </div>
          </div>

        </div>
      </div>

      <Card id="member-profile" className="border-indigo-200/50 dark:border-indigo-800/30 scroll-mt-4">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-indigo-900 dark:text-indigo-100">
              <User className="h-5 w-5" /> Profile
            </CardTitle>
          </div>
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={() => setShowEditModal(true)} className="shrink-0">
              <Pencil className="h-4 w-4 mr-1.5" />
              Edit Profile
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-2">
            {member.profilePhotoUrl ? (
              <img
                src={resolveFileUrl(member.profilePhotoUrl)}
                alt={member.fullName}
                className="h-24 w-24 rounded-full object-cover border-2 border-indigo-200/50 dark:border-indigo-800/50 shrink-0"
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0 border-2 border-indigo-200/50 dark:border-indigo-800/50">
                <User className="h-12 w-12 text-indigo-500 dark:text-indigo-400" />
              </div>
            )}
            <div className="flex flex-col gap-1 text-center sm:text-left">
              <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">{member.fullName}</h3>
              <Badge variant="secondary" className="w-fit bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200">
                {CATEGORY_LABELS[member.category] ?? member.category}
              </Badge>
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
                  : member.addressLine ?? "—"}
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

      {canConfirmManual && (() => {
        const pendingManual = (member.subscriptions ?? []).filter(
          (s) => s.status === "PENDING_PAYMENT" && (s.payments ?? []).some((p) => p.status === "PENDING" && p.method === "MANUAL")
        );
        return pendingManual.length > 0 ? (
          <Card className="border-amber-200 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                <Eye className="h-5 w-5" /> Pending manual payments to verify
              </CardTitle>
              <CardDescription>
                These members have submitted receipts. View and verify each payment.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingManual.map((sub) => {
                  const pendingPay = (sub.payments ?? []).find((p) => p.status === "PENDING" && p.method === "MANUAL");
                  return (
                    <div
                      key={sub.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg border border-amber-200/60 dark:border-amber-800/40"
                    >
                      <div>
                        <p className="font-medium">{sub.plan?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {String(pendingPay?.amount ?? sub.plan?.feeAmount ?? "")} ETB · Manual payment pending
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {pendingPay?.receiptUrl && (
                          <Button size="sm" variant="outline" asChild>
                            <a
                              href={resolveFileUrl(pendingPay.receiptUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View receipt
                            </a>
                          </Button>
                        )}
                        <Button size="sm" onClick={() => setManualSubId(sub.id)}>
                          <Banknote className="h-4 w-4 mr-1" />
                          Verify payment
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : null;
      })()}

      <Card className="border-indigo-200/50 dark:border-indigo-800/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-900 dark:text-indigo-100">
            <CreditCard className="h-5 w-5" /> Membership & payments
          </CardTitle>
          <CardDescription>Plan details, subscription status, payment history, receipts, and certificates</CardDescription>
        </CardHeader>
        <CardContent>
          {(() => {
            type MergedRow = { sub: (typeof member.subscriptions)[0]; pay?: MembershipPayment; key: string };
            const mergedRows: MergedRow[] = [];
            for (const sub of member.subscriptions ?? []) {
              const pays = sub.payments ?? [];
              if (pays.length === 0) mergedRows.push({ sub, key: sub.id });
              else for (const pay of pays) mergedRows.push({ sub, pay, key: `${sub.id}-${pay.id}` });
            }
            mergedRows.sort((a, b) => {
              const aD = a.pay?.paidAt ?? a.pay?.createdAt ?? a.sub.createdAt;
              const bD = b.pay?.paidAt ?? b.pay?.createdAt ?? b.sub.createdAt;
              return new Date(bD || 0).getTime() - new Date(aD || 0).getTime();
            });
            if (mergedRows.length === 0) return <p className="text-muted-foreground">No subscriptions yet.</p>;
            return (
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
                      <TableHead className="whitespace-nowrap">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mergedRows.map((row) => (
                      <TableRow key={row.key} className="border-indigo-200/30 dark:border-indigo-800/20">
                        <TableCell className="font-medium">{row.sub.plan?.name ?? "—"}</TableCell>
                        <TableCell className="text-sm">
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
                        <TableCell>{row.pay ? row.pay.status : "—"}</TableCell>
                        <TableCell>
                          {row.pay?.method === "MANUAL" && row.pay?.receiptUrl ? (
                            <a
                              href={resolveFileUrl(row.pay.receiptUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:underline text-sm flex items-center gap-1"
                            >
                              <ExternalLink className="h-4 w-4" /> View
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
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            {row.sub.status === "PENDING_PAYMENT" && canConfirmManual && (
                              <Button size="sm" variant="outline" onClick={() => setManualSubId(row.sub.id)}>
                                <Banknote className="h-4 w-4 mr-1" />
                                Verify
                              </Button>
                            )}
                            {row.sub.certificate && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    window.open(
                                      `${API_BASE_URL}/api/v1/membership/certificates/by-id/${row.sub.certificate!.certificateId}/download`,
                                      "_blank"
                                    )
                                  }
                                >
                                  <Award className="h-4 w-4 mr-1" />
                                  Cert
                                </Button>
                                {canConfirmManual && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="px-2"
                                    disabled={
                                      regenerateCertificateMutation.isPending &&
                                      regenerateCertificateMutation.variables ===
                                        row.sub.certificate!.certificateId
                                    }
                                    title="Regenerate membership ID from the active Document template"
                                    aria-label="Regenerate membership ID"
                                    onClick={() =>
                                      regenerateCertificateMutation.mutate(row.sub.certificate!.certificateId)
                                    }
                                  >
                                    {regenerateCertificateMutation.isPending &&
                                    regenerateCertificateMutation.variables ===
                                      row.sub.certificate!.certificateId ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <RefreshCw className="h-4 w-4" />
                                    )}
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto border-indigo-200/50 dark:border-indigo-800/30">
          <DialogHeader>
            <DialogTitle className="text-indigo-900 dark:text-indigo-100">Edit profile</DialogTitle>
            <DialogDescription>
              Update this member&apos;s profile information.
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
            <div className="grid gap-2">
              <Label>Profile photo (optional)</Label>
              <Input type="file" accept="image/*" onChange={(e) => setEditForm((f) => ({ ...f, profilePhoto: e.target.files?.[0] ?? null }))} />
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

      <Dialog
        open={!!manualSubId}
        onOpenChange={(open) => {
          if (!open) setManualSubId(null);
        }}
      >
        <DialogContent className="border-indigo-200/50 dark:border-indigo-800/30 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Verify manual payment</DialogTitle>
            <DialogDescription>
              Review payment details below, then confirm the payment to generate the certificate.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            {subscriptionDetailLoading ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              </div>
            ) : subscriptionDetail ? (
              <>
                <div className="rounded-lg border border-indigo-200/60 dark:border-indigo-800/50 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 space-y-3">
                  <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">Payment & subscription details</p>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Member</dt>
                      <dd className="font-medium">{subscriptionDetail.member?.fullName ?? member?.fullName ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Plan</dt>
                      <dd className="font-medium">{subscriptionDetail.plan?.name ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Plan amount</dt>
                      <dd className="font-medium">{subscriptionDetail.plan?.feeAmount != null ? `${Number(subscriptionDetail.plan.feeAmount).toLocaleString()} ETB` : "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Duration</dt>
                      <dd className="font-medium">{subscriptionDetail.plan?.durationMonths ? `${subscriptionDetail.plan.durationMonths} month(s)` : "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Subscription status</dt>
                      <dd>
                        <Badge variant="secondary">{subscriptionDetail.status?.replace(/_/g, " ") ?? "—"}</Badge>
                      </dd>
                    </div>
                    {subscriptionDetail.startDate && subscriptionDetail.endDate && (
                      <div className="sm:col-span-2">
                        <dt className="text-muted-foreground">Period</dt>
                        <dd className="font-medium">
                          {new Date(subscriptionDetail.startDate).toLocaleDateString()} – {new Date(subscriptionDetail.endDate).toLocaleDateString()}
                        </dd>
                      </div>
                    )}
                  </dl>
                  {(() => {
                    const pendingPay = (subscriptionDetail.payments ?? []).find((p) => p.status === "PENDING" && (p.method === "MANUAL" || p.method === "CASH"));
                    if (!pendingPay) return null;
                    const paymentType = pendingPay.bankName ? "Bank transfer" : "Cash";
                    const bankDisplay = pendingPay.bankName ? pendingPay.bankName : null;
                    return (
                      <div className="pt-2 border-t border-indigo-200/40 dark:border-indigo-800/40 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pending payment</p>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                          <div>
                            <dt className="text-muted-foreground">Amount</dt>
                            <dd className="font-medium">{pendingPay.amount != null ? `${Number(pendingPay.amount).toLocaleString()} ETB` : "—"}</dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">Payment type</dt>
                            <dd className="font-medium">{paymentType}</dd>
                          </div>
                          {bankDisplay && (
                            <div className="sm:col-span-2">
                              <dt className="text-muted-foreground">Bank</dt>
                              <dd className="font-medium">{bankDisplay}</dd>
                            </div>
                          )}
                          {pendingPay.receiptUrl && (
                            <div className="sm:col-span-2">
                              <dt className="text-muted-foreground">Receipt</dt>
                              <dd>
                                <a
                                  href={resolveFileUrl(pendingPay.receiptUrl)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-indigo-600 hover:underline text-sm font-medium"
                                >
                                  <ExternalLink className="h-4 w-4" /> View receipt
                                </a>
                              </dd>
                            </div>
                          )}
                        </dl>
                      </div>
                    );
                  })()}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground py-4">Unable to load subscription details.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualSubId(null)}>Cancel</Button>
            <Button
              onClick={() => manualSubId && manualPaymentMutation.mutate(manualSubId)}
              disabled={manualPaymentMutation.isPending || subscriptionDetailLoading || !subscriptionDetail}
            >
              {manualPaymentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Verify payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
