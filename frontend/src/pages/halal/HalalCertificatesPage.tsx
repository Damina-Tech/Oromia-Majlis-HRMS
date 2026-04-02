"use client";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Award, ArrowLeft, ExternalLink, RefreshCw, Download, Calendar } from "lucide-react";
import { halalApi, type HalalCertificate, type HalalCertificateStatus } from "@/services/halal";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const STATUS_COLORS: Record<HalalCertificateStatus, string> = {
  VALID: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200",
  EXPIRED: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200",
  REVOKED: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200",
  SUSPENDED: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
};

export default function HalalCertificatesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [renewalCert, setRenewalCert] = useState<HalalCertificate | null>(null);
  const [newExpiry, setNewExpiry] = useState("");

  const isStaff = hasPermission("halal.admin") || hasPermission("halal.supervisor") || hasPermission("halal.renew");

  const { data, isLoading } = useQuery({
    queryKey: ["halal-certificates", statusFilter],
    queryFn: () =>
      halalApi.certificates.list({
        limit: 100,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
      }),
  });

  const renewalMutation = useMutation({
    mutationFn: (payload: { certificateId: string; newExpiry: string }) =>
      halalApi.renewals.create(payload),
    onSuccess: () => {
      toast.success("Renewal request submitted successfully");
      queryClient.invalidateQueries({ queryKey: ["halal-certificates"] });
      setRenewalCert(null);
      setNewExpiry("");
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message ?? "Failed to submit renewal");
    },
  });

  const handleRenewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewalCert || !newExpiry) return;
    renewalMutation.mutate({
      certificateId: renewalCert.certificateId,
      newExpiry: new Date(newExpiry).toISOString(),
    });
  };

  const openRenewalModal = (cert: HalalCertificate) => {
    setRenewalCert(cert);
    setNewExpiry("");
  };

  const certificates = data?.items ?? [];

  if (isLoading)
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    );

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent dark:from-emerald-600/20 dark:via-teal-600/10 border border-emerald-200/50 dark:border-emerald-800/30 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/halal/dashboard")}
              className="self-start text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                {isStaff ? "All Certificates" : "My Certificates"}
              </h1>
              <p className="text-emerald-700/80 dark:text-emerald-300/80 text-sm mt-1">
                {isStaff
                  ? "View and manage all issued Halal certificates"
                  : "View your issued Halal certificates"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Certificates card */}
      <Card className="shadow-sm border-emerald-200/50 dark:border-emerald-900/30 overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
                <Award className="h-5 w-5 text-emerald-600" /> Certificates
              </CardTitle>
              <CardDescription>View, verify, and download Halal certificates</CardDescription>
            </div>
            {isStaff && (
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All status</SelectItem>
                  <SelectItem value="VALID">Valid</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                  <SelectItem value="REVOKED">Revoked</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {certificates.length === 0 ? (
            <div className="py-12 text-center">
              <Award className="h-16 w-16 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground font-medium">No certificates yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                {isStaff
                  ? "Certificates will appear here when applications are approved."
                  : "Your approved applications will show certificates here."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {certificates.map((c) => (
                <div
                  key={c.id}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-900/20 hover:border-emerald-300/60 dark:hover:border-emerald-700/40 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/10 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-mono font-semibold text-emerald-800 dark:text-emerald-200">
                        {c.certificateId}
                      </p>
                      <Badge className={STATUS_COLORS[c.status] ?? "bg-slate-500"}>
                        {c.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {c.application?.business?.name ?? "—"}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Issued: {new Date(c.issuedAt).toLocaleDateString()}
                      </span>
                      <span>
                        Expires: {new Date(c.expiresAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {c.pdfUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-emerald-300 dark:border-emerald-700"
                        onClick={() => halalApi.certificates.download(c.id, c.certificateId)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => halalApi.certificates.openInNewTab(c.id)}
                      className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    {c.status === "VALID" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-amber-600 border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                        onClick={() => openRenewalModal(c)}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Request renewal
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Renewal modal */}
      <Dialog open={!!renewalCert} onOpenChange={() => !renewalMutation.isPending && setRenewalCert(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" /> Request renewal
            </DialogTitle>
            <DialogDescription>
              {renewalCert && (
                <>
                  Certificate <span className="font-mono font-medium">{renewalCert.certificateId}</span>
                  {renewalCert.application?.business?.name && (
                    <> — {renewalCert.application.business.name}</>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRenewSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newExpiry">New expiry date</Label>
              <Input
                id="newExpiry"
                type="date"
                value={newExpiry}
                onChange={(e) => setNewExpiry(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRenewalCert(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={renewalMutation.isPending || !newExpiry}
              >
                {renewalMutation.isPending ? "Submitting…" : "Submit renewal"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
