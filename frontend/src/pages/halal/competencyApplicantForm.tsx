import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { HalalCompetencyReligiousAnswers } from "@/services/halal";

export type CompetencyApplicantFormValues = {
  fullName: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  employerName: string;
  jobTitle: string;
  confirmMuslim: boolean;
  dailyPrayer: boolean | null;
  observesRamadanFasting: boolean | null;
  understandsTasmiyah: boolean | null;
  familiarHalalVsHaramAnimals: boolean | null;
  understandsProperSlaughterMethod: boolean | null;
  knowledgeAnimalAliveHealthy: boolean | null;
  knowledgeCorrectCuttingTechnique: boolean | null;
  knowledgeCompleteBloodDrainage: boolean | null;
};

export function emptyCompetencyApplicantForm(): CompetencyApplicantFormValues {
  return {
    fullName: "",
    dateOfBirth: "",
    phone: "",
    email: "",
    employerName: "",
    jobTitle: "",
    confirmMuslim: false,
    dailyPrayer: null,
    observesRamadanFasting: null,
    understandsTasmiyah: null,
    familiarHalalVsHaramAnimals: null,
    understandsProperSlaughterMethod: null,
    knowledgeAnimalAliveHealthy: null,
    knowledgeCorrectCuttingTechnique: null,
    knowledgeCompleteBloodDrainage: null,
  };
}

/** Map API religiousAnswers + row fields into form (supports legacy text-based answers as empty booleans). */
export function competencyFormFromApi(row: {
  fullName: string;
  dateOfBirth?: string | null;
  phone?: string | null;
  email?: string | null;
  employerName: string;
  jobTitle?: string | null;
  religiousAnswers: unknown;
}): CompetencyApplicantFormValues {
  const ra = (row.religiousAnswers ?? {}) as Partial<HalalCompetencyReligiousAnswers> & Record<string, unknown>;
  const b = (k: keyof HalalCompetencyReligiousAnswers): boolean | null =>
    typeof ra[k] === "boolean" ? ra[k] : null;
  return {
    fullName: row.fullName,
    dateOfBirth: row.dateOfBirth ? row.dateOfBirth.slice(0, 10) : "",
    phone: row.phone ?? "",
    email: row.email ?? "",
    employerName: row.employerName,
    jobTitle: row.jobTitle ?? "",
    confirmMuslim: ra.religionConfirmedMuslim === true,
    dailyPrayer: b("dailyPrayer"),
    observesRamadanFasting: b("observesRamadanFasting"),
    understandsTasmiyah: b("understandsTasmiyah"),
    familiarHalalVsHaramAnimals: b("familiarHalalVsHaramAnimals"),
    understandsProperSlaughterMethod: b("understandsProperSlaughterMethod"),
    knowledgeAnimalAliveHealthy: b("knowledgeAnimalAliveHealthy"),
    knowledgeCorrectCuttingTechnique: b("knowledgeCorrectCuttingTechnique"),
    knowledgeCompleteBloodDrainage: b("knowledgeCompleteBloodDrainage"),
  };
}

export function toReligiousAnswersPayload(form: CompetencyApplicantFormValues): HalalCompetencyReligiousAnswers {
  return {
    religionConfirmedMuslim: true,
    dailyPrayer: form.dailyPrayer === true,
    observesRamadanFasting: form.observesRamadanFasting === true,
    understandsTasmiyah: form.understandsTasmiyah === true,
    familiarHalalVsHaramAnimals: form.familiarHalalVsHaramAnimals === true,
    understandsProperSlaughterMethod: form.understandsProperSlaughterMethod === true,
    knowledgeAnimalAliveHealthy: form.knowledgeAnimalAliveHealthy === true,
    knowledgeCorrectCuttingTechnique: form.knowledgeCorrectCuttingTechnique === true,
    knowledgeCompleteBloodDrainage: form.knowledgeCompleteBloodDrainage === true,
  };
}

function YesNoRow({
  name,
  label,
  value,
  onChange,
}: {
  name: string;
  label: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="space-y-2 py-1 border-b border-border/40 last:border-0">
      <Label className="text-sm font-medium leading-snug">{label}</Label>
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="radio" name={name} checked={value === true} onChange={() => onChange(true)} />
          Yes
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="radio" name={name} checked={value === false} onChange={() => onChange(false)} />
          No
        </label>
      </div>
    </div>
  );
}

type SetForm = React.Dispatch<React.SetStateAction<CompetencyApplicantFormValues>>;

export function CompetencyApplicantFormFields({
  form,
  setForm,
  supportLetterSlot,
}: {
  form: CompetencyApplicantFormValues;
  setForm: SetForm;
  /** Optional file upload block (new application page or draft) */
  supportLetterSlot?: React.ReactNode;
}) {
  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Basic information</CardTitle>
          <CardDescription>Personal details as they should appear on your certificate</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="comp-fullName">Full name</Label>
            <Input
              id="comp-fullName"
              value={form.fullName}
              onChange={(e) => setForm((s) => ({ ...s, fullName: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="comp-dob">Date of birth</Label>
            <Input
              id="comp-dob"
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setForm((s) => ({ ...s, dateOfBirth: e.target.value }))}
              required
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="comp-phone">Phone</Label>
              <Input
                id="comp-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comp-email">Email</Label>
              <Input
                id="comp-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="comp-employer">Current employer / organization</Label>
            <Input
              id="comp-employer"
              value={form.employerName}
              onChange={(e) => setForm((s) => ({ ...s, employerName: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="comp-job">Job title (optional)</Label>
            <Input
              id="comp-job"
              value={form.jobTitle}
              onChange={(e) => setForm((s) => ({ ...s, jobTitle: e.target.value }))}
            />
          </div>
          {supportLetterSlot}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Personal & religious information</CardTitle>
          <CardDescription>Declaration for Halal competency assessment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="space-y-2 pb-3 border-b border-border/40">
            <Label className="text-sm font-medium">Religion</Label>
            <p className="text-sm text-muted-foreground">This certificate is only for Muslims. Religion on record: Islam.</p>
            <label className="flex items-start gap-2 text-sm cursor-pointer mt-2">
              <input
                type="checkbox"
                checked={form.confirmMuslim}
                onChange={(e) => setForm((s) => ({ ...s, confirmMuslim: e.target.checked }))}
                className="mt-0.5"
              />
              <span>I confirm that I am Muslim.</span>
            </label>
          </div>
          <YesNoRow
            name="dailyPrayer"
            label="Daily prayer practice"
            value={form.dailyPrayer}
            onChange={(v) => setForm((s) => ({ ...s, dailyPrayer: v }))}
          />
          <YesNoRow
            name="ramadan"
            label="Observes Ramadan fasting"
            value={form.observesRamadanFasting}
            onChange={(v) => setForm((s) => ({ ...s, observesRamadanFasting: v }))}
          />
          <YesNoRow
            name="tasmiyah"
            label="Understanding of Tasmiyah (Bismillah, Allahu Akbar before slaughter)"
            value={form.understandsTasmiyah}
            onChange={(v) => setForm((s) => ({ ...s, understandsTasmiyah: v }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Halal slaughter knowledge</CardTitle>
          <CardDescription>Self-assessment — answer honestly</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          <YesNoRow
            name="halalHaram"
            label="Familiar with Halal vs Haram animals"
            value={form.familiarHalalVsHaramAnimals}
            onChange={(v) => setForm((s) => ({ ...s, familiarHalalVsHaramAnimals: v }))}
          />
          <YesNoRow
            name="slaughterMethod"
            label="Understand proper Halal slaughter method"
            value={form.understandsProperSlaughterMethod}
            onChange={(v) => setForm((s) => ({ ...s, understandsProperSlaughterMethod: v }))}
          />
          <YesNoRow
            name="aliveHealthy"
            label="Knowledge of ensuring animal is alive and healthy at slaughter"
            value={form.knowledgeAnimalAliveHealthy}
            onChange={(v) => setForm((s) => ({ ...s, knowledgeAnimalAliveHealthy: v }))}
          />
          <YesNoRow
            name="cutting"
            label="Knowledge of correct cutting technique (trachea, esophagus, major blood vessels)"
            value={form.knowledgeCorrectCuttingTechnique}
            onChange={(v) => setForm((s) => ({ ...s, knowledgeCorrectCuttingTechnique: v }))}
          />
          <YesNoRow
            name="drainage"
            label="Knowledge of complete blood drainage requirement"
            value={form.knowledgeCompleteBloodDrainage}
            onChange={(v) => setForm((s) => ({ ...s, knowledgeCompleteBloodDrainage: v }))}
          />
        </CardContent>
      </Card>
    </>
  );
}

export function validateCompetencyApplicantForm(form: CompetencyApplicantFormValues): string | null {
  if (!form.fullName.trim() || !form.employerName.trim()) return "Full name and employer are required.";
  if (!form.dateOfBirth) return "Date of birth is required.";
  if (!form.phone.trim() || form.phone.trim().length < 5) return "A valid phone number is required.";
  if (!form.email.trim()) return "Email is required.";
  if (!form.confirmMuslim) return "You must confirm that you are Muslim.";
  const boolKeys: (keyof CompetencyApplicantFormValues)[] = [
    "dailyPrayer",
    "observesRamadanFasting",
    "understandsTasmiyah",
    "familiarHalalVsHaramAnimals",
    "understandsProperSlaughterMethod",
    "knowledgeAnimalAliveHealthy",
    "knowledgeCorrectCuttingTechnique",
    "knowledgeCompleteBloodDrainage",
  ];
  for (const k of boolKeys) {
    if (form[k] === null) return "Please answer all Yes/No questions.";
  }
  return null;
}
