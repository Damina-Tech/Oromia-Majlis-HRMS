"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { verifyHalalCertificate } from "@/services/halal";

export default function VerifyHalalPage() {
  const { certificateId: urlCertId } = useParams<{ certificateId: string }>();
  const [certificateId, setCertificateId] = useState(urlCertId || "");
  const [result, setResult] = useState<{
    valid: boolean;
    status: string;
    expiresAt: string;
    businessName: string;
    certificateId: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const id = certificateId?.trim() || urlCertId;
    if (!id) {
      setError("Enter certificate ID");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await verifyHalalCertificate(id);
      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Verification failed");
      setResult({ valid: false, status: "NOT_FOUND", expiresAt: "", businessName: "", certificateId: id });
    } finally {
      setLoading(false);
    }
  };

  const showForm = !urlCertId;

  useEffect(() => {
    if (!urlCertId) return;
    setCertificateId(urlCertId);
    setLoading(true);
    setError(null);
    setResult(null);
    verifyHalalCertificate(urlCertId)
      .then(setResult)
      .catch((err) => {
        setError(err.response?.data?.message || "Verification failed");
        setResult({ valid: false, status: "NOT_FOUND", expiresAt: "", businessName: "", certificateId: urlCertId });
      })
      .finally(() => setLoading(false));
  }, [urlCertId]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Halal Certificate Verification</CardTitle>
          <CardDescription>Verify the authenticity of a Halal certificate</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {showForm && (
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <Label>Certificate ID</Label>
                <Input
                  value={certificateId}
                  onChange={(e) => setCertificateId(e.target.value)}
                  placeholder="e.g. HAL-2025-0001"
                  className="font-mono"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Verifying..." : "Verify"}
              </Button>
            </form>
          )}
          {urlCertId && loading && <p className="text-center text-muted-foreground">Verifying...</p>}
          {urlCertId && result && !loading && (
            <Button variant="outline" onClick={() => handleVerify()} className="w-full">Verify again</Button>
          )}

          {result && (
            <div className="space-y-4 rounded-lg border p-4">
              {result.valid ? (
                <div className="flex items-center gap-3 text-green-700">
                  <CheckCircle className="h-10 w-10" />
                  <div>
                    <p className="font-semibold">Valid Certificate</p>
                    <p className="text-sm">This certificate is valid and in good standing.</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-red-700">
                  <XCircle className="h-10 w-10" />
                  <div>
                    <p className="font-semibold">Invalid or Expired</p>
                    <p className="text-sm">Status: {result.status}. This certificate cannot be verified.</p>
                  </div>
                </div>
              )}
              <dl className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Certificate ID</dt>
                  <dd className="font-mono font-medium">{result.certificateId}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Business</dt>
                  <dd>{result.businessName || "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>{result.status}</dd>
                </div>
                {result.expiresAt && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Expires</dt>
                    <dd>{new Date(result.expiresAt).toLocaleDateString()}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-3 text-amber-700 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <AlertCircle className="h-8 w-8" />
              <p>{error}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
