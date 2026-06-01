import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { halalApi } from "@/services/halal";
import type { HalalCompetencyReligiousAnswers } from "@/services/halal";

const EMPLOYER_OTHER_VALUE = "__other__";

/** Labels for read-only detail views and consistent copy */
export const COMPETENCY_REGISTRATION_LABELS = {
  religionConfirmedMuslim: "Confirmed Muslim (declaration)",
  dailyPrayer: "Daily prayer practice",
  observesRamadanFasting: "Observes Ramadan fasting",
  understandsTasmiyah: "Understanding of Tasmiyah (Bismillah, Allahu Akbar before slaughter)",
  familiarHalalVsHaramAnimals: "Familiar with Halal vs Haram animals",
  understandsProperSlaughterMethod: "Understand proper Halal slaughter method",
  knowledgeAnimalAliveHealthy: "Knowledge of ensuring animal is alive and healthy at slaughter",
  knowledgeCorrectCuttingTechnique:
    "Knowledge of correct cutting technique (trachea, esophagus, major blood vessels)",
  knowledgeCompleteBloodDrainage: "Knowledge of complete blood drainage requirement",
} as const satisfies Record<keyof HalalCompetencyReligiousAnswers, string>;

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

/** Subset of account / registration data used to pre-fill empty fields (all remain editable). */
export type CompetencyRegistrationUser = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
};

/**
 * Fills only still-empty identity fields from the logged-in account (e.g. public registration).
 * Does not overwrite anything the applicant already entered or loaded from the API.
 */
export function applyRegistrationPrefill(
  form: CompetencyApplicantFormValues,
  user: CompetencyRegistrationUser | null | undefined,
): CompetencyApplicantFormValues {
  if (!user) return form;
  const next = { ...form };
  const fromNames = [user.firstName, user.lastName]
    .map((s) => (s ?? "").trim())
    .filter(Boolean)
    .join(" ");
  if (!next.fullName.trim() && fromNames) {
    next.fullName = fromNames;
  }
  if (!next.email.trim() && (user.email ?? "").trim()) {
    next.email = (user.email ?? "").trim();
  }
  return next;
}

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
  const { data: employerDirectory, isLoading: loadingEmployers } = useQuery({
    queryKey: ["halal-employer-directory"],
    queryFn: () => halalApi.businesses.listEmployerDirectory(),
  });
  const approvedBusinesses = employerDirectory?.items ?? [];

  const employerSelectValue = useMemo(() => {
    const name = form.employerName.trim();
    if (!name) return "";
    const match = approvedBusinesses.find((b) => b.name.trim().toLowerCase() === name.toLowerCase());
    return match?.id ?? EMPLOYER_OTHER_VALUE;
  }, [form.employerName, approvedBusinesses]);

  const showOtherEmployerField = employerSelectValue === EMPLOYER_OTHER_VALUE;

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Basic information</CardTitle>
          <CardDescription>Personal details as they should appear on your certificate</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
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
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="comp-email">Email</Label>
            <Input
              id="comp-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="comp-employer">Current employer / organization</Label>
            <Select
              value={employerSelectValue}
              onValueChange={(value) => {
                if (value === EMPLOYER_OTHER_VALUE) {
                  setForm((s) => ({ ...s, employerName: "" }));
                  return;
                }
                const business = approvedBusinesses.find((b) => b.id === value);
                setForm((s) => ({ ...s, employerName: business?.name ?? "" }));
              }}
              disabled={loadingEmployers}
            >
              <SelectTrigger id="comp-employer">
                <SelectValue
                  placeholder={loadingEmployers ? "Loading businesses…" : "Select registered Halal business"}
                />
              </SelectTrigger>
              <SelectContent>
                {approvedBusinesses.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
                <SelectItem value={EMPLOYER_OTHER_VALUE}>Other (not listed)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose a registered Halal business if your employer is on the list. Otherwise select Other and enter the name
              below.
            </p>
          </div>
          {showOtherEmployerField && (
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="comp-employer-other">Employer / organization name</Label>
              <Input
                id="comp-employer-other"
                value={form.employerName}
                onChange={(e) => setForm((s) => ({ ...s, employerName: e.target.value }))}
                placeholder="Enter employer or organization name"
                required
              />
            </div>
          )}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="comp-job">Job title (optional)</Label>
            <Input
              id="comp-job"
              value={form.jobTitle}
              onChange={(e) => setForm((s) => ({ ...s, jobTitle: e.target.value }))}
            />
          </div>
          {supportLetterSlot ? <div className="sm:col-span-2">{supportLetterSlot}</div> : null}
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
          <div className="grid gap-0 md:grid-cols-2 md:gap-x-6">
            <YesNoRow
              name="dailyPrayer"
              label={COMPETENCY_REGISTRATION_LABELS.dailyPrayer}
              value={form.dailyPrayer}
              onChange={(v) => setForm((s) => ({ ...s, dailyPrayer: v }))}
            />
            <YesNoRow
              name="ramadan"
              label={COMPETENCY_REGISTRATION_LABELS.observesRamadanFasting}
              value={form.observesRamadanFasting}
              onChange={(v) => setForm((s) => ({ ...s, observesRamadanFasting: v }))}
            />
            <YesNoRow
              name="tasmiyah"
              label={COMPETENCY_REGISTRATION_LABELS.understandsTasmiyah}
              value={form.understandsTasmiyah}
              onChange={(v) => setForm((s) => ({ ...s, understandsTasmiyah: v }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Halal slaughter knowledge</CardTitle>
          <CardDescription>Self-assessment — answer honestly</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-0 md:grid-cols-2 md:gap-x-6">
          <YesNoRow
            name="halalHaram"
            label={COMPETENCY_REGISTRATION_LABELS.familiarHalalVsHaramAnimals}
            value={form.familiarHalalVsHaramAnimals}
            onChange={(v) => setForm((s) => ({ ...s, familiarHalalVsHaramAnimals: v }))}
          />
          <YesNoRow
            name="slaughterMethod"
            label={COMPETENCY_REGISTRATION_LABELS.understandsProperSlaughterMethod}
            value={form.understandsProperSlaughterMethod}
            onChange={(v) => setForm((s) => ({ ...s, understandsProperSlaughterMethod: v }))}
          />
          <YesNoRow
            name="aliveHealthy"
            label={COMPETENCY_REGISTRATION_LABELS.knowledgeAnimalAliveHealthy}
            value={form.knowledgeAnimalAliveHealthy}
            onChange={(v) => setForm((s) => ({ ...s, knowledgeAnimalAliveHealthy: v }))}
          />
          <YesNoRow
            name="cutting"
            label={COMPETENCY_REGISTRATION_LABELS.knowledgeCorrectCuttingTechnique}
            value={form.knowledgeCorrectCuttingTechnique}
            onChange={(v) => setForm((s) => ({ ...s, knowledgeCorrectCuttingTechnique: v }))}
          />
          <YesNoRow
            name="drainage"
            label={COMPETENCY_REGISTRATION_LABELS.knowledgeCompleteBloodDrainage}
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
