"use client";
import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ArrowRight, GraduationCap } from "lucide-react";
import { halalApi, type HalalCompetencyCertificate, type HalalCompetencyStatus } from "@/services/halal";
import { useAuth } from "@/contexts/AuthContext";

const STATUS_BADGE: Partial<Record<HalalCompetencyStatus, string>> = {
  DRAFT: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
  SUBMITTED: "bg-blue-100 text-blue-900 dark:bg-blue-950/50 dark:text-blue-200",
  THEORETICAL_SCHEDULED: "bg-violet-100 text-violet-900 dark:bg-violet-950/50 dark:text-violet-200",
  THEORETICAL_PASSED: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200",
  THEORETICAL_FAILED: "bg-red-100 text-red-900 dark:bg-red-950/50 dark:text-red-200",
  TECHNICAL_SCHEDULED: "bg-violet-100 text-violet-900 dark:bg-violet-950/50 dark:text-violet-200",
  TECHNICAL_PASSED: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200",
  TECHNICAL_FAILED: "bg-red-100 text-red-900 dark:bg-red-950/50 dark:text-red-200",
  PAYMENT_PENDING: "bg-amber-100 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100",
  ISSUED: "bg-teal-100 text-teal-900 dark:bg-teal-950/50 dark:text-teal-200",
  CANCELLED: "bg-muted text-muted-foreground",
};

export default function HalalCompetencyListPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
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
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
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
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => navigate("/halal/competency/new")}>
            <Plus className="h-4 w-4 mr-2" />
            New application
          </Button>
        )}
      </div>

      <Card className="border-emerald-200/50 dark:border-emerald-900/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Applications</CardTitle>
          <CardDescription>
            {isStaff ? "All competency applications in the system" : "Your competency applications"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-10 w-10 border-2 border-emerald-600 border-t-transparent rounded-full" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              <p>No applications yet.</p>
              {hasPermission("halal.competency") && (
                <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate("/halal/competency/new")}>
                  Start an application
                </Button>
              )}
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map((row: HalalCompetencyCertificate) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/40 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 cursor-pointer transition-colors"
                  onClick={() => navigate(`/halal/competency/${row.id}`)}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{row.fullName}</p>
                    <p className="text-xs text-muted-foreground truncate">{row.employerName}</p>
                    {isStaff && row.user && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {row.user.firstName} {row.user.lastName} · {row.user.email}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={`text-xs ${STATUS_BADGE[row.status] ?? ""}`}>{row.status.replace(/_/g, " ")}</Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
