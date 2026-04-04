"use client";
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  competencyFormFromApi,
  CompetencyApplicantFormFields,
  emptyCompetencyApplicantForm,
  toReligiousAnswersPayload,
  validateCompetencyApplicantForm,
  type CompetencyApplicantFormValues,
} from "./competencyApplicantForm";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  GraduationCap,
  Upload,
  Wallet,
} from "lucide-react";
import { halalApi, HALAL_COMPETENCY_FEE_ETB, type HalalCompetencyCertificate } from "@/services/halal";
import { resolveFileUrl } from "@/config/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const ETHIOPIAN_BANKS = [
  "Commercial Bank of Ethiopia",
  "Cooperative Bank of Oromia",
  "Oromia Bank",
  "Awash Bank",
  "Hijra Bank",
  "Other",
];

const ACCOUNT_NAME = "Oromia Islamic Affairs Supreme Council";
const BANK_ACCOUNT_DETAILS: Record<string, { accountName: string; accountNumber: string }> = {
  "Commercial Bank of Ethiopia": { accountName: ACCOUNT_NAME, accountNumber: "1000600162447" },
  "Cooperative Bank of Oromia": { accountName: ACCOUNT_NAME, accountNumber: "1042200124748" },
  "Oromia Bank": { accountName: ACCOUNT_NAME, accountNumber: "1371866200002" },
  "Awash Bank": { accountName: ACCOUNT_NAME, accountNumber: "014100449821400" },
  "Hijra Bank": { accountName: ACCOUNT_NAME, accountNumber: "1000044440001" },
  Other: { accountName: "Contact admin for account details", accountNumber: "-" },
};

export default function HalalCompetencyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, hasPermission } = useAuth();

  const isStaff =
    hasPermission("halal.admin") ||
    hasPermission("halal.supervisor") ||
    hasPermission("halal.committee") ||
    hasPermission("halal.review");
  const canApproveManual =
    hasPermission("halal.admin") || hasPermission("halal.supervisor") || hasPermission("halal.finance");

  const [draftForm, setDraftForm] = useState<CompetencyApplicantFormValues>(emptyCompetencyApplicantForm());
  const [letterFile, setLetterFile] = useState<File | null>(null);

  const [theoryWhen, setTheoryWhen] = useState("");
  const [theoryPassed, setTheoryPassed] = useState(true);
  const [theoryNotes, setTheoryNotes] = useState("");
  const [techWhen, setTechWhen] = useState("");
  const [techPassed, setTechPassed] = useState(true);
  const [techNotes, setTechNotes] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<"chapa" | "manual">("chapa");
  const [manualBank, setManualBank] = useState("");
  const [manualReceipt, setManualReceipt] = useState<File | null>(null);

  const [renewalPaymentMethod, setRenewalPaymentMethod] = useState<"chapa" | "manual">("chapa");
  const [renewalBank, setRenewalBank] = useState("");
  const [renewalReceipt, setRenewalReceipt] = useState<File | null>(null);

  const { data: row, isLoading } = useQuery({
    queryKey: ["halal-competency-certificate", id],
    queryFn: () => halalApi.competencyCertificates.get(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (!row) return;
    setDraftForm(competencyFormFromApi(row));
  }, [row?.id, row?.updatedAt]);

  useEffect(() => {
    if (searchParams.get("payment") === "chapa" && id) {
      queryClient.invalidateQueries({ queryKey: ["halal-competency-certificate", id] });
      queryClient.invalidateQueries({ queryKey: ["halal-competency-certificates"] });
      toast.success("Payment received");
      setSearchParams({}, { replace: true });
    }
    if (searchParams.get("renewalPayment") === "chapa" && id) {
      queryClient.invalidateQueries({ queryKey: ["halal-competency-certificate", id] });
      queryClient.invalidateQueries({ queryKey: ["halal-competency-certificates"] });
      toast.success("Renewal payment received");
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, id, queryClient, setSearchParams]);

  const patchMutation = useMutation({
    mutationFn: () => {
      const err = validateCompetencyApplicantForm(draftForm);
      if (err) throw new Error(err);
      return halalApi.competencyCertificates.update(id!, {
        fullName: draftForm.fullName.trim(),
        dateOfBirth: draftForm.dateOfBirth,
        phone: draftForm.phone.trim(),
        email: draftForm.email.trim(),
        employerName: draftForm.employerName.trim(),
        jobTitle: draftForm.jobTitle.trim() || undefined,
        religiousAnswers: toReligiousAnswersPayload(draftForm),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["halal-competency-certificate", id] });
      toast.success("Draft saved");
    },
    onError: (e: any) =>
      toast.error(e?.message ?? e.response?.data?.message ?? "Save failed"),
  });

  const uploadLetterMutation = useMutation({
    mutationFn: async () => {
      if (!letterFile) throw new Error("Choose a file");
      const { url } = await halalApi.businesses.uploadDocument(letterFile);
      return halalApi.competencyCertificates.update(id!, { supportLetterUrl: url });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["halal-competency-certificate", id] });
      setLetterFile(null);
      toast.success("Support letter attached");
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? e.message ?? "Upload failed"),
  });

  const [submitAppPending, setSubmitAppPending] = useState(false);

  const handleSubmitApplication = async () => {
    const err = validateCompetencyApplicantForm(draftForm);
    if (err) {
      toast.error(err);
      return;
    }
    if (!row?.supportLetterUrl?.trim()) {
      toast.error("Upload a support letter from your employer before submitting.");
      return;
    }
    setSubmitAppPending(true);
    try {
      await halalApi.competencyCertificates.update(id!, {
        fullName: draftForm.fullName.trim(),
        dateOfBirth: draftForm.dateOfBirth,
        phone: draftForm.phone.trim(),
        email: draftForm.email.trim(),
        employerName: draftForm.employerName.trim(),
        jobTitle: draftForm.jobTitle.trim() || undefined,
        religiousAnswers: toReligiousAnswersPayload(draftForm),
      });
      await halalApi.competencyCertificates.submit(id!);
      queryClient.invalidateQueries({ queryKey: ["halal-competency-certificate", id] });
      queryClient.invalidateQueries({ queryKey: ["halal-competency-certificates"] });
      toast.success("Application submitted");
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? "Submit failed");
    } finally {
      setSubmitAppPending(false);
    }
  };

  const scheduleTheoryMutation = useMutation({
    mutationFn: () => halalApi.competencyCertificates.scheduleTheoretical(id!, new Date(theoryWhen).toISOString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["halal-competency-certificate", id] });
      toast.success("Theoretical interview scheduled");
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed"),
  });

  const recordTheoryMutation = useMutation({
    mutationFn: () =>
      halalApi.competencyCertificates.recordTheoretical(id!, { passed: theoryPassed, notes: theoryNotes || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["halal-competency-certificate", id] });
      toast.success("Theoretical result recorded");
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed"),
  });

  const scheduleTechMutation = useMutation({
    mutationFn: () => halalApi.competencyCertificates.scheduleTechnical(id!, new Date(techWhen).toISOString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["halal-competency-certificate", id] });
      toast.success("Technical interview scheduled");
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed"),
  });

  const recordTechMutation = useMutation({
    mutationFn: () =>
      halalApi.competencyCertificates.recordTechnical(id!, { passed: techPassed, notes: techNotes || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["halal-competency-certificate", id] });
      toast.success("Technical result recorded");
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed"),
  });

  const chapaMutation = useMutation({
    mutationFn: () => halalApi.competencyCertificates.initChapaPayment(id!),
    onSuccess: (d) => {
      if (d.checkoutUrl) window.location.href = d.checkoutUrl;
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Chapa failed"),
  });

  const manualMutation = useMutation({
    mutationFn: (data: { bankName: string; receipt: File }) =>
      halalApi.competencyCertificates.confirmManualPayment(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["halal-competency-certificate", id] });
      toast.success("Receipt submitted. Awaiting approval.");
      setManualBank("");
      setManualReceipt(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed"),
  });

  const approveManualMutation = useMutation({
    mutationFn: () => halalApi.competencyCertificates.approveManualPayment(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["halal-competency-certificate", id] });
      queryClient.invalidateQueries({ queryKey: ["halal-competency-certificates"] });
      toast.success("Payment approved. Certificate issued.");
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed"),
  });

  const createRenewalMutation = useMutation({
    mutationFn: () => halalApi.competencyCertificates.createRenewal(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["halal-competency-certificate", id] });
      toast.success("Renewal started — complete payment below.");
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed"),
  });

  const pendingRenewal = row?.renewals?.find((r) => r.status === "PAYMENT_PENDING");
  const renewalIdForPayment = row?.pendingRenewalId ?? pendingRenewal?.id;

  const renewalChapaMutation = useMutation({
    mutationFn: () => halalApi.competencyCertificates.initRenewalChapaPayment(renewalIdForPayment!),
    onSuccess: (d) => {
      if (d.checkoutUrl) window.location.href = d.checkoutUrl;
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Chapa failed"),
  });

  const renewalManualMutation = useMutation({
    mutationFn: (data: { bankName: string; receipt: File }) =>
      halalApi.competencyCertificates.confirmRenewalManualPayment(renewalIdForPayment!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["halal-competency-certificate", id] });
      toast.success("Renewal receipt submitted.");
      setRenewalBank("");
      setRenewalReceipt(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed"),
  });

  const approveRenewalMutation = useMutation({
    mutationFn: () => halalApi.competencyCertificates.approveRenewalManualPayment(renewalIdForPayment!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["halal-competency-certificate", id] });
      toast.success("Renewal approved. Expiry extended.");
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed"),
  });

  if (!id || isLoading) {
    return (
      <div className="p-6 flex justify-center min-h-[200px]">
        <div className="animate-spin h-10 w-10 border-2 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!row) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/halal/competency")}>
          Back
        </Button>
      </div>
    );
  }

  const c = row as HalalCompetencyCertificate;
  const isOwner = user?.id === c.userId;
  const isPaid = !!c.feePaidAt;
  const fee = HALAL_COMPETENCY_FEE_ETB;
  const letterUrl = c.supportLetterUrl ? resolveFileUrl(c.supportLetterUrl) : null;

  const awaitingManualApproval =
    c.status === "PAYMENT_PENDING" && !isPaid && c.paymentMethod === "MANUAL" && !!c.paymentReceiptUrl;

  const showApproveInitial =
    canApproveManual &&
    c.status === "PAYMENT_PENDING" &&
    c.paymentMethod === "MANUAL" &&
    c.paymentReceiptUrl &&
    !isPaid &&
    !isOwner;

  const renewalAwaitingApproval =
    pendingRenewal &&
    pendingRenewal.paymentMethod === "MANUAL" &&
    pendingRenewal.paymentReceiptUrl &&
    !pendingRenewal.feePaidAt;

  const showApproveRenewal =
    canApproveManual && renewalAwaitingApproval && pendingRenewal && !isOwner;

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6 pb-16">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate("/halal/competency")}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="rounded-2xl border border-emerald-200/50 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-500/[0.06] to-transparent p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <GraduationCap className="h-9 w-9 text-emerald-600 shrink-0" />
            <div>
              <h1 className="text-lg font-semibold">{c.fullName}</h1>
              <p className="text-sm text-muted-foreground">{c.employerName}</p>
              {c.certificateNumber && <p className="text-xs font-mono mt-1">{c.certificateNumber}</p>}
            </div>
          </div>
          <Badge variant="outline" className="shrink-0">
            {c.status.replace(/_/g, " ")}
          </Badge>
        </div>
      </div>

      {/* Draft */}
      {c.status === "DRAFT" && isOwner && (
        <>
          <CompetencyApplicantFormFields form={draftForm} setForm={setDraftForm} />
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Save & supporting documents</CardTitle>
              <CardDescription>Upload employer support letter, then submit</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button type="button" variant="secondary" onClick={() => patchMutation.mutate()} disabled={patchMutation.isPending}>
                Save draft
              </Button>
              <Separator />
              <div className="space-y-2">
                <Label>Employer support letter</Label>
                {c.supportLetterUrl && letterUrl && (
                  <a
                    href={letterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-emerald-600 flex items-center gap-1"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> View current file
                  </a>
                )}
                <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setLetterFile(e.target.files?.[0] ?? null)} />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => uploadLetterMutation.mutate()}
                  disabled={!letterFile || uploadLetterMutation.isPending}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload letter
                </Button>
              </div>
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={() => void handleSubmitApplication()}
                disabled={submitAppPending || !c.supportLetterUrl}
              >
                Submit application
              </Button>
              {!c.supportLetterUrl && (
                <p className="text-xs text-amber-700">Upload a support letter from your employer before submitting.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Staff: theoretical */}
      {isStaff && c.status === "SUBMITTED" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarClock className="h-4 w-4" />
              Schedule theoretical interview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input type="datetime-local" value={theoryWhen} onChange={(e) => setTheoryWhen(e.target.value)} />
            <Button onClick={() => scheduleTheoryMutation.mutate()} disabled={!theoryWhen || scheduleTheoryMutation.isPending}>
              Save schedule
            </Button>
          </CardContent>
        </Card>
      )}

      {isStaff && c.status === "THEORETICAL_SCHEDULED" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Record theoretical result</CardTitle>
            <CardDescription>
              Scheduled: {c.theoreticalScheduledAt ? new Date(c.theoreticalScheduledAt).toLocaleString() : "—"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" checked={theoryPassed} onChange={() => setTheoryPassed(true)} />
                Passed
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" checked={!theoryPassed} onChange={() => setTheoryPassed(false)} />
                Failed
              </label>
            </div>
            <Textarea placeholder="Notes (optional)" value={theoryNotes} onChange={(e) => setTheoryNotes(e.target.value)} />
            <Button onClick={() => recordTheoryMutation.mutate()} disabled={recordTheoryMutation.isPending}>
              Submit result
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Staff: technical */}
      {isStaff && c.status === "THEORETICAL_PASSED" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarClock className="h-4 w-4" />
              Schedule technical interview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input type="datetime-local" value={techWhen} onChange={(e) => setTechWhen(e.target.value)} />
            <Button onClick={() => scheduleTechMutation.mutate()} disabled={!techWhen || scheduleTechMutation.isPending}>
              Save schedule
            </Button>
          </CardContent>
        </Card>
      )}

      {isStaff && c.status === "TECHNICAL_SCHEDULED" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Record technical result</CardTitle>
            <CardDescription>
              Scheduled: {c.technicalScheduledAt ? new Date(c.technicalScheduledAt).toLocaleString() : "—"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" checked={techPassed} onChange={() => setTechPassed(true)} />
                Passed
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" checked={!techPassed} onChange={() => setTechPassed(false)} />
                Failed
              </label>
            </div>
            <Textarea placeholder="Notes (optional)" value={techNotes} onChange={(e) => setTechNotes(e.target.value)} />
            <Button onClick={() => recordTechMutation.mutate()} disabled={recordTechMutation.isPending}>
              Submit result
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Payment initial */}
      {c.status === "PAYMENT_PENDING" && isOwner && !isPaid && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Pay {fee.toLocaleString()} ETB
            </CardTitle>
            <CardDescription>Chapa (automatic) or bank transfer with manual verification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={paymentMethod === "chapa" ? "default" : "outline"}
                size="sm"
                onClick={() => setPaymentMethod("chapa")}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Chapa
              </Button>
              <Button
                type="button"
                variant={paymentMethod === "manual" ? "default" : "outline"}
                size="sm"
                onClick={() => setPaymentMethod("manual")}
              >
                Bank transfer
              </Button>
            </div>
            {paymentMethod === "chapa" && (
              <Button className="w-full" onClick={() => chapaMutation.mutate()} disabled={chapaMutation.isPending}>
                Pay with Chapa
              </Button>
            )}
            {paymentMethod === "manual" && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Transfer {fee.toLocaleString()} ETB, then upload receipt.</p>
                <div className="space-y-2">
                  <Label>Bank</Label>
                  <select
                    className="w-full border rounded-md h-10 px-3 text-sm bg-background"
                    value={manualBank}
                    onChange={(e) => setManualBank(e.target.value)}
                  >
                    <option value="">Select…</option>
                    {ETHIOPIAN_BANKS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
                {manualBank && BANK_ACCOUNT_DETAILS[manualBank] && (
                  <p className="text-xs text-muted-foreground">
                    {BANK_ACCOUNT_DETAILS[manualBank].accountName} — {BANK_ACCOUNT_DETAILS[manualBank].accountNumber}
                  </p>
                )}
                <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setManualReceipt(e.target.files?.[0] ?? null)} />
                <Button
                  disabled={!manualBank || !manualReceipt || manualMutation.isPending}
                  onClick={() => manualMutation.mutate({ bankName: manualBank, receipt: manualReceipt! })}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Submit receipt
                </Button>
              </div>
            )}
            {awaitingManualApproval && (
              <p className="text-sm text-amber-800 dark:text-amber-200">Receipt received — waiting for finance approval.</p>
            )}
          </CardContent>
        </Card>
      )}

      {showApproveInitial && (
        <Card className="border-amber-200/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Approve manual payment</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => approveManualMutation.mutate()} disabled={approveManualMutation.isPending}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Approve & issue certificate
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Issued */}
      {c.status === "ISSUED" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Certificate</CardTitle>
            <CardDescription>
              {c.expiresAt && <>Valid until {new Date(c.expiresAt).toLocaleDateString()}</>}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => halalApi.competencyCertificates.download(id, c.certificateNumber ?? id)}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="secondary" onClick={() => halalApi.competencyCertificates.openPdfInNewTab(id)}>
              <FileText className="h-4 w-4 mr-2" />
              Open PDF
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Renewal */}
      {c.status === "ISSUED" && isOwner && c.renewalEligible && !renewalIdForPayment && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Annual renewal</CardTitle>
            <CardDescription>Extend validity by one year ({fee.toLocaleString()} ETB)</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => createRenewalMutation.mutate()} disabled={createRenewalMutation.isPending}>
              Start renewal
            </Button>
          </CardContent>
        </Card>
      )}

      {c.status === "ISSUED" && renewalIdForPayment && pendingRenewal && !pendingRenewal.feePaidAt && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Complete renewal payment</CardTitle>
            <CardDescription>{fee.toLocaleString()} ETB</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isOwner && (
              <>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={renewalPaymentMethod === "chapa" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRenewalPaymentMethod("chapa")}
                  >
                    Chapa
                  </Button>
                  <Button
                    type="button"
                    variant={renewalPaymentMethod === "manual" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRenewalPaymentMethod("manual")}
                  >
                    Bank transfer
                  </Button>
                </div>
                {renewalPaymentMethod === "chapa" && (
                  <Button onClick={() => renewalChapaMutation.mutate()} disabled={renewalChapaMutation.isPending}>
                    Pay renewal with Chapa
                  </Button>
                )}
                {renewalPaymentMethod === "manual" && (
                  <div className="space-y-3">
                    <select
                      className="w-full border rounded-md h-10 px-3 text-sm bg-background"
                      value={renewalBank}
                      onChange={(e) => setRenewalBank(e.target.value)}
                    >
                      <option value="">Select bank…</option>
                      {ETHIOPIAN_BANKS.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                    <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setRenewalReceipt(e.target.files?.[0] ?? null)} />
                    <Button
                      disabled={!renewalBank || !renewalReceipt || renewalManualMutation.isPending}
                      onClick={() => renewalManualMutation.mutate({ bankName: renewalBank, receipt: renewalReceipt! })}
                    >
                      Submit renewal receipt
                    </Button>
                  </div>
                )}
              </>
            )}
            {isOwner &&
              pendingRenewal.paymentMethod === "MANUAL" &&
              pendingRenewal.paymentReceiptUrl &&
              !pendingRenewal.feePaidAt && (
                <p className="text-sm text-amber-800 dark:text-amber-200">Renewal receipt submitted — awaiting approval.</p>
              )}
            {showApproveRenewal && (
              <Button onClick={() => approveRenewalMutation.mutate()} disabled={approveRenewalMutation.isPending}>
                Approve renewal payment
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {(c.status === "THEORETICAL_FAILED" || c.status === "TECHNICAL_FAILED") && (
        <p className="text-sm text-destructive">This application was not successful. You may start a new application if allowed by policy.</p>
      )}
    </div>
  );
}
