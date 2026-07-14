"use client";

import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Search, ShieldCheck, XCircle } from "lucide-react";
import {
  publicCertificateVerifyPath,
  verifyCertificatePublic,
  type UnifiedCertificateVerifyResult,
} from "@/services/certificates";

function statusBadgeClass(status: UnifiedCertificateVerifyResult["status"]) {
  switch (status) {
    case "Verified":
      return "bg-emerald-100 text-emerald-900 border-emerald-200";
    case "Expired":
      return "bg-amber-100 text-amber-950 border-amber-200";
    case "Invalid":
      return "bg-red-100 text-red-900 border-red-200";
    default:
      return "bg-slate-100 text-slate-800 border-slate-200";
  }
}

function StatusIcon({ status }: { status: UnifiedCertificateVerifyResult["status"] }) {
  if (status === "Verified") return <CheckCircle className="h-10 w-10 text-emerald-600" />;
  if (status === "Expired") return <AlertCircle className="h-10 w-10 text-amber-600" />;
  return <XCircle className="h-10 w-10 text-red-600" />;
}

export default function VerifyCertificatePage() {
  const { code: urlCode } = useParams<{ code?: string }>();
  const navigate = useNavigate();
  const [input, setInput] = useState(urlCode ? decodeURIComponent(urlCode) : "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UnifiedCertificateVerifyResult | null>(null);

  const runVerify = async (raw: string) => {
    const code = raw.trim();
    if (!code) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await verifyCertificatePublic(code);
      setResult(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!urlCode) {
      setResult(null);
      return;
    }
    const decoded = decodeURIComponent(urlCode);
    setInput(decoded);
    void runVerify(decoded);
  }, [urlCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = input.trim();
    if (!code) return;
    if (urlCode && decodeURIComponent(urlCode) === code) {
      void runVerify(code);
      return;
    }
    navigate(publicCertificateVerifyPath(code));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-slate-50 via-emerald-50/40 to-teal-50/30">
      <Card className="w-full max-w-lg shadow-xl border-emerald-100/80">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">Certificate Verification</CardTitle>
          <CardDescription>
            Scan a certificate QR code or enter the certificate code to verify authenticity against Oromia Majlis records.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="certificate-code">Certificate code</Label>
              <div className="flex gap-2">
                <Input
                  id="certificate-code"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="e.g. HAL-2026-0001, MAJ-2026-0001, IRR-2026-00001"
                  className="font-mono"
                  autoComplete="off"
                />
                <Button type="submit" disabled={loading || !input.trim()} className="bg-emerald-700 hover:bg-emerald-800">
                  <Search className="h-4 w-4 mr-1.5" />
                  {loading ? "…" : "Verify"}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Supports Membership, Institution Recognition, Halal, Halal Product, and Halal Competency certificates.
            </p>
          </form>

          {loading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-10 w-10 border-2 border-emerald-600 border-t-transparent rounded-full" />
            </div>
          )}

          {!loading && result && (
            <div className="space-y-4 rounded-xl border bg-white/80 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <StatusIcon status={result.status} />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-base">{result.status}</p>
                    <Badge variant="outline" className={`text-xs border ${statusBadgeClass(result.status)}`}>
                      {result.status}
                    </Badge>
                  </div>
                  {result.typeLabel && (
                    <p className="text-sm text-muted-foreground">{result.typeLabel}</p>
                  )}
                  {result.message && !result.found && (
                    <p className="text-sm text-muted-foreground">{result.message}</p>
                  )}
                </div>
              </div>

              {result.found && (
                <dl className="grid gap-2.5 text-sm border-t pt-3">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground shrink-0">Certificate code</dt>
                    <dd className="font-mono font-medium text-right break-all">{result.certificateCode}</dd>
                  </div>
                  {result.subjectName && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground shrink-0">Name</dt>
                      <dd className="font-medium text-right">{result.subjectName}</dd>
                    </div>
                  )}
                  {result.fields
                    .filter((f) => !result.subjectName || f.value !== result.subjectName)
                    .map((f) => (
                    <div key={f.label} className="flex justify-between gap-4">
                      <dt className="text-muted-foreground shrink-0">{f.label}</dt>
                      <dd className="text-right">{f.value}</dd>
                    </div>
                  ))}
                  {result.issuedAt && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground shrink-0">Issued</dt>
                      <dd>{new Date(result.issuedAt).toLocaleDateString(undefined, { dateStyle: "medium" })}</dd>
                    </div>
                  )}
                  {result.expiresAt && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground shrink-0">Valid until</dt>
                      <dd>{new Date(result.expiresAt).toLocaleDateString(undefined, { dateStyle: "medium" })}</dd>
                    </div>
                  )}
                  {result.verifiedAt && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground shrink-0">Checked at</dt>
                      <dd className="text-right text-xs">
                        {new Date(result.verifiedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                      </dd>
                    </div>
                  )}
                </dl>
              )}
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground">
            <Link to="/login" className="underline underline-offset-2 hover:text-foreground">
              Sign in
            </Link>{" "}
            for staff access
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
