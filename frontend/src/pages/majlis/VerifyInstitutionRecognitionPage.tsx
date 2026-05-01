"use client";
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, Search, ShieldCheck } from "lucide-react";
import { institutionRecognitionApi } from "@/services/institution-recognition";
import { useQuery } from "@tanstack/react-query";

export default function VerifyInstitutionRecognitionPage() {
  const { certificateNumber } = useParams<{ certificateNumber?: string }>();
  const [inputId, setInputId] = useState(certificateNumber ?? "");

  const effectiveId = (inputId || certificateNumber)?.trim();
  const { data, isLoading, refetch, isFetching, isError, error } = useQuery({
    queryKey: ["verify-institution-recognition", effectiveId],
    queryFn: () => institutionRecognitionApi.verifyPublic(effectiveId!),
    enabled: !!effectiveId,
    retry: false,
  });

  const notFound = effectiveId && (isError || (!isLoading && !isFetching && !data));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" /> Verify institution recognition
          </CardTitle>
          <CardDescription>
            Enter the certificate number (for example IRR-2026-00001) to load live data from Oromia Majlis records.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!certificateNumber && (
            <div className="flex gap-2">
              <Input
                placeholder="Certificate number"
                value={inputId}
                onChange={(e) => setInputId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && refetch()}
              />
              <Button onClick={() => refetch()} disabled={!inputId.trim() || isFetching}>
                Verify
              </Button>
            </div>
          )}
          {isLoading || (effectiveId && isFetching) ? (
            <div className="py-8 text-center text-muted-foreground">Verifying…</div>
          ) : notFound ? (
            <div className="py-6 flex flex-col items-center gap-2 text-destructive">
              <XCircle className="h-12 w-12" />
              <p className="font-medium">Certificate not found</p>
              {error instanceof Error ? <p className="text-sm text-center opacity-90">{error.message}</p> : null}
            </div>
          ) : data ? (
            <div className="space-y-4 border rounded-lg p-4">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                {data.valid ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                <span className="font-medium">{data.valid ? "Recognized institution (live record)" : "Invalid"}</span>
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5" />
                Live verification from Oromia Majlis
              </div>
              <dl className="grid gap-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Certificate number</dt>
                  <dd className="font-medium">{data.certificateNumber}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Institution (registry)</dt>
                  <dd>
                    {data.institution.name}{" "}
                    <span className="text-muted-foreground font-mono text-xs">{data.institution.institutionCode}</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Type</dt>
                  <dd>{data.institution.type}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Name on certificate</dt>
                  <dd>{data.recognition.institutionNameOnCert}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Location on certificate</dt>
                  <dd>
                    {[data.recognition.zoneCityAdmin, data.recognition.districtSubcity, data.recognition.gandaKebele]
                      .filter(Boolean)
                      .join(" · ")}
                  </dd>
                </div>
                {(data.institution.region || data.institution.zone) && (
                  <div>
                    <dt className="text-muted-foreground">Registered geography</dt>
                    <dd>
                      {[data.institution.region, data.institution.zone, data.institution.woreda, data.institution.kebele]
                        .filter(Boolean)
                        .join(", ")}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-muted-foreground">Issue date (form)</dt>
                  <dd>{data.recognition.issueDate && new Date(data.recognition.issueDate).toLocaleDateString()}</dd>
                </div>
                {data.recognition.issuedAt && (
                  <div>
                    <dt className="text-muted-foreground">Issued at</dt>
                    <dd>{new Date(data.recognition.issuedAt).toLocaleString()}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-muted-foreground">Payment</dt>
                  <dd>
                    {data.recognition.paymentMethod ?? "—"} · {data.recognition.amountEtb} ETB
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Registry status</dt>
                  <dd>{data.institution.status}</dd>
                </div>
                {data.verifiedAt && (
                  <div>
                    <dt className="text-muted-foreground">Verified at</dt>
                    <dd>{new Date(data.verifiedAt).toLocaleString()}</dd>
                  </div>
                )}
              </dl>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
