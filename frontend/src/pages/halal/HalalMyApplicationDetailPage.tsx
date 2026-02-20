"use client";
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, CreditCard, Award, ChevronRight, FileText, Building2, AlertCircle } from "lucide-react";
import { halalApi, type HalalApplication, type HalalApplicationStatus } from "@/services/halal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const STATUS_COLORS: Record<HalalApplicationStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  SUBMITTED: "bg-blue-100 text-blue-800",
  REVIEW: "bg-amber-100 text-amber-800",
  INSPECTION: "bg-purple-100 text-purple-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

const NEXT_ACTION_HINTS: Record<HalalApplicationStatus, { title: string; description: string }> = {
  DRAFT: {
    title: "Complete and submit your application",
    description: "Review your application details and click Submit when ready. You can edit until you submit.",
  },
  SUBMITTED: {
    title: "Pay the certification fee",
    description: "Pay the required fee to proceed. After payment, Oromia Majlis will review your application.",
  },
  REVIEW: {
    title: "Application under review",
    description: "Oromia Majlis staff are reviewing your application. An inspector may be assigned soon.",
  },
  INSPECTION: {
    title: "Inspection in progress",
    description: "An inspector has been assigned. They will visit your premises to complete the inspection.",
  },
  APPROVED: {
    title: "Certificate issued",
    description: "Your application was approved. Download your Halal certificate from the Certificates page.",
  },
  REJECTED: {
    title: "Application not approved",
    description: "Your application was not approved. See the rejection reason below. You may submit a new application.",
  },
};

const WORKFLOW_STEPS = [
  { key: "DRAFT", label: "Create draft" },
  { key: "SUBMITTED", label: "Submit & pay" },
  { key: "REVIEW", label: "Under review" },
  { key: "INSPECTION", label: "Inspection" },
  { key: "APPROVED", label: "Certificate" },
];

export default function HalalMyApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: app, isLoading } = useQuery({
    queryKey: ["halal-application", id],
    queryFn: () => halalApi.applications.get(id!),
    enabled: !!id,
  });

  const submitMutation = useMutation({
    mutationFn: () => halalApi.applications.submit(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["halal-application", id] });
      queryClient.invalidateQueries({ queryKey: ["halal-applications"] });
      toast.success("Application submitted successfully");
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed to submit"),
  });

  const paymentMutation = useMutation({
    mutationFn: () => halalApi.applications.confirmPayment(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["halal-application", id] });
      queryClient.invalidateQueries({ queryKey: ["halal-applications"] });
      toast.success("Payment confirmed");
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed to confirm payment"),
  });

  if (!id || isLoading) return <div className="p-6">Loading…</div>;
  if (!app) return <div className="p-6">Application not found</div>;

  const application = app as HalalApplication;
  const feeAmount = application.feeAmount != null ? Number(application.feeAmount) : 500;
  const isPaid = !!application.feePaidAt;
  const currentStepIndex = WORKFLOW_STEPS.findIndex((s) => s.key === application.status);
  const hint = NEXT_ACTION_HINTS[application.status];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/halal/dashboard")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold">Application details</h1>
          <p className="text-muted-foreground text-sm">{application.business?.name ?? application.businessId}</p>
        </div>
        <Badge className={STATUS_COLORS[application.status]}>{application.status}</Badge>
      </div>

      {/* Workflow progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Application progress</CardTitle>
          <CardDescription>Current stage and next steps</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 items-center">
            {WORKFLOW_STEPS.map((step, i) => (
              <React.Fragment key={step.key}>
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${
                    i <= currentStepIndex ? "bg-primary/10 text-primary font-medium" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <span>{step.label}</span>
                  {application.status === step.key && <ChevronRight className="h-4 w-4" />}
                </div>
                {i < WORKFLOW_STEPS.length - 1 && <span className="text-muted-foreground">→</span>}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Next action hint */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle className="h-5 w-5" />
            {hint.title}
          </CardTitle>
          <CardDescription>{hint.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {application.status === "DRAFT" && (
            <Button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}>
              <Send className="h-4 w-4 mr-2" />
              {submitMutation.isPending ? "Submitting…" : "Submit application"}
            </Button>
          )}
          {application.status === "SUBMITTED" && !isPaid && (
            <Button onClick={() => paymentMutation.mutate()} disabled={paymentMutation.isPending}>
              <CreditCard className="h-4 w-4 mr-2" />
              {paymentMutation.isPending ? "Confirming…" : `Confirm payment (${feeAmount} ETB)`}
            </Button>
          )}
          {application.status === "APPROVED" && application.certificate && (
            <Button
              variant="outline"
              onClick={() =>
                halalApi.certificates.download(application.certificate!.id, application.certificate!.certificateId)
              }
            >
              <Award className="h-4 w-4 mr-2" />
              Download certificate
            </Button>
          )}
          {(application.status === "APPROVED" || application.status === "REJECTED") && (
            <Button variant="outline" onClick={() => navigate("/halal/dashboard")}>
              Back to dashboard
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Business info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" /> Business
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="font-medium">{application.business?.name}</p>
          <p className="text-sm text-muted-foreground">
            Category: {application.business?.category?.replace("_", " ")}
          </p>
          <p className="text-sm">
            Contact: {application.business?.contactName} — {application.business?.contactEmail} —{" "}
            {application.business?.contactPhone}
          </p>
        </CardContent>
      </Card>

      {/* Products & Ingredients */}
      {(application.productList?.length || application.ingredients?.length) ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> Products & ingredients
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {application.productList && application.productList.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Products</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {application.productList.map((p, i) => (
                    <li key={i}>
                      {p.name}
                      {p.description && <span className="text-muted-foreground"> — {p.description}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {application.ingredients && application.ingredients.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Ingredients</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {application.ingredients.map((ing, i) => (
                    <li key={i}>
                      {ing.name}
                      {ing.source && <span className="text-muted-foreground"> — {ing.source}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* Payment status */}
      {application.status !== "DRAFT" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" /> Certification fee
            </CardTitle>
            <CardDescription>Fee amount: {feeAmount} ETB</CardDescription>
          </CardHeader>
          <CardContent>
            {isPaid ? (
              <p className="text-sm text-green-600">
                Paid on {application.feePaidAt ? new Date(application.feePaidAt).toLocaleDateString() : "—"}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Payment pending. Click "Confirm payment" above after you have made the payment.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Inspections (read-only for business owner) */}
      {application.inspections && application.inspections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Inspections</CardTitle>
            <CardDescription>Assigned inspections</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {application.inspections.map((ins) => (
                <li key={ins.id} className="flex justify-between items-center p-2 border rounded">
                  <span>
                    {ins.inspector?.firstName} {ins.inspector?.lastName}
                  </span>
                  {ins.completedAt ? (
                    <Badge variant="default">Completed</Badge>
                  ) : (
                    <Badge variant="secondary">Scheduled</Badge>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Rejection reason */}
      {application.status === "REJECTED" && application.rejectionReason && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Rejection reason</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{application.rejectionReason}</p>
          </CardContent>
        </Card>
      )}

      {/* Edit draft - link to apply page with state to edit */}
      {application.status === "DRAFT" && (
        <Button variant="outline" onClick={() => navigate(`/halal/apply/${id}/edit`)}>
          Edit application details
        </Button>
      )}
    </div>
  );
}
