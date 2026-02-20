"use client";
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  ArrowLeft,
  CheckCircle2,
  XCircle,
  FileText,
  Building2,
  UserPlus,
  ExternalLink,
  CreditCard,
} from "lucide-react";
import { halalApi, type HalalApplication } from "@/services/halal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { resolveFileUrl } from "@/config/api";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-500",
  SUBMITTED: "bg-blue-500",
  REVIEW: "bg-amber-500",
  INSPECTION: "bg-purple-500",
  APPROVED: "bg-green-500",
  REJECTED: "bg-red-500",
};

export default function HalalApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: application, isLoading } = useQuery({
    queryKey: ["halal-application", id],
    queryFn: () => halalApi.applications.get(id!),
    enabled: !!id,
  });

  const approveMutation = useMutation({
    mutationFn: (payload: { approved: boolean; notes?: string; rejectionReason?: string }) =>
      halalApi.applications.approve(id!, payload),
    onSuccess: (_, vars) => {
      toast.success(vars.approved ? "Application approved" : "Application rejected");
      queryClient.invalidateQueries({ queryKey: ["halal-application", id] });
      queryClient.invalidateQueries({ queryKey: ["halal-applications"] });
      setApproveOpen(false);
      setRejectOpen(false);
      setNotes("");
      setRejectionReason("");
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message ?? "Action failed");
    },
  });

  const hasCompletedInspection =
    application?.inspections?.some((i) => i.completedAt != null) ?? false;
  const canApprove =
    application &&
    ["SUBMITTED", "REVIEW", "INSPECTION"].includes(application.status) &&
    hasCompletedInspection;
  const canReject =
    application && ["SUBMITTED", "REVIEW", "INSPECTION"].includes(application.status);
  const isApproved = application?.status === "APPROVED";
  const isRejected = application?.status === "REJECTED";

  if (!id || isLoading) return <div className="p-6">Loading…</div>;
  if (!application) return <div className="p-6">Application not found</div>;

  const app = application as HalalApplication;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin/halal/applications")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Application details</h1>
            <p className="text-muted-foreground text-sm">
              {app.business?.name ?? app.businessId}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className={STATUS_COLORS[app.status] ?? "bg-gray-500"}>
            {app.status}
          </Badge>
          {canReject && !canApprove && (
            <span className="text-xs text-muted-foreground">
              Complete an inspection before approving
            </span>
          )}
          {canApprove && (
            <Button
              size="sm"
              variant="default"
              onClick={() => setApproveOpen(true)}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Approve
            </Button>
          )}
          {canReject && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setRejectOpen(true)}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
          )}
          {["SUBMITTED", "REVIEW", "INSPECTION"].includes(app.status) && (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                navigate("/admin/halal/inspections", { state: { applicationId: app.id } })
              }
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Assign inspection
            </Button>
          )}
        </div>
      </div>

      {/* Payment status */}
      {app.status !== "DRAFT" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" /> Certification fee
            </CardTitle>
            <CardDescription>
              Fee: {app.feeAmount != null ? Number(app.feeAmount) : 500} ETB
              {app.feePaidAt ? (
                <span className="ml-2 text-green-600">
                  • Paid on {new Date(app.feePaidAt).toLocaleDateString()}
                </span>
              ) : (
                <span className="ml-2 text-amber-600">• Payment pending</span>
              )}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Business info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" /> Business
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="font-medium">{app.business?.name}</p>
          <p className="text-sm text-muted-foreground">
            Category: {app.business?.category?.replace("_", " ")}
          </p>
          <p className="text-sm">
            Contact: {app.business?.contactName} — {app.business?.contactEmail} —{" "}
            {app.business?.contactPhone}
          </p>
          {app.business?.address && (
            <p className="text-sm text-muted-foreground">{app.business.address}</p>
          )}
        </CardContent>
      </Card>

      {/* Products */}
      {app.productList && app.productList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {app.productList.map((p, i) => (
                <li key={i} className="flex justify-between border-b pb-2 last:border-0">
                  <span>{p.name}</span>
                  {p.description && (
                    <span className="text-sm text-muted-foreground">
                      {p.description}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Ingredients */}
      {app.ingredients && app.ingredients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ingredients</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {app.ingredients.map((ing, i) => (
                <li key={i} className="flex justify-between">
                  <span>{ing.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {ing.source ?? ing.halalStatus ?? "—"}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Documents */}
      {app.documents && app.documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {app.documents.map((d, i) => (
                <li key={i}>
                  <a
                    href={resolveFileUrl(d.url) ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {d.name}
                  </a>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Inspections */}
      {app.inspections && app.inspections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Inspections</CardTitle>
            <CardDescription>Scheduled and completed inspections</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {app.inspections.map((ins) => (
                <li
                  key={ins.id}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <span>
                    {ins.inspector?.firstName} {ins.inspector?.lastName}
                  </span>
                  <div className="flex items-center gap-2">
                    {ins.scheduledAt && (
                      <span className="text-xs text-muted-foreground">
                        Scheduled: {new Date(ins.scheduledAt).toLocaleString()}
                      </span>
                    )}
                    {ins.completedAt ? (
                      <Badge variant="default">Completed</Badge>
                    ) : (
                      <>
                        <Badge variant="secondary">Pending</Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/admin/halal/inspections/${ins.id}/complete`)}
                        >
                          Complete
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Rejection info */}
      {isRejected && app.rejectionReason && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Rejection reason</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{app.rejectionReason}</p>
          </CardContent>
        </Card>
      )}

      {/* Certificate link */}
      {app.certificate && isApproved && (
        <Card>
          <CardHeader>
            <CardTitle>Certificate</CardTitle>
            <CardDescription>{app.certificate.certificateId}</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button
              variant="outline"
              onClick={() =>
                window.open(`/verify/halal/${app.certificate!.certificateId}`, "_blank")
              }
            >
              View certificate
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                halalApi.certificates.download(app.certificate!.id, app.certificate!.certificateId)
              }
            >
              Download PDF
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Approve dialog */}
      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve application</DialogTitle>
            <DialogDescription>
              Add optional notes for the approval.
            </DialogDescription>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                approveMutation.mutate({ approved: true, notes: notes || undefined })
              }
              disabled={approveMutation.isPending}
            >
              Approve
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
    </div>
  );
}
