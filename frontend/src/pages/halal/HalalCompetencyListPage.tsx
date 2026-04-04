"use client";
import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, GraduationCap, Eye, CreditCard, Pencil } from "lucide-react";
import { halalApi, type HalalCompetencyCertificate, type HalalCompetencyStatus } from "@/services/halal";
import { useAuth } from "@/contexts/AuthContext";

const STATUS_BADGE: Partial<Record<HalalCompetencyStatus, string>> = {
  DRAFT: "bg-slate-100 text-slate-800 border-slate-200/80 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700",
  SUBMITTED: "bg-blue-100 text-blue-900 border-blue-200/80 dark:bg-blue-950/50 dark:text-blue-200 dark:border-blue-800",
  THEORETICAL_SCHEDULED: "bg-violet-100 text-violet-900 border-violet-200/80 dark:bg-violet-950/50 dark:text-violet-200 dark:border-violet-800",
  THEORETICAL_PASSED: "bg-emerald-100 text-emerald-900 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-800",
  THEORETICAL_FAILED: "bg-red-100 text-red-900 border-red-200/80 dark:bg-red-950/50 dark:text-red-200 dark:border-red-800",
  TECHNICAL_SCHEDULED: "bg-violet-100 text-violet-900 border-violet-200/80 dark:bg-violet-950/50 dark:text-violet-200 dark:border-violet-800",
  TECHNICAL_PASSED: "bg-emerald-100 text-emerald-900 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-800",
  TECHNICAL_FAILED: "bg-red-100 text-red-900 border-red-200/80 dark:bg-red-950/50 dark:text-red-200 dark:border-red-800",
  PAYMENT_PENDING: "bg-amber-100 text-amber-950 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-100 dark:border-amber-800",
  ISSUED: "bg-teal-100 text-teal-900 border-teal-200/80 dark:bg-teal-950/50 dark:text-teal-200 dark:border-teal-800",
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

function listActionLabel(status: HalalCompetencyStatus, isOwnerContext: boolean): { label: string; icon: typeof Eye } {
  if (status === "DRAFT" && isOwnerContext) return { label: "Continue", icon: Pencil };
  if (status === "PAYMENT_PENDING" && isOwnerContext) return { label: "Pay", icon: CreditCard };
  return { label: "View", icon: Eye };
}

export default function HalalCompetencyListPage() {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const isStaff =
    hasPermission("halal.admin") ||
    hasPermission("halal.supervisor") ||
    hasPermission("halal.committee") ||
    hasPermission("halal.review");

  const { data, isLoading } = useQuery({
    queryKey: ["halal-competency-certificates"],
    queryFn: () => halalApi.competencyCertificates.list({ limit: 50 }),
  });

  const items = data?.items ?? [];

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-emerald-950 dark:text-emerald-50 flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-emerald-600" />
            Halal Competency
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Individual certification for Halal standards knowledge and professional competence
          </p>
        </div>
        {hasPermission("halal.competency") && (
          <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-sm" onClick={() => navigate("/halal/competency/new")}>
            <Plus className="h-4 w-4 mr-2" />
            New application
          </Button>
        )}
      </div>

      <Card className="border-emerald-200/60 dark:border-emerald-900/50 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-emerald-100/80 dark:border-emerald-900/40 bg-gradient-to-r from-emerald-50/80 to-teal-50/40 dark:from-emerald-950/40 dark:to-teal-950/20">
          <CardTitle className="text-base">Applications & certificates</CardTitle>
          <CardDescription>
            {isStaff ? "All competency records in the system" : "Your competency applications and issued certificates"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin h-10 w-10 border-2 border-emerald-600 border-t-transparent rounded-full" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-14 text-muted-foreground text-sm px-4">
              <p>No applications yet.</p>
              {hasPermission("halal.competency") && (
                <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate("/halal/competency/new")}>
                  Start an application
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-emerald-100 dark:border-emerald-900/50 hover:bg-transparent">
                  <TableHead className="text-emerald-950 dark:text-emerald-100 font-semibold min-w-[140px]">Holder</TableHead>
                  <TableHead className="text-emerald-950 dark:text-emerald-100 font-semibold min-w-[120px] hidden md:table-cell">
                    Employer
                  </TableHead>
                  <TableHead className="text-emerald-950 dark:text-emerald-100 font-semibold whitespace-nowrap hidden lg:table-cell">
                    Certificate #
                  </TableHead>
                  {isStaff && (
                    <TableHead className="text-emerald-950 dark:text-emerald-100 font-semibold min-w-[160px] hidden xl:table-cell">
                      Applicant account
                    </TableHead>
                  )}
                  <TableHead className="text-emerald-950 dark:text-emerald-100 font-semibold whitespace-nowrap hidden sm:table-cell">
                    Updated
                  </TableHead>
                  <TableHead className="text-emerald-950 dark:text-emerald-100 font-semibold">Status</TableHead>
                  <TableHead className="text-emerald-950 dark:text-emerald-100 font-semibold text-right w-[120px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((row: HalalCompetencyCertificate) => {
                  const isMine = user?.id === row.userId;
                  const { label, icon: ActionIcon } = listActionLabel(row.status, isMine);
                  return (
                    <TableRow
                      key={row.id}
                      className="border-emerald-100/80 dark:border-emerald-900/40 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/25"
                    >
                      <TableCell className="align-top py-3">
                        <div className="font-medium text-foreground">{row.fullName}</div>
                        <div className="text-xs text-muted-foreground md:hidden mt-0.5 truncate max-w-[200px]">{row.employerName}</div>
                      </TableCell>
                      <TableCell className="align-top py-3 hidden md:table-cell text-muted-foreground">{row.employerName}</TableCell>
                      <TableCell className="align-top py-3 hidden lg:table-cell">
                        {row.certificateNumber ? (
                          <span className="font-mono text-xs text-teal-800 dark:text-teal-200">{row.certificateNumber}</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      {isStaff && (
                        <TableCell className="align-top py-3 hidden xl:table-cell text-sm text-muted-foreground">
                          {row.user ? (
                            <>
                              <div className="text-foreground/90">
                                {row.user.firstName} {row.user.lastName}
                              </div>
                              <div className="text-xs truncate max-w-[200px]">{row.user.email}</div>
                            </>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      )}
                      <TableCell className="align-top py-3 hidden sm:table-cell text-muted-foreground text-sm whitespace-nowrap">
                        {formatShortDate(row.updatedAt)}
                      </TableCell>
                      <TableCell className="align-top py-3">
                        <Badge variant="outline" className={`text-xs font-medium border ${STATUS_BADGE[row.status] ?? ""}`}>
                          {row.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="align-top py-3 text-right">
                        <Button
                          size="sm"
                          variant={row.status === "PAYMENT_PENDING" && isMine ? "default" : "outline"}
                          className={
                            row.status === "PAYMENT_PENDING" && isMine
                              ? "bg-amber-600 hover:bg-amber-700 text-white border-0"
                              : "border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                          }
                          onClick={() => navigate(`/halal/competency/${row.id}`)}
                        >
                          <ActionIcon className="h-3.5 w-3.5 mr-1.5" />
                          {label}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
