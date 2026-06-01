"use client";
import React from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, CreditCard, GraduationCap, Users } from "lucide-react";
import { halalApi, HALAL_COMPETENCY_FEE_ETB, type HalalCompetencyStatus } from "@/services/halal";
import { useAuth } from "@/contexts/AuthContext";

const STATUS_BADGE: Partial<Record<HalalCompetencyStatus, string>> = {
  DRAFT: "bg-slate-100 text-slate-800 border-slate-200/80 dark:bg-slate-800 dark:text-slate-200",
  SUBMITTED: "bg-blue-100 text-blue-900 border-blue-200/80 dark:bg-blue-950/50 dark:text-blue-200",
  THEORETICAL_SCHEDULED: "bg-violet-100 text-violet-900 border-violet-200/80 dark:bg-violet-950/50 dark:text-violet-200",
  THEORETICAL_PASSED: "bg-emerald-100 text-emerald-900 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-200",
  THEORETICAL_FAILED: "bg-red-100 text-red-900 border-red-200/80 dark:bg-red-950/50 dark:text-red-200",
  TECHNICAL_SCHEDULED: "bg-violet-100 text-violet-900 border-violet-200/80 dark:bg-violet-950/50 dark:text-violet-200",
  TECHNICAL_PASSED: "bg-emerald-100 text-emerald-900 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-200",
  TECHNICAL_FAILED: "bg-red-100 text-red-900 border-red-200/80 dark:bg-red-950/50 dark:text-red-200",
  PAYMENT_PENDING: "bg-amber-100 text-amber-950 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-100",
  ISSUED: "bg-teal-100 text-teal-900 border-teal-200/80 dark:bg-teal-950/50 dark:text-teal-200",
  CANCELLED: "bg-muted text-muted-foreground border-border",
};

function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "—";
  }
}

export default function HalalBusinessWorkerCompetencyProgressPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = useAuth();
  const isAdminContext = location.pathname.startsWith("/admin/halal/applications");
  const applicationPath = isAdminContext ? `/admin/halal/applications/${id}` : `/halal/applications/${id}`;
  const canViewCompetencyDetail =
    hasPermission("halal.admin") ||
    hasPermission("halal.supervisor") ||
    hasPermission("halal.committee") ||
    hasPermission("halal.review");
  const canPayRegisteredWorkers = hasPermission("halal.business") && !isAdminContext;

  const { data, isLoading } = useQuery({
    queryKey: ["halal-application-worker-competency-progress", id],
    queryFn: () => halalApi.applications.businessWorkerCompetencyProgress(id!),
    enabled: !!id,
  });

  const issuedCount = data?.applications.filter((a) => a.status === "ISSUED").length ?? 0;
  const registrationsAwaitingPayment =
    data?.registrations.filter(
      (r) => r.status === "APPROVED" && r.competencyCertificate?.status === "PAYMENT_PENDING"
    ) ?? [];

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start gap-3">
        <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate(applicationPath)}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to application
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-emerald-950 dark:text-emerald-50 flex items-center gap-2">
          <Users className="h-7 w-7 text-cyan-600" />
          Worker competency progress
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Platform competency applications listing <strong>{data?.businessName ?? "your business"}</strong> as employer.
          {data ? ` ${issuedCount} issued · ${data.applications.length} total.` : null}
        </p>
      </div>

      {canPayRegisteredWorkers && registrationsAwaitingPayment.length > 0 && (
        <div className="rounded-lg border border-amber-200/70 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/25 p-3 text-sm text-amber-950 dark:text-amber-100">
          {registrationsAwaitingPayment.length} admin-approved registration
          {registrationsAwaitingPayment.length === 1 ? "" : "s"} need competency payment (
          {HALAL_COMPETENCY_FEE_ETB.toLocaleString()} ETB each). Pay below — your business Halal certificate is issued
          automatically when every approved worker is paid.
        </div>
      )}

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-emerald-600" />
            Competency applications
          </CardTitle>
          <CardDescription>
            Workers who applied on the platform and named this business as their employer.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          {isLoading ? (
            <div className="flex justify-center py-14">
              <div className="animate-spin h-10 w-10 border-2 border-emerald-600 border-t-transparent rounded-full" />
            </div>
          ) : !data || data.applications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12 px-4">
              No competency applications yet for this business. Share the registration link with your workers so they can
              apply on the platform.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Worker</TableHead>
                  <TableHead className="hidden sm:table-cell">Contact</TableHead>
                  <TableHead className="hidden md:table-cell">Updated</TableHead>
                  <TableHead>Status</TableHead>
                  {canViewCompetencyDetail && <TableHead className="text-right">Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.applications.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="align-top py-3">
                      <div className="font-medium">{row.fullName}</div>
                      <div className="text-xs text-muted-foreground">
                        {row.certificateNumber ? `Cert. ${row.certificateNumber}` : row.jobTitle ?? "—"}
                      </div>
                    </TableCell>
                    <TableCell className="align-top py-3 hidden sm:table-cell text-sm text-muted-foreground">
                      <div>{row.email ?? "—"}</div>
                      <div className="text-xs">{row.phone ?? ""}</div>
                    </TableCell>
                    <TableCell className="align-top py-3 hidden md:table-cell text-sm text-muted-foreground">
                      {formatShortDate(row.updatedAt)}
                    </TableCell>
                    <TableCell className="align-top py-3">
                      <Badge variant="outline" className={`text-xs border ${STATUS_BADGE[row.status] ?? ""}`}>
                        {row.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    {canViewCompetencyDetail && (
                      <TableCell className="align-top py-3 text-right">
                        <Button size="sm" variant="outline" onClick={() => navigate(`/halal/competency/${row.id}`)}>
                          View
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {(data?.registrations.length ?? 0) > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">External certificate registrations</CardTitle>
            <CardDescription>
              Workers you registered on this application with uploaded certificates. After admin approval, pay the
              competency fee for each worker here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data!.registrations.map((r) => {
              const certStatus = r.competencyCertificate?.status;
              const showPay =
                canPayRegisteredWorkers &&
                r.status === "APPROVED" &&
                certStatus === "PAYMENT_PENDING" &&
                r.competencyCertificate?.id;
              return (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">{r.fullName}</p>
                    <p className="text-xs text-muted-foreground">{r.email ?? "—"}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">
                      {r.status === "APPROVED" && certStatus === "PAYMENT_PENDING"
                        ? "Approved · payment due"
                        : r.status === "APPROVED" && certStatus === "ISSUED"
                          ? "Paid · issued"
                          : r.status.replace(/_/g, " ")}
                    </Badge>
                    {showPay && (
                      <Button
                        size="sm"
                        className="bg-amber-600 hover:bg-amber-700 text-white h-8"
                        onClick={() => navigate(`/halal/competency/${r.competencyCertificate!.id}`)}
                      >
                        <CreditCard className="h-3.5 w-3.5 mr-1" />
                        Pay {HALAL_COMPETENCY_FEE_ETB.toLocaleString()} ETB
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
