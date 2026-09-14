"use client";

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Building2, CheckCircle2, MapPin } from "lucide-react";
import PublicAuthNavbar from "@/components/layout/PublicAuthNavbar";
import InstitutionRegistrationForm from "@/components/institutions/InstitutionRegistrationForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  institutionsApi,
  type Institution,
  type InstitutionCreatePayload,
} from "@/services/institutions";
import { useAuth } from "@/contexts/AuthContext";
import { resolveFileUrl } from "@/config/api";

function typeLabel(type: Institution["type"]) {
  if (type === "MOSQUE") return "Mosque";
  if (type === "MADRASAH") return "Madrasah";
  return "Markaz";
}

function ownershipLabel(value?: string | null) {
  return value ? value.split("_").join(" ") : "Not specified";
}

function locationLine(institution: Institution) {
  return (
    [
      institution.kebeleName || institution.kebele?.name,
      institution.woreda?.name,
      institution.zone?.name,
      institution.region?.name,
    ]
      .filter(Boolean)
      .join(" · ") || "Not specified"
  );
}

function DetailRow({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value == null || value === "") return null;
  return (
    <div className="grid gap-1 sm:grid-cols-[10rem_1fr] sm:items-start">
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="text-sm text-slate-800 dark:text-slate-100">{value}</dd>
    </div>
  );
}

function InstitutionDetailSummary({ institution }: { institution: Institution }) {
  const mosque = institution.mosqueData;
  const madrasah = institution.madrasahData;
  const markaz = institution.markazData;
  const submitter = institution.submitter;

  return (
    <dl className="space-y-3">
      {institution.imageUrl ? (
        <div className="mb-2">
          <img
            src={resolveFileUrl(institution.imageUrl)}
            alt={institution.name}
            className="w-full max-h-48 object-cover rounded-lg border"
          />
        </div>
      ) : null}
      <DetailRow label="Reference" value={<span className="font-mono font-medium">{institution.institutionCode}</span>} />
      <DetailRow label="Name" value={institution.name} />
      <DetailRow label="Type" value={typeLabel(institution.type)} />
      <DetailRow label="Status" value={institution.status.split("_").join(" ")} />
      <DetailRow label="Location" value={locationLine(institution)} />
      <DetailRow label="Area (Kare)" value={institution.address} />
      <DetailRow
        label="GPS"
        value={
          institution.latitude != null && institution.longitude != null
            ? `${Number(institution.latitude).toFixed(6)}, ${Number(institution.longitude).toFixed(6)}`
            : undefined
        }
      />
      <DetailRow label="Year established" value={institution.yearEstablished} />
      <DetailRow label="Ownership" value={ownershipLabel(institution.ownershipStatus)} />

      {institution.type === "MOSQUE" && mosque ? (
        <>
          <DetailRow label="Capacity" value={mosque.capacity != null ? `${mosque.capacity} worshippers` : undefined} />
          <DetailRow label="Jummah" value={mosque.jummahAvailable ? "Available" : "Not indicated"} />
          <DetailRow label="Women prayer space" value={mosque.womenPrayerSpace ? "Yes" : "No"} />
        </>
      ) : null}

      {institution.type === "MADRASAH" && madrasah ? (
        <>
          <DetailRow label="Accreditation" value={madrasah.accreditationStatus.split("_").join(" ")} />
          <DetailRow label="Grade levels" value={madrasah.gradeLevels.join(", ")} />
        </>
      ) : null}

      {institution.type === "MARKAZ" && markaz ? (
        <>
          <DetailRow label="Disciplines" value={markaz.disciplines.join(", ")} />
          <DetailRow label="Study levels" value={markaz.studyLevels.join(", ")} />
        </>
      ) : null}

      {submitter ? (
        <>
          <DetailRow label="Account holder" value={submitter.name} />
          <DetailRow label="Login email" value={submitter.email || undefined} />
          <DetailRow label="Role" value={submitter.role} />
          <DetailRow label="Phone" value={submitter.phone} />
        </>
      ) : null}
    </dl>
  );
}

export default function InstitutionRegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [created, setCreated] = useState<Institution | null>(null);
  const [loginEmail, setLoginEmail] = useState("");

  const registerMutation = useMutation({
    mutationFn: (data: InstitutionCreatePayload) => institutionsApi.registerPublic(data),
    onSuccess: async (result, variables) => {
      setCreated(result.institution);
      setLoginEmail(result.user.email);
      toast.success("Institution registered and account created");

      const password = variables.password;
      if (password && result.user.email) {
        const loginResult = await login(result.user.email, password);
        if (loginResult.success) {
          toast.success("Signed in — opening your institution dashboard");
          navigate(`/my-institutions`, { replace: true });
          return;
        }
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: (error: unknown) => {
      const message =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message ?? "Failed to submit institution registration");
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50/30 to-indigo-100 dark:from-slate-900 dark:via-indigo-950/30 dark:to-slate-900 flex flex-col">
      <PublicAuthNavbar />
      <div className="flex-1 flex items-start justify-center p-4 sm:p-6">
        <Card className="w-full max-w-3xl shadow-xl border-indigo-200/60 dark:border-indigo-900/50 my-4">
          {created ? (
            <>
              <CardHeader className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-emerald-100 p-2 text-emerald-700">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-indigo-900 dark:text-indigo-100">Registration complete</CardTitle>
                    <CardDescription>
                      Your account was created. Sign in with <strong>{loginEmail}</strong> and your password to manage
                      this institution and request certificates.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg border bg-white/70 dark:bg-slate-950/40 p-4">
                  <InstitutionDetailSummary institution={created} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild>
                    <Link to={`/login?redirect=${encodeURIComponent("/my-institutions")}`}>Sign in</Link>
                  </Button>
                  <Button variant="outline" onClick={() => setCreated(null)}>
                    Register another institution
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-indigo-100 p-2.5 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-indigo-900 dark:text-indigo-100">
                      Register a Majlis institution(Masjid, Madrasah, Markaz)
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Create your account and submit full mosque, madrasah, or markaz details. After registration you
                      can sign in to manage the record and request recognition certificates.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4 flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  Include the official name, area (Kare), status, photo, and type-specific information so the registry
                  is complete.
                </p>
                <InstitutionRegistrationForm
                  variant="public"
                  onSubmit={async (data) => {
                    await registerMutation.mutateAsync(data);
                  }}
                  isSubmitting={registerMutation.isPending}
                />
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
