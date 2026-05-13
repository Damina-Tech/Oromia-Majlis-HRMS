"use client";
import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft, CheckCircle, FileText, AlertCircle, Upload } from "lucide-react";
import { halalApi } from "@/services/halal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const ACCEPT_REPORT_FILES = ".pdf,.doc,.docx,.jpg,.jpeg,.png";

export default function HalalInspectionCompletePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [nonConformityFile, setNonConformityFile] = useState<File | null>(null);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

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
      queryClient.invalidateQueries({ queryKey: ["halal-application"] });
      toast.success("Inspection report submitted successfully");
      const appId = inspection?.applicationId;
      navigate(appId ? `/halal/applications/${appId}` : "/admin/halal/inspections");
    },
    onError: (e: any) => {
      const msg = e.response?.data?.message;
      toast.error(typeof msg === "string" ? msg : "Failed to submit inspection report");
    },
  });

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!nonConformityFile) {
      e.nonConformity = "Upload a non-conformity report (PDF, Word, or image)";
    }
    if (!evidenceFile) {
      e.evidence = "Upload an evidence report (PDF, Word, or image)";
    }
    return e;
  }, [nonConformityFile, evidenceFile]);

  const isValid = Boolean(nonConformityFile && evidenceFile);

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const showError = (field: string) => touched[field] && errors[field];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ nonConformity: true, evidence: true });
    if (Object.keys(errors).length > 0) {
      toast.error("Please fix the validation errors before submitting");
      return;
    }
    if (!nonConformityFile || !evidenceFile) return;

    try {
      setIsUploading(true);
      const [ncUpload, evUpload] = await Promise.all([
        halalApi.businesses.uploadDocument(nonConformityFile),
        halalApi.businesses.uploadDocument(evidenceFile),
      ]);

      completeMutation.mutate({
        checklistData: {
          inspectionDate: new Date().toISOString(),
          recommendations: recommendations.trim() || undefined,
          nonConformityReportUrl: ncUpload.url,
          nonConformityReportFileName: nonConformityFile.name,
          evidenceReportUrl: evUpload.url,
          evidenceReportFileName: evidenceFile.name,
        },
        notes: notes.trim() || undefined,
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast.error(typeof msg === "string" ? msg : "Failed to upload report files");
    } finally {
      setIsUploading(false);
    }
  };

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

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl mx-auto">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent dark:from-violet-600/20 dark:via-purple-600/10 border border-violet-200/50 dark:border-violet-800/30 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin/halal/inspections")}
            className="self-start text-violet-800 dark:text-violet-200 hover:bg-violet-100 dark:hover:bg-violet-900/40"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-violet-900 dark:text-violet-100">
              Complete inspection
            </h1>
            <p className="text-violet-700/80 dark:text-violet-300/80 text-sm mt-1">
              {inspection.application?.business?.name ?? "Application"} — Scheduled:{" "}
              {inspection.scheduledAt ? new Date(inspection.scheduledAt).toLocaleString() : "Not set"}
            </p>
          </div>
        </div>
      </div>

      {Object.keys(errors).length > 0 && Object.keys(touched).length > 0 && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Please fix the following before submitting:
            </p>
            <ul className="text-sm text-amber-700 dark:text-amber-300 list-disc list-inside space-y-0.5">
              {errors.nonConformity && <li>{errors.nonConformity}</li>}
              {errors.evidence && <li>{errors.evidence}</li>}
            </ul>
          </div>
        </div>
      )}

      <Card className="shadow-sm border-violet-200/50 dark:border-violet-900/30 overflow-hidden">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="flex items-center gap-2 text-violet-800 dark:text-violet-200">
            <CheckCircle className="h-5 w-5 text-violet-600" /> Inspection report
          </CardTitle>
          <CardDescription>
            Upload the non-conformity report and evidence report. Both files are required. Optional text fields
            support certification review.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="non-conformity-file" className="text-base font-semibold flex items-center gap-2">
                <Upload className="h-4 w-4" /> Non-conformity report <span className="text-destructive">*</span>
              </Label>
              <p className="text-sm text-muted-foreground">
                Document describing any non-conformities identified during the inspection (PDF, Word, or image).
              </p>
              <Input
                id="non-conformity-file"
                type="file"
                accept={ACCEPT_REPORT_FILES}
                onChange={(e) => {
                  setNonConformityFile(e.target.files?.[0] ?? null);
                  markTouched("nonConformity");
                }}
                className={showError("nonConformity") ? "border-destructive" : ""}
              />
              {showError("nonConformity") && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {errors.nonConformity}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="evidence-file" className="text-base font-semibold flex items-center gap-2">
                <Upload className="h-4 w-4" /> Evidence report <span className="text-destructive">*</span>
              </Label>
              <p className="text-sm text-muted-foreground">
                Supporting evidence from the inspection (photos, scans, or written report — PDF, Word, or image).
              </p>
              <Input
                id="evidence-file"
                type="file"
                accept={ACCEPT_REPORT_FILES}
                onChange={(e) => {
                  setEvidenceFile(e.target.files?.[0] ?? null);
                  markTouched("evidence");
                }}
                className={showError("evidence") ? "border-destructive" : ""}
              />
              {showError("evidence") && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {errors.evidence}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="recommendations" className="text-base font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" /> Recommendations (optional)
              </Label>
              <p className="text-sm text-muted-foreground">
                Suggestions for the business to maintain or improve Halal compliance.
              </p>
              <Textarea
                id="recommendations"
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                placeholder="Any recommendations for the certification review…"
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium">
                Additional notes (optional)
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any other relevant information for the certification review…"
                rows={2}
                className="resize-none"
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/halal/inspections")}
                className="sm:mr-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={completeMutation.isPending || isUploading || !isValid}
                className="bg-violet-600 hover:bg-violet-700"
              >
                {isUploading
                  ? "Uploading files…"
                  : completeMutation.isPending
                    ? "Submitting…"
                    : "Submit inspection report"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
