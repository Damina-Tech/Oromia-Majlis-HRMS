"use client";
import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, FileText, Award, RefreshCw, ArrowRight, ShieldCheck } from "lucide-react";
import { halalApi, type HalalApplicationStatus } from "@/services/halal";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";

const STATUS_COLORS: Record<HalalApplicationStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  SUBMITTED: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  REVIEW: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  INSPECTION: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
  APPROVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

export default function HalalDashboardPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const isStaff = hasPermission("halal.admin") || hasPermission("halal.review") || hasPermission("halal.inspector");
  const isBusinessOwner = hasPermission("halal.business");

  const { data: businesses, isLoading } = useQuery({
    queryKey: ["halal-businesses"],
    queryFn: () => halalApi.businesses.list({ limit: 50 }),
  });
  const { data: applications } = useQuery({
    queryKey: ["halal-applications"],
    queryFn: () => halalApi.applications.list({ limit: 50 }),
  });
  const { data: certificates } = useQuery({
    queryKey: ["halal-certificates"],
    queryFn: () => halalApi.certificates.list({ limit: 20 }),
  });

  const apps = applications?.items ?? [];
  const bizList = businesses?.items ?? [];
  const pendingApprovalBiz = bizList.filter((b) => (b.status ?? "PENDING_APPROVAL") === "PENDING_APPROVAL");
  const approvedBiz = bizList.filter((b) => b.status === "APPROVED");

  const stats = {
    businesses: businesses?.total ?? 0,
    applications: applications?.total ?? 0,
    pending: apps.filter((a) => ["DRAFT", "SUBMITTED", "REVIEW", "INSPECTION"].includes(a.status)).length,
    pendingBusinesses: pendingApprovalBiz.length,
    approved: apps.filter((a) => a.status === "APPROVED").length,
    certificates: certificates?.total ?? 0,
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-8 max-w-6xl mx-auto">
      {/* Stats cards with subtle colors */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="border-l-4 border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-l-emerald-600">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">{stats.businesses}</p>
                <p className="text-sm text-muted-foreground">
                  {isStaff && !isBusinessOwner ? "Total Businesses" : "Businesses"}
                </p>
              </div>
              <Building2 className="h-9 w-9 text-emerald-500/70" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20 dark:border-l-blue-600">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{stats.applications}</p>
                <p className="text-sm text-muted-foreground">
                  {isStaff && !isBusinessOwner ? "Total Applications" : "Applications"}
                </p>
              </div>
              <FileText className="h-9 w-9 text-blue-500/70" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20 dark:border-l-amber-600">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-amber-800 dark:text-amber-200">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending Applications</p>
              </div>
              <RefreshCw className="h-9 w-9 text-amber-500/70" />
            </div>
          </CardContent>
        </Card>
        <Card
          className={`border-l-4 border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/20 dark:border-l-orange-600 ${stats.pendingBusinesses > 0 ? "cursor-pointer hover:bg-orange-100/50 dark:hover:bg-orange-950/30 transition-colors" : ""}`}
          onClick={() => stats.pendingBusinesses > 0 && pendingApprovalBiz[0] && navigate(`/halal/businesses/${pendingApprovalBiz[0].id}`)}
        >
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">{stats.pendingBusinesses}</p>
                <p className="text-sm text-muted-foreground">Businesses Pending Approval</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-violet-500 bg-violet-50/50 dark:bg-violet-950/20 dark:border-l-violet-600">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-violet-800 dark:text-violet-200">{stats.certificates}</p>
                <p className="text-sm text-muted-foreground">Certificates</p>
              </div>
              <Award className="h-9 w-9 text-violet-500/70" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Businesses Waiting for Approval + Quick Actions */}
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        <div className="flex-1 min-w-0">
          {pendingApprovalBiz.length > 0 ? (
            <Card className="shadow-sm border-amber-200/50 dark:border-amber-900/30 h-full">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg text-amber-800 dark:text-amber-200">
                  <RefreshCw className="h-5 w-5 text-amber-600" />
                  {isStaff ? "Businesses Waiting for Approval" : "Your Businesses Awaiting Approval"}
                </CardTitle>
                <CardDescription>
                  {isStaff
                    ? "Review and approve these business registrations"
                    : "Your businesses are pending admin approval. You can apply for Halal certification once approved."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {pendingApprovalBiz.slice(0, 6).map((b) => (
                    <li
                      key={b.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-amber-100 dark:border-amber-900/40 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 cursor-pointer transition-colors"
                      onClick={() => navigate(`/halal/businesses/${b.id}`)}
                    >
                      <div>
                        <p className="font-medium">{b.name}</p>
                        <p className="text-sm text-muted-foreground">{b.category.replace("_", " ")}</p>
                      </div>
                      {isStaff ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-amber-700 border-amber-500 hover:bg-amber-100 dark:border-amber-600 dark:text-amber-400 dark:hover:bg-amber-900/50"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/halal/businesses/${b.id}`);
                          }}
                        >
                          Review & Approve
                        </Button>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">Pending Approval</Badge>
                      )}
                    </li>
                  ))}
                </ul>
                {pendingApprovalBiz.length > 6 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2 text-amber-600"
                    onClick={() => navigate("/halal/register")}
                  >
                    View all
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-sm border-emerald-200/50 dark:border-emerald-900/30 h-full">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <ShieldCheck className="h-12 w-12 text-emerald-500/70 mb-3" />
                <h3 className="font-semibold text-emerald-800 dark:text-emerald-200">
                  {isStaff && !isBusinessOwner ? "Halal Certification Overview" : "My Halal Certification"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {isStaff && !isBusinessOwner
                    ? "System-wide statistics and applications"
                    : "Manage your businesses and applications"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
        <div className="w-full lg:w-72 xl:w-80 shrink-0">
          <Card className="shadow-sm border-emerald-200/50 dark:border-emerald-900/30 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-transparent dark:from-emerald-600/10 dark:via-teal-600/10 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Quick Actions</CardTitle>
              <CardDescription>Shortcuts to common tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {isBusinessOwner && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => navigate("/halal/register")}
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    Register Business
                  </Button>
                  <Button
                    size="sm"
                    className="w-full justify-start bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => navigate("/halal/apply/new")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Application
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => navigate("/halal/certificates")}
              >
                <Award className="h-4 w-4 mr-2" />
                Certificates
              </Button>
              {isStaff && (
                <>
                  {pendingApprovalBiz.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full justify-start border-amber-500 text-amber-700 hover:bg-amber-50 dark:border-amber-600 dark:text-amber-400 dark:hover:bg-amber-950/50"
                      onClick={() => navigate(`/halal/businesses/${pendingApprovalBiz[0].id}`)}
                    >
                      Approve Businesses ({pendingApprovalBiz.length})
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => navigate("/halal/apply")}
                  >
                    Manage Applications
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Businesses card - only for business owners or when staff has businesses */}
        {(isBusinessOwner || bizList.length > 0) && (
          <Card className="shadow-sm border-emerald-200/50 dark:border-emerald-900/30">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-emerald-600" />
                {isStaff && !isBusinessOwner ? "Registered Businesses" : "Recent Registered Businesses"}
              </CardTitle>
              <CardDescription>
                {isStaff && !isBusinessOwner
                  ? "All businesses in the system"
                  : "Your registered businesses"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bizList.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground rounded-lg bg-muted/30">
                  <Building2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No businesses registered.</p>
                  {isBusinessOwner && (
                    <Button size="sm" className="mt-3" onClick={() => navigate("/halal/register/new")}>
                      Register your first business
                    </Button>
                  )}
                </div>
              ) : (
                <ul className="space-y-2">
                  {bizList.slice(0, 6).map((b) => {
                    const status = b.status ?? "PENDING_APPROVAL";
                    const canApplyForThis = isBusinessOwner && status === "APPROVED";
                    return (
                      <li
                        key={b.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/40 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 cursor-pointer transition-colors"
                        onClick={() => navigate(`/halal/businesses/${b.id}`)}
                      >
                        <div>
                          <p className="font-medium">{b.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {b.category.replace("_", " ")}
                            <Badge
                              className={`ml-2 ${
                                status === "APPROVED"
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                                  : status === "REJECTED"
                                  ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                              }`}
                            >
                              {status === "APPROVED" ? "Approved" : status === "REJECTED" ? "Rejected" : "Pending"}
                            </Badge>
                          </p>
                        </div>
                        {isBusinessOwner && (
                          canApplyForThis ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate("/halal/apply/new", { state: { businessId: b.id } });
                              }}
                            >
                              Apply
                            </Button>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">Apply after approval</Badge>
                          )
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
              {bizList.length > 6 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2 text-emerald-600"
                  onClick={() => navigate("/halal/register")}
                >
                  View all businesses
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Applications card */}
        <Card className="shadow-sm border-blue-200/50 dark:border-blue-900/30">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-blue-600" />
              {isStaff && !isBusinessOwner ? "Recent Applications" : "Recent Applications"}
            </CardTitle>
            <CardDescription>
              {isStaff && !isBusinessOwner
                ? "Submitted applications (drafts are visible only to owners)"
                : "Your application status"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {apps.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground rounded-lg bg-muted/30">
                <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  {isStaff ? "No submitted applications yet." : "No applications yet."}
                </p>
                {isBusinessOwner && (
                  <Button size="sm" className="mt-3" onClick={() => navigate("/halal/apply/new")}>
                    Start your first application
                  </Button>
                )}
              </div>
            ) : (
              <ul className="space-y-2">
                {apps.slice(0, 6).map((a) => {
                  const nextAction =
                    a.status === "DRAFT"
                      ? "Submit"
                      : a.status === "SUBMITTED" && !a.feePaidAt
                        ? "Pay fee"
                        : a.status === "APPROVED"
                          ? "Download certificate"
                          : null;
                  return (
                    <li
                      key={a.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-blue-100 dark:border-blue-900/40 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 cursor-pointer transition-colors"
                      onClick={() => navigate(`/halal/applications/${a.id}`)}
                    >
                      <div>
                        <p className="font-medium">{a.business?.name ?? a.businessId}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge className={STATUS_COLORS[a.status]}>{a.status}</Badge>
                          {nextAction && (
                            <span className="text-xs text-muted-foreground">→ {nextAction}</span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </li>
                  );
                })}
              </ul>
            )}
            {apps.length > 6 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 text-blue-600"
                onClick={() => navigate("/halal/apply")}
              >
                View all applications
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
