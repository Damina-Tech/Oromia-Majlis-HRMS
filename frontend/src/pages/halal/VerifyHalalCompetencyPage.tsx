"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";
import { verifyHalalCompetencyCertificate } from "@/services/halal";

export default function VerifyHalalCompetencyPage() {
  const { certificateNumber } = useParams<{ certificateNumber: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Awaited<ReturnType<typeof verifyHalalCompetencyCertificate>> | null>(null);

  useEffect(() => {
    if (!certificateNumber) {
      setLoading(false);
      return;
    }
    verifyHalalCompetencyCertificate(certificateNumber)
      .then(setData)
      .catch(() => setData({ valid: false, message: "Verification failed" }))
      .finally(() => setLoading(false));
  }, [certificateNumber]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="animate-spin h-10 w-10 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const ok = data?.valid && data.certificateNumber;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-emerald-50/30">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle>Halal Competency certificate</CardTitle>
          <CardDescription>Public verification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {ok ? (
            <>
              <div className="flex justify-center text-emerald-600">
                <CheckCircle className="h-14 w-14" />
              </div>
              <p className="text-center font-mono font-semibold">{data.certificateNumber}</p>
              <p className="text-sm">
                <span className="text-muted-foreground">Holder:</span> {data.holderName}
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Employer:</span> {data.employerName}
              </p>
              {data.jobTitle && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Role:</span> {data.jobTitle}
                </p>
              )}
              {data.issuedAt && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Issued:</span>{" "}
                  {new Date(data.issuedAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                </p>
              )}
              {data.expiresAt && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Valid until:</span>{" "}
                  {new Date(data.expiresAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                </p>
              )}
              {data.currentlyValid === false && (
                <p className="text-xs text-amber-700">This certificate has expired. Renewal may be required.</p>
              )}
            </>
          ) : (
            <>
              <div className="flex justify-center text-destructive">
                <XCircle className="h-14 w-14" />
              </div>
              <p className="text-center text-sm text-muted-foreground">{data?.message ?? "Certificate not found"}</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
