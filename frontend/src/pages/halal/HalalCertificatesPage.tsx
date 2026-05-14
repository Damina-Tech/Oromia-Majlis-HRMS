"use client";
import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Award,
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  Download,
  Calendar,
  Shield,
  Clock,
  Package,
  ClipboardCheck,
  ChevronDown,
  ListFilter,
  Search,
} from "lucide-react";
import {
  halalApi,
  HALAL_PRODUCT_CERTIFICATE_FEE_ETB,
  type HalalCertificate,
  type HalalCertificateStatus,
  type HalalProductCertificate,
} from "@/services/halal";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { HalalListPagination, HALAL_LIST_PAGE_SIZE } from "@/components/halal/HalalListPagination";

const STATUS_COLORS: Record<HalalCertificateStatus, string> = {
  VALID: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200",
  EXPIRED: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200",
  REVOKED: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200",
  SUSPENDED: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
};

const PRODUCT_CERT_NUMBER_BADGE =
  "border-emerald-300/60 bg-white/80 text-emerald-950 font-mono dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-100";

/** Row badge(s) for product certificate payment / lifecycle state */
function productCertStatusPresentation(
  p: HalalProductCertificate
): { label: string; className: string; secondary?: { label: string; className: string } } {
  if (p.status === "ISSUED") {
    return {
      label: "Issued",
      className:
        "border-emerald-200/80 bg-emerald-100 text-emerald-900 dark:border-emerald-800/50 dark:bg-emerald-950/60 dark:text-emerald-100",
      ...(p.certificateNumber
        ? { secondary: { label: p.certificateNumber, className: PRODUCT_CERT_NUMBER_BADGE } }
        : {}),
    };
  }
  if (p.status === "CANCELLED") {
    return {
      label: "Cancelled",
      className:
        "border-red-200/80 bg-red-100 text-red-900 dark:border-red-800/50 dark:bg-red-950/50 dark:text-red-100",
    };
  }
  if (p.feePaidAt) {
    return {
      label: "Paid — issuing",
      className:
        "border-cyan-200/80 bg-cyan-100 text-cyan-950 dark:border-cyan-800/50 dark:bg-cyan-950/50 dark:text-cyan-100",
    };
  }
  if (p.paymentMethod === "MANUAL" && p.paymentReceiptUrl) {
    return {
      label: "Awaiting approval",
      className:
        "border-violet-200/80 bg-violet-100 text-violet-950 dark:border-violet-800/50 dark:bg-violet-950/50 dark:text-violet-100",
    };
  }
  if ((p.paymentMethod ?? "").toUpperCase() === "CHAPA") {
    return {
      label: "Chapa — pay now",
      className:
        "border-sky-200/80 bg-sky-100 text-sky-950 dark:border-sky-800/50 dark:bg-sky-950/40 dark:text-sky-100",
    };
  }
  return {
    label: "Payment pending",
    className:
      "border-amber-200/80 bg-amber-100 text-amber-950 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-100",
  };
}

const WARN_DAYS = 60;

/** Calendar days from today to target (local midnight). */
function calendarDaysUntil(iso: string): number {
  const t = new Date(iso);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startTarget = new Date(t.getFullYear(), t.getMonth(), t.getDate());
  return Math.round((startTarget.getTime() - startToday.getTime()) / 86400000);
}

function remainingMeta(iso: string): { text: string; daysLeft: number; isOverdue: boolean; warn: boolean } {
  const daysLeft = calendarDaysUntil(iso);
  const isOverdue = daysLeft < 0;
  let text: string;
  if (isOverdue) {
    const n = Math.abs(daysLeft);
    text = n === 1 ? "1 day overdue" : `${n} days overdue`;
  } else if (daysLeft === 0) {
    text = "Today";
  } else if (daysLeft < 14) {
    text = daysLeft === 1 ? "1 day" : `${daysLeft} days`;
  } else if (daysLeft < WARN_DAYS) {
    text = `${daysLeft} days`;
  } else if (daysLeft < 365) {
    const mo = Math.round(daysLeft / 30);
    text = mo <= 1 ? "~1 mo" : `~${mo} mo`;
  } else {
    const y = Math.floor(daysLeft / 365);
    const rem = daysLeft - y * 365;
    const mo = Math.floor(rem / 30);
    text = mo > 0 ? `${y}y ${mo}mo` : `${y}y`;
  }
  const warn = isOverdue || (daysLeft >= 0 && daysLeft < WARN_DAYS);
  return { text, daysLeft, isOverdue, warn };
}

function ProductCertificateNestedRow({
  p,
  userId,
  canApproveProductManual,
  navigate,
}: {
  p: HalalProductCertificate;
  userId: string | undefined;
  canApproveProductManual: boolean;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const ownerUserId = p.business?.userId;
  const canApproveThisRow =
    canApproveProductManual &&
    p.status === "PAYMENT_PENDING" &&
    p.paymentMethod === "MANUAL" &&
    !!p.paymentReceiptUrl &&
    !p.feePaidAt &&
    Boolean(ownerUserId) &&
    ownerUserId !== userId;
  const statusBadge = productCertStatusPresentation(p);
  const canViewPdf = p.status === "ISSUED" && !!p.pdfUrl && !!p.certificateNumber;
  return (
    <li className="flex flex-col sm:flex-row sm:items-stretch gap-3">
      <button
        type="button"
        className="flex-1 min-w-0 text-left rounded-xl border border-teal-200/60 dark:border-teal-800/50 bg-white/90 dark:bg-teal-950/40 shadow-sm px-4 py-3 hover:bg-teal-50/90 dark:hover:bg-teal-950/55 hover:border-teal-300/70 dark:hover:border-teal-700/50 transition-all"
        onClick={() => navigate(`/halal/product-certificates/${p.id}`)}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-medium text-sm">{p.productName}</span>
          <div className="flex flex-wrap items-center gap-1.5 justify-end shrink-0">
            <Badge variant="outline" className={`text-xs font-semibold border ${statusBadge.className}`}>
              {statusBadge.label}
            </Badge>
            {statusBadge.secondary && (
              <Badge
                variant="outline"
                className={`text-[10px] sm:text-xs font-semibold border ${statusBadge.secondary.className}`}
              >
                {statusBadge.secondary.label}
              </Badge>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {p.productAmount} · {p.destination}
        </p>
      </button>
      <div className="flex flex-wrap items-center gap-2 shrink-0 sm:justify-end">
        <Button
          size="sm"
          variant="ghost"
          className="h-9 text-teal-700 hover:text-teal-800 hover:bg-teal-100 dark:text-teal-300 dark:hover:bg-teal-950/50"
          onClick={(e) => {
            e.stopPropagation();
            if (canViewPdf) {
              halalApi.productCertificates.openPdfInNewTab(p.id).catch(() => {
                toast.error("Could not open PDF");
                navigate(`/halal/product-certificates/${p.id}`);
              });
            } else {
              navigate(`/halal/product-certificates/${p.id}`);
            }
          }}
        >
          <ExternalLink className="h-4 w-4 mr-1.5" />
          View
        </Button>
        {canApproveThisRow && (
          <Button
            size="sm"
            variant="outline"
            className="h-9 border-violet-300 text-violet-900 bg-violet-50/80 hover:bg-violet-100 dark:border-violet-700 dark:text-violet-100 dark:bg-violet-950/40 dark:hover:bg-violet-950/70"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/halal/product-certificates/${p.id}`);
            }}
          >
            <ClipboardCheck className="h-4 w-4 mr-1.5" />
            Review to approve
          </Button>
        )}
      </div>
    </li>
  );
}

function RemainingBadge({
  variant,
  label,
  iso,
}: {
  variant: "expiry" | "recert";
  label: string;
  iso: string;
}) {
  const r = remainingMeta(iso);
  const base =
    "inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] leading-tight sm:text-xs tabular-nums max-w-full";
  const palette = r.isOverdue
    ? "border-red-500/30 bg-red-500/[0.08] text-red-800 dark:text-red-200"
    : r.warn
      ? "border-amber-500/40 bg-amber-500/[0.12] text-amber-950 dark:text-amber-100"
      : "border-border/60 bg-muted/40 text-muted-foreground";
  const accent = variant === "recert" ? "ring-1 ring-violet-500/15" : "";
  return (
    <div className={`${base} ${palette} ${accent}`} title={`${label}: ${r.text}`}>
      <Clock className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
      <span className="flex min-w-0 flex-col gap-0 sm:flex-row sm:items-baseline sm:gap-1.5">
        <span className="font-medium text-foreground/90">{label}</span>
        <span className={r.isOverdue ? "font-semibold" : r.warn ? "font-semibold text-amber-950 dark:text-amber-50" : ""}>
          {r.text}
        </span>
      </span>
    </div>
  );
}

export default function HalalCertificatesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, hasPermission } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [certificateSearch, setCertificateSearch] = useState("");
  const [productLinkFilter, setProductLinkFilter] = useState<"all" | "with" | "without">("all");
  const [renewalUrgencyFilter, setRenewalUrgencyFilter] = useState<"all" | "attention">("all");
  const [renewalCert, setRenewalCert] = useState<HalalCertificate | null>(null);
  const [newExpiry, setNewExpiry] = useState("");
  const [expandedCertIds, setExpandedCertIds] = useState<Record<string, boolean>>({});
  const [certificatesPage, setCertificatesPage] = useState(1);

  const isHalalAdmin = hasPermission("halal.admin");
  const canApproveProductManual =
    hasPermission("halal.admin") || hasPermission("halal.supervisor") || hasPermission("halal.finance");
  const isStaff =
    hasPermission("halal.admin") ||
    hasPermission("halal.supervisor") ||
    hasPermission("halal.inspector") ||
    hasPermission("halal.audit") ||
    hasPermission("halal.committee");

  const { data, isLoading } = useQuery({
    queryKey: ["halal-certificates", statusFilter],
    queryFn: () =>
      halalApi.certificates.list({
        limit: 300,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
      }),
  });

  const { data: productCertData } = useQuery({
    queryKey: ["halal-product-certificates"],
    queryFn: () => halalApi.productCertificates.list({ limit: 300 }),
  });

  const certificates = data?.items ?? [];

  useEffect(() => {
    setCertificatesPage(1);
  }, [certificateSearch, productLinkFilter, renewalUrgencyFilter, statusFilter]);

  const productCertsByHalalId = useMemo(() => {
    const m = new Map<string, HalalProductCertificate[]>();
    for (const p of productCertData?.items ?? []) {
      const k = p.halalCertificateId;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(p);
    }
    for (const arr of m.values()) {
      arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return m;
  }, [productCertData?.items]);

  const filteredCertificates = useMemo(() => {
    let list = certificates;
    const q = certificateSearch.trim().toLowerCase();
    if (q) {
      list = list.filter((c) => {
        const id = c.certificateId.toLowerCase();
        const name = (c.application?.business?.name ?? "").toLowerCase();
        return id.includes(q) || name.includes(q);
      });
    }
    if (productLinkFilter === "with") {
      list = list.filter((c) => (productCertsByHalalId.get(c.id)?.length ?? 0) > 0);
    } else if (productLinkFilter === "without") {
      list = list.filter((c) => (productCertsByHalalId.get(c.id)?.length ?? 0) === 0);
    }
    if (renewalUrgencyFilter === "attention") {
      list = list.filter((c) => remainingMeta(c.expiresAt).warn);
    }
    return list;
  }, [certificates, certificateSearch, productLinkFilter, renewalUrgencyFilter, productCertsByHalalId]);

  const paginatedFilteredCertificates = useMemo(() => {
    const start = (certificatesPage - 1) * HALAL_LIST_PAGE_SIZE;
    return filteredCertificates.slice(start, start + HALAL_LIST_PAGE_SIZE);
  }, [filteredCertificates, certificatesPage]);

  const certificateFiltersActive =
    certificateSearch.trim() !== "" ||
    productLinkFilter !== "all" ||
    renewalUrgencyFilter !== "all" ||
    statusFilter !== "ALL";

  const clearCertificateFilters = () => {
    setCertificateSearch("");
    setProductLinkFilter("all");
    setRenewalUrgencyFilter("all");
    setStatusFilter("ALL");
  };

  const renewalMutation = useMutation({
    mutationFn: (payload: { certificateId: string; newExpiry: string }) =>
      halalApi.renewals.create(payload),
    onSuccess: () => {
      toast.success("Annual renewal recorded");
      queryClient.invalidateQueries({ queryKey: ["halal-certificates"] });
      setRenewalCert(null);
      setNewExpiry("");
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message ?? "Failed to record renewal");
    },
  });

  const handleRenewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewalCert || !newExpiry) return;
    renewalMutation.mutate({
      certificateId: renewalCert.certificateId,
      newExpiry: new Date(newExpiry).toISOString(),
    });
  };

  const openRenewalModal = (cert: HalalCertificate) => {
    setRenewalCert(cert);
    setNewExpiry("");
  };

  if (isLoading)
    return (
      <div className="min-h-[calc(100vh-4rem)] w-full max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-11 w-11 border-2 border-emerald-600 border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading certificates…</p>
      </div>
    );

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 max-w-6xl xl:max-w-7xl mx-auto w-full">
      {/* Header */}
      <header className="relative overflow-hidden rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40 bg-gradient-to-br from-emerald-500/[0.12] via-teal-500/[0.08] to-cyan-500/[0.04] dark:from-emerald-950/50 dark:via-teal-950/30 dark:to-slate-950/40 shadow-sm ring-1 ring-emerald-900/5 dark:ring-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_100%_0%,rgba(16,185,129,0.12),transparent)] dark:bg-[radial-gradient(ellipse_80%_60%_at_100%_0%,rgba(52,211,153,0.08),transparent)] pointer-events-none" />
        <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/halal/dashboard")}
              className="self-start -ml-2 text-emerald-900 dark:text-emerald-100 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/30 shrink-0"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="min-w-0 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800/70 dark:text-emerald-300/80">
                Halal certification
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-950 dark:text-emerald-50">
                {isStaff ? "All certificates" : "My certificates"}
              </h1>
              <p className="text-emerald-800/85 dark:text-emerald-200/80 text-sm sm:text-base max-w-2xl leading-relaxed">
                {isStaff
                  ? "Browse, filter, and manage issued business certificates and linked product certificates."
                  : "Your business Halal certificates and per-shipment product certificates in one place."}
              </p>
            </div>
          </div>
        </div>
      </header>

      {isHalalAdmin && (
        <Card className="rounded-2xl border-violet-200/70 dark:border-violet-800/50 bg-gradient-to-br from-violet-50/60 to-transparent dark:from-violet-950/35 dark:to-transparent shadow-sm overflow-hidden">
          <CardHeader className="pb-3 sm:pb-4 border-b border-violet-200/40 dark:border-violet-900/40 bg-violet-50/30 dark:bg-violet-950/20">
            <CardTitle className="text-base flex items-center gap-2.5 text-violet-900 dark:text-violet-100">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-200/60 dark:bg-violet-800/50">
                <Shield className="h-4 w-4" />
              </span>
              Certification policy (admin)
            </CardTitle>
            <CardDescription className="text-violet-900/85 dark:text-violet-200/85 text-sm leading-relaxed pt-1 pl-11 sm:pl-0 sm:ml-11">
              Each business may hold only one active Halal certificate. The certificate is renewed annually (up to two
              renewals per 3-year cycle). After three years from the cycle start, the business must complete full
              recertification (new application and issuance). Annual renewals and cycle tracking are managed here.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Certificates card */}
      <Card className="rounded-2xl shadow-md border-emerald-200/55 dark:border-emerald-900/40 overflow-hidden ring-1 ring-black/[0.02] dark:ring-white/[0.04]">
        <CardHeader className="pb-0 px-0 pt-0 gap-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 px-6 sm:px-8 py-6 sm:py-7 bg-gradient-to-r from-emerald-50/90 via-teal-50/40 to-transparent dark:from-emerald-950/40 dark:via-teal-950/25 dark:to-transparent border-b border-emerald-200/50 dark:border-emerald-900/50">
            <div className="min-w-0 space-y-2">
              <CardTitle className="flex items-center gap-3 text-lg sm:text-xl text-emerald-900 dark:text-emerald-100 font-semibold">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200 shrink-0">
                  <Award className="h-5 w-5" />
                </span>
                Business Halal certificates
              </CardTitle>
              <CardDescription className="text-sm sm:text-[15px] text-emerald-900/75 dark:text-emerald-200/75 leading-relaxed max-w-3xl pl-[3.25rem] sm:pl-0 sm:ml-[3.25rem]">
                Expand a row to see linked product / shipment certificates. Fee{" "}
                <span className="font-semibold text-emerald-900 dark:text-emerald-100 tabular-nums">
                  {HALAL_PRODUCT_CERTIFICATE_FEE_ETB.toLocaleString()} ETB
                </span>{" "}
                per product certificate.
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 shrink-0 sm:pt-1">
              {hasPermission("halal.business") && (
                <Button
                  variant="outline"
                  className="h-10 border-teal-300/80 bg-white/70 text-teal-900 shadow-sm hover:bg-teal-50 dark:bg-teal-950/40 dark:border-teal-700 dark:text-teal-100 dark:hover:bg-teal-950/60"
                  onClick={() => navigate("/halal/product-certificates/new")}
                >
                  <Package className="h-4 w-4 mr-2" />
                  New product certificate
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 px-6 sm:px-8 py-6 sm:py-8">
          {certificates.length === 0 ? (
            <div className="py-16 px-4 text-center rounded-2xl border border-dashed border-emerald-200/60 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-950/15">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100/80 dark:bg-emerald-900/40 mb-5">
                <Award className="h-8 w-8 text-emerald-700 dark:text-emerald-300" />
              </div>
              <p className="text-base font-semibold text-foreground">No certificates yet</p>
              <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">
                {isStaff
                  ? "Certificates will appear here when applications are approved."
                  : "Your approved applications will show certificates here."}
              </p>
            </div>
          ) : (
            <>
              <section
                aria-label="Certificate filters"
                className="rounded-2xl border border-emerald-200/55 dark:border-emerald-900/45 bg-background/80 dark:bg-slate-950/40 shadow-sm p-5 sm:p-6 space-y-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-800 dark:text-emerald-200">
                      <ListFilter className="h-4 w-4 shrink-0" />
                    </span>
                    <div>
                      <h2 className="text-sm font-semibold text-foreground">Filters</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Refine the list below</p>
                    </div>
                  </div>
                  {certificateFiltersActive && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 text-muted-foreground border-dashed"
                      onClick={clearCertificateFilters}
                    >
                      Clear all
                    </Button>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-12 xl:items-end">
                  <div className="sm:col-span-2 xl:col-span-5 space-y-2">
                    <Label htmlFor="cert-search" className="text-xs font-medium text-foreground/80">
                      Search
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <Input
                        id="cert-search"
                        placeholder="Certificate ID or business name…"
                        value={certificateSearch}
                        onChange={(e) => setCertificateSearch(e.target.value)}
                        className="pl-10 h-11 bg-background/60"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 xl:col-span-2">
                    <Label className="text-xs font-medium text-foreground/80">Certificate status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="h-11 bg-background/60">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All statuses</SelectItem>
                        <SelectItem value="VALID">Valid</SelectItem>
                        <SelectItem value="EXPIRED">Expired</SelectItem>
                        <SelectItem value="REVOKED">Revoked</SelectItem>
                        <SelectItem value="SUSPENDED">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 xl:col-span-3">
                    <Label className="text-xs font-medium text-foreground/80">Product certificates</Label>
                    <Select value={productLinkFilter} onValueChange={(v) => setProductLinkFilter(v as "all" | "with" | "without")}>
                      <SelectTrigger className="h-11 bg-background/60">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="with">Has product certificates</SelectItem>
                        <SelectItem value="without">No product certificates</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 sm:col-span-2 xl:col-span-2">
                    <Label className="text-xs font-medium text-foreground/80">Annual renewal</Label>
                    <Select value={renewalUrgencyFilter} onValueChange={(v) => setRenewalUrgencyFilter(v as "all" | "attention")}>
                      <SelectTrigger className="h-11 bg-background/60">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="attention">Due soon or overdue ({WARN_DAYS} days)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center rounded-full border border-border/80 bg-muted/30 px-2.5 py-1 font-medium tabular-nums">
                    {filteredCertificates.length} / {certificates.length} match filters
                  </span>
                  {statusFilter !== "ALL" && (
                    <span className="text-muted-foreground/90">Status uses server-side filtering.</span>
                  )}
                </div>
              </section>

              {filteredCertificates.length === 0 ? (
                <div className="py-14 px-4 text-center rounded-2xl border border-dashed border-amber-200/60 dark:border-amber-900/40 bg-amber-50/15 dark:bg-amber-950/10">
                  <ListFilter className="h-11 w-11 mx-auto text-amber-700/70 dark:text-amber-400/70 mb-4" />
                  <p className="font-semibold text-foreground">No certificates match your filters</p>
                  <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">
                    Try adjusting search, status, product certificate, or renewal filters.
                  </p>
                  <Button type="button" variant="default" size="sm" className="mt-5" onClick={clearCertificateFilters}>
                    Clear filters
                  </Button>
                </div>
              ) : (
                <div className="space-y-5">
                  {paginatedFilteredCertificates.map((c) => {
                    const linkedProducts = productCertsByHalalId.get(c.id) ?? [];
                    const productCount = linkedProducts.length;
                    const isOpen = !!expandedCertIds[c.id];
                    return (
                      <Collapsible
                        key={c.id}
                        open={isOpen}
                        onOpenChange={(open) => setExpandedCertIds((prev) => ({ ...prev, [c.id]: open }))}
                      >
                        <div className="group/row rounded-2xl border border-slate-200/70 dark:border-slate-800/60 bg-gradient-to-b from-white/90 to-slate-50/50 dark:from-slate-900/40 dark:to-slate-950/30 shadow-sm overflow-hidden transition-all hover:shadow-md hover:border-emerald-300/50 dark:hover:border-emerald-800/50">
                          <div className="flex flex-col lg:flex-row lg:items-stretch">
                            <CollapsibleTrigger asChild>
                              <button
                                type="button"
                                className="flex flex-1 min-w-0 items-start gap-4 p-5 sm:p-6 text-left outline-none transition-colors hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500/35"
                              >
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100/90 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">
                                  <ChevronDown
                                    className={`h-5 w-5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                                    aria-hidden
                                  />
                                </span>
                                <div className="flex-1 min-w-0 space-y-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-mono text-base sm:text-lg font-semibold text-emerald-900 dark:text-emerald-100 tracking-tight">
                                      {c.certificateId}
                                    </p>
                                    <Badge className={`${STATUS_COLORS[c.status] ?? "bg-slate-500"} font-semibold`}>
                                      {c.status}
                                    </Badge>
                                  </div>
                                  <p className="text-sm sm:text-[15px] text-muted-foreground font-medium">
                                    {c.application?.business?.name ?? "—"}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-1 text-xs sm:text-sm text-muted-foreground">
                                    <span className="inline-flex items-center gap-1.5">
                                      <Calendar className="h-3.5 w-3.5 shrink-0 opacity-70" />
                                      Issued {new Date(c.issuedAt).toLocaleDateString()}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                      <span className="opacity-70">Expires</span>{" "}
                                      {new Date(c.expiresAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-2 pt-1">
                                    <RemainingBadge variant="expiry" label="Annual renewal" iso={c.expiresAt} />
                                    {isHalalAdmin && c.lifecycle && (
                                      <RemainingBadge
                                        variant="recert"
                                        label="Full recertification"
                                        iso={c.lifecycle.cycleEndsAt}
                                      />
                                    )}
                                  </div>
                                  <p className="text-xs sm:text-sm text-teal-800 dark:text-teal-200/95 pt-1 flex flex-wrap items-center gap-2 rounded-lg bg-teal-50/60 dark:bg-teal-950/30 px-2.5 py-2 border border-teal-200/40 dark:border-teal-900/40">
                                    <Package className="h-3.5 w-3.5 shrink-0" />
                                    <span>
                                      {productCount === 0
                                        ? "No product certificates yet — expand for options"
                                        : `${productCount} product certificate${productCount === 1 ? "" : "s"} linked — expand to view`}
                                    </span>
                                  </p>
                                </div>
                              </button>
                            </CollapsibleTrigger>
                            <div className="flex flex-wrap items-center gap-2 shrink-0 p-4 sm:p-5 lg:border-l border-t lg:border-t-0 border-slate-200/70 dark:border-slate-800/60 bg-slate-50/80 dark:bg-slate-900/50 lg:min-w-[200px] lg:justify-end">
                              {c.pdfUrl && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-9 border-emerald-300 bg-white/80 dark:bg-slate-950/40 dark:border-emerald-700"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    halalApi.certificates.download(c.id, c.certificateId);
                                  }}
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-9 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
                                onClick={(e) => {
                                  e.preventDefault();
                                  halalApi.certificates.openInNewTab(c.id);
                                }}
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View
                              </Button>
                              {isHalalAdmin && c.status === "VALID" && c.lifecycle?.canRecordAnnualRenewal && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-9 text-amber-700 border-amber-300 dark:text-amber-400 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    openRenewalModal(c);
                                  }}
                                >
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Record annual renewal
                                </Button>
                              )}
                            </div>
                          </div>
                          <CollapsibleContent>
                            <div className="border-t border-teal-200/55 dark:border-teal-900/50 bg-gradient-to-b from-teal-50/40 to-teal-50/10 dark:from-teal-950/35 dark:to-teal-950/10 px-5 py-4 sm:px-6 sm:py-5">
                              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-teal-200/40 dark:border-teal-900/50">
                                <div>
                                  <p className="text-sm font-semibold text-teal-950 dark:text-teal-100">
                                    Product / shipment certificates
                                  </p>
                                  <p className="text-xs text-teal-800/75 dark:text-teal-300/70 mt-0.5">
                                    Linked to this business certificate
                                  </p>
                                </div>
                                {hasPermission("halal.business") && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-9 border-teal-300 bg-white/70 text-teal-900 shadow-sm dark:bg-teal-950/50 dark:text-teal-100 dark:border-teal-700"
                                    onClick={() => navigate("/halal/product-certificates/new")}
                                  >
                                    <Package className="h-3.5 w-3.5 mr-1.5" />
                                    New product certificate
                                  </Button>
                                )}
                              </div>
                              {productCount === 0 ? (
                                <p className="text-sm text-muted-foreground py-2 leading-relaxed max-w-2xl">
                                  No product certificates for this business certificate yet. Use{" "}
                                  <span className="font-medium text-foreground">New product certificate</span> and choose{" "}
                                  <span className="font-mono text-xs">{c.certificateId}</span> as the parent.
                                </p>
                              ) : (
                                <ul className="space-y-3">
                                  {linkedProducts.map((p) => (
                                    <ProductCertificateNestedRow
                                      key={p.id}
                                      p={p}
                                      userId={user?.id}
                                      canApproveProductManual={canApproveProductManual}
                                      navigate={navigate}
                                    />
                                  ))}
                                </ul>
                              )}
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    );
                  })}
                  <HalalListPagination
                    page={certificatesPage}
                    total={filteredCertificates.length}
                    pageSize={HALAL_LIST_PAGE_SIZE}
                    onPageChange={setCertificatesPage}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Renewal modal (halal.admin only) */}
      <Dialog open={!!renewalCert} onOpenChange={() => !renewalMutation.isPending && setRenewalCert(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" /> Record annual renewal
            </DialogTitle>
            <DialogDescription>
              {renewalCert && (
                <>
                  Certificate <span className="font-mono font-medium">{renewalCert.certificateId}</span>
                  {renewalCert.application?.business?.name && (
                    <> — {renewalCert.application.business.name}</>
                  )}
                  . New expiry must be after the current expiry and not beyond the end of the 3-year cycle.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRenewSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newExpiry">New expiry date</Label>
              <Input
                id="newExpiry"
                type="date"
                value={newExpiry}
                onChange={(e) => setNewExpiry(e.target.value)}
                min={
                  renewalCert
                    ? new Date(new Date(renewalCert.expiresAt).getTime() + 86400000).toISOString().split("T")[0]
                    : new Date().toISOString().split("T")[0]
                }
                max={
                  renewalCert?.lifecycle?.cycleEndsAt
                    ? new Date(renewalCert.lifecycle.cycleEndsAt).toISOString().split("T")[0]
                    : undefined
                }
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRenewalCert(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={renewalMutation.isPending || !newExpiry}
              >
                {renewalMutation.isPending ? "Saving…" : "Save renewal"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
