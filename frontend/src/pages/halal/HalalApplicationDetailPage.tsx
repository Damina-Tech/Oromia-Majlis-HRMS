"use client";
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Send,
  CreditCard,
  Award,
  FileText,
  Building2,
  AlertCircle,
  XCircle,
  Eye,
  CheckCircle2,
  Wallet,
  Landmark,
  Upload,
  UserPlus,
  ExternalLink,
  MapPin,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { halalApi, type HalalApplication, type HalalApplicationStatus } from "@/services/halal";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { resolveFileUrl } from "@/config/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const STATUS_COLORS: Record<HalalApplicationStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
  SUBMITTED: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200",
  REVIEW: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200",
  INSPECTION: "bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200",
  APPROVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200",
};

const NEXT_ACTION_HINTS: Record<HalalApplicationStatus, { title: string; description: string }> = {
  DRAFT: {
    title: "Complete and submit your application",
    description: "Review your application details and click Submit when ready. You can edit until you submit.",
  },
  SUBMITTED: {
    title: "Inspection in progress",
    description: "Your application was submitted. Assigned inspectors will inspect your business and submit the inspection result.",
  },
  REVIEW: {
    title: "Pay certification fee",
    description: "Committee approved your application. Pay 20,000 ETB to generate your Halal certificate.",
  },
  INSPECTION: {
    title: "Committee review",
    description: "The committee is reviewing your full business profile and inspection results.",
  },
  APPROVED: {
    title: "Certificate issued",
    description: "Your application was approved. Download your Halal certificate below.",
  },
  REJECTED: {
    title: "Application not approved",
    description: "Your application was not approved. See the rejection reason below. You may submit a new application.",
  },
};

const WORKFLOW_STEPS = [
  { key: "DRAFT", label: "Submitted", icon: FileText },
  { key: "SUBMITTED", label: "Inspection", icon: Building2 },
  { key: "INSPECTION", label: "Committee review", icon: AlertCircle },
  { key: "REVIEW", label: "Payment", icon: CreditCard },
  { key: "APPROVED", label: "Certificate", icon: Award },
];

const ETHIOPIAN_BANKS = [
  "Commercial Bank of Ethiopia",
  "Cooperative Bank of Oromia",
  "Oromia Bank",
  "Awash Bank",
  "Hijra Bank",
  "Ramis Bank",
  "Sinqee Bank",
  "Zemzem Bank",
  "Other",
];

const ACCOUNT_NAME = "Oromia Islamic Affairs Supreme Council";
const HALAL_CERTIFICATION_FEE = 20000;

const BANK_ACCOUNT_DETAILS: Record<string, { accountName: string; accountNumber: string }> = {
  "Commercial Bank of Ethiopia": { accountName: ACCOUNT_NAME, accountNumber: "1000600162447" },
  "Cooperative Bank of Oromia": { accountName: ACCOUNT_NAME, accountNumber: "1042200124748" },
  "Oromia Bank": { accountName: ACCOUNT_NAME, accountNumber: "1371866200002" },
  "Awash Bank": { accountName: ACCOUNT_NAME, accountNumber: "014100449821400" },
  "Hijra Bank": { accountName: ACCOUNT_NAME, accountNumber: "1000044440001" },
  "Ramis Bank": { accountName: ACCOUNT_NAME, accountNumber: "1030000551101" },
  "Sinqee Bank": { accountName: ACCOUNT_NAME, accountNumber: "1058169471818" },
  "Zemzem Bank": { accountName: ACCOUNT_NAME, accountNumber: "0006692210301" },
  "Other": { accountName: "Contact admin for account details", accountNumber: "—" },
};

function getOwnerIdDocumentUrl(
  documents?: { name: string; url: string }[]
): string | undefined {
  if (!documents?.length) return undefined;
  const doc = documents.find(
    (d) =>
      d.name?.toLowerCase().includes("owner id") ||
      d.name?.toLowerCase().includes("passport") ||
      d.name === "Owner ID/Passport"
  );
  return doc ? resolveFileUrl(doc.url) : undefined;
}

export default function HalalMyApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const isAdminContext = location.pathname.startsWith("/admin/halal/applications");
  const canCommitteeReview =
    hasPermission("halal.admin") || hasPermission("halal.supervisor") || hasPermission("halal.committee");
  const canCommitteeApprove = hasPermission("halal.committee");
  const canCommitteeReject = hasPermission("halal.admin") || hasPermission("halal.committee");
  const isStaff = canCommitteeReview;
  const canCompleteInspection =
    hasPermission("halal.admin") || hasPermission("halal.supervisor") || hasPermission("halal.inspector");

  const [paymentMethod, setPaymentMethod] = useState<"chapa" | "manual">("chapa");
  const [manualBank, setManualBank] = useState("");
  const [manualReceipt, setManualReceipt] = useState<File | null>(null);

  const { data: app, isLoading } = useQuery({
    queryKey: ["halal-application", id],
    queryFn: () => halalApi.applications.get(id!),
    enabled: !!id,
  });

  const submitMutation = useMutation({
    mutationFn: () => halalApi.applications.submit(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["halal-application", id] });
      queryClient.invalidateQueries({ queryKey: ["halal-applications"] });
      toast.success("Application submitted successfully");
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed to submit"),
  });

  const chapaInitMutation = useMutation({
    mutationFn: () => halalApi.applications.initChapaPayment(id!),
    onSuccess: (data) => {
      if (data.checkoutUrl) window.location.href = data.checkoutUrl;
    },
    onError: (e: any) => {
      const msg = e.response?.data?.message;
      toast.error(typeof msg === "string" ? msg : "Failed to initialize Chapa payment");
    },
  });

  const manualPaymentMutation = useMutation({
    mutationFn: (data: { bankName: string; receipt: File }) =>
      halalApi.applications.confirmManualPayment(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["halal-application", id] });
      queryClient.invalidateQueries({ queryKey: ["halal-applications"] });
      toast.success("Receipt submitted. Payment confirmed.");
      setManualBank("");
      setManualReceipt(null);
    },
    onError: (e: any) => {
      const msg = e.response?.data?.message;
      toast.error(typeof msg === "string" ? msg : "Failed to submit receipt");
    },
  });

  useEffect(() => {
    if (searchParams.get("payment") === "chapa" && id) {
      queryClient.invalidateQueries({ queryKey: ["halal-application", id] });
      toast.success("Payment successful");
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, id, queryClient, setSearchParams]);

  const withdrawMutation = useMutation({
    mutationFn: () => halalApi.applications.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["halal-application", id] });
      queryClient.invalidateQueries({ queryKey: ["halal-applications"] });
      toast.success("Application withdrawn");
      navigate("/halal/dashboard");
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed to withdraw"),
  });

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [meetingMinutesFile, setMeetingMinutesFile] = useState<File | null>(null);
  const [isUploadingMeetingMinutes, setIsUploadingMeetingMinutes] = useState(false);

  const approveMutation = useMutation({
    mutationFn: (payload: { approved: boolean; notes?: string; rejectionReason?: string; meetingMinutesUrl?: string }) =>
      halalApi.applications.approve(id!, payload),
    onSuccess: (_, vars) => {
      toast.success(vars.approved ? "Application approved" : "Application rejected");
      queryClient.invalidateQueries({ queryKey: ["halal-application", id] });
      queryClient.invalidateQueries({ queryKey: ["halal-applications"] });
      setApproveOpen(false);
      setRejectOpen(false);
      setNotes("");
      setRejectionReason("");
      setMeetingMinutesFile(null);
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message ?? "Action failed");
    },
  });

  if (!id || isLoading)
    return (
      <div className="p-6 flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    );
  if (!app) return <div className="p-6 text-muted-foreground">Application not found</div>;

  const application = app as HalalApplication;
  const feeAmount = HALAL_CERTIFICATION_FEE;
  const isPaid = !!application.feePaidAt;
  const hasCompletedInspection = application.inspections?.some((i) => i.completedAt != null) ?? false;
  const effectiveStatus = application.status;
  const currentStepIndex = WORKFLOW_STEPS.findIndex((s) => s.key === effectiveStatus);
  const baseHint = NEXT_ACTION_HINTS[effectiveStatus];
  // When inspection is completed, show awaiting-admin message
  const hint =
    effectiveStatus === "INSPECTION" && hasCompletedInspection
      ? {
          title: "Ready for committee review",
          description:
            "Inspection has been completed. The committee can now review and decide whether to approve this application for payment.",
        }
      : baseHint;
  const isRejected = application.status === "REJECTED";
  const bizDocs = application.documents ?? application.business?.documents ?? [];
  const ownerIdUrl = getOwnerIdDocumentUrl(bizDocs);

  const biz = application.business;
  const canApprove =
    canCommitteeApprove &&
    application.status === "INSPECTION" &&
    hasCompletedInspection;
  const canReject = canCommitteeReject && ["SUBMITTED", "INSPECTION"].includes(application.status);
  const isApproved = application.status === "APPROVED";

  const handleApproveWithMeetingMinutes = async () => {
    try {
      let meetingMinutesUrl: string | undefined;
      if (meetingMinutesFile) {
        setIsUploadingMeetingMinutes(true);
        const uploadResult = await halalApi.businesses.uploadDocument(meetingMinutesFile);
        meetingMinutesUrl = uploadResult.url;
      }
      approveMutation.mutate({
        approved: true,
        notes: notes || undefined,
        meetingMinutesUrl,
      });
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      toast.error(typeof msg === "string" ? msg : "Failed to upload meeting minutes");
    } finally {
      setIsUploadingMeetingMinutes(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500/10 via-teal-500/5 to-transparent dark:from-blue-600/20 dark:via-teal-600/10 border border-blue-200/50 dark:border-blue-800/30 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(isStaff ? "/halal/apply" : "/halal/dashboard")}
            className="self-start text-blue-800 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900/40"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-100">
              Application details
            </h1>
            <p className="text-blue-700/80 dark:text-blue-300/80 text-sm mt-1">
              {application.business?.name ?? application.businessId}
            </p>
          </div>
          <Badge className={`text-sm font-medium px-3 py-1 ${STATUS_COLORS[effectiveStatus]}`}>
            {effectiveStatus === "REVIEW"
              ? "Payment pending"
              : effectiveStatus === "INSPECTION"
                ? "Committee review"
                : effectiveStatus === "SUBMITTED"
                  ? "Inspection"
                : effectiveStatus}
          </Badge>
        </div>
      </div>

      {/* Workflow progress - visual stepper */}
      <Card className="shadow-sm border-blue-200/50 dark:border-blue-900/30 overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Application progress</CardTitle>
          <CardDescription>Current stage and next steps</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-stretch">
            {WORKFLOW_STEPS.map((step, i) => {
              const Icon = step.icon;
              const isPast = isRejected ? i < 4 : i < currentStepIndex;
              const isCurrent =
                !isRejected && effectiveStatus === step.key;
              const isFuture = !isPast && !isCurrent;
              const isLast = i === WORKFLOW_STEPS.length - 1;

              return (
                <React.Fragment key={step.key}>
                  <div
                    className={`flex flex-col items-center flex-1 min-w-0 ${
                      isPast
                        ? "text-emerald-600 dark:text-emerald-400"
                        : isCurrent
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-muted-foreground"
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 transition-colors ${
                        isPast
                          ? "bg-emerald-100 dark:bg-emerald-900/50 ring-2 ring-emerald-500/30"
                          : isCurrent
                            ? "bg-blue-100 dark:bg-blue-900/50 ring-2 ring-blue-500 shadow-md"
                            : "bg-muted"
                      }`}
                    >
                      {isPast ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <span
                      className={`mt-2 text-xs font-medium text-center truncate w-full px-0.5 ${
                        isCurrent ? "text-foreground font-semibold" : ""
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {!isLast && (
                    <div
                      className={`flex-1 min-w-[16px] self-center h-0.5 -mx-1 rounded ${
                        isPast ? "bg-emerald-500/60" : "bg-muted"
                      }`}
                      aria-hidden
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
          {isRejected && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-3 text-center font-medium">
              Application was rejected
            </p>
          )}
        </CardContent>
      </Card>

      {/* Next action hint */}
      <Card
        className={`border-2 ${
          isRejected
            ? "border-red-200/60 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/20"
            : "border-blue-200/60 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-950/20"
        }`}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle className="h-5 w-5" />
            {hint.title}
          </CardTitle>
          <CardDescription>{hint.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {application.status === "DRAFT" && (
            <>
              <Button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}>
                <Send className="h-4 w-4 mr-2" />
                {submitMutation.isPending ? "Submitting…" : "Submit application"}
              </Button>
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setWithdrawOpen(true)}
                disabled={withdrawMutation.isPending}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Withdraw application
              </Button>
            </>
          )}
          {application.status === "APPROVED" && isPaid && (
            <div className="w-full space-y-3">
              <div className="flex items-center gap-2 rounded-lg bg-emerald-100/80 dark:bg-emerald-900/30 px-3 py-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm text-emerald-800 dark:text-emerald-200 font-medium">
                    Certification fee: {feeAmount} ETB
                  </p>
                  <p className="text-sm text-emerald-800 dark:text-emerald-200">
                    Paid on{" "}
                    {application.feePaidAt
                      ? new Date(application.feePaidAt).toLocaleDateString()
                      : "—"}
                    {(application as any).paymentMethod === "MANUAL" && (application as any).paymentBankName && (
                      <span className="text-emerald-700/80 dark:text-emerald-300/80">
                        {" "}via {(application as any).paymentBankName}
                      </span>
                    )}
                    {(application as any).paymentMethod === "CHAPA" && (
                      <span className="text-emerald-700/80 dark:text-emerald-300/80"> via Chapa</span>
                    )}
                  </p>
                </div>
              </div>
              {(application as any).paymentReceiptUrl && (
                <a
                  href={resolveFileUrl((application as any).paymentReceiptUrl) ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 hover:underline flex items-center gap-1"
                >
                  <Eye className="h-4 w-4" /> View receipt
                </a>
              )}
            </div>
          )}
          {application.status === "REVIEW" && !isPaid && (
            <>
              <div className="w-full space-y-4">
                <p className="text-sm text-muted-foreground">
                  Fee: {feeAmount} ETB. Choose your payment method:
                </p>
                <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "chapa" | "manual")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="chapa" className="flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      Pay online (Chapa)
                    </TabsTrigger>
                    <TabsTrigger value="manual" className="flex items-center gap-2">
                      <Landmark className="h-4 w-4" />
                      Bank transfer
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="chapa" className="mt-4 space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Pay securely with Chapa. You will be redirected to complete the payment.
                    </p>
                    <Button
                      onClick={() => chapaInitMutation.mutate()}
                      disabled={chapaInitMutation.isPending}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {chapaInitMutation.isPending ? (
                        "Redirecting…"
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Pay {feeAmount} ETB with Chapa
                        </>
                      )}
                    </Button>
                  </TabsContent>
                  <TabsContent value="manual" className="mt-4 space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Transfer {feeAmount} ETB to the designated bank account, then upload your receipt.
                    </p>
                    <div>
                      <Label>Bank name</Label>
                      <select
                        value={manualBank}
                        onChange={(e) => setManualBank(e.target.value)}
                        className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="">Select bank</option>
                        {ETHIOPIAN_BANKS.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                      {manualBank && BANK_ACCOUNT_DETAILS[manualBank] && (
                        <div className="mt-2 rounded-md border border-muted bg-muted/30 px-3 py-2 text-xs">
                          <p className="font-medium text-muted-foreground">Transfer to:</p>
                          <p><span className="text-muted-foreground">Account Name:</span> {BANK_ACCOUNT_DETAILS[manualBank].accountName}</p>
                          <p><span className="text-muted-foreground">Account Number:</span> {BANK_ACCOUNT_DETAILS[manualBank].accountNumber}</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <Label>Payment receipt (PDF or image)</Label>
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="mt-1"
                        onChange={(e) => setManualReceipt(e.target.files?.[0] ?? null)}
                      />
                    </div>
                    <Button
                      onClick={() => {
                        if (!manualBank.trim()) {
                          toast.error("Select a bank");
                          return;
                        }
                        if (!manualReceipt) {
                          toast.error("Upload your payment receipt");
                          return;
                        }
                        manualPaymentMutation.mutate({ bankName: manualBank, receipt: manualReceipt });
                      }}
                      disabled={manualPaymentMutation.isPending || !manualBank || !manualReceipt}
                    >
                      {manualPaymentMutation.isPending ? (
                        "Submitting…"
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Submit receipt
                        </>
                      )}
                    </Button>
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
          {application.status === "APPROVED" && application.certificate && (
            <Button
              variant="outline"
              onClick={() =>
                halalApi.certificates.download(
                  application.certificate!.id,
                  application.certificate!.certificateId
                )
              }
            >
              <Award className="h-4 w-4 mr-2" />
              Download certificate
            </Button>
          )}
          {(application.status === "APPROVED" || application.status === "REJECTED") && (
            <Button variant="outline" onClick={() => navigate("/halal/dashboard")}>
              Back to dashboard
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Business info */}
      <Card className="shadow-sm border-slate-200/60 dark:border-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" /> Business
          </CardTitle>
          <CardDescription>Business and contact details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-lg">{application.business?.name}</p>
              <p className="text-sm text-muted-foreground">
                Category: {application.business?.category?.replace("_", " ")}
              </p>
            </div>
            {application.business?.id && (
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                onClick={() => navigate(`/halal/businesses/${application.business!.id}`)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View
              </Button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t">
            <p className="text-sm">
              <span className="text-muted-foreground">Contact:</span>{" "}
              {application.business?.contactName}
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Email:</span>{" "}
              <a
                href={`mailto:${application.business?.contactEmail}`}
                className="text-primary hover:underline"
              >
                {application.business?.contactEmail}
              </a>
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Phone:</span>{" "}
              {application.business?.contactPhone}
            </p>
            <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
              <p className="text-sm">
                <span className="text-muted-foreground">Owner ID / Passport:</span>{" "}
                {application.business?.ownerNationalId || "—"}
              </p>
              {ownerIdUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                  onClick={() => window.open(ownerIdUrl, "_blank", "noopener,noreferrer")}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View document
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Payment status
      {application.status !== "DRAFT" && (
        <Card
          className={`shadow-sm ${
            isPaid
              ? "border-emerald-200/70 dark:border-emerald-800/50 bg-emerald-50/40 dark:bg-emerald-950/20"
              : "border-amber-200/70 dark:border-amber-800/50 bg-amber-50/40 dark:bg-amber-950/20"
          }`}
        >
          <CardHeader>
            <CardTitle
              className={`flex items-center gap-2 ${
                isPaid ? "text-emerald-800 dark:text-emerald-200" : "text-amber-800 dark:text-amber-200"
              }`}
            >
              <CreditCard className={`h-5 w-5 ${isPaid ? "text-emerald-600" : "text-amber-600"}`} />
              Certification fee
            </CardTitle>
            <CardDescription>Fee amount: {feeAmount} ETB</CardDescription>
          </CardHeader>
          <CardContent>
            {isPaid ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-lg bg-emerald-100/80 dark:bg-emerald-900/30 px-3 py-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <p className="text-sm text-emerald-800 dark:text-emerald-200 font-medium">
                    Paid on{" "}
                    {application.feePaidAt
                      ? new Date(application.feePaidAt).toLocaleDateString()
                      : "—"}
                    {(application as any).paymentMethod === "MANUAL" && (application as any).paymentBankName && (
                      <span className="text-emerald-700/80 dark:text-emerald-300/80">
                        {" "}via {(application as any).paymentBankName}
                      </span>
                    )}
                    {(application as any).paymentMethod === "CHAPA" && (
                      <span className="text-emerald-700/80 dark:text-emerald-300/80"> via Chapa</span>
                    )}
                  </p>
                </div>
                {(application as any).paymentReceiptUrl && (
                  <a
                    href={resolveFileUrl((application as any).paymentReceiptUrl) ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:underline flex items-center gap-1"
                  >
                    <Eye className="h-4 w-4" /> View receipt
                  </a>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      )} */}

      {/* Inspections - read-only for owner; staff sees Complete button + result when completed */}
      {application.inspections && application.inspections.length > 0 && (
        <Card className="shadow-sm border-slate-200/60 dark:border-slate-800/50">
          <CardHeader>
            <CardTitle>Inspections</CardTitle>
            <CardDescription>
              {canCompleteInspection ? "Scheduled and completed inspections" : "Assigned inspections"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {application.inspections.map((ins) => {
                const data = ins.checklistData as Record<string, unknown> | undefined;
                const overallPassed = data?.overallPassed as boolean | undefined;
                const observations = (data?.observations as string) || ins.notes || "";
                const recommendations = data?.recommendations as string | undefined;
                const additionalNotes = (data?.additionalNotes as string) || "";
                const reportUrlRaw = data?.inspectionReportUrl as string | undefined;
                const reportFileName = (data?.inspectionReportFileName as string) || "Inspection report";
                const reportUrl = reportUrlRaw ? resolveFileUrl(reportUrlRaw) : undefined;
                const checklistKeys = ["premisesClean", "equipmentHalalCompliant", "storageProper", "ingredientTraceability", "noProhibitedSubstances", "personnelTrained"];
                const checklistMet = checklistKeys.filter((k) => data?.[k] === true).length;
                const hasResult = ins.completedAt && data;

                return (
                  <li
                    key={ins.id}
                    className={`rounded-md border overflow-hidden ${canCompleteInspection ? "" : "bg-muted/30"}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2 px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {ins.inspector?.firstName} {ins.inspector?.lastName}
                        </p>
                        {ins.scheduledAt && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Scheduled: {new Date(ins.scheduledAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={ins.completedAt ? "default" : "secondary"}
                          className={ins.completedAt ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200" : ""}
                        >
                          {ins.completedAt ? "Completed" : canCompleteInspection ? "Pending" : "Scheduled"}
                        </Badge>
                        {!ins.completedAt && canCompleteInspection && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/40"
                            onClick={() => navigate(`/admin/halal/inspections/${ins.id}/complete`)}
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                    {hasResult && (
                      <div className="border-t bg-muted/20 px-3 py-2.5 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-foreground/80 uppercase tracking-wide">Result</span>
                          <Badge
                            className={
                              overallPassed === true
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200 border-0"
                                : overallPassed === false
                                  ? "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200 border-0"
                                  : "bg-muted text-muted-foreground border-0"
                            }
                          >
                            {overallPassed === true ? "Passed" : overallPassed === false ? "Failed" : "—"}
                          </Badge>
                          {typeof checklistMet === "number" && checklistKeys.length > 0 && (
                            <span className="text-xs font-medium text-foreground/70">
                              Checklist: {checklistMet}/{checklistKeys.length} items met
                            </span>
                          )}
                          {reportUrl && (
                            <a
                              href={reportUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Attachment: {reportFileName}
                            </a>
                          )}
                        </div>
                        {observations && (
                          <div>
                            <p className="text-xs font-bold text-foreground/80 uppercase tracking-wide mb-1">Observations</p>
                            <p className="text-sm text-foreground/90 line-clamp-2">{observations}</p>
                          </div>
                        )}
                        {recommendations && (
                          <div>
                            <p className="text-xs font-bold text-foreground/80 uppercase tracking-wide mb-1">Recommendations</p>
                            <p className="text-sm text-foreground/90 line-clamp-2">{recommendations}</p>
                          </div>
                        )}
                        {(additionalNotes || ins.notes) && (
                          <div>
                            <p className="text-xs font-bold text-foreground/80 uppercase tracking-wide mb-1">Additional note</p>
                            <p className="text-sm text-foreground/90 line-clamp-2">
                              {additionalNotes || ins.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Rejection reason */}
      {application.status === "REJECTED" && application.rejectionReason && (
        <Card className="border-2 border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="text-red-700 dark:text-red-300">Rejection reason</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-800/90 dark:text-red-200/90">
              {application.rejectionReason}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Staff-only: Supplier info */}
      {isStaff && application.supplierInfo && application.supplierInfo.length > 0 && (
        <Card className="shadow-sm border-slate-200/60 dark:border-slate-800/50">
          <CardHeader>
            <CardTitle>Suppliers</CardTitle>
            <CardDescription>Listed suppliers and their certification</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {application.supplierInfo.map((s, i) => (
                <li key={i} className="flex justify-between py-2 border-b last:border-0">
                  <span>{s.name}</span>
                  <span className="text-sm text-muted-foreground">{s.certification ?? "—"}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Staff-only: Certificate card (View + Download) */}
      {isStaff && application.certificate && isApproved && (
        <Card className="shadow-sm border-slate-200/60 dark:border-slate-800/50">
          <CardHeader>
            <CardTitle>Certificate</CardTitle>
            <CardDescription>{application.certificate.certificateId}</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button
              variant="outline"
              onClick={() =>
                halalApi.certificates.openInNewTab(application.certificate!.id)
              }
            >
              View certificate
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                halalApi.certificates.download(
                  application.certificate!.id,
                  application.certificate!.certificateId
                )
              }
            >
              Download PDF
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Staff-only: Committee actions (Approve, Reject, Assign inspectors) */}
          {canCommitteeReview && (
        <Card className="shadow-sm border-blue-200/50 dark:border-blue-900/30">
          <CardHeader>
            <CardTitle className="text-blue-800 dark:text-blue-200">Committee actions</CardTitle>
            <CardDescription>Review this application and inspection outcome</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {canReject && !canApprove && (
              <span className="text-xs text-muted-foreground w-full">
                Complete an inspection before approving
              </span>
            )}
            {canApprove && (
              <Button size="sm" variant="default" onClick={() => setApproveOpen(true)}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve
              </Button>
            )}
            {canReject && (
              <Button size="sm" variant="destructive" onClick={() => setRejectOpen(true)}>
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            )}
            {["SUBMITTED", "REVIEW", "INSPECTION"].includes(application.status) && (
              <Button
                size="sm"
                variant="outline"
                disabled={hasCompletedInspection}
                title={hasCompletedInspection ? "Inspection already completed; cannot reassign" : undefined}
                onClick={() =>
                  navigate("/admin/halal/inspections", { state: { applicationId: application.id } })
                }
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Assign inspectors
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Approve dialog */}
      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve application</DialogTitle>
            <DialogDescription>Add optional notes for the approval.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Approval notes…"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Meeting minutes (optional)</Label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => setMeetingMinutesFile(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-muted-foreground">
                Committee head can attach the meeting minutes when approving this application.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleApproveWithMeetingMinutes}
              disabled={approveMutation.isPending || isUploadingMeetingMinutes || !canCommitteeApprove}
            >
              {isUploadingMeetingMinutes
                ? "Uploading minutes..."
                : approveMutation.isPending
                  ? "Approving..."
                  : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject application</DialogTitle>
            <DialogDescription>
              Provide a reason for rejection. This will be shared with the applicant.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rejection reason *</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Reason for rejection…"
                rows={4}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                approveMutation.mutate({
                  approved: false,
                  rejectionReason: rejectionReason || "No reason provided",
                })
              }
              disabled={approveMutation.isPending || !rejectionReason.trim()}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdraw confirmation dialog */}
      <AlertDialog
        open={withdrawOpen}
        onOpenChange={(o) => !withdrawMutation.isPending && setWithdrawOpen(o)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw application?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel your application. You can submit a new application later if needed.
              This action cannot be undone.
              {!isPaid && ["SUBMITTED", "INSPECTION", "REVIEW"].includes(application.status) && (
                <span className="block mt-2 text-amber-600">
                  Payment has not been confirmed yet, so you can still withdraw this application.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={withdrawMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => withdrawMutation.mutate()}
              disabled={withdrawMutation.isPending}
            >
              {withdrawMutation.isPending ? "Withdrawing…" : "Withdraw"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
