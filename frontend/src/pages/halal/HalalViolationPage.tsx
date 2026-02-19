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
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { halalApi } from "@/services/halal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const SEVERITIES = ["MINOR", "MAJOR", "CRITICAL"] as const;
const ACTIONS = ["WARNING", "SUSPENSION", "REVOCATION"] as const;

export default function HalalViolationPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [certificateId, setCertificateId] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<string>("");
  const [action, setAction] = useState<string>("");

  const { data: certs } = useQuery({
    queryKey: ["halal-certificates-violation"],
    queryFn: () => halalApi.certificates.list({ limit: 100 }),
  });
  const validCerts = certs?.items?.filter((c) => c.status === "VALID" || c.status === "SUSPENDED") ?? [];

  const violationMutation = useMutation({
    mutationFn: (data: {
      certificateId: string;
      description: string;
      severity: string;
      action?: string;
    }) => halalApi.violations.create(data),
    onSuccess: () => {
      toast.success("Violation recorded");
      queryClient.invalidateQueries({ queryKey: ["halal-certificates"] });
      setCertificateId("");
      setDescription("");
      setSeverity("");
      setAction("");
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message ?? "Failed to record violation");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certificateId || !description || !severity) {
      toast.error("Please fill certificate, description, and severity");
      return;
    }
    violationMutation.mutate({
      certificateId,
      description,
      severity,
      action: action && action !== "none" ? action : undefined,
    });
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin/halal/applications")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Record Violation</h1>
          <p className="text-muted-foreground text-sm">
            Report a violation for a Halal certificate
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" /> New violation
          </CardTitle>
          <CardDescription>
            Select the certificate and describe the violation. Optionally set an action.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="certificate">Certificate</Label>
              <Select value={certificateId} onValueChange={setCertificateId}>
                <SelectTrigger id="certificate" className="w-full">
                  <SelectValue placeholder="Select certificate" />
                </SelectTrigger>
                <SelectContent>
                  {validCerts.map((c) => (
                    <SelectItem key={c.id} value={c.certificateId}>
                      {c.certificateId} — {c.application?.business?.name ?? "—"} ({c.status})
                    </SelectItem>
                  ))}
                  {validCerts.length === 0 && (
                    <SelectItem value="_none" disabled>
                      No valid/suspended certificates
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the violation…"
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="severity">Severity *</Label>
              <Select value={severity} onValueChange={setSeverity} required>
                <SelectTrigger id="severity" className="w-full">
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITIES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="action">Action (optional)</Label>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger id="action" className="w-full">
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {ACTIONS.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={
                violationMutation.isPending ||
                !certificateId ||
                !description.trim() ||
                !severity
              }
              variant="destructive"
              className="w-full sm:w-auto"
            >
              {violationMutation.isPending ? "Recording…" : "Record violation"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
