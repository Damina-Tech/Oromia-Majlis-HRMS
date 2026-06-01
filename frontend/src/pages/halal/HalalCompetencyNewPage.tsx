"use client";
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, GraduationCap, Upload } from "lucide-react";
import { halalApi } from "@/services/halal";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  applyRegistrationPrefill,
  CompetencyApplicantFormFields,
  emptyCompetencyApplicantForm,
  toReligiousAnswersPayload,
  validateCompetencyApplicantForm,
  type CompetencyApplicantFormValues,
} from "./competencyApplicantForm";

export default function HalalCompetencyNewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [form, setForm] = useState<CompetencyApplicantFormValues>(emptyCompetencyApplicantForm);
  const [letterFile, setLetterFile] = useState<File | null>(null);

  useEffect(() => {
    if (!user) return;
    setForm((prev) => applyRegistrationPrefill(prev, user));
  }, [user?.id, user?.email, user?.firstName, user?.lastName]);

  useEffect(() => {
    const employer = searchParams.get("employer")?.trim();
    if (!employer) return;
    setForm((prev) => (prev.employerName.trim() ? prev : { ...prev, employerName: employer }));
  }, [searchParams]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const err = validateCompetencyApplicantForm(form);
      if (err) throw new Error(err);
      if (!letterFile) throw new Error("Employer support letter is required.");

      const { url: supportLetterUrl } = await halalApi.businesses.uploadDocument(letterFile);

      const created = await halalApi.competencyCertificates.create({
        fullName: form.fullName.trim(),
        dateOfBirth: form.dateOfBirth,
        phone: form.phone.trim(),
        email: form.email.trim(),
        employerName: form.employerName.trim(),
        jobTitle: form.jobTitle.trim() || undefined,
        religiousAnswers: toReligiousAnswersPayload(form),
        supportLetterUrl,
      });
      return halalApi.competencyCertificates.submit(created.id);
    },
    onSuccess: (row) => {
      toast.success("Application submitted. Staff will schedule your interviews when ready.");
      navigate(`/halal/competency/${row.id}`);
    },
    onError: (e: any) => {
      const msg = e?.message ?? e.response?.data?.message ?? "Failed to submit application";
      toast.error(typeof msg === "string" ? msg : "Failed to submit application");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateCompetencyApplicantForm(form);
    if (err) {
      toast.error(err);
      return;
    }
    if (!letterFile) {
      toast.error("Please attach your employer support letter.");
      return;
    }
    createMutation.mutate();
  };

  const supportLetterSlot = (
    <div className="space-y-2 pt-2">
      <Label htmlFor="comp-letter">Support letter from employer</Label>
      <p className="text-xs text-muted-foreground">PDF or image, from your current employer.</p>
      <Input
        id="comp-letter"
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={(e) => setLetterFile(e.target.files?.[0] ?? null)}
        required
      />
    </div>
  );

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate("/halal/competency")}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="flex items-center gap-2">
        <GraduationCap className="h-8 w-8 text-emerald-600" />
        <div>
          <h1 className="text-xl font-bold">New Halal Competency application</h1>
          <p className="text-sm text-muted-foreground">
            Your account name and email are filled in when empty (from registration); you can edit any field. Complete all
            sections, attach your employer letter, then submit — your application goes straight to staff review.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <CompetencyApplicantFormFields form={form} setForm={setForm} supportLetterSlot={supportLetterSlot} />

        <Button
          type="submit"
          className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <>
              <Upload className="h-4 w-4 mr-2 inline" />
              Uploading & submitting…
            </>
          ) : (
            "Save application"
          )}
        </Button>
      </form>
    </div>
  );
}
