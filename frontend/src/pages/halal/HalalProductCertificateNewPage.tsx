"use client";
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, MapPin, Package, Scale, Sparkles } from "lucide-react";
import {
  halalApi,
  HALAL_PRODUCT_CERTIFICATE_FEE_ETB,
  type HalalCertificate,
} from "@/services/halal";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export default function HalalProductCertificateNewPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [halalCertificateId, setHalalCertificateId] = useState("");
  const [productName, setProductName] = useState("");
  const [productAmount, setProductAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [notes, setNotes] = useState("");

  const { data: certsData, isLoading } = useQuery({
    queryKey: ["halal-certificates", "valid-for-product"],
    queryFn: () => halalApi.certificates.list({ limit: 100, status: "VALID" }),
  });

  const validCerts = useMemo(() => {
    const items = certsData?.items ?? [];
    const now = Date.now();
    return items.filter((c: HalalCertificate) => {
      if (c.status !== "VALID") return false;
      return new Date(c.expiresAt).getTime() > now;
    });
  }, [certsData]);

  const createMutation = useMutation({
    mutationFn: () =>
      halalApi.productCertificates.create({
        halalCertificateId,
        productName: productName.trim(),
        productAmount: productAmount.trim(),
        destination: destination.trim(),
        notes: notes.trim() || undefined,
      }),
    onSuccess: (row) => {
      toast.success("Details saved. Complete payment to issue the product certificate.");
      navigate(`/halal/product-certificates/${row.id}`);
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message ?? "Failed to create request");
    },
  });

  const canSubmit =
    halalCertificateId &&
    productName.trim() &&
    productAmount.trim() &&
    destination.trim() &&
    !createMutation.isPending;

  if (!hasPermission("halal.business")) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <div className="rounded-xl border border-muted bg-muted/20 px-4 py-6 text-center">
          <p className="text-muted-foreground">Only business accounts can request product certificates.</p>
          <Button className="mt-4" variant="outline" onClick={() => navigate("/halal/certificates")}>
            Back to certificates
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-xl mx-auto space-y-6 pb-12">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/halal/certificates")}
        className="text-teal-800 dark:text-teal-200 hover:bg-teal-100/80 dark:hover:bg-teal-950/50 -ml-2"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to certificates
      </Button>

      <div className="relative overflow-hidden rounded-2xl border border-teal-200/50 dark:border-teal-900/40 bg-gradient-to-br from-teal-500/[0.09] via-cyan-500/[0.05] to-transparent dark:from-teal-600/18 dark:via-cyan-900/10 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-600/15 text-teal-700 dark:bg-teal-500/25 dark:text-teal-200">
            <Package className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-semibold text-teal-950 dark:text-teal-50">New product certificate</h1>
              <span className="inline-flex items-center rounded-full border border-teal-300/60 dark:border-teal-700/50 bg-white/50 dark:bg-black/20 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-teal-800 dark:text-teal-200">
                Step 1 of 2
              </span>
            </div>
            <p className="text-sm text-teal-900/75 dark:text-teal-200/75 mt-1.5 flex items-start gap-1.5">
              <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5 opacity-70" />
              Enter shipment details, then pay {HALAL_PRODUCT_CERTIFICATE_FEE_ETB.toLocaleString()} ETB to issue the certificate.
            </p>
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <div className="h-1 flex-1 rounded-full bg-teal-600" />
          <div className="h-1 flex-1 rounded-full bg-teal-600/20 dark:bg-teal-400/20" />
        </div>
      </div>

      <Card className="shadow-sm border-teal-200/50 dark:border-teal-900/40 overflow-hidden">
        <CardHeader className="border-b bg-muted/15 pb-4">
          <CardTitle className="text-base">Request details</CardTitle>
          <CardDescription>
            Link this request to your active business Halal certificate. You need a valid parent certificate before
            requesting a product certificate.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="animate-spin h-9 w-9 border-2 border-teal-600 border-t-transparent rounded-full" />
              <p className="text-sm text-muted-foreground">Loading your certificates…</p>
            </div>
          ) : validCerts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-muted-foreground/25 bg-muted/20 px-4 py-8 text-center">
              <Package className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground font-medium">No valid business certificate</p>
              <p className="text-sm text-muted-foreground/90 mt-2 max-w-sm mx-auto">
                Complete Halal certification for your business first, then return here to request product certificates.
              </p>
            </div>
          ) : (
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                if (!canSubmit) return;
                createMutation.mutate();
              }}
            >
              <div className="rounded-xl border bg-card/50 p-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Business Halal certificate
                  </Label>
                  <Select value={halalCertificateId} onValueChange={setHalalCertificateId}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select your active certificate" />
                    </SelectTrigger>
                    <SelectContent>
                      {validCerts.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.certificateId} — {c.application?.business?.name ?? "Business"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productName" className="flex items-center gap-2">
                    <Package className="h-3.5 w-3.5 text-muted-foreground" />
                    Product name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="productName"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="e.g. Frozen beef cuts"
                    className="h-11"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productAmount" className="flex items-center gap-2">
                    <Scale className="h-3.5 w-3.5 text-muted-foreground" />
                    Amount / quantity <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="productAmount"
                    value={productAmount}
                    onChange={(e) => setProductAmount(e.target.value)}
                    placeholder="e.g. 2,000 kg"
                    className="h-11"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination" className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    Destination <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="destination"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="e.g. Addis Ababa distribution center"
                    className="h-11"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Batch reference, container ID, etc."
                    className="resize-y min-h-[80px]"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full sm:w-auto h-11 px-8 bg-teal-600 hover:bg-teal-700" disabled={!canSubmit}>
                {createMutation.isPending ? "Saving…" : "Continue to payment — step 2"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
