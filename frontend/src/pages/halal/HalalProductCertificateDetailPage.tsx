"use client";
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  Landmark,
  Package,
  ShieldCheck,
  Upload,
  Wallet,
} from "lucide-react";
import {
  halalApi,
  HALAL_PRODUCT_CERTIFICATE_FEE_ETB,
  type HalalProductCertificate,
  type HalalProductCertificateStatus,
} from "@/services/halal";
import { resolveFileUrl } from "@/config/api";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
const BANK_ACCOUNT_DETAILS: Record<string, { accountName: string; accountNumber: string }> = {
  "Commercial Bank of Ethiopia": { accountName: ACCOUNT_NAME, accountNumber: "1000600162447" },
  "Cooperative Bank of Oromia": { accountName: ACCOUNT_NAME, accountNumber: "1042200124748" },
  "Oromia Bank": { accountName: ACCOUNT_NAME, accountNumber: "1371866200002" },
  "Awash Bank": { accountName: ACCOUNT_NAME, accountNumber: "014100449821400" },
  "Hijra Bank": { accountName: ACCOUNT_NAME, accountNumber: "1000044440001" },
  "Ramis Bank": { accountName: ACCOUNT_NAME, accountNumber: "1030000551101" },
  "Sinqee Bank": { accountName: ACCOUNT_NAME, accountNumber: "1058169471818" },
  "Zemzem Bank": { accountName: ACCOUNT_NAME, accountNumber: "0006692210301" },
  Other: { accountName: "Contact admin for account details", accountNumber: "-" },
};

function statusBadgeClass(status: HalalProductCertificateStatus): string {
  switch (status) {
    case "ISSUED":
      return "bg-emerald-100 text-emerald-900 border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-100 dark:border-emerald-800/50";
    case "AWAITING_DETAILS_APPROVAL":
      return "bg-sky-100 text-sky-950 border-sky-200/80 dark:bg-sky-950/40 dark:text-sky-100 dark:border-sky-800/50";
    case "PAYMENT_PENDING":
      return "bg-amber-100 text-amber-950 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-100 dark:border-amber-800/50";
    case "CANCELLED":
      return "bg-red-100 text-red-900 border-red-200/80 dark:bg-red-950/50 dark:text-red-100 dark:border-red-800/50";
    default:
      return "";
  }
}

function paymentMethodLabel(method: string | null | undefined): string {
  const m = (method ?? "").toUpperCase();
  if (m === "CHAPA") return "Chapa (online)";
  if (m === "MANUAL") return "Bank transfer";
  return "Not selected yet";
}

function receiptLooksPdf(path: string): boolean {
  return /\.pdf(\?|#|$)/i.test(path);
}

function receiptLooksImage(path: string): boolean {
  return /\.(jpe?g|png|gif|webp)(\?|#|$)/i.test(path);
}

function approverLabel(
  user?: { firstName: string; lastName: string; email: string } | null,
  at?: string | null
): string | null {
  if (!user && !at) return null;
  const name = user ? `${user.firstName} ${user.lastName}`.trim() : "Staff";
  const when = at ? new Date(at).toLocaleString() : null;
  return when ? `${name} · ${when}` : name;
}

function PaymentReceiptPreview({ relativeUrl }: { relativeUrl: string }) {
  const fullUrl = resolveFileUrl(relativeUrl);
  if (!fullUrl) return null;

  return (
    <div className="rounded-xl border border-teal-200/40 dark:border-teal-900/50 bg-gradient-to-b from-teal-50/40 to-transparent dark:from-teal-950/20 overflow-hidden shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-teal-200/30 dark:border-teal-900/40 bg-teal-50/50 dark:bg-teal-950/30 px-3 py-2.5">
        <div className="flex items-center gap-2 text-xs font-medium text-teal-900 dark:text-teal-100">
          <FileText className="h-3.5 w-3.5 opacity-80" />
          Payment receipt
        </div>
        <a
          href={fullUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs inline-flex items-center gap-1 font-medium text-teal-700 hover:text-teal-800 dark:text-teal-300 dark:hover:text-teal-200"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open in new tab
        </a>
      </div>
      <div className="p-2 sm:p-3">
        {receiptLooksImage(relativeUrl) ? (
          <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="block">
            <img
              src={fullUrl}
              alt="Payment receipt"
              className="max-h-[min(440px,55vh)] w-full rounded-lg border border-border/50 object-contain bg-muted/30"
            />
          </a>
        ) : receiptLooksPdf(relativeUrl) ? (
          <iframe
            title="Payment receipt PDF"
            src={fullUrl}
            className="h-[min(440px,55vh)] w-full rounded-lg border border-border/50 bg-white dark:bg-slate-950"
          />
        ) : (
          <p className="text-sm text-muted-foreground px-2 py-6 text-center">
            Preview unavailable for this file type.{" "}
            <a href={fullUrl} className="text-teal-600 dark:text-teal-400 underline font-medium" target="_blank" rel="noopener noreferrer">
              Download / open
            </a>
          </p>
        )}
      </div>
    </div>
  );
}

export default function HalalProductCertificateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, hasPermission } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<"chapa" | "manual">("chapa");
  const [manualBank, setManualBank] = useState("");
  const [manualReceipt, setManualReceipt] = useState<File | null>(null);

  const canApproveManualPayment =
    hasPermission("halal.admin") || hasPermission("halal.supervisor") || hasPermission("halal.finance");
  /** Admin may act as supervisor until dedicated supervisor permission is enforced. */
  const canApproveDetails = hasPermission("halal.admin") || hasPermission("halal.supervisor");

  const { data: row, isLoading } = useQuery({
    queryKey: ["halal-product-certificate", id],
    queryFn: () => halalApi.productCertificates.get(id!),
    enabled: !!id,
  });

  const chapaMutation = useMutation({
    mutationFn: () => halalApi.productCertificates.initChapaPayment(id!),
    onSuccess: (data) => {
      if (data.checkoutUrl) window.location.href = data.checkoutUrl;
    },
    onError: (e: any) => {
      const msg = e.response?.data?.message;
      toast.error(typeof msg === "string" ? msg : "Failed to start Chapa payment");
    },
  });

  const manualMutation = useMutation({
    mutationFn: (data: { bankName: string; receipt: File }) =>
       halalApi.productCertificates.confirmManualPayment(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["halal-product-certificate", id] });
      queryClient.invalidateQueries({ queryKey: ["halal-product-certificates"] });
      toast.success("Receipt submitted. Awaiting admin payment approval.");
      setManualBank("");
      setManualReceipt(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed to submit"),
  });

  const approveManualMutation = useMutation({
    mutationFn: () => halalApi.productCertificates.approveManualPayment(id!),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["halal-product-certificate", id] });
      queryClient.invalidateQueries({ queryKey: ["halal-product-certificates"] });
      if (updated.status === "ISSUED") {
        toast.success("Payment approved and certificate issued.");
      } else {
        toast.success("Payment approved. Supervisor details approval is still required before issuance.");
      }
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed to approve payment"),
  });

  const approveDetailsMutation = useMutation({
    mutationFn: () => halalApi.productCertificates.approveDetails(id!),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["halal-product-certificate", id] });
      queryClient.invalidateQueries({ queryKey: ["halal-product-certificates"] });
      if (updated.status === "ISSUED") {
        toast.success("Details approved. Product certificate issued.");
      } else {
        toast.success("Details approved. Certificate will issue after payment is settled.");
      }
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed to approve details"),
  });

  useEffect(() => {
    if (searchParams.get("payment") === "chapa" && id) {
      queryClient.invalidateQueries({ queryKey: ["halal-product-certificate", id] });
      toast.success("Payment received. Awaiting details approval before certificate issuance.");
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, id, queryClient, setSearchParams]);

  if (!id || isLoading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[240px] gap-3">
        <div className="animate-spin h-10 w-10 border-2 border-teal-600 border-t-transparent rounded-full" />
        <p className="text-sm text-muted-foreground">Loading certificate…</p>
      </div>
    );
  }
  if (!row) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <p className="text-muted-foreground">Not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/halal/certificates")}>
          Back
        </Button>
      </div>
    );
  }

  const pc = row as HalalProductCertificate;
  const isPaid = !!pc.feePaidAt;
  const detailsApproved = !!pc.detailsApprovedAt;
  const fee = HALAL_PRODUCT_CERTIFICATE_FEE_ETB;
  const isApplicantBusinessOwner = Boolean(user?.id && pc.business?.userId === user.id);
  const isStaffViewer = !isApplicantBusinessOwner && (canApproveManualPayment || canApproveDetails);

  const showReceiptPreview =
    !!pc.paymentReceiptUrl &&
    (isApplicantBusinessOwner || (canApproveManualPayment && !isApplicantBusinessOwner));

  const awaitingManualApproval =
    pc.status === "PAYMENT_PENDING" &&
    !isPaid &&
    pc.paymentMethod === "MANUAL" &&
    !!pc.paymentReceiptUrl;

  const showApprovePaymentCard =
    canApproveManualPayment &&
    pc.status === "PAYMENT_PENDING" &&
    pc.paymentMethod === "MANUAL" &&
    !!pc.paymentReceiptUrl &&
    !isPaid &&
    !isApplicantBusinessOwner;

  const showApproveDetailsCard =
    canApproveDetails &&
    !detailsApproved &&
    pc.status !== "ISSUED" &&
    pc.status !== "CANCELLED" &&
    !isApplicantBusinessOwner;

  let paymentStatusLabel: string;
  let paymentStatusDetail: string | null = null;
  if (isPaid && pc.feePaidAt) {
    paymentStatusLabel = "Paid";
    paymentStatusDetail = new Date(pc.feePaidAt).toLocaleString();
  } else if (awaitingManualApproval) {
    paymentStatusLabel = "Awaiting admin payment approval";
    paymentStatusDetail = "Staff must verify your bank receipt before payment is marked settled.";
  } else if (pc.status === "PAYMENT_PENDING") {
    paymentStatusLabel = "Payment required";
    paymentStatusDetail = `${fee.toLocaleString()} ETB must be paid before issuance.`;
  } else {
    paymentStatusLabel = pc.status === "ISSUED" ? "Complete" : "—";
    paymentStatusDetail = null;
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6 pb-12">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/halal/certificates")}
        className="text-teal-800 dark:text-teal-200 hover:bg-teal-100/80 dark:hover:bg-teal-950/50 -ml-2"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to certificates
      </Button>

      <div className="relative overflow-hidden rounded-2xl border border-teal-200/50 dark:border-teal-900/40 bg-gradient-to-br from-teal-500/[0.08] via-cyan-500/[0.04] to-transparent dark:from-teal-600/15 dark:via-cyan-900/10 p-5 sm:p-6">
        <div className="flex flex-wrap items-start gap-4 justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-600/15 text-teal-700 dark:bg-teal-500/20 dark:text-teal-200">
              <Package className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-semibold text-teal-950 dark:text-teal-50 tracking-tight">
                Product Halal certificate
              </h1>
              <p className="text-sm text-teal-800/80 dark:text-teal-200/80 mt-1">
                {pc.business?.name ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 shrink-0 opacity-70" />
                    {pc.business.name}
                  </span>
                ) : (
                  "Per-shipment product certification"
                )}
              </p>
            </div>
          </div>
          <Badge variant="outline" className={`shrink-0 border font-semibold ${statusBadgeClass(pc.status)}`}>
            {pc.status.replace(/_/g, " ")}
          </Badge>
        </div>
        {pc.certificateNumber && (
          <p className="mt-4 font-mono text-sm font-medium text-teal-900 dark:text-teal-100 bg-white/60 dark:bg-black/20 rounded-lg px-3 py-2 border border-teal-200/30 dark:border-teal-800/40 w-fit max-w-full">
            {pc.certificateNumber}
          </p>
        )}
      </div>

      <Card className="shadow-sm border-slate-200/70 dark:border-slate-800/60 overflow-hidden">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <CardTitle className="text-base">Shipment details</CardTitle>
          <CardDescription>Product and logistics information</CardDescription>
        </CardHeader>
        <CardContent className="pt-4 grid gap-3 sm:grid-cols-2">
          {[
            { label: "Parent certificate", value: pc.halalCertificate?.certificateId ?? "—", mono: true, span: 2 },
            { label: "Product", value: pc.productName, span: 2 },
            { label: "Consignment (PCS)", value: pc.consignmentPcs ?? "—" },
            { label: "Net weight", value: pc.netWeightKg ? `${pc.netWeightKg} kg` : "—" },
            { label: "Gross weight", value: pc.grossWeightKg ? `${pc.grossWeightKg} kg` : "—" },
            { label: "Shipping", value: pc.shipping ?? "—" },
            { label: "Voyage / flight no.", value: pc.voyageFlightNo ?? "—" },
            { label: "Loading port", value: pc.loadingPort ?? "—" },
            { label: "Destination", value: pc.destination },
            {
              label: "Slaughtering date",
              value: pc.slaughteringDate
                ? new Date(pc.slaughteringDate).toLocaleDateString()
                : "—",
            },
            {
              label: "Production date",
              value: pc.productionDate ? new Date(pc.productionDate).toLocaleDateString() : "—",
            },
            {
              label: "Expiry date",
              value: pc.expiryDate ? new Date(pc.expiryDate).toLocaleDateString() : "—",
            },
            { label: "Health certificate no.", value: pc.healthCertificateNo ?? "—" },
            { label: "Slaughtering certificate", value: pc.slaughteringCertificate ?? "—", span: 2 },
            { label: "Authorized representative", value: pc.authorizedRepresentative ?? "—", span: 2 },
          ].map((row) => (
            <div
              key={row.label}
              className={`flex items-start gap-2 text-sm ${row.span === 2 ? "sm:col-span-2" : ""}`}
            >
              <span className="text-muted-foreground shrink-0 w-36 text-xs sm:text-sm">{row.label}</span>
              <span className={row.mono ? "font-mono font-medium" : ""}>{row.value}</span>
            </div>
          ))}
          {pc.notes && (
            <div className="sm:col-span-2 text-sm rounded-lg border border-dashed border-muted-foreground/25 bg-muted/20 px-3 py-2">
              <span className="text-muted-foreground text-xs uppercase tracking-wide">Notes</span>
              <p className="mt-1">{pc.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {(isStaffViewer || pc.status !== "PAYMENT_PENDING" || isPaid || detailsApproved) && pc.status !== "ISSUED" && (
        <Card className="shadow-sm border-slate-200/70 dark:border-slate-800/60 overflow-hidden">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-teal-700" />
              Approval checklist
            </CardTitle>
            <CardDescription>
              Certificate PDF is generated only after payment is settled and details are approved.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-start gap-3 rounded-lg border px-3 py-2.5">
              {isPaid ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  1. Admin payment approval
                  {pc.paymentMethod === "CHAPA" && isPaid ? " (satisfied by Chapa)" : ""}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isPaid
                    ? approverLabel(pc.manualPaymentApprovedBy, pc.manualPaymentApprovedAt) ||
                      (pc.paymentMethod === "CHAPA"
                        ? "Online payment verified"
                        : "Payment settled")
                    : pc.paymentMethod === "MANUAL" && pc.paymentReceiptUrl
                      ? "Waiting for admin to verify bank receipt"
                      : "Waiting for payment"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border px-3 py-2.5">
              {detailsApproved ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <Clock className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium">2. Supervisor details approval</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {detailsApproved
                    ? approverLabel(pc.detailsApprovedBy, pc.detailsApprovedAt) || "Details verified"
                    : "Verify shipment details are accurate and complete (admin can approve for now)"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm border-teal-200/50 dark:border-teal-900/45 overflow-hidden">
        <CardHeader className="pb-3 border-b border-teal-200/30 dark:border-teal-900/40 bg-teal-50/40 dark:bg-teal-950/25">
          <CardTitle className="text-base flex items-center gap-2 text-teal-900 dark:text-teal-100">
            <CreditCard className="h-4 w-4" />
            Payment & status
          </CardTitle>
          <CardDescription>Method, fee, and verification state</CardDescription>
        </CardHeader>
        <CardContent className="pt-5 space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border bg-card px-4 py-3 space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Payment method</p>
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                {(pc.paymentMethod ?? "").toUpperCase() === "CHAPA" && <Wallet className="h-4 w-4 text-teal-600" />}
                {(pc.paymentMethod ?? "").toUpperCase() === "MANUAL" && <Landmark className="h-4 w-4 text-teal-600" />}
                {paymentMethodLabel(pc.paymentMethod)}
              </p>
              {pc.paymentMethod === "MANUAL" && pc.paymentBankName && (
                <p className="text-xs text-muted-foreground mt-1">Bank: {pc.paymentBankName}</p>
              )}
            </div>
            <div className="rounded-xl border bg-card px-4 py-3 space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Fee</p>
              <p className="text-sm font-semibold tabular-nums">{fee.toLocaleString()} ETB</p>
              {isPaid && <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Settled</p>}
            </div>
            <div className="sm:col-span-2 rounded-xl border bg-card px-4 py-3 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 min-w-0">
                {isPaid ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                ) : awaitingManualApproval ? (
                  <Clock className="h-5 w-5 text-amber-600 shrink-0" />
                ) : (
                  <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
                )}
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Payment status</p>
                  <p className="text-sm font-semibold">{paymentStatusLabel}</p>
                  {paymentStatusDetail && <p className="text-xs text-muted-foreground mt-0.5">{paymentStatusDetail}</p>}
                </div>
              </div>
            </div>
          </div>

          {showReceiptPreview && pc.paymentReceiptUrl && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  {showApprovePaymentCard ? "Receipt for your review" : "Your uploaded receipt"}
                </p>
                <PaymentReceiptPreview relativeUrl={pc.paymentReceiptUrl} />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {pc.status === "PAYMENT_PENDING" && !isPaid && isApplicantBusinessOwner && awaitingManualApproval && (
        <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900/40 px-4 py-3 flex gap-3 text-sm text-amber-950 dark:text-amber-100">
          <Clock className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div>
            <p className="font-medium">Receipt received</p>
            <p className="text-amber-900/85 dark:text-amber-200/85 mt-1">
              Waiting for admin to approve your payment, then supervisor details approval before the PDF can be issued.
            </p>
          </div>
        </div>
      )}

      {isApplicantBusinessOwner && isPaid && !detailsApproved && pc.status !== "ISSUED" && (
        <div className="rounded-xl border border-sky-200/60 bg-sky-50/50 dark:bg-sky-950/20 dark:border-sky-900/40 px-4 py-3 flex gap-3 text-sm text-sky-950 dark:text-sky-100">
          <Clock className="h-5 w-5 shrink-0 text-sky-600 dark:text-sky-400 mt-0.5" />
          <div>
            <p className="font-medium">Payment settled</p>
            <p className="text-sky-900/85 dark:text-sky-200/85 mt-1">
              Staff are reviewing your shipment details. The certificate PDF will be available after details approval.
            </p>
          </div>
        </div>
      )}

      {pc.status === "PAYMENT_PENDING" && !isPaid && isApplicantBusinessOwner && !awaitingManualApproval && (
        <Card className="border-amber-200/55 dark:border-amber-900/40 shadow-sm overflow-hidden">
          <CardHeader className="bg-amber-50/40 dark:bg-amber-950/20 border-b border-amber-200/40 dark:border-amber-900/40">
            <CardTitle className="text-base">Step 2: Pay {fee.toLocaleString()} ETB</CardTitle>
            <CardDescription>Pay online with Chapa or transfer to a listed bank and upload your receipt.</CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "chapa" | "manual")}>
              <TabsList className="grid w-full grid-cols-2 h-11">
                <TabsTrigger value="chapa" className="gap-2 data-[state=active]:bg-teal-600 data-[state=active]:text-white">
                  <Wallet className="h-4 w-4" />
                  Chapa
                </TabsTrigger>
                <TabsTrigger value="manual" className="gap-2 data-[state=active]:bg-teal-600 data-[state=active]:text-white">
                  <Landmark className="h-4 w-4" />
                  Bank transfer
                </TabsTrigger>
              </TabsList>
              <TabsContent value="chapa" className="mt-4 space-y-3">
                <p className="text-sm text-muted-foreground">You will be redirected to Chapa to complete payment securely.</p>
                <Button
                  className="bg-teal-600 hover:bg-teal-700"
                  onClick={() => chapaMutation.mutate()}
                  disabled={chapaMutation.isPending}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay {fee.toLocaleString()} ETB with Chapa
                </Button>
              </TabsContent>
              <TabsContent value="manual" className="mt-4 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Transfer {fee.toLocaleString()} ETB, then upload a clear photo or PDF of your receipt.
                </p>
                <div>
                  <Label>Bank name</Label>
                  <select
                    value={manualBank}
                    onChange={(e) => setManualBank(e.target.value)}
                    className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30"
                  >
                    <option value="">Select bank</option>
                    {ETHIOPIAN_BANKS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                  {manualBank && BANK_ACCOUNT_DETAILS[manualBank] && (
                    <div className="mt-2 rounded-lg border border-muted bg-muted/30 px-3 py-2.5 text-xs space-y-0.5">
                      <p className="font-semibold text-muted-foreground">Transfer to</p>
                      <p>
                        <span className="text-muted-foreground">Account name:</span> {BANK_ACCOUNT_DETAILS[manualBank].accountName}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Account number:</span>{" "}
                        <span className="font-mono">{BANK_ACCOUNT_DETAILS[manualBank].accountNumber}</span>
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <Label>Receipt (PDF or image)</Label>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="mt-1.5"
                    onChange={(e) => setManualReceipt(e.target.files?.[0] ?? null)}
                  />
                </div>
                <Button
                  className="bg-teal-600 hover:bg-teal-700"
                  onClick={() => {
                    if (!manualBank.trim()) {
                      toast.error("Select a bank");
                      return;
                    }
                    if (!manualReceipt) {
                      toast.error("Upload receipt");
                      return;
                    }
                    manualMutation.mutate({ bankName: manualBank, receipt: manualReceipt });
                  }}
                  disabled={manualMutation.isPending}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Submit receipt
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {showApprovePaymentCard && (
        <Card className="border-violet-200/60 dark:border-violet-900/45 shadow-sm overflow-hidden">
          <CardHeader className="pb-2 bg-violet-50/50 dark:bg-violet-950/25 border-b border-violet-200/40 dark:border-violet-900/40">
            <CardTitle className="text-base text-violet-950 dark:text-violet-100">1. Approve manual payment</CardTitle>
            <CardDescription>
              Confirm the receipt matches the fee and bank details. This settles payment only — details approval is still required before the PDF is generated.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <Button
              className="w-full bg-violet-600 hover:bg-violet-700"
              onClick={() => approveManualMutation.mutate()}
              disabled={approveManualMutation.isPending}
            >
              {approveManualMutation.isPending ? "Approving…" : "Approve payment"}
            </Button>
          </CardContent>
        </Card>
      )}

      {showApproveDetailsCard && (
        <Card className="border-sky-200/60 dark:border-sky-900/45 shadow-sm overflow-hidden">
          <CardHeader className="pb-2 bg-sky-50/50 dark:bg-sky-950/25 border-b border-sky-200/40 dark:border-sky-900/40">
            <CardTitle className="text-base text-sky-950 dark:text-sky-100">
              {isPaid ? "2. Approve certificate details" : "Approve certificate details By Supervisor"}
            </CardTitle>
            <CardDescription>
              Verify shipment fields above are accurate and complete.
              {!isPaid
                ? " You can approve details before payment; the certificate is issued only after both steps."
                : " Approving now will generate and issue the certificate PDF."}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <Button
              className="w-full bg-sky-600 hover:bg-sky-700"
              onClick={() => approveDetailsMutation.mutate()}
              disabled={approveDetailsMutation.isPending}
            >
              {approveDetailsMutation.isPending
                ? "Approving…"
                : isPaid
                  ? "Approve details & issue certificate"
                  : "Approve details"}
            </Button>
          </CardContent>
        </Card>
      )}

      {pc.status === "ISSUED" && pc.certificateNumber && (
        <Card className="border-emerald-200/60 dark:border-emerald-900/40 shadow-sm overflow-hidden bg-gradient-to-br from-emerald-50/30 to-transparent dark:from-emerald-950/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-emerald-900 dark:text-emerald-100">
              <CheckCircle2 className="h-5 w-5" />
              Certificate ready
            </CardTitle>
            <CardDescription>Download your official product Halal certificate (PDF).</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="border-emerald-300 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-200 dark:hover:bg-emerald-950/40"
              onClick={() => halalApi.productCertificates.download(pc.id, pc.certificateNumber!)}
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
