"use client";
import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft, CheckCircle, CheckSquare, XSquare, FileText, AlertCircle } from "lucide-react";
import { halalApi } from "@/services/halal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Standard checklist items for Halal inspection compliance
const MIN_OBSERVATIONS_LENGTH = 30;
const MIN_RECOMMENDATIONS_LENGTH = 20;

const CHECKLIST_ITEMS = [
  { key: "premisesClean", label: "Premises are clean and hygienic" },
  { key: "equipmentHalalCompliant", label: "Equipment is Halal-compliant (no cross-contamination)" },
  { key: "storageProper", label: "Storage conditions meet Halal requirements" },
  { key: "ingredientTraceability", label: "Ingredient sourcing and traceability verified" },
  { key: "noProhibitedSubstances", label: "No prohibited substances on premises" },
  { key: "personnelTrained", label: "Personnel trained on Halal compliance" },
];

export default function HalalInspectionCompletePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");
  const [observations, setObservations] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [isUploadingReport, setIsUploadingReport] = useState(false);
  const [passed, setPassed] = useState<boolean | null>(null);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
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
    if (passed === null) e.result = "Select an inspection result (Passed or Failed)";
    const obsTrimmed = observations.trim();
    if (obsTrimmed.length < MIN_OBSERVATIONS_LENGTH) {
      e.observations = `Observations must be at least ${MIN_OBSERVATIONS_LENGTH} characters (${obsTrimmed.length}/${MIN_OBSERVATIONS_LENGTH})`;
    }
    if (passed === false) {
      const recTrimmed = recommendations.trim();
      if (recTrimmed.length < MIN_RECOMMENDATIONS_LENGTH) {
        e.recommendations = `Recommendations required when Failed: at least ${MIN_RECOMMENDATIONS_LENGTH} characters (${recTrimmed.length}/${MIN_RECOMMENDATIONS_LENGTH})`;
      }
    }
    return e;
  }, [passed, observations, recommendations]);

  const isValid = passed !== null && observations.trim().length >= MIN_OBSERVATIONS_LENGTH &&
    (passed === true || recommendations.trim().length >= MIN_RECOMMENDATIONS_LENGTH);

  const toggleChecklist = (key: string) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const showError = (field: string) => touched[field] && errors[field];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ result: true, observations: true, recommendations: true });
    if (Object.keys(errors).length > 0) {
      toast.error("Please fix the validation errors before submitting");
      return;
    }
    let reportUrl: string | undefined;
    try {
      if (reportFile) {
        setIsUploadingReport(true);
        const uploaded = await halalApi.businesses.uploadDocument(reportFile);
        reportUrl = uploaded.url;
      }
      const fullNotes = [observations, recommendations, notes].filter(Boolean).join("\n\n---\n\n");
      completeMutation.mutate({
        checklistData: {
          overallPassed: passed,
          ...Object.fromEntries(CHECKLIST_ITEMS.map((c) => [c.key, checklist[c.key] ?? false])),
          inspectionDate: new Date().toISOString(),
          observations: observations || undefined,
          recommendations: recommendations || undefined,
          inspectionReportUrl: reportUrl,
          inspectionReportFileName: reportFile?.name,
        },
        notes: fullNotes || undefined,
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast.error(typeof msg === "string" ? msg : "Failed to upload inspection report");
    } finally {
      setIsUploadingReport(false);
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
      {/* Header */}
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

      {/* Validation summary */}
      {Object.keys(errors).length > 0 && Object.keys(touched).length > 0 && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Please fix the following before submitting:
            </p>
            <ul className="text-sm text-amber-700 dark:text-amber-300 list-disc list-inside space-y-0.5">
              {errors.result && <li>{errors.result}</li>}
              {errors.observations && <li>{errors.observations}</li>}
              {errors.recommendations && <li>{errors.recommendations}</li>}
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
            Record your findings and submit the full inspection report for tracking and certification review.
            Required fields are marked with *.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Overall result */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">
                Inspection result <span className="text-destructive">*</span>
              </Label>
              <p className="text-sm text-muted-foreground">Overall compliance assessment</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <label
                  className={`flex items-center gap-3 cursor-pointer p-4 rounded-lg border-2 transition-all flex-1 ${
                    passed === true
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20"
                      : showError("result")
                        ? "border-destructive bg-destructive/5"
                        : "border-input hover:bg-accent/50"
                  }`}
                  onClick={() => { setPassed(true); markTouched("result"); }}
                >
                  <input type="radio" name="passed" checked={passed === true} onChange={() => { setPassed(true); markTouched("result"); }} className="sr-only" />
                  <CheckSquare className={`h-5 w-5 shrink-0 ${passed === true ? "text-emerald-600" : "text-muted-foreground"}`} />
                  <div>
                    <span className="font-medium block">Passed</span>
                    <span className="text-sm text-muted-foreground">Meets Halal requirements</span>
                  </div>
                </label>
                <label
                  className={`flex items-center gap-3 cursor-pointer p-4 rounded-lg border-2 transition-all flex-1 ${
                    passed === false
                      ? "border-red-500 bg-red-50 dark:bg-red-950/30 ring-2 ring-red-500/20"
                      : showError("result")
                        ? "border-destructive bg-destructive/5"
                        : "border-input hover:bg-accent/50"
                  }`}
                  onClick={() => { setPassed(false); markTouched("result"); }}
                >
                  <input type="radio" name="passed" checked={passed === false} onChange={() => { setPassed(false); markTouched("result"); }} className="sr-only" />
                  <XSquare className={`h-5 w-5 shrink-0 ${passed === false ? "text-red-600" : "text-muted-foreground"}`} />
                  <div>
                    <span className="font-medium block">Failed</span>
                    <span className="text-sm text-muted-foreground">Does not meet requirements</span>
                  </div>
                </label>
              </div>
              {showError("result") && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" /> {errors.result}
                </p>
              )}
            </div>

            {/* Compliance checklist */}
            <div className="space-y-2">
              <Label className="text-base font-semibold flex items-center gap-2">
                <CheckSquare className="h-4 w-4" /> Compliance checklist
              </Label>
              <p className="text-sm text-muted-foreground">Verify each item during the inspection</p>
              <div className="space-y-2 rounded-lg border border-input p-4 bg-muted/20">
                {CHECKLIST_ITEMS.map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center gap-3 cursor-pointer py-2.5 px-3 rounded-md hover:bg-background/80 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={checklist[item.key] ?? false}
                      onChange={() => toggleChecklist(item.key)}
                      className="h-4 w-4 rounded border-input accent-violet-600"
                    />
                    <span className="text-sm">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Observations */}
            <div className="space-y-2">
              <Label htmlFor="observations" className="text-base font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" /> Observations <span className="text-destructive">*</span>
              </Label>
              <p className="text-sm text-muted-foreground">
                Detailed findings during the inspection (min {MIN_OBSERVATIONS_LENGTH} characters)
              </p>
              <Textarea
                id="observations"
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                onBlur={() => markTouched("observations")}
                placeholder="Describe what you observed: premises condition, equipment usage, storage practices, personnel practices, documentation reviewed…"
                rows={4}
                className={`resize-none ${showError("observations") ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
              {showError("observations") && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {errors.observations}
                </p>
              )}
            </div>

            {/* Recommendations */}
            <div className="space-y-2">
              <Label htmlFor="recommendations" className="text-base font-semibold">
                Recommendations {passed === false && <span className="text-destructive">*</span>}
              </Label>
              <p className="text-sm text-muted-foreground">
                {passed === false
                  ? `Required when Failed: explain what needs improvement (min ${MIN_RECOMMENDATIONS_LENGTH} characters)`
                  : "Suggestions for improvement (optional)"}
              </p>
              <Textarea
                id="recommendations"
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                onBlur={() => markTouched("recommendations")}
                placeholder="Any recommendations for the business to maintain or improve Halal compliance…"
                rows={3}
                className={`resize-none ${showError("recommendations") ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
              {showError("recommendations") && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {errors.recommendations}
                </p>
              )}
            </div>

            {/* Additional notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium">Additional notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any other relevant information for the certification review…"
                rows={2}
                className="resize-none"
              />
            </div>
            
            {/* Additional notes */}
            <div className="space-y-2">
              <Label htmlFor="reportFile" className="text-sm font-medium">
                Inspection report file (optional)
              </Label>
              <Input
                id="reportFile"
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => setReportFile(e.target.files?.[0] ?? null)}
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
                disabled={completeMutation.isPending || isUploadingReport || !isValid}
                className="bg-violet-600 hover:bg-violet-700"
              >
                {isUploadingReport
                  ? "Uploading report..."
                  : completeMutation.isPending
                    ? "Submitting..."
                    : "Submit inspection report"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
