"use client";
import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, ArrowLeft, ExternalLink } from "lucide-react";
import { halalApi } from "@/services/halal";
import { useQuery } from "@tanstack/react-query";

export default function HalalCertificatesPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["halal-certificates"],
    queryFn: () => halalApi.certificates.list({ limit: 50 }),
  });

  if (isLoading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/halal/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">My Certificates</h1>
            <p className="text-muted-foreground text-sm">Issued Halal certificates</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/halal/renew")}>
          Request renewal
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Award className="h-5 w-5" /> Certificates</CardTitle>
          <CardDescription>View and verify your Halal certificates</CardDescription>
        </CardHeader>
        <CardContent>
          {data?.items?.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">No certificates yet.</p>
          ) : (
            <div className="space-y-3">
              {data?.items?.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div>
                    <p className="font-mono font-medium">{c.certificateId}</p>
                    <p className="text-sm text-muted-foreground">{c.application?.business?.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      Issued: {new Date(c.issuedAt).toLocaleDateString()} • Expires: {new Date(c.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={c.status === "VALID" ? "default" : "secondary"}>{c.status}</Badge>
                    {c.pdfUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => halalApi.certificates.download(c.id, c.certificateId)}
                      >
                        Download PDF
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(`/verify/halal/${c.certificateId}`, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
