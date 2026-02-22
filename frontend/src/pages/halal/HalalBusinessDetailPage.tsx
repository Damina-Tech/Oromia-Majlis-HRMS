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
  Mail,
  Phone,
  User,
  Loader2,
  CheckCircle2,
  Calendar,
  Globe,
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
  const bizStatus = biz.status ?? "PENDING_APPROVAL";
  const canApply = !activeApplication && bizStatus === "APPROVED";
  const locationParts = [biz.region?.name, biz.zone?.name, biz.woreda?.name, biz.kebeleName].filter(Boolean);
  const locationStr = locationParts.length > 0 ? locationParts.join(", ") : null;
  const lat = typeof biz.latitude === "number" ? biz.latitude : Number(biz.latitude);
  const lng = typeof biz.longitude === "number" ? biz.longitude : Number(biz.longitude);
  const hasValidCoords = !isNaN(lat) && !isNaN(lng);

  const InfoItem = ({
    icon: Icon,
    label,
    value,
    href,
  }: {
    icon: React.ElementType;
    label: string;
    value: React.ReactNode;
    href?: string;
  }) => (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background border">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        {href ? (
          <a href={href} className="font-medium text-primary hover:underline break-all">
            {value}
          </a>
        ) : (
          <p className="font-medium text-foreground">{value}</p>
        )}
      </div>
    </div>
  );

  const formatDate = (d: string | undefined) => (d ? new Date(d).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—");

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent dark:from-emerald-600/20 dark:via-teal-600/10 border border-emerald-200/50 dark:border-emerald-800/30 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/halal/dashboard")} className="shrink-0">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold truncate">{biz.name}</h1>
                <Badge
                  className={
                    bizStatus === "APPROVED"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 shrink-0"
                      : bizStatus === "REJECTED"
                      ? "bg-red-100 text-red-800 dark:bg-red-900/40 shrink-0"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 shrink-0"
                  }
                >
                  {bizStatus === "APPROVED" ? "Approved" : bizStatus === "REJECTED" ? "Rejected" : "Pending Approval"}
                </Badge>
                {isStaff && bizStatus === "PENDING_APPROVAL" && (
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 shrink-0"
                    disabled={approveMutation.isPending}
                    onClick={() => approveMutation.mutate()}
                  >
                    {approveMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                    )}
                    Approve Business
                  </Button>
                )}
              </div>
              <p className="text-muted-foreground text-sm mt-1">
                <span className="font-medium">{biz.category.replace("_", " ")}</span>
                {locationStr && <span> • {locationStr}</span>}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Owner Information */}
      <Card className="shadow-sm border-emerald-200/50 dark:border-emerald-900/30 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 text-base">
            <User className="h-5 w-5 text-emerald-600" />
            Owner Information
          </CardTitle>
          <CardDescription>Legal representative and contact details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoItem icon={User} label="Contact person" value={biz.contactName} />
            <InfoItem icon={Mail} label="Email" value={biz.contactEmail} href={`mailto:${biz.contactEmail}`} />
            <InfoItem icon={Phone} label="Phone" value={biz.contactPhone} />
            {(biz as any).ownerNationalId && (
              <InfoItem icon={FileText} label="National ID / Passport" value={(biz as any).ownerNationalId} />
            )}
            {(biz as any).ownerGender && (
              <InfoItem icon={User} label="Gender" value={(biz as any).ownerGender} />
            )}
            {(biz as any).ownerDateOfBirth && (
              <InfoItem icon={Calendar} label="Date of Birth" value={formatDate((biz as any).ownerDateOfBirth)} />
            )}
            {(biz as any).ownerRole && (
              <InfoItem icon={User} label="Role" value={(biz as any).ownerRole} />
            )}
          </div>
          {(biz as any).ownerHomeAddress && (
            <InfoItem
              icon={MapPin}
              label="Home Address"
              value={(biz as any).ownerHomeAddress}
            />
          )}
          {(biz.createdAt || biz.updatedAt) && (
            <div className="pt-2 border-t space-y-2">
              {biz.createdAt && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span>Registered {formatDate(biz.createdAt)}</span>
                </div>
              )}
              {biz.updatedAt && biz.updatedAt !== biz.createdAt && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span>Last updated {formatDate(biz.updatedAt)}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Business details & documents - two columns */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm border-blue-200/50 dark:border-blue-900/30 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200 text-base">
              <Building2 className="h-5 w-5 text-blue-600" />
              Business & Legal Information
            </CardTitle>
            <CardDescription>Business details and documents</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoItem icon={Building2} label="Business name" value={biz.name} />
            {(biz as any).brandName && (
              <InfoItem icon={Building2} label="Brand / Trade name" value={(biz as any).brandName} />
            )}
            <InfoItem icon={Building2} label="Category" value={biz.category.replace("_", " ")} />
            {(biz as any).yearEstablished && (
              <InfoItem icon={Calendar} label="Year established" value={String((biz as any).yearEstablished)} />
            )}
            {(biz as any).businessType && (
              <InfoItem icon={Building2} label="Business type" value={(biz as any).businessType} />
            )}
            {(biz as any).tinNumber && (
              <InfoItem icon={FileText} label="TIN Number" value={(biz as any).tinNumber} />
            )}
            {biz.licenseUrl && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Business License</p>
                  <a
                    href={resolveFileUrl(biz.licenseUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline inline-flex items-center gap-1"
                  >
                    View document <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            )}
            {((biz as any).documents as { name: string; url: string }[])?.length > 0 && (
              <div className="pt-2 border-t space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Additional documents</p>
                {((biz as any).documents as { name: string; url: string }[]).map((d, i) => (
                  <a
                    key={i}
                    href={resolveFileUrl(d.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    {d.name} <ExternalLink className="h-3 w-3" />
                  </a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location */}
        <Card className="shadow-sm border-emerald-200/50 dark:border-emerald-900/30 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 text-base">
              <MapPin className="h-5 w-5 text-emerald-600" />
              Location
            </CardTitle>
            <CardDescription>Business address and coordinates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {biz.address && (
              <InfoItem
                icon={MapPin}
                label="Address"
                value={
                  <span>
                    {biz.address}
                    {biz.kebeleName && ` • Kebele: ${biz.kebeleName}`}
                  </span>
                }
              />
            )}
            {(biz.region || biz.zone || biz.woreda) && (
              <InfoItem
                icon={Globe}
                label="Administrative area"
                value={
                  [biz.region?.name, biz.zone?.name, biz.woreda?.name].filter(Boolean).join(" → ") || "—"
                }
              />
            )}
            {hasValidCoords && (
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  Coordinates
                </p>
                <p className="font-mono text-sm">{lat.toFixed(6)}, {lng.toFixed(6)}</p>
              </div>
            )}
            {!biz.address && !biz.region && !hasValidCoords && (
              <p className="text-sm text-muted-foreground py-4">No location information provided.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Products & Services - from business */}
      {(() => {
        const productLists = ((biz as any).productList as { name: string; description?: string }[]) || [];
        return productLists.length > 0 ? (
          <Card className="shadow-sm border-violet-200/50 dark:border-violet-900/30 overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-violet-800 dark:text-violet-200 text-base">
                <Package className="h-5 w-5 text-violet-600" />
                Products / Services
              </CardTitle>
              <CardDescription>Products and services declared for Halal certification</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {productLists.map((p, i) => (
                  <div key={i} className="rounded-lg border bg-muted/20 p-3">
                    <p className="font-medium">{p.name}</p>
                    {p.description && (
                      <p className="text-sm text-muted-foreground mt-1">{p.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null;
      })()}

      {/* Declaration & Signature */}
      {((biz as any).declarationSignature || (biz as any).declarationSignedAt) && (
        <Card className="shadow-sm border-amber-200/50 dark:border-amber-900/30 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200 text-base">
              <PenLine className="h-5 w-5 text-amber-600" />
              Declaration & Signature
            </CardTitle>
            <CardDescription>Applicant declaration and digital signature</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(biz as any).declarationSignature && (
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Signed by</p>
                <p className="font-medium">{(biz as any).declarationSignature}</p>
              </div>
            )}
            {(biz as any).declarationSignedAt && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0" />
                <span>Signed on {formatDate((biz as any).declarationSignedAt)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {hasValidCoords && (
        <GoogleMapEmbed
          latitude={lat}
          longitude={lng}
          title={`${biz.name} — Business location`}
          height={320}
          zoom={14}
        />
      )}

      {applications.length > 0 && (
        <Card className="shadow-sm border-blue-200/50 dark:border-blue-900/30 overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <FileText className="h-5 w-5 text-blue-600" />
              Halal certification applications
            </CardTitle>
            <CardDescription>
              {applications.length} application{applications.length !== 1 ? "s" : ""} for this business
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between gap-4 p-4 rounded-lg border border-blue-100 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/20 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 cursor-pointer transition-colors"
                  onClick={() => navigate(`/halal/applications/${app.id}`)}
                >
                  <div className="min-w-0 flex-1">
                    <Badge className={`${APPLICATION_STATUS_COLORS[app.status]} mb-1`}>{app.status}</Badge>
                    {app.submittedAt && (
                      <p className="text-xs text-muted-foreground">
                        Submitted {formatDate(app.submittedAt)}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/halal/applications/${app.id}`)}>
                      View
                    </Button>
                    {canWithdraw(app) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
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

      {/* Action area */}
      <Card className="shadow-sm border-emerald-200/50 dark:border-emerald-900/30 bg-gradient-to-br from-emerald-500/5 to-transparent">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Button
                onClick={() => navigate("/halal/apply/new", { state: { businessId: biz.id } })}
                disabled={!canApply}
                className={canApply ? "bg-emerald-600 hover:bg-emerald-700" : ""}
              >
                <FileText className="h-4 w-4 mr-2" />
                Apply for Halal certification
              </Button>
              {bizStatus !== "APPROVED" && (
                <p className="text-sm text-muted-foreground mt-3">
                  This business is pending admin approval. You can apply for Halal certification only after your business has been approved.
                </p>
              )}
              {canApply === false && bizStatus === "APPROVED" && (
                <p className="text-sm text-muted-foreground mt-3">
                  This business has an active application. Complete or withdraw it before applying again.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

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
