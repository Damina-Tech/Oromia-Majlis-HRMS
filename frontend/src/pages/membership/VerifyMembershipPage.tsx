"use client";
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, Search } from "lucide-react";
import { membershipApi } from "@/services/membership";
import { useQuery } from "@tanstack/react-query";

export default function VerifyMembershipPage() {
  const { certificateId } = useParams<{ certificateId?: string }>();
  const [inputId, setInputId] = useState(certificateId ?? "");

  const effectiveId = inputId || certificateId;
  const { data, isLoading, refetch, isFetching, isError } = useQuery({
    queryKey: ["verify-membership", effectiveId],
    queryFn: () => membershipApi.certificates.verify(effectiveId!),
    enabled: !!effectiveId,
    retry: false,
  });

  const notFound = effectiveId && (isError || (!isLoading && !isFetching && !data));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" /> Verify Membership Certificate
          </CardTitle>
          <CardDescription>
            Enter the certificate ID (e.g. MAJ-2025-0001) to verify membership status.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!certificateId && (
            <div className="flex gap-2">
              <Input
                placeholder="Certificate ID"
                value={inputId}
                onChange={(e) => setInputId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && refetch()}
              />
              <Button onClick={() => refetch()} disabled={!inputId || isFetching}>
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
            </div>
          ) : data ? (
            <div className="space-y-4 border rounded-lg p-4">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                {data.valid ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5 text-amber-600" />}
                <span className="font-medium">{data.valid ? "Valid certificate" : "Expired"}</span>
              </div>
              <dl className="grid gap-2 text-sm">
                <div><dt className="text-muted-foreground">Certificate ID</dt><dd className="font-medium">{data.certificateId}</dd></div>
                <div><dt className="text-muted-foreground">Name</dt><dd>{data.fullName}</dd></div>
                <div><dt className="text-muted-foreground">Category</dt><dd>{data.category?.replace(/_/g, " ")}</dd></div>
                <div><dt className="text-muted-foreground">Valid until</dt><dd>{data.expiresAt && new Date(data.expiresAt).toLocaleDateString()}</dd></div>
              </dl>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
