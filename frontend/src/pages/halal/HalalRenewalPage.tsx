"use client";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { halalApi } from "@/services/halal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function HalalRenewalPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [certificateId, setCertificateId] = useState("");
  const [newExpiry, setNewExpiry] = useState("");

  const { data: certs } = useQuery({
    queryKey: ["halal-certificates-renewal"],
    queryFn: () => halalApi.certificates.list({ limit: 100, status: "VALID" }),
  });
  const validCerts = certs?.items?.filter((c) => c.status === "VALID") ?? [];

  const renewalMutation = useMutation({
    mutationFn: (data: { certificateId: string; newExpiry: string }) =>
      halalApi.renewals.create(data),
    onSuccess: () => {
      toast.success("Renewal request submitted successfully");
      queryClient.invalidateQueries({ queryKey: ["halal-certificates"] });
      setCertificateId("");
      setNewExpiry("");
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message ?? "Failed to submit renewal");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certificateId || !newExpiry) {
      toast.error("Please select a certificate and enter the new expiry date");
      return;
    }
    const isoExpiry = new Date(newExpiry).toISOString();
    renewalMutation.mutate({ certificateId, newExpiry: isoExpiry });
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/halal/certificates")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Certificate Renewal</h1>
          <p className="text-muted-foreground text-sm">
            Request renewal for an existing Halal certificate
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" /> Submit renewal
          </CardTitle>
          <CardDescription>
            Select a valid certificate and specify the new expiry date.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="certificate">Certificate</Label>
              <Select
                value={certificateId}
                onValueChange={setCertificateId}
              >
                <SelectTrigger id="certificate" className="w-full">
                  <SelectValue placeholder="Select certificate" />
                </SelectTrigger>
                <SelectContent>
                  {validCerts.map((c) => (
                    <SelectItem key={c.id} value={c.certificateId}>
                      {c.certificateId} — {c.application?.business?.name ?? "—"} (expires{" "}
                      {new Date(c.expiresAt).toLocaleDateString()})
                    </SelectItem>
                  ))}
                  {validCerts.length === 0 && (
                    <SelectItem value="_none" disabled>
                      No valid certificates to renew
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newExpiry">New expiry date</Label>
              <Input
                id="newExpiry"
                type="date"
                value={newExpiry}
                onChange={(e) => setNewExpiry(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            <Button
              type="submit"
              disabled={renewalMutation.isPending || !certificateId || !newExpiry}
              className="w-full sm:w-auto"
            >
              {renewalMutation.isPending ? "Submitting…" : "Submit renewal"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
