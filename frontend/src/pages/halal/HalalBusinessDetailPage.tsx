"use client";
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Building2,
  FileText,
  MapPin,
  User,
  Loader2,
  CheckCircle2,
  Package,
  PenLine,
  ExternalLink,
} from "lucide-react";
import { halalApi, type HalalBusiness, type HalalApplicationStatus } from "@/services/halal";
import { resolveFileUrl } from "@/config/api";
import GoogleMapEmbed from "@/components/institutions/GoogleMapEmbed";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const APPLICATION_STATUS_COLORS: Record<HalalApplicationStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700 dark:bg-slate-800",
  SUBMITTED: "bg-blue-100 text-blue-800 dark:bg-blue-900/40",
  REVIEW: "bg-amber-100 text-amber-800 dark:bg-amber-900/40",
  INSPECTION: "bg-violet-100 text-violet-800 dark:bg-violet-900/40",
  APPROVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/40",
};

export default function HalalBusinessDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const isStaff = hasPermission("halal.admin") || hasPermission("halal.review");
  const [withdrawId, setWithdrawId] = useState<string | null>(null);

  const { data: business, isLoading } = useQuery({
    queryKey: ["halal-business", id],
    queryFn: () => halalApi.businesses.get(id!),
    enabled: !!id,
  });

  const withdrawMutation = useMutation({
    mutationFn: halalApi.applications.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["halal-business", id] });
      queryClient.invalidateQueries({ queryKey: ["halal-applications"] });
      toast.success("Application withdrawn");
      setWithdrawId(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed to withdraw"),
  });

  const approveMutation = useMutation({
    mutationFn: () => halalApi.businesses.approve(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["halal-business", id] });
      queryClient.invalidateQueries({ queryKey: ["halal-businesses"] });
      toast.success("Business approved. Owner can now apply for Halal certification.");
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed to approve"),
  });

  const canWithdraw = (app: { status: string; feePaidAt?: string | null }) =>
    app.status === "DRAFT" || (app.status === "SUBMITTED" && !app.feePaidAt);

  if (!id || isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!business) return <div className="p-6">Business not found</div>;

  const biz = business as HalalBusiness & { applications?: any[] };
  const applications = biz.applications ?? [];
  const activeApplication = applications.find((a) => a.status !== "REJECTED");
  const hasApprovedApplication = applications.some((a) => a.status === "APPROVED");
  const bizStatus = biz.status ?? "PENDING_APPROVAL";
  const canApply = !activeApplication && bizStatus === "APPROVED";
  const locationParts = [biz.region?.name, biz.zone?.name, biz.woreda?.name, biz.kebeleName].filter(Boolean);
  const locationStr = locationParts.length > 0 ? locationParts.join(", ") : null;
  const lat = typeof biz.latitude === "number" ? biz.latitude : Number(biz.latitude);
  const lng = typeof biz.longitude === "number" ? biz.longitude : Number(biz.longitude);
  const hasValidCoords = !isNaN(lat) && !isNaN(lng);
  const productList = (biz.productList as { name: string; description?: string }[]) ?? [];
  const documents = (biz.documents as { name: string; url: string }[]) ?? [];
  const declarationChecklist = biz.declarationChecklist as
    | { noAlcohol?: boolean; noProhibited?: boolean; majlisCompliance?: boolean; dataAccurate?: boolean }
    | undefined;

  const formatDate = (d: string | undefined) => (d ? new Date(d).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—");

  /** Parse pipe-delimited product description into labeled rows (e.g. "Ingredients: x | Source: y" -> [{ label: "Ingredients", value: "x" }, ...]) */
  function parseProductDescription(description: string): { label: string; value: string }[] {
    if (!description?.trim()) return [];
    const segments = description.split(/\s*\|\s*/).map((s) => s.trim()).filter(Boolean);
    return segments.map((seg) => {
      const colonIdx = seg.indexOf(": ");
      if (colonIdx > 0) {
        return { label: seg.slice(0, colonIdx).trim(), value: seg.slice(colonIdx + 2).trim() };
      }
      return { label: "Category", value: seg };
    });
  }

  const InfoRow = ({
    label,
    value,
    href,
  }: {
    label: string;
    value: React.ReactNode;
    href?: string;
  }) => (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-2 py-2 border-b border-border/50 last:border-0">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider shrink-0 sm:w-36">{label}</span>
      {href ? (
        <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline break-all">
          {value}
        </a>
      ) : (
        <span className="text-sm font-medium text-foreground break-words">{value}</span>
      )}
    </div>
  );

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-5xl mx-auto">
      {/* Compact header */}
      <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent dark:from-emerald-600/20 dark:via-teal-600/10 border border-emerald-200/50 dark:border-emerald-800/30 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/halal/dashboard")} className="shrink-0 -ml-1">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-lg sm:text-xl font-bold truncate min-w-0 flex-1">{biz.name}</h1>
          <Badge
            className={
              bizStatus === "APPROVED"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40"
                : bizStatus === "REJECTED"
                ? "bg-red-100 text-red-800 dark:bg-red-900/40"
                : "bg-amber-100 text-amber-800 dark:bg-amber-900/40"
            }
          >
            {bizStatus === "APPROVED" ? "Approved" : bizStatus === "REJECTED" ? "Rejected" : "Pending"}
          </Badge>
          {isStaff && bizStatus === "PENDING_APPROVAL" && (
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={approveMutation.isPending}
              onClick={() => approveMutation.mutate()}
            >
              {approveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
              Approve
            </Button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm text-muted-foreground">
          <span>{biz.category.replace("_", " ")}</span>
          {locationStr && <span>• {locationStr}</span>}
          {biz.createdAt && <span>• Registered {formatDate(biz.createdAt)}</span>}
          {applications.length > 0 && (
            <span>• {applications.length} application{applications.length !== 1 ? "s" : ""}</span>
          )}
        </div>
      </div>

      {/* Two-column: Owner + Business/Location */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="shadow-sm border-emerald-200/50 dark:border-emerald-900/30 overflow-hidden">
          <CardHeader className="py-3 px-4">
            <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 text-sm font-semibold">
              <User className="h-4 w-4 text-emerald-600" />
              Owner & contact
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <InfoRow label="Contact person" value={biz.contactName} />
            <InfoRow label="Email" value={biz.contactEmail} href={`mailto:${biz.contactEmail}`} />
            <InfoRow label="Phone" value={biz.contactPhone} />
            {biz.ownerNationalId && <InfoRow label="National ID" value={biz.ownerNationalId} />}
            {biz.ownerGender && <InfoRow label="Gender" value={biz.ownerGender} />}
            {biz.ownerDateOfBirth && <InfoRow label="Date of birth" value={formatDate(biz.ownerDateOfBirth)} />}
            {biz.ownerRole && <InfoRow label="Role" value={biz.ownerRole} />}
            {biz.ownerHomeAddress && <InfoRow label="Home address" value={biz.ownerHomeAddress} />}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-blue-200/50 dark:border-blue-900/30 overflow-hidden">
          <CardHeader className="py-3 px-4">
            <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200 text-sm font-semibold">
              <Building2 className="h-4 w-4 text-blue-600" />
              Business & legal
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <InfoRow label="Business name" value={biz.name} />
            {biz.brandName && <InfoRow label="Brand / trade" value={biz.brandName} />}
            <InfoRow label="Category" value={biz.category.replace("_", " ")} />
            {biz.yearEstablished != null && <InfoRow label="Year established" value={String(biz.yearEstablished)} />}
            {biz.businessType && <InfoRow label="Business type" value={biz.businessType} />}
            {biz.tinNumber && <InfoRow label="TIN number" value={biz.tinNumber} />}
          </CardContent>
        </Card>
      </div>

      {/* Location + Documents side by side */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="shadow-sm border-emerald-200/50 dark:border-emerald-900/30 overflow-hidden">
          <CardHeader className="py-3 px-4">
            <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 text-sm font-semibold">
              <MapPin className="h-4 w-4 text-emerald-600" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            {biz.address && (
              <InfoRow
                label="Address"
                value={[biz.address, biz.kebeleName ? `Kebele: ${biz.kebeleName}` : null].filter(Boolean).join(" • ")}
              />
            )}
            {(biz.region || biz.zone || biz.woreda) && (
              <InfoRow
                label="Region / Zone / Woreda"
                value={[biz.region?.name, biz.zone?.name, biz.woreda?.name].filter(Boolean).join(" → ") || "—"}
              />
            )}
            {hasValidCoords && (
              <div className="py-2 border-b border-border/50 last:border-0">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Coordinates</span>
                <p className="text-sm font-mono mt-0.5">{lat.toFixed(6)}, {lng.toFixed(6)}</p>
              </div>
            )}
            {!biz.address && !biz.region && !hasValidCoords && (
              <p className="text-sm text-muted-foreground py-2">No location information.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-blue-200/50 dark:border-blue-900/30 overflow-hidden">
          <CardHeader className="py-3 px-4">
            <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200 text-sm font-semibold">
              <FileText className="h-4 w-4 text-blue-600" />
              Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            {biz.licenseUrl ? (
              <div className="flex items-center justify-between gap-2 py-2 border-b border-border/50">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Business license</span>
                <a
                  href={resolveFileUrl(biz.licenseUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                >
                  View <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            ) : null}
            {documents.length > 0
              ? documents.map((d, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 py-2 border-b border-border/50 last:border-0">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{d.name}</span>
                    <a
                      href={resolveFileUrl(d.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                    >
                      View <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ))
              : !biz.licenseUrl && <p className="text-sm text-muted-foreground py-2">No documents uploaded.</p>}
          </CardContent>
        </Card>
      </div>

      {/* Products + Declaration */}
      <div className="grid gap-5 lg:grid-cols-2">
        {productList.length > 0 && (
          <Card className="shadow-sm border-violet-200/50 dark:border-violet-900/30 overflow-hidden">
            <CardHeader className="py-3 px-4">
              <CardTitle className="flex items-center gap-2 text-violet-800 dark:text-violet-200 text-sm font-semibold">
                <Package className="h-4 w-4 text-violet-600" />
                Products / services
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <ul className="space-y-4">
                {productList.map((p, i) => {
                  const rows = p.description ? parseProductDescription(p.description) : [];
                  return (
                    <li key={i} className="rounded-lg border border-violet-200/50 dark:border-violet-800/30 bg-violet-50/30 dark:bg-violet-950/20 overflow-hidden">
                      <div className="px-3 py-2 border-b border-violet-200/50 dark:border-violet-800/30 bg-violet-100/40 dark:bg-violet-900/30">
                        <p className="font-semibold text-sm text-violet-900 dark:text-violet-100">{p.name}</p>
                      </div>
                      {rows.length > 0 ? (
                        <dl className="px-3 py-2 space-y-1.5">
                          {rows.map((row, j) => (
                            <div key={j} className="flex flex-col sm:flex-row sm:gap-2 gap-0.5">
                              <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider shrink-0 sm:w-28">{row.label}</dt>
                              <dd className="text-sm text-foreground break-words">{row.value}</dd>
                            </div>
                          ))}
                        </dl>
                      ) : (
                        p.description && (
                          <p className="px-3 py-2 text-sm text-muted-foreground">{p.description}</p>
                        )
                      )}
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        )}
        {(biz.declarationSignature || biz.declarationSignedAt || declarationChecklist) && (
          <Card className="shadow-sm border-amber-200/50 dark:border-amber-900/30 overflow-hidden">
            <CardHeader className="py-3 px-4">
              <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200 text-sm font-semibold">
                <PenLine className="h-4 w-4 text-amber-600" />
                Declaration
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0 space-y-3">
              {declarationChecklist && (
                <ul className="space-y-2">
                  {[
                    { key: "noAlcohol", label: "No alcohol or pork used", checked: declarationChecklist.noAlcohol },
                    { key: "noProhibited", label: "No prohibited ingredients used", checked: declarationChecklist.noProhibited },
                    { key: "majlisCompliance", label: "Full compliance with Majlis standards", checked: declarationChecklist.majlisCompliance },
                    { key: "dataAccurate", label: "All submitted data is accurate", checked: declarationChecklist.dataAccurate },
                  ].map((item) => (
                    <li key={item.key} className="flex items-center gap-2 text-sm">
                      {item.checked ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      ) : (
                        <span className="h-4 w-4 rounded-full border-2 border-muted-foreground/50 shrink-0" />
                      )}
                      <span className={item.checked ? "text-foreground" : "text-muted-foreground"}>{item.label}</span>
                    </li>
                  ))}
                </ul>
              )}
              {biz.declarationSignature && (
                <p className="text-sm font-medium pt-1 border-t border-amber-200/50 dark:border-amber-800/30">{biz.declarationSignature}</p>
              )}
              {biz.declarationSignedAt && (
                <p className="text-xs text-muted-foreground">Signed on {formatDate(biz.declarationSignedAt)}</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Timestamps */}
      {(biz.createdAt || biz.updatedAt) && (
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          {biz.createdAt && <span>Registered {formatDate(biz.createdAt)}</span>}
          {biz.updatedAt && biz.updatedAt !== biz.createdAt && <span>Updated {formatDate(biz.updatedAt)}</span>}
        </div>
      )}

      {hasValidCoords && (
        <div className="rounded-lg overflow-hidden border border-border">
          <GoogleMapEmbed
            latitude={lat}
            longitude={lng}
            title={`${biz.name} — Location`}
            height={260}
            zoom={14}
          />
        </div>
      )}

      {applications.length > 0 && (
        <Card className="shadow-sm border-blue-200/50 dark:border-blue-900/30 overflow-hidden">
          <CardHeader className="py-3 px-4">
            <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200 text-sm font-semibold">
              <FileText className="h-4 w-4 text-blue-600" />
              Applications ({applications.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid gap-2 sm:grid-cols-2">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border border-blue-100 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/20 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 cursor-pointer transition-colors"
                  onClick={() => navigate(`/halal/applications/${app.id}`)}
                >
                  <div className="min-w-0 flex-1">
                    <Badge className={`${APPLICATION_STATUS_COLORS[app.status]} text-xs`}>{app.status}</Badge>
                    {app.submittedAt && (
                      <p className="text-xs text-muted-foreground mt-0.5">Submitted {formatDate(app.submittedAt)}</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button variant="outline" size="sm" className="h-8" onClick={() => navigate(`/halal/applications/${app.id}`)}>
                      View
                    </Button>
                    {canWithdraw(app) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-destructive hover:bg-destructive/10"
                        onClick={() => setWithdrawId(app.id)}
                      >
                        Withdraw
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Primary action */}
      {!hasApprovedApplication && (
        <Card className="shadow-sm border-emerald-200/50 dark:border-emerald-900/30 bg-gradient-to-br from-emerald-500/5 to-transparent">
          <CardContent className="py-4 px-4">
            <Button
              onClick={() => navigate("/halal/apply/new", { state: { businessId: biz.id } })}
              disabled={!canApply}
              className={canApply ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            >
              <FileText className="h-4 w-4 mr-2" />
              Apply for Halal certification
            </Button>
            {bizStatus !== "APPROVED" && (
              <p className="text-sm text-muted-foreground mt-2">Apply for Halal only after this business is approved.</p>
            )}
            {!canApply && bizStatus === "APPROVED" && (
              <p className="text-sm text-muted-foreground mt-2">Complete or withdraw the current application first.</p>
            )}
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!withdrawId} onOpenChange={() => !withdrawMutation.isPending && setWithdrawId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw application?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel your application. You can submit a new application later if needed.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={withdrawMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => withdrawId && withdrawMutation.mutate(withdrawId)}
              disabled={withdrawMutation.isPending}
            >
              {withdrawMutation.isPending ? "Withdrawing…" : "Withdraw"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
