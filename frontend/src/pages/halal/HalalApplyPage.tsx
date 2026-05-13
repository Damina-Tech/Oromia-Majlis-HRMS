"use client";
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Plus, FileText, Eye, Trash2, AlertCircle, Search } from "lucide-react";
import { halalApi, type HalalApplication, type HalalApplicationStatus, isHalalApplicationWithdrawLockedByAgreement, getHalalApplicationStatusBadgeLabel } from "@/services/halal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

const STATUS_COLORS: Record<HalalApplicationStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  SUBMITTED: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  REVIEW: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  INSPECTION: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
  APPROVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

export default function HalalApplyPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const isAdmin = hasPermission("halal.admin") || hasPermission("halal.supervisor");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: applicationsData } = useQuery({
    queryKey: ["halal-applications", searchQuery],
    queryFn: () => halalApi.applications.list({ limit: 100, search: searchQuery || undefined }),
  });
  const applications = applicationsData?.items ?? [];

  const { data: businessesData } = useQuery({
    queryKey: ["halal-businesses"],
    queryFn: () => halalApi.businesses.list({ limit: 100 }),
  });
  const businesses = businessesData?.items ?? [];

  const businessIdsWithActiveApp = useMemo(() => {
    return new Set(
      applications
        .filter((a) => a.status !== "REJECTED")
        .map((a) => a.businessId)
    );
  }, [applications]);

  const hasAllBusinessesWithApps =
    businesses.length > 0 &&
    businesses.every((b) => businessIdsWithActiveApp.has(b.id));

  const eligibleBusinesses = businesses.filter(
    (b) => b.status === "APPROVED" && !businessIdsWithActiveApp.has(b.id)
  );

  const deleteMutation = useMutation({
    mutationFn: halalApi.applications.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["halal-applications"] });
      queryClient.invalidateQueries({ queryKey: ["halal-businesses"] });
      queryClient.invalidateQueries({ queryKey: ["halal-business"] });
      toast.success("Application deleted");
      setDeleteId(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed to delete"),
  });

  const handleDelete = (app: HalalApplication) => {
    if (isHalalApplicationWithdrawLockedByAgreement(app)) {
      toast.error(
        "This application cannot be withdrawn after the certification agreement has been signed and uploaded."
      );
      return;
    }
    if (!isAdmin && app.status !== "DRAFT") {
      toast.error("Only draft applications can be deleted");
      return;
    }
    setDeleteId(app.id);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500/10 to-transparent dark:from-blue-600/20 border border-blue-200/50 dark:border-blue-800/30 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/halal/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Halal Certification</h1>
              <p className="text-muted-foreground text-sm">Apply for Halal certification</p>
            </div>
          </div>
          <Button size="sm" className="shrink-0 bg-blue-600 hover:bg-blue-700" onClick={() => navigate("/halal/apply/new")}>
            <Plus className="h-4 w-4 mr-2" />
            New Application
          </Button>
        </div>
      </div>

      {hasAllBusinessesWithApps && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
          <CardContent className="flex items-start gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">
                All your businesses already have active applications
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Each business can have only one active application at a time.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm border-blue-200/50 dark:border-blue-900/30">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                <FileText className="h-5 w-5 text-blue-600" />
                My Applications
              </CardTitle>
              <CardDescription>Your Halal certification applications</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by business name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {applications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No applications yet.</p>
              <p className="text-sm mt-1">
                {businesses.length === 0
                  ? "Register a business first to apply for Halal certification."
                  : "Select a business and apply for Halal certification."}
              </p>
              {businesses.length === 0 ? (
                <Button className="mt-4" onClick={() => navigate("/halal/register")}>
                  Register Business
                </Button>
              ) : eligibleBusinesses.length > 0 ? (
                <Button className="mt-4" onClick={() => navigate("/halal/apply/new")}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Application
                </Button>
              ) : null}
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead className="hidden sm:table-cell">Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((a) => (
                      <TableRow
                        key={a.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/halal/applications/${a.id}`)}
                      >
                        <TableCell className="font-medium">{a.business?.name ?? a.businessId}</TableCell>
                        <TableCell>
                          <Badge className={STATUS_COLORS[a.status]}>{getHalalApplicationStatusBadgeLabel(a)}</Badge>
                        </TableCell>
                        <TableCell>
                          {a.status === "DRAFT" ? (
                            "—"
                          ) : a.feePaidAt ? (
                            <span className="text-green-600 dark:text-green-500 text-sm font-medium">Paid</span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-500 text-sm font-medium">Pending</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                          {a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => navigate(`/halal/applications/${a.id}`)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {(a.status === "DRAFT" || isAdmin) &&
                              !isHalalApplicationWithdrawLockedByAgreement(a) && (
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(a)} title={isAdmin ? "Delete (admin)" : "Delete"}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="md:hidden divide-y">
                {applications.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/30 cursor-pointer"
                    onClick={() => navigate(`/halal/applications/${a.id}`)}
                  >
                    <div>
                      <p className="font-medium">{a.business?.name ?? a.businessId}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge className={STATUS_COLORS[a.status]}>{getHalalApplicationStatusBadgeLabel(a)}</Badge>
                        {a.status !== "DRAFT" && (
                          <span className={`text-xs font-medium ${a.feePaidAt ? "text-green-600 dark:text-green-500" : "text-amber-600 dark:text-amber-500"}`}>
                            {a.feePaidAt ? "Paid" : "Fee pending"}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/halal/applications/${a.id}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {(a.status === "DRAFT" || isAdmin) && !isHalalApplicationWithdrawLockedByAgreement(a) && (
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(a)} title={isAdmin ? "Delete (admin)" : "Delete"}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => !deleteMutation.isPending && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete application?</AlertDialogTitle>
            <AlertDialogDescription>
              {isAdmin
                ? "This will permanently delete the application. This action cannot be undone."
                : "Only draft applications can be deleted. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
