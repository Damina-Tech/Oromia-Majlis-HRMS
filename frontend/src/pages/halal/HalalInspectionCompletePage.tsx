"use client";
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { halalApi } from "@/services/halal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function HalalInspectionCompletePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");
  const [passed, setPassed] = useState<boolean | null>(null);

  const { data: inspection, isLoading } = useQuery({
    queryKey: ["halal-inspection", id],
    queryFn: () => halalApi.inspections.get(id!),
    enabled: !!id,
  });

  const completeMutation = useMutation({
    mutationFn: (data: { checklistData?: Record<string, unknown>; notes?: string }) =>
      halalApi.inspections.complete(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["halal-inspection", id] });
      queryClient.invalidateQueries({ queryKey: ["halal-inspections"] });
      queryClient.invalidateQueries({ queryKey: ["halal-applications"] });
      toast.success("Inspection completed");
      const appId = inspection?.applicationId;
      navigate(appId ? `/admin/halal/applications/${appId}` : "/admin/halal/inspections");
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed to complete"),
  });

  if (!id || isLoading) return <div className="p-6">Loading…</div>;
  if (!inspection) return <div className="p-6">Inspection not found</div>;
  if (inspection.completedAt) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">This inspection is already completed.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/admin/halal/inspections")}>
          Back
        </Button>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    completeMutation.mutate({
      checklistData: { overallPassed: passed },
      notes: notes || undefined,
    });
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/halal/inspections")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Complete inspection</h1>
          <p className="text-muted-foreground text-sm">
            {inspection.application?.business?.name ?? "Application"} — Scheduled:{" "}
            {inspection.scheduledAt ? new Date(inspection.scheduledAt).toLocaleString() : "Not set"}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" /> Inspection report
          </CardTitle>
          <CardDescription>
            Record your findings and submit the inspection report.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Inspection result</label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="passed"
                    checked={passed === true}
                    onChange={() => setPassed(true)}
                  />
                  Passed
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="passed"
                    checked={passed === false}
                    onChange={() => setPassed(false)}
                  />
                  Failed
                </label>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe inspection findings, observations, recommendations…"
                rows={5}
                className="mt-2"
              />
            </div>

            <Button type="submit" disabled={completeMutation.isPending || passed === null}>
              {completeMutation.isPending ? "Submitting…" : "Complete inspection"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
