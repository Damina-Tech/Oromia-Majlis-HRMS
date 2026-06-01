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
  applyRegistrationPrefill,
  COMPETENCY_REGISTRATION_LABELS,
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
import {
  halalApi,
  HALAL_COMPETENCY_FEE_ETB,
  type HalalCompetencyCertificate,
  type HalalCompetencyReligiousAnswers,
} from "@/services/halal";
import { resolveFileUrl } from "@/config/api";
import { cn } from "@/lib/utils";
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

function fmtDetailDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
  } catch {
    return "—";
  }
}

function fmtInterviewDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" });
  } catch {
    return "—";
  }
}

const COMPETENCY_RELIGIOUS_ANSWER_KEYS = [
  "religionConfirmedMuslim",
  "dailyPrayer",
  "observesRamadanFasting",
  "understandsTasmiyah",
  "familiarHalalVsHaramAnimals",
  "understandsProperSlaughterMethod",
  "knowledgeAnimalAliveHealthy",
  "knowledgeCorrectCuttingTechnique",
  "knowledgeCompleteBloodDrainage",
] as const satisfies readonly (keyof typeof COMPETENCY_REGISTRATION_LABELS)[];

function fmtYesNo(v: unknown): string {
  if (v === true) return "Yes";
  if (v === false) return "No";
  return "—";
}

function yesNoClass(v: unknown): string {
  if (v === true) return "text-emerald-700 dark:text-emerald-400";
  if (v === false) return "text-amber-800 dark:text-amber-200";
  return "text-muted-foreground";
}

function DetailCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-2.5 border-b border-teal-100/90 dark:border-teal-900/35 last:border-b-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-400">{label}</p>
      <div className="text-sm text-foreground leading-snug break-words mt-0.5">{children}</div>
    </div>
  );
}

const workflowCardClass =
  "border-teal-200/45 dark:border-teal-900/50 shadow-sm bg-gradient-to-br from-white to-teal-50/25 dark:from-card dark:to-teal-950/20";

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
    const base = competencyFormFromApi(row);
    const isOwner = user?.id === row.userId;
    setDraftForm(isOwner ? applyRegistrationPrefill(base, user) : base);
  }, [row?.id, row?.userId, row?.updatedAt, user?.id, user?.email, user?.firstName, user?.lastName]);

  useEffect(() => {
    if (searchParams.get("payment") === "chapa" && id) {
      queryClient.invalidateQueries({ queryKey: ["halal-competency-certificate", id] });
      queryClient.invalidateQueries({ queryKey: ["halal-competency-certificates"] });
      queryClient.invalidateQueries({ queryKey: ["halal-application"] });
      queryClient.invalidateQueries({ queryKey: ["halal-applications"] });
      queryClient.invalidateQueries({ queryKey: ["halal-application-worker-competency-progress"] });
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

  const invalidateLinkedBusinessApplications = () => {
    queryClient.invalidateQueries({ queryKey: ["halal-application"] });
    queryClient.invalidateQueries({ queryKey: ["halal-applications"] });
    queryClient.invalidateQueries({ queryKey: ["halal-application-worker-competency-progress"] });
  };

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
      invalidateLinkedBusinessApplications();
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
      invalidateLinkedBusinessApplications();
      toast.success(
        row?.businessRegisteredWorker
          ? "Payment approved. Worker certificate issued. Business Halal certificate will update when all workers are paid."
          : "Payment approved. Certificate issued."
      );
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
  const religiousAnswers = (c.religiousAnswers ?? {}) as Partial<HalalCompetencyReligiousAnswers>;
  const isOwner = user?.id === c.userId;
  const isPaid = !!c.feePaidAt;
  const fee = HALAL_COMPETENCY_FEE_ETB;
  const letterUrl = c.supportLetterUrl ? resolveFileUrl(c.supportLetterUrl) : null;
  const manualPaymentReceiptUrl = c.paymentReceiptUrl ? resolveFileUrl(c.paymentReceiptUrl) : null;
  const manualPaymentReceiptIsImage =
    !!manualPaymentReceiptUrl && /\.(jpe?g|png|gif|webp)(\?|$)/i.test(manualPaymentReceiptUrl);

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

  const ownerTheoreticalBlock =
    !!c.theoreticalScheduledAt || typeof c.theoreticalPassed === "boolean";
  const ownerTechnicalBlock =
    !!c.technicalScheduledAt || typeof c.technicalPassed === "boolean";
  const showOwnerInterviewSummary =
    !c.businessRegisteredWorker &&
    (isOwner || hasPermission("halal.admin")) &&
    (ownerTheoreticalBlock || ownerTechnicalBlock);

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5 pb-16">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 text-teal-800 dark:text-teal-200 hover:bg-teal-100/60 dark:hover:bg-teal-950/50"
        onClick={() => navigate("/halal/competency")}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to list
      </Button>

      <div className="rounded-xl overflow-hidden border border-emerald-300/40 dark:border-emerald-800/50 shadow-md ring-1 ring-black/5 dark:ring-white/5 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-900 text-white">
        <div className="p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm border border-white/20">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-semibold tracking-tight truncate">{c.fullName}</h1>
                <p className="text-sm text-emerald-50/95 mt-0.5 truncate">{c.employerName}</p>
                {c.certificateNumber ? (
                  <p className="text-xs font-mono text-emerald-100/90 mt-2 bg-black/10 inline-block px-2 py-0.5 rounded">
                    {c.certificateNumber}
                  </p>
                ) : c.status === "ISSUED" ? (
                  <p className="text-xs text-emerald-100/80 mt-2">Certificate number pending</p>
                ) : null}
              </div>
            </div>
            <Badge className="shrink-0 bg-white/20 text-white border-white/30 hover:bg-white/25 backdrop-blur-sm font-medium">
              {c.status.replace(/_/g, " ")}
            </Badge>
          </div>
        </div>
      </div>

      {c.businessRegisteredWorker && (
        <Card className={`${workflowCardClass} border-cyan-200/55 dark:border-cyan-900/45`}>
          <CardHeader className="pb-2 border-b border-cyan-100/80 dark:border-cyan-900/40 bg-cyan-50/40 dark:bg-cyan-950/20">
            <CardTitle className="text-base text-cyan-950 dark:text-cyan-100">Business-registered worker</CardTitle>
            <CardDescription className="text-cyan-900/80 dark:text-cyan-200/80">
              This worker was registered on a Halal business certification application for{" "}
              <strong>{c.employerName}</strong>. Interviews were waived based on the uploaded external certificate.
              {isOwner && c.status === "PAYMENT_PENDING" && !isPaid
                ? ` Pay ${fee.toLocaleString()} ETB below to issue this worker's platform certificate and link them to the business. When every approved worker on that application is paid, the business Halal certificate is generated automatically.`
                : isOwner && c.status === "ISSUED"
                  ? " Payment complete — this worker counts toward the business certification once all approved workers on that application are paid."
                  : null}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card className={`${workflowCardClass} overflow-hidden`}>
        <CardHeader className="pb-2 border-b border-teal-100/80 dark:border-teal-900/40 bg-teal-50/50 dark:bg-teal-950/30">
          <CardTitle className="text-sm font-semibold text-teal-900 dark:text-teal-100">Record details</CardTitle>
          <CardDescription className="text-teal-800/75 dark:text-teal-300/70 text-xs">
            Applicant and certificate data on file
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-2 min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-400">
                Personal & contact
              </p>
              <div className="rounded-lg border border-teal-100/80 dark:border-teal-900/40 bg-white/50 dark:bg-card/50 p-3 sm:p-4 shadow-sm">
                <DetailCell label="Full name">{c.fullName}</DetailCell>
                <DetailCell label="Date of birth">{fmtDetailDate(c.dateOfBirth)}</DetailCell>
                <DetailCell label="Phone">{c.phone?.trim() || "—"}</DetailCell>
                <DetailCell label="Email">{c.email?.trim() || "—"}</DetailCell>
              </div>
            </div>
            <div className="space-y-2 min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-400">
                Employer & documents
              </p>
              <div className="rounded-lg border border-teal-100/80 dark:border-teal-900/40 bg-white/50 dark:bg-card/50 p-3 sm:p-4 shadow-sm">
                <DetailCell label="Employer">{c.employerName}</DetailCell>
                <DetailCell label="Job title">{c.jobTitle?.trim() || "—"}</DetailCell>
                {isStaff && c.user && (
                  <DetailCell label="Applicant login">
                    {c.user.firstName} {c.user.lastName}
                    <span className="block text-xs text-muted-foreground mt-0.5">{c.user.email}</span>
                  </DetailCell>
                )}
                {c.status === "ISSUED" && (
                  <>
                    <DetailCell label="Issued">{fmtDetailDate(c.issuedAt)}</DetailCell>
                    <DetailCell label="Valid until">{fmtDetailDate(c.expiresAt)}</DetailCell>
                  </>
                )}
                <DetailCell label="Support letter">
                  {letterUrl ? (
                    <a
                      href={letterUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-teal-700 dark:text-teal-400 font-medium hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      View uploaded file
                    </a>
                  ) : (
                    <span className="text-muted-foreground">Not uploaded</span>
                  )}
                </DetailCell>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-400">
              Registration self-assessment
            </p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {COMPETENCY_RELIGIOUS_ANSWER_KEYS.map((key) => (
                <div
                  key={key}
                  className="rounded-lg border border-teal-100/75 dark:border-teal-900/40 bg-gradient-to-br from-teal-50/70 via-white to-emerald-50/40 dark:from-teal-950/30 dark:via-card dark:to-emerald-950/20 p-3 sm:p-3.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 min-h-[4.5rem] shadow-sm"
                >
                  <p className="text-xs text-foreground/95 leading-snug min-w-0 flex-1">
                    {COMPETENCY_REGISTRATION_LABELS[key]}
                  </p>
                  <span
                    className={cn(
                      "text-sm font-semibold shrink-0 tabular-nums px-2 py-0.5 rounded-md bg-white/80 dark:bg-background/80 border border-teal-100/80 dark:border-teal-900/50",
                      yesNoClass(religiousAnswers[key]),
                    )}
                  >
                    {fmtYesNo(religiousAnswers[key])}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Draft */}
      {c.status === "DRAFT" && isOwner && (
        <>
          <CompetencyApplicantFormFields form={draftForm} setForm={setDraftForm} />
          <Card className={workflowCardClass}>
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
        <Card className={workflowCardClass}>
          <CardHeader className="pb-2 border-b border-teal-100/70 dark:border-teal-900/40">
            <CardTitle className="text-base flex items-center gap-2 text-teal-900 dark:text-teal-100">
              <CalendarClock className="h-4 w-4 text-teal-600 dark:text-teal-400" />
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
        <Card className={workflowCardClass}>
          <CardHeader className="pb-2 border-b border-teal-100/70 dark:border-teal-900/40">
            <CardTitle className="text-base text-teal-900 dark:text-teal-100">Record theoretical result</CardTitle>
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
        <Card className={workflowCardClass}>
          <CardHeader className="pb-2 border-b border-teal-100/70 dark:border-teal-900/40">
            <CardTitle className="text-base flex items-center gap-2 text-teal-900 dark:text-teal-100">
              <CalendarClock className="h-4 w-4 text-teal-600 dark:text-teal-400" />
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
        <Card className={workflowCardClass}>
          <CardHeader className="pb-2 border-b border-teal-100/70 dark:border-teal-900/40">
            <CardTitle className="text-base text-teal-900 dark:text-teal-100">Record technical result</CardTitle>
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
        <Card className={`${workflowCardClass} border-amber-200/50 dark:border-amber-900/40`}>
          <CardHeader className="pb-2 border-b border-amber-100/80 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20">
            <CardTitle className="text-base flex items-center gap-2 text-amber-950 dark:text-amber-100">
              <Wallet className="h-4 w-4 text-amber-600 dark:text-amber-400" />
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
        <Card className={`${workflowCardClass} border-amber-300/55 dark:border-amber-800/50`}>
          <CardHeader className="pb-2 border-b border-amber-100/80 dark:border-amber-900/40">
            <CardTitle className="text-base text-amber-950 dark:text-amber-100">Approve manual payment</CardTitle>
            <CardDescription>
              Review the applicant’s transfer receipt before issuing the certificate ({fee.toLocaleString()} ETB).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {manualPaymentReceiptUrl && (
              <div className="rounded-lg border border-amber-200/70 dark:border-amber-900/45 bg-amber-50/30 dark:bg-amber-950/20 p-3 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
                  Submitted receipt
                </p>
                {c.paymentBankName?.trim() ? (
                  <p className="text-sm text-foreground">
                    <span className="text-muted-foreground">Bank reported:</span> {c.paymentBankName}
                  </p>
                ) : null}
                {manualPaymentReceiptIsImage ? (
                  <a
                    href={manualPaymentReceiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-md overflow-hidden border border-amber-200/80 dark:border-amber-900/50 bg-background/80"
                  >
                    <img
                      src={manualPaymentReceiptUrl}
                      alt="Payment receipt"
                      className="max-h-64 w-full object-contain object-top"
                    />
                  </a>
                ) : null}
                <a
                  href={manualPaymentReceiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-800 dark:text-amber-200 hover:underline"
                >
                  <ExternalLink className="h-4 w-4 shrink-0" />
                  {manualPaymentReceiptIsImage ? "Open receipt in new tab" : "View receipt (PDF or image)"}
                </a>
              </div>
            )}
            <Button onClick={() => approveManualMutation.mutate()} disabled={approveManualMutation.isPending}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Approve & issue certificate
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Issued */}
      {c.status === "ISSUED" && (
        <Card className={`${workflowCardClass} border-emerald-200/55 dark:border-emerald-900/45`}>
          <CardHeader className="pb-2 border-b border-emerald-100/80 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/25">
            <CardTitle className="text-base text-emerald-900 dark:text-emerald-100">Download certificate</CardTitle>
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
        <Card className={workflowCardClass}>
          <CardHeader className="pb-2 border-b border-teal-100/70 dark:border-teal-900/40">
            <CardTitle className="text-base text-teal-900 dark:text-teal-100">Annual renewal</CardTitle>
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
        <Card className={`${workflowCardClass} border-teal-200/50 dark:border-teal-900/50`}>
          <CardHeader className="pb-2 border-b border-teal-100/70 dark:border-teal-900/40">
            <CardTitle className="text-base text-teal-900 dark:text-teal-100">Complete renewal payment</CardTitle>
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

      {showOwnerInterviewSummary && (
        <Card
          className={`${workflowCardClass} border-teal-300/50 dark:border-teal-800/45 ring-1 ring-teal-200/40 dark:ring-teal-900/40`}
        >
          <CardHeader className="pb-2 border-b border-teal-100/80 dark:border-teal-900/40 bg-teal-50/50 dark:bg-teal-950/30">
            <CardTitle className="text-base flex items-center gap-2 text-teal-900 dark:text-teal-100">
              <CalendarClock className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              {isOwner ? "Your interviews" : "Interview schedule & results"}
            </CardTitle>
            <CardDescription>Schedule and outcomes recorded by staff</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-6">
            {ownerTheoreticalBlock && (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-400">
                  Theoretical interview
                </p>
                {c.theoreticalScheduledAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Scheduled for</p>
                    <p className="text-base font-semibold text-foreground tracking-tight mt-0.5">
                      {fmtInterviewDateTime(c.theoreticalScheduledAt)}
                    </p>
                  </div>
                )}
                {typeof c.theoreticalPassed === "boolean" ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground">Result</span>
                    <Badge
                      className={
                        c.theoreticalPassed
                          ? "bg-emerald-600 hover:bg-emerald-600 text-white border-0"
                          : "bg-amber-700 hover:bg-amber-700 text-white border-0"
                      }
                    >
                      {c.theoreticalPassed ? "Passed" : "Failed"}
                    </Badge>
                  </div>
                ) : (
                  c.status === "THEORETICAL_SCHEDULED" && (
                    <p className="text-sm text-muted-foreground">Result will appear here after the interview is completed.</p>
                  )
                )}
              </div>
            )}

            {ownerTechnicalBlock && (
              <>
                {ownerTheoreticalBlock && <Separator className="bg-teal-100/80 dark:bg-teal-900/40" />}
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-400">
                    Technical interview
                  </p>
                  {c.technicalScheduledAt && (
                    <div>
                      <p className="text-sm text-muted-foreground">Scheduled for</p>
                      <p className="text-base font-semibold text-foreground tracking-tight mt-0.5">
                        {fmtInterviewDateTime(c.technicalScheduledAt)}
                      </p>
                    </div>
                  )}
                  {typeof c.technicalPassed === "boolean" ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-muted-foreground">Result</span>
                      <Badge
                        className={
                          c.technicalPassed
                            ? "bg-emerald-600 hover:bg-emerald-600 text-white border-0"
                            : "bg-amber-700 hover:bg-amber-700 text-white border-0"
                        }
                      >
                        {c.technicalPassed ? "Passed" : "Failed"}
                      </Badge>
                    </div>
                  ) : (
                    c.status === "TECHNICAL_SCHEDULED" && (
                      <p className="text-sm text-muted-foreground">Result will appear here after the interview is completed.</p>
                    )
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {(c.status === "THEORETICAL_FAILED" || c.status === "TECHNICAL_FAILED") && (
        <div className="rounded-lg border border-red-200/80 bg-red-50/80 dark:bg-red-950/30 dark:border-red-900/50 px-4 py-3 text-sm text-red-900 dark:text-red-200">
          This application was not successful. You may start a new application if allowed by policy.
        </div>
      )}
    </div>
  );
}
