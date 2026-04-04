"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";
import { verifyHalalProductCertificate } from "@/services/halal";

export default function VerifyHalalProductPage() {
  const { certificateNumber } = useParams<{ certificateNumber: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Awaited<ReturnType<typeof verifyHalalProductCertificate>> | null>(null);

  useEffect(() => {
    if (!certificateNumber) {
      setLoading(false);
      return;
    }
    verifyHalalProductCertificate(certificateNumber)
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
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-teal-50/30">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle>Product Halal certificate</CardTitle>
          <CardDescription>Verification (public)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {ok ? (
            <>
              <div className="flex justify-center text-emerald-600">
                <CheckCircle className="h-14 w-14" />
              </div>
              <p className="text-center font-mono font-semibold">{data.certificateNumber}</p>
              <p className="text-sm">
                <span className="text-muted-foreground">Business:</span> {data.businessName}
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Product:</span> {data.productName}
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Amount:</span> {data.productAmount}
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Destination:</span> {data.destination}
              </p>
              {data.parentCertificateValid === false && (
                <p className="text-xs text-amber-700">
                  Note: The parent business Halal certificate may be expired or invalid; confirm with the council.
                </p>
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
