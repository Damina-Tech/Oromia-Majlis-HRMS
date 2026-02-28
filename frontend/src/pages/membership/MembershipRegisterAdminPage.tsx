"use client";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { UserPlus, CreditCard, Loader2, Banknote, ArrowLeft } from "lucide-react";
import { membershipApi, type MemberCategory, type MembershipPlan } from "@/services/membership";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

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

export default function MembershipRegisterAdminPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [pendingSubscriptionId, setPendingSubscriptionId] = useState<string | null>(null);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualReceipt, setManualReceipt] = useState<File | null>(null);

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
  const { data: plans } = useQuery({
    queryKey: ["membership-plans-active"],
    queryFn: () => membershipApi.plans.listActive(),
    enabled: step >= 3,
  });

  const selectedRegion = regions?.find((r) => r.id === form.regionId);
  const selectedZone = selectedRegion?.zones?.find((z) => z.id === form.zoneId);
  const woredas = selectedZone?.woredas ?? [];

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
      toast.success("Member registered. Select plan and payment method.");
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message ?? "Registration failed");
    },
  });

  const createSubMutation = useMutation({
    mutationFn: ({ planId }: { planId: string }) =>
      membershipApi.subscriptions.create({ memberId: memberId!, planId }),
    onSuccess: (data) => {
      setPendingSubscriptionId(data.subscription.id);
      toast.success("Subscription created. Choose payment: Chapa or mark manual.");
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message ?? "Failed to create subscription");
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

  const manualPaymentMutation = useMutation({
    mutationFn: (subId: string) => {
      const formData = new FormData();
      if (manualReceipt) formData.append("receipt", manualReceipt);
      return membershipApi.subscriptions.confirmManual(subId, formData);
    },
    onSuccess: () => {
      toast.success("Payment marked. Certificate generated.");
      setManualModalOpen(false);
      setManualReceipt(null);
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
      setStep(2);
    } else if (step === 2) {
      if (!form.category) {
        toast.error("Please select a category");
        return;
      }
      createMemberMutation.mutate();
    }
  };

  const handleSelectPlan = (plan: MembershipPlan) => {
    if (!memberId) return;
    createSubMutation.mutate({ planId: plan.id });
  };

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/majlis/membership")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-xl font-bold">Register member (representative)</h1>
      </div>

      <Progress value={(step / 3) * 100} className="h-2" />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {step === 1 && "Step 1: Basic information"}
            {step === 2 && "Step 2: Category & details"}
            {step === 3 && "Step 3: Plan & payment"}
          </CardTitle>
          <CardDescription>
            {step === 1 && "Enter member details (same as public form)."}
            {step === 2 && "Select category and fill required fields."}
            {step === 3 && "Select plan, then pay via Chapa or mark manual/cash payment."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 1 && (
            <>
              <div className="grid gap-2">
                <Label>Full Name *</Label>
                <Input value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} placeholder="Full name" />
              </div>
              <div className="grid gap-2">
                <Label>Phone Number *</Label>
                <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="09xxxxxxxx" />
              </div>
              <div className="grid gap-2">
                <Label>Email (optional)</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Date of Birth</Label>
                  <Input type="date" value={form.dateOfBirth} onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label>Gender</Label>
                  <Select value={form.gender} onValueChange={(v) => setForm((f) => ({ ...f, gender: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
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
                  <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                  <SelectContent>
                    {regions?.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {selectedRegion?.zones && selectedRegion.zones.length > 0 && (
                <div className="grid gap-2">
                  <Label>Zone</Label>
                  <Select value={form.zoneId} onValueChange={(v) => setForm((f) => ({ ...f, zoneId: v, woredaId: "" }))}>
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
                  <Select value={form.woredaId} onValueChange={(v) => setForm((f) => ({ ...f, woredaId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select woreda" /></SelectTrigger>
                    <SelectContent>
                      {woredas.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid gap-2">
                <Label>Address (optional)</Label>
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
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v as MemberCategory, categoryData: {} }))}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
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
                      <SelectTrigger><SelectValue placeholder={`Select ${field.label}`} /></SelectTrigger>
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
              {!pendingSubscriptionId ? (
                <div className="grid gap-3">
                  {plans?.map((plan) => (
                    <Card key={plan.id} className="cursor-pointer hover:border-primary transition-colors">
                      <CardContent className="pt-4 flex justify-between items-center">
                        <div>
                          <p className="font-medium">{plan.name}</p>
                          <p className="text-sm text-muted-foreground">{plan.durationMonths} month(s) · {Number(plan.feeAmount)} ETB</p>
                        </div>
                        <Button onClick={() => handleSelectPlan(plan)} disabled={createSubMutation.isPending}>
                          {createSubMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Select plan"}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
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
                    <Button variant="outline" onClick={() => setManualModalOpen(true)}>
                      <Banknote className="h-4 w-4 mr-2" />
                      Mark manual / cash payment
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-between pt-4">
            {step > 1 && step < 3 && (
              <Button variant="outline" onClick={() => setStep((s) => s - 1)}>Back</Button>
            )}
            {step < 3 && (
              <Button className="ml-auto" onClick={handleNext} disabled={createMemberMutation.isPending}>
                {createMemberMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {step === 1 ? "Next" : step === 2 ? "Register member" : null}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={manualModalOpen} onOpenChange={setManualModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark manual / cash payment</DialogTitle>
            <DialogDescription>
              Confirm that the member has paid (cash or bank transfer). Optionally upload a receipt. Certificate will be generated.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label>Receipt (optional)</Label>
            <Input type="file" accept="image/*,.pdf" onChange={(e) => setManualReceipt(e.target.files?.[0] ?? null)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualModalOpen(false)}>Cancel</Button>
            <Button
              onClick={() => pendingSubscriptionId && manualPaymentMutation.mutate(pendingSubscriptionId)}
              disabled={manualPaymentMutation.isPending}
            >
              {manualPaymentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
