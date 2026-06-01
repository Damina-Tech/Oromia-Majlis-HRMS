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
import {
  ArrowLeft,
  MapPin,
  Package,
  Plane,
  Scale,
  Ship,
  Sparkles,
  User,
} from "lucide-react";
import {
  halalApi,
  HALAL_PRODUCT_CERTIFICATE_FEE_ETB,
  type HalalCertificate,
  type HalalProductCertificateCreateInput,
} from "@/services/halal";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

const DEFAULT_LOADING_PORT = "Addis Ababa Airport";

const initialForm = {
  halalCertificateId: "",
  productName: "",
  consignmentPcs: "",
  netWeightKg: "",
  grossWeightKg: "",
  shipping: "",
  voyageFlightNo: "",
  loadingPort: DEFAULT_LOADING_PORT,
  destination: "",
  slaughteringDate: "",
  productionDate: "",
  expiryDate: "",
  healthCertificateNo: "",
  slaughteringCertificate: "",
  authorizedRepresentative: "",
  notes: "",
};

function isFormComplete(f: typeof initialForm): boolean {
  return Boolean(
    f.halalCertificateId &&
      f.productName.trim() &&
      f.consignmentPcs.trim() &&
      f.netWeightKg.trim() &&
      f.grossWeightKg.trim() &&
      f.shipping.trim() &&
      f.voyageFlightNo.trim() &&
      f.loadingPort.trim() &&
      f.destination.trim() &&
      f.slaughteringDate &&
      f.productionDate &&
      f.expiryDate &&
      f.healthCertificateNo.trim() &&
      f.slaughteringCertificate.trim() &&
      f.authorizedRepresentative.trim()
  );
}

export default function HalalProductCertificateNewPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [form, setForm] = useState(initialForm);

  const set = (key: keyof typeof initialForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

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
    mutationFn: () => {
      const payload: HalalProductCertificateCreateInput = {
        halalCertificateId: form.halalCertificateId,
        productName: form.productName.trim(),
        consignmentPcs: form.consignmentPcs.trim(),
        netWeightKg: form.netWeightKg.trim(),
        grossWeightKg: form.grossWeightKg.trim(),
        shipping: form.shipping.trim(),
        voyageFlightNo: form.voyageFlightNo.trim(),
        loadingPort: form.loadingPort.trim() || DEFAULT_LOADING_PORT,
        destination: form.destination.trim(),
        slaughteringDate: form.slaughteringDate,
        productionDate: form.productionDate,
        expiryDate: form.expiryDate,
        healthCertificateNo: form.healthCertificateNo.trim(),
        slaughteringCertificate: form.slaughteringCertificate.trim(),
        authorizedRepresentative: form.authorizedRepresentative.trim(),
        notes: form.notes.trim() || undefined,
      };
      return halalApi.productCertificates.create(payload);
    },
    onSuccess: (row) => {
      toast.success("Details saved. Complete payment to issue the product certificate.");
      navigate(`/halal/product-certificates/${row.id}`);
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message ?? "Failed to create request");
    },
  });

  const canSubmit = isFormComplete(form) && !createMutation.isPending;

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
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6 pb-12">
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
              Enter consignment and shipment details, then pay {HALAL_PRODUCT_CERTIFICATE_FEE_ETB.toLocaleString()} ETB to
              issue the certificate.
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
            All fields below are required and appear on the issued product Halal certificate (via your active PDF
            template).
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
              className="space-y-6"
              onSubmit={(e) => {
                e.preventDefault();
                if (!canSubmit) return;
                createMutation.mutate();
              }}
            >
              <div className="rounded-xl border bg-card/50 p-4 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Parent certificate</p>
                <div className="space-y-2">
                  <Label>Business Halal certificate</Label>
                  <Select value={form.halalCertificateId} onValueChange={(v) => set("halalCertificateId", v)}>
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
                    value={form.productName}
                    onChange={(e) => set("productName", e.target.value)}
                    placeholder="e.g. Frozen beef cuts"
                    className="h-11"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="consignmentPcs">
                    Consignment details (PCS) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="consignmentPcs"
                    value={form.consignmentPcs}
                    onChange={(e) => set("consignmentPcs", e.target.value)}
                    placeholder="e.g. 240 cartons"
                    className="h-11"
                    required
                  />
                </div>
              </div>

              <div className="rounded-xl border bg-card/50 p-4 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Weights</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="netWeightKg" className="flex items-center gap-2">
                      <Scale className="h-3.5 w-3.5 text-muted-foreground" />
                      Net weight (kg) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="netWeightKg"
                      value={form.netWeightKg}
                      onChange={(e) => set("netWeightKg", e.target.value)}
                      placeholder="e.g. 12000"
                      className="h-11"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="grossWeightKg">
                      Gross weight (kg) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="grossWeightKg"
                      value={form.grossWeightKg}
                      onChange={(e) => set("grossWeightKg", e.target.value)}
                      placeholder="e.g. 12480"
                      className="h-11"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border bg-card/50 p-4 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Shipping & routing</p>
                <div className="space-y-2">
                  <Label htmlFor="shipping" className="flex items-center gap-2">
                    <Ship className="h-3.5 w-3.5 text-muted-foreground" />
                    Shipping <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="shipping"
                    value={form.shipping}
                    onChange={(e) => set("shipping", e.target.value)}
                    placeholder="e.g. Air freight"
                    className="h-11"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="voyageFlightNo" className="flex items-center gap-2">
                    <Plane className="h-3.5 w-3.5 text-muted-foreground" />
                    Voyage / flight no. <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="voyageFlightNo"
                    value={form.voyageFlightNo}
                    onChange={(e) => set("voyageFlightNo", e.target.value)}
                    placeholder="e.g. ET 302"
                    className="h-11"
                    required
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="loadingPort">Loading port <span className="text-destructive">*</span></Label>
                    <Input
                      id="loadingPort"
                      value={form.loadingPort}
                      onChange={(e) => set("loadingPort", e.target.value)}
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
                      value={form.destination}
                      onChange={(e) => set("destination", e.target.value)}
                      placeholder="e.g. Dubai, UAE"
                      className="h-11"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border bg-card/50 p-4 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dates</p>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="slaughteringDate">
                      Slaughtering date <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="slaughteringDate"
                      type="date"
                      value={form.slaughteringDate}
                      onChange={(e) => set("slaughteringDate", e.target.value)}
                      className="h-11"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="productionDate">
                      Production date <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="productionDate"
                      type="date"
                      value={form.productionDate}
                      onChange={(e) => set("productionDate", e.target.value)}
                      className="h-11"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">
                      Expiry date <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="expiryDate"
                      type="date"
                      value={form.expiryDate}
                      onChange={(e) => set("expiryDate", e.target.value)}
                      className="h-11"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border bg-card/50 p-4 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Certificates</p>
                <div className="space-y-2">
                  <Label htmlFor="healthCertificateNo">
                    Health certificate no. <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="healthCertificateNo"
                    value={form.healthCertificateNo}
                    onChange={(e) => set("healthCertificateNo", e.target.value)}
                    className="h-11"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slaughteringCertificate">
                    Slaughtering certificate <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="slaughteringCertificate"
                    value={form.slaughteringCertificate}
                    onChange={(e) => set("slaughteringCertificate", e.target.value)}
                    className="h-11"
                    required
                  />
                </div>
              </div>

              <div className="rounded-xl border bg-card/50 p-4 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Authorization</p>
                <div className="space-y-2">
                  <Label htmlFor="authorizedRepresentative" className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    Authorized representative <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="authorizedRepresentative"
                    value={form.authorizedRepresentative}
                    onChange={(e) => set("authorizedRepresentative", e.target.value)}
                    className="h-11"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Signature and seal images are uploaded once under Documents → Settings (Stamp &amp; Signature tab) and
                  appear on every issued certificate PDF.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  rows={2}
                  placeholder="Batch reference, container ID, etc."
                  className="resize-y min-h-[72px]"
                />
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
