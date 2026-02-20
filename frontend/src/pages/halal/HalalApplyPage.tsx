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
import { toast } from "sonner";
import { ArrowLeft, Plus, FileText, Eye, Pencil, Trash2, AlertCircle } from "lucide-react";
import { halalApi, type HalalApplicationStatus } from "@/services/halal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const STATUS_COLORS: Record<HalalApplicationStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  SUBMITTED: "bg-blue-100 text-blue-800",
  REVIEW: "bg-amber-100 text-amber-800",
  INSPECTION: "bg-purple-100 text-purple-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

export default function HalalApplyPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: applicationsData } = useQuery({
    queryKey: ["halal-applications"],
    queryFn: () => halalApi.applications.list({ limit: 100 }),
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

  const eligibleBusinesses = businesses.filter((b) => !businessIdsWithActiveApp.has(b.id));

  const deleteMutation = useMutation({
    mutationFn: halalApi.applications.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["halal-applications"] });
      toast.success("Application deleted");
      setDeleteId(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed to delete"),
  });

  const handleDelete = (app: { id: string; status: string }) => {
    if (app.status !== "DRAFT") {
      toast.error("Only draft applications can be deleted");
      return;
    }
    setDeleteId(app.id);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
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
        <Button size="sm" className="shrink-0" onClick={() => navigate("/halal/apply/new")}>
          <Plus className="h-4 w-4 mr-2" />
          New Application
        </Button>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            My Applications
          </CardTitle>
          <CardDescription>Your Halal certification applications</CardDescription>
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
                          <Badge className={STATUS_COLORS[a.status]}>{a.status}</Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                          {a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => navigate(`/halal/applications/${a.id}`)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {a.status === "DRAFT" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => navigate(`/halal/apply/${a.id}/edit`, { state: { applicationId: a.id } })}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(a)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </>
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
                      <Badge className={`mt-1 ${STATUS_COLORS[a.status]}`}>{a.status}</Badge>
                    </div>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/halal/applications/${a.id}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {a.status === "DRAFT" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/halal/apply/${a.id}/edit`, { state: { applicationId: a.id } })}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(a)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
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
              Only draft applications can be deleted. This action cannot be undone.
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
