"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { halalApi, type HalalReportCertificateType } from "@/services/halal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Building2,
  CreditCard,
  Filter,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const CERTIFICATE_TYPE_OPTIONS: HalalReportCertificateType[] = [
  "ALL",
  "BUSINESS_CERTIFICATION",
  "PRODUCT_CERTIFICATE",
  "COMPETENCY",
];

const TYPE_LABELS: Record<HalalReportCertificateType, string> = {
  ALL: "All certificate types",
  BUSINESS_CERTIFICATION: "Halal Business Certificate",
  PRODUCT_CERTIFICATE: "Halal Product Certificate",
  COMPETENCY: "Halal Competency Certificate",
};

const CHART_COLORS = {
  BUSINESS_CERTIFICATION: "#059669",
  PRODUCT_CERTIFICATE: "#7c3aed",
  COMPETENCY: "#0d9488",
};

const PIE_COLORS = ["#059669", "#7c3aed", "#0d9488", "#0891b2", "#ca8a04", "#dc2626"];

function formatEtb(n: number) {
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 2 })} ETB`;
}

function defaultDateRange() {
  const end = new Date();
  const start = new Date(end.getFullYear(), 0, 1);
  return {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
  };
}

export default function HalalReportsPage() {
  const defaults = useMemo(() => defaultDateRange(), []);
  const [dateFrom, setDateFrom] = useState(defaults.from);
  const [dateTo, setDateTo] = useState(defaults.to);
  const [businessId, setBusinessId] = useState<string>("");
  const [certificateType, setCertificateType] = useState<HalalReportCertificateType>("ALL");

  const { data: certifiedBusinesses, isSuccess: certifiedBusinessesLoaded } = useQuery({
    queryKey: ["halal-reports-businesses-active-cert"],
    queryFn: () => halalApi.reports.businessesWithActiveCertificate(),
  });

  const queryParams = useMemo(
    () => ({
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      businessId: businessId || undefined,
      certificateType: certificateType === "ALL" ? undefined : certificateType,
    }),
    [dateFrom, dateTo, businessId, certificateType],
  );

  const { data: report, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: ["halal-reports-overview", queryParams],
    queryFn: () => halalApi.reports.overview(queryParams),
  });

  const pieData = useMemo(() => {
    if (!report?.payments.byCertificateType.length) return [];
    return report.payments.byCertificateType.map((row) => ({
      name:
        (TYPE_LABELS as Record<string, string>)[row.type] ?? row.type.replace(/_/g, " "),
      value: row.amount,
      count: row.count,
    }));
  }, [report]);

  const methodChartData = useMemo(() => {
    if (!report) return [];
    return report.payments.byPaymentMethod.map((m) => ({
      name: m.method === "UNKNOWN" ? "Unknown" : m.method,
      amount: m.amount,
      count: m.count,
    }));
  }, [report]);

  const businessChartData = useMemo(() => {
    if (!report?.payments.byBusiness.length) return [];
    return report.payments.byBusiness.map((b) => ({
      name: b.businessName.length > 28 ? `${b.businessName.slice(0, 26)}…` : b.businessName,
      fullName: b.businessName,
      amount: b.amount,
      count: b.count,
    }));
  }, [report]);

  const resetFilters = () => {
    const d = defaultDateRange();
    setDateFrom(d.from);
    setDateTo(d.to);
    setBusinessId("");
    setCertificateType("ALL");
  };

  const issuedInPeriod =
    (report?.activity.businessCertificatesIssuedInPeriod ?? 0) +
    (report?.activity.productCertificatesIssuedInPeriod ?? 0) +
    (report?.activity.competencyCertificatesIssuedInPeriod ?? 0);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-emerald-600" />
            Halal report
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Module overview with certificate payments by type, business, method, and period.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="shrink-0"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card className="border-emerald-200/50 dark:border-emerald-900/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
          <CardDescription>
            Date range applies to payment dates and activity. Businesses listed here have a valid (non-expired) Halal
            Business Certificate.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <div className="space-y-2">
            <Label htmlFor="hr-from">From</Label>
            <Input id="hr-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hr-to">To</Label>
            <Input id="hr-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Business</Label>
            <Select value={businessId || "__all__"} onValueChange={(v) => setBusinessId(v === "__all__" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="All certified businesses" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="__all__">All (module-wide)</SelectItem>
                {(certifiedBusinesses?.items ?? []).map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name} · {b.halalCertificateNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Certificate type</Label>
            <Select
              value={certificateType}
              onValueChange={(v) => setCertificateType(v as HalalReportCertificateType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CERTIFICATE_TYPE_OPTIONS.map((k) => (
                  <SelectItem key={k} value={k}>
                    {TYPE_LABELS[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button variant="secondary" className="w-full" onClick={resetFilters}>
              Reset range
            </Button>
          </div>
        </CardContent>
        {(certifiedBusinessesLoaded && (certifiedBusinesses?.items ?? []).length === 0 && !businessId) || businessId ? (
          <CardContent className="pt-0 space-y-2">
            {certifiedBusinessesLoaded && (certifiedBusinesses?.items ?? []).length === 0 && !businessId ? (
              <p className="text-xs text-amber-800 dark:text-amber-200">
                No businesses currently have a valid Halal Business Certificate. The business filter will populate once
                at least one certificate is active.
              </p>
            ) : null}
            {businessId ? (
              <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="font-normal">
                  Per-business view
                </Badge>
                Halal Competency Certificate fees are individual and are hidden while a business is selected. Charts and
                totals below reflect this business’s Halal Business Certificate, Halal Product certificates, and related
                payments.
              </p>
            ) : null}
          </CardContent>
        ) : null}
      </Card>

      {error ? (
        <Card className="border-destructive/50">
          <CardContent className="pt-6 text-sm text-destructive">
            {error instanceof Error ? error.message : "Failed to load report"}
          </CardContent>
        </Card>
      ) : null}

      {isLoading ? (
        <div className="flex justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-emerald-600 border-t-transparent" />
        </div>
      ) : report ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-l-4 border-l-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Paid in period</p>
                    <p className="text-xl font-bold text-emerald-900 dark:text-emerald-100">
                      {formatEtb(report.payments.totalAmount)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {report.payments.transactionCount} transaction
                      {report.payments.transactionCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <Wallet className="h-9 w-9 text-emerald-600/70 shrink-0" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-violet-500 bg-violet-50/40 dark:bg-violet-950/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Certificates issued (period)</p>
                    <p className="text-xl font-bold text-violet-900 dark:text-violet-100">{issuedInPeriod}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {businessId ? (
                        <>
                          Halal Business {report.activity.businessCertificatesIssuedInPeriod} · Halal Product{" "}
                          {report.activity.productCertificatesIssuedInPeriod}
                        </>
                      ) : (
                        <>
                          Halal Business {report.activity.businessCertificatesIssuedInPeriod} · Halal Product{" "}
                          {report.activity.productCertificatesIssuedInPeriod} · Halal Competency{" "}
                          {report.activity.competencyCertificatesIssuedInPeriod}
                        </>
                      )}
                    </p>
                  </div>
                  <ShieldCheck className="h-9 w-9 text-violet-600/70 shrink-0" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-amber-500 bg-amber-50/40 dark:bg-amber-950/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Inspections completed</p>
                    <p className="text-xl font-bold text-amber-900 dark:text-amber-100">
                      {report.activity.inspectionsCompletedInPeriod}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">In selected date range</p>
                  </div>
                  <TrendingUp className="h-9 w-9 text-amber-600/70 shrink-0" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-sky-500 bg-sky-50/40 dark:bg-sky-950/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Pipeline snapshot</p>
                    <p className="text-xl font-bold text-sky-900 dark:text-sky-100">
                      {businessId
                        ? report.snapshot.productCertificatesAwaitingPayment
                        : report.snapshot.productCertificatesAwaitingPayment +
                          report.snapshot.competencyAwaitingPayment}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {businessId ? (
                        <>Halal Product certificates awaiting payment (this business)</>
                      ) : (
                        <>
                          Halal Product pending {report.snapshot.productCertificatesAwaitingPayment} · Halal Competency
                          pending {report.snapshot.competencyAwaitingPayment}
                        </>
                      )}
                    </p>
                  </div>
                  <CreditCard className="h-9 w-9 text-sky-600/70 shrink-0" />
                </div>
              </CardContent>
            </Card>
          </div>

          {report.businessDetail ? (
            <Card className="border-emerald-300/60 dark:border-emerald-800/50 bg-emerald-50/30 dark:bg-emerald-950/25">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-emerald-700" />
                  {report.businessDetail.businessName}
                </CardTitle>
                <CardDescription>
                  {report.businessDetail.halalBusinessCertificate ? (
                    <>
                      Active Halal Business Certificate{" "}
                      <span className="font-medium text-foreground">
                        {report.businessDetail.halalBusinessCertificate.certificateId}
                      </span>
                      {" · "}
                      Expires {new Date(report.businessDetail.halalBusinessCertificate.expiresAt).toLocaleDateString()}
                    </>
                  ) : (
                    <span className="text-amber-700 dark:text-amber-300">
                      No valid Halal Business Certificate on file for this business (renewal may be required).
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border bg-background/80 p-3">
                  <p className="text-xs text-muted-foreground">Product certificates (all)</p>
                  <p className="text-2xl font-semibold">{report.businessDetail.productCertificates.totalCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Issued {report.businessDetail.productCertificates.issuedCount} · Pending payment{" "}
                    {report.businessDetail.productCertificates.paymentPendingCount} · Cancelled{" "}
                    {report.businessDetail.productCertificates.cancelledCount}
                  </p>
                </div>
                <div className="rounded-lg border bg-background/80 p-3">
                  <p className="text-xs text-muted-foreground">Product certificate payments (period)</p>
                  <p className="text-2xl font-semibold text-violet-700 dark:text-violet-300">
                    {formatEtb(report.businessDetail.productCertificates.paidInPeriodAmount)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {report.businessDetail.productCertificates.paidInPeriodTransactionCount} paid transaction
                    {report.businessDetail.productCertificates.paidInPeriodTransactionCount === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="rounded-lg border bg-background/80 p-3">
                  <p className="text-xs text-muted-foreground">Business certification fees (period)</p>
                  <p className="text-2xl font-semibold text-emerald-700 dark:text-emerald-300">
                    {formatEtb(report.businessDetail.businessCertification.certificationFeesPaidInPeriodAmount)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {report.businessDetail.businessCertification.certificationFeesPaidInPeriodCount} payment
                    {report.businessDetail.businessCertification.certificationFeesPaidInPeriodCount === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="rounded-lg border bg-background/80 p-3">
                  <p className="text-xs text-muted-foreground">Total business-scoped payments (period)</p>
                  <p className="text-2xl font-semibold">
                    {formatEtb(report.businessDetail.combinedBusinessScopedPaidInPeriod.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {report.businessDetail.combinedBusinessScopedPaidInPeriod.transactionCount} transactions (certification +
                    product)
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Revenue by certificate type</CardTitle>
                <CardDescription>Amount collected in the filtered period</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {pieData.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-12 text-center">No paid transactions in this range.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatEtb(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Payments by method</CardTitle>
                <CardDescription>Chapa vs manual (and unknown)</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {methodChartData.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-12 text-center">No data.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={methodChartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}`} />
                      <Tooltip
                        formatter={(value: number, _n, props) => [
                          formatEtb(value),
                          `Amount (${(props.payload as { count?: number }).count ?? 0} tx)`,
                        ]}
                      />
                      <Bar dataKey="amount" fill="#059669" name="Amount (ETB)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {!businessId ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Top businesses by payment volume
                </CardTitle>
                <CardDescription>Halal Business + Halal Product certificate fees (period filter)</CardDescription>
              </CardHeader>
              <CardContent className="h-[320px]">
                {businessChartData.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-12 text-center">
                    No business-scoped payments in this range.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={businessChartData}
                      layout="vertical"
                      margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}`} />
                      <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(value: number, _n, item) => [
                          formatEtb(value),
                          `${(item.payload as { count?: number }).count ?? 0} payments`,
                        ]}
                        labelFormatter={(_, payload) =>
                          (payload[0]?.payload as { fullName?: string })?.fullName ?? ""
                        }
                      />
                      <Bar dataKey="amount" fill="#7c3aed" name="ETB" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Monthly payment trend</CardTitle>
              <CardDescription>
                Stacked amounts: Halal Business, Halal Product, and Halal Competency (renewals included in competency)
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[340px]">
              {report.payments.monthlyTrend.length === 0 ? (
                <p className="text-sm text-muted-foreground py-12 text-center">No monthly data in range.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.payments.monthlyTrend} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: number) => formatEtb(value)} />
                    <Legend />
                    <Bar
                      dataKey="BUSINESS_CERTIFICATION"
                      stackId="a"
                      fill={CHART_COLORS.BUSINESS_CERTIFICATION}
                      name="Halal Business"
                    />
                    <Bar
                      dataKey="PRODUCT_CERTIFICATE"
                      stackId="a"
                      fill={CHART_COLORS.PRODUCT_CERTIFICATE}
                      name="Halal Product"
                    />
                    <Bar
                      dataKey="COMPETENCY"
                      stackId="a"
                      fill={CHART_COLORS.COMPETENCY}
                      name="Halal Competency"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Applications in period</CardTitle>
                <CardDescription>New applications created in the date range (by status)</CardDescription>
              </CardHeader>
              <CardContent className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={Object.entries(report.activity.applicationsByStatusInPeriod).map(([status, count]) => ({
                      status: status.replace(/_/g, " "),
                      count,
                    }))}
                    margin={{ top: 8, right: 8, left: 8, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="status" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={60} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Workflow snapshot (all time)</CardTitle>
                <CardDescription>
                  {businessId
                    ? "Applications for this business only. Competency workflow is not business-scoped."
                    : "Current application and competency counts by status"}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Certification applications</p>
                  <ul className="space-y-1 text-sm max-h-[200px] overflow-y-auto">
                    {Object.keys(report.workflow.applicationsByStatus).length === 0 ? (
                      <li className="text-sm text-muted-foreground">No applications.</li>
                    ) : (
                      Object.entries(report.workflow.applicationsByStatus)
                        .sort((a, b) => b[1] - a[1])
                        .map(([s, c]) => (
                          <li key={s} className="flex justify-between gap-2 border-b border-border/50 py-1">
                            <span className="truncate">{s.replace(/_/g, " ")}</span>
                            <Badge variant="secondary">{c}</Badge>
                          </li>
                        ))
                    )}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Halal Competency Certificate</p>
                  {businessId ? (
                    <p className="text-sm text-muted-foreground">
                      Not shown in per-business view (competency records belong to individuals, not businesses).
                    </p>
                  ) : (
                    <ul className="space-y-1 text-sm max-h-[200px] overflow-y-auto">
                      {Object.entries(report.workflow.competencyByStatus)
                        .sort((a, b) => b[1] - a[1])
                        .map(([s, c]) => (
                          <li key={s} className="flex justify-between gap-2 border-b border-border/50 py-1">
                            <span className="truncate">{s.replace(/_/g, " ")}</span>
                            <Badge variant="secondary">{c}</Badge>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Approved businesses (total)</p>
                <p className="text-2xl font-semibold">{report.snapshot.approvedBusinessesTotal}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Businesses registered (period)</p>
                <p className="text-2xl font-semibold">{report.activity.businessesRegisteredInPeriod}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Violations recorded (period)</p>
                <p className="text-2xl font-semibold">{report.activity.violationsRecordedInPeriod}</p>
              </CardContent>
            </Card>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Generated {new Date(report.generatedAt).toLocaleString()}
            {report.filters.dateFrom || report.filters.dateTo
              ? ` · Filters: ${report.filters.dateFrom?.slice(0, 10) ?? "…"} → ${report.filters.dateTo?.slice(0, 10) ?? "…"}`
              : ""}
          </p>
        </>
      ) : null}
    </div>
  );
}
