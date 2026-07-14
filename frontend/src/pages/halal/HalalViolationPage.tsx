"use client";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, AlertTriangle, PlusCircle, FileWarning } from "lucide-react";
import { halalApi, type HalalViolation } from "@/services/halal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const SEVERITIES = ["MINOR", "MAJOR", "CRITICAL"] as const;
const ACTIONS = ["WARNING", "SUSPENSION", "REVOCATION"] as const;

const SEVERITY_STYLES: Record<string, string> = {
  MINOR: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200",
  MAJOR: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200",
  CRITICAL: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200",
};

const ACTION_STYLES: Record<string, string> = {
  WARNING: "bg-amber-100 text-amber-800 dark:bg-amber-900/50",
  SUSPENSION: "bg-orange-100 text-orange-800 dark:bg-orange-900/50",
  REVOCATION: "bg-red-100 text-red-800 dark:bg-red-900/50",
};

export default function HalalViolationPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [certificateId, setCertificateId] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<string>("");
  const [action, setAction] = useState<string>("");

  const { data: violationsData, isLoading } = useQuery({
    queryKey: ["halal-violations"],
    queryFn: () => halalApi.violations.list({ limit: 100 }),
  });
  const violations = violationsData?.items ?? [];

  const { data: certs } = useQuery({
    queryKey: ["halal-certificates-violation"],
    queryFn: () => halalApi.certificates.list({ limit: 100 }),
    enabled: recordModalOpen,
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
      queryClient.invalidateQueries({ queryKey: ["halal-violations"] });
      queryClient.invalidateQueries({ queryKey: ["halal-certificates"] });
      setRecordModalOpen(false);
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

  const formatDate = (d: string) =>
    new Date(d).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-rose-500/10 via-red-500/5 to-transparent dark:from-rose-600/20 dark:via-red-600/10 border border-rose-200/50 dark:border-rose-800/30 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/halal/apply")}
              className="self-start text-rose-800 dark:text-rose-200 hover:bg-rose-100 dark:hover:bg-rose-900/40"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-rose-900 dark:text-rose-100">
                Violations
              </h1>
              <p className="text-rose-700/80 dark:text-rose-300/80 text-sm mt-1">
                View and record Halal certificate violations
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setRecordModalOpen(true)}
            className="bg-rose-600 hover:bg-rose-700"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Record violation
          </Button>
        </div>
      </div>

      {/* Violations list */}
      <Card className="shadow-sm border-rose-200/50 dark:border-rose-900/30 overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-rose-800 dark:text-rose-200">
            <AlertTriangle className="h-5 w-5 text-rose-600" /> Recorded violations
          </CardTitle>
          <CardDescription>
            All violations reported against Halal certificates. Use Record violation to add a new one.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-rose-600 border-t-transparent" />
            </div>
          ) : violations.length === 0 ? (
            <div className="p-12 text-center">
              <FileWarning className="h-14 w-14 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground font-medium">No violations yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Record a violation when a certificate holder breaches Halal standards.
              </p>
              <Button
                className="mt-4 bg-rose-600 hover:bg-rose-700"
                onClick={() => setRecordModalOpen(true)}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Record violation
              </Button>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Certificate</TableHead>
                      <TableHead>Business</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Recorded</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {violations.map((v: HalalViolation) => (
                      <TableRow key={v.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">
                          {v.certificate?.certificateId ?? v.certificateId}
                        </TableCell>
                        <TableCell>
                          {v.certificate?.application?.business?.name ?? "—"}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate" title={v.description}>
                          {v.description}
                        </TableCell>
                        <TableCell>
                          <Badge className={SEVERITY_STYLES[v.severity] ?? ""}>
                            {v.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {v.action ? (
                            <Badge className={ACTION_STYLES[v.action] ?? ""}>
                              {v.action}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(v.recordedAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="md:hidden divide-y">
                {violations.map((v: HalalViolation) => (
                  <div key={v.id} className="p-4 hover:bg-muted/30">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <p className="font-medium">
                          {v.certificate?.certificateId ?? v.certificateId} — {v.certificate?.application?.business?.name ?? "—"}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {v.description}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          <Badge className={SEVERITY_STYLES[v.severity] ?? ""}>
                            {v.severity}
                          </Badge>
                          {v.action && (
                            <Badge className={ACTION_STYLES[v.action] ?? ""}>
                              {v.action}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDate(v.recordedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Record violation modal */}
      <Dialog open={recordModalOpen} onOpenChange={setRecordModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-600" /> Record violation
            </DialogTitle>
            <DialogDescription>
              Select the certificate and describe the violation. Optionally set an action.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="certificate">Certificate *</Label>
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

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setRecordModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  violationMutation.isPending ||
                  !certificateId ||
                  !description.trim() ||
                  !severity
                }
                variant="destructive"
                className="bg-rose-600 hover:bg-rose-700"
              >
                {violationMutation.isPending ? "Recording…" : "Record violation"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
