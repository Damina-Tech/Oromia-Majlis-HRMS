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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
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
  Factory,
  Users,
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

function formatDate(d: string | undefined): string {
  return d ? new Date(d).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—";
}

export default function HalalBusinessDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const isStaff = hasPermission("halal.admin") || hasPermission("halal.supervisor");
  const isAdmin = hasPermission("halal.admin");
  const isHalalAdmin = hasPermission("halal.admin");
  const isSupervisor = hasPermission("halal.supervisor");
  const [withdrawId, setWithdrawId] = useState<string | null>(null);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [approvalRole, setApprovalRole] = useState<"SUPERVISOR" | "ADMIN" | null>(null);
  const [approvalChecklist, setApprovalChecklist] = useState<Record<string, boolean>>({});
  const [approvalNote, setApprovalNote] = useState("");
  const [detailsConfirmed, setDetailsConfirmed] = useState(false);

  const SUPERVISOR_QUESTIONS = [
    { key: "siteVisited", label: "I conducted on-site review of the business premises." },
    { key: "docsVerified", label: "I verified required documents and business identity." },
    { key: "halalReadiness", label: "I confirm baseline Halal readiness for operations." },
  ] as const;
  const ADMIN_QUESTIONS = [
    { key: "supervisorReviewed", label: "Supervisor review is completed and recorded." },
    { key: "complianceChecked", label: "I checked compliance, policy, and submitted records." },
    { key: "approvalDecision", label: "I approve this business for Halal application access." },
  ] as const;

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
    mutationFn: (data: { role: "SUPERVISOR" | "ADMIN"; checklist: Record<string, boolean>; note?: string; detailsConfirmed: boolean }) =>
      halalApi.businesses.approve(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["halal-business", id] });
      queryClient.invalidateQueries({ queryKey: ["halal-businesses"] });
      toast.success("Business approval step recorded.");
      setApprovalOpen(false);
      setApprovalRole(null);
      setApprovalChecklist({});
      setApprovalNote("");
      setDetailsConfirmed(false);
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed to approve"),
  });

  const canWithdraw = (app: { status: string; feePaidAt?: string | null }) =>
    app.status === "DRAFT" || (app.status === "SUBMITTED" && !app.feePaidAt);

  const openApprovalModal = (role: "SUPERVISOR" | "ADMIN") => {
    setApprovalRole(role);
    const qs = role === "SUPERVISOR" ? SUPERVISOR_QUESTIONS : ADMIN_QUESTIONS;
    setApprovalChecklist(Object.fromEntries(qs.map((q) => [q.key, false])));
    setApprovalNote("");
    setDetailsConfirmed(false);
    setApprovalOpen(true);
  };

  if (!id || isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!business) return <div className="p-6">Business not found</div>;

  const biz = business as HalalBusiness & { applications?: any[] };
  const businessCategoryLabel =
    biz.category === "OTHER"
      ? biz.categoryOther?.trim()
        ? `Other (${biz.categoryOther.trim()})`
        : "Other"
      : biz.category.replace(/_/g, " ");
  const applications = biz.applications ?? [];
  const activeApplication = applications.find((a) =>
    ["DRAFT", "SUBMITTED", "INSPECTION", "REVIEW"].includes(a.status)
  );
  const hasApprovedApplication = applications.some((a) => a.status === "APPROVED");
  const bizStatus = biz.status ?? "PENDING_APPROVAL";
  const canStartCert =
    typeof biz.canStartNewCertificationApplication === "boolean"
      ? biz.canStartNewCertificationApplication
      : !activeApplication && bizStatus === "APPROVED" && !hasApprovedApplication;
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
  const approvalProgress = biz.approvalProgress ?? {
    supervisorApproved: false,
    adminApproved: false,
    approvedBySupervisor: null,
    approvedByAdmin: null,
  };

  const ownersManagersList =
    Array.isArray(biz.ownersManagers) && biz.ownersManagers.length > 0 ? biz.ownersManagers : null;

  /** One row in the product detail list; `certUrl` shows a blue View link after `value`. */
  type ProductDetailRow = { label: string; value: string; certUrl?: string };

  function renderProductDetailValue(row: ProductDetailRow): React.ReactNode {
    const v = row.value?.trim() ?? "";
    const cert = row.certUrl?.trim();
    const certHref =
      cert && (cert.startsWith("/") || cert.startsWith("http://") || cert.startsWith("https://"))
        ? resolveFileUrl(cert)
        : undefined;

    if (certHref) {
      return (
        <span className="inline-flex flex-wrap items-center gap-2">
          <span className="break-words">{v || "—"}</span>
          <a
            href={certHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 shrink-0"
          >
            View <ExternalLink className="h-3 w-3" />
          </a>
        </span>
      );
    }

    // Legacy rows: single line stored as "… certificate" with URL in value
    if (
      /certificate/i.test(row.label) &&
      v &&
      (v.startsWith("/") || v.startsWith("http://") || v.startsWith("https://"))
    ) {
      return (
        <a
          href={resolveFileUrl(v)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
        >
          View <ExternalLink className="h-3 w-3" />
        </a>
      );
    }
    return v || "—";
  }

  /** Parse product description: v2/v3 JSON from registration form, or legacy pipe-delimited text. */
  function parseProductDescription(description: string): ProductDetailRow[] {
    if (!description?.trim()) return [];
    const raw = description.trim();
    if (raw.startsWith("{")) {
      try {
        const j = JSON.parse(raw) as {
          v?: number;
          productCategory?: string;
          productNames?: string[];
          productNamesOther?: string;
          slaughterMethod?: string;
          storageMethod?: string;
          anyIngredients?: boolean;
          ingredientDescription?: string;
          ingredientCertUrl?: string;
          ingredients?: { description?: string; certUrl?: string }[];
          packaging?: boolean;
          packagingDescription?: string;
          packagingCertUrl?: string;
          packagingItems?: { description?: string; certUrl?: string }[];
        };
        if (j?.v === 2 || j?.v === 3) {
          const rows: ProductDetailRow[] = [];
          if (j.productCategory) rows.push({ label: "Product category", value: j.productCategory.replace(/_/g, " ") });
          const names =
            j.productCategory === "OTHER"
              ? (j.productNamesOther || "").trim()
              : (j.productNames || []).filter(Boolean).join(", ");
          if (names) rows.push({ label: "Product names", value: names });
          if (j.slaughterMethod) rows.push({ label: "Slaughter method", value: j.slaughterMethod });
          if (j.storageMethod) rows.push({ label: "Storage method", value: j.storageMethod });
          rows.push({ label: "Any ingredients", value: j.anyIngredients ? "Yes" : "No" });
          if (j.anyIngredients) {
            if (j.v === 3 && Array.isArray(j.ingredients) && j.ingredients.length > 0) {
              j.ingredients.forEach((ing, i) => {
                const desc = (ing?.description ?? "").trim();
                const cert = (ing?.certUrl ?? "").trim();
                if (desc || cert) {
                  rows.push({
                    label: `Ingredient ${i + 1}`,
                    value: desc || "—",
                    certUrl: cert || undefined,
                  });
                }
              });
            } else {
              const desc = (j.ingredientDescription ?? "").trim();
              const cert = (j.ingredientCertUrl ?? "").trim();
              if (desc || cert) {
                rows.push({
                  label: "Ingredient note",
                  value: desc || "—",
                  certUrl: cert || undefined,
                });
              }
            }
          }
          rows.push({ label: "Packaging", value: j.packaging ? "Yes" : "No" });
          if (j.packaging) {
            if (j.v === 3 && Array.isArray(j.packagingItems) && j.packagingItems.length > 0) {
              j.packagingItems.forEach((pkg, i) => {
                const desc = (pkg?.description ?? "").trim();
                const cert = (pkg?.certUrl ?? "").trim();
                if (desc || cert) {
                  rows.push({
                    label: `Packaging ${i + 1}`,
                    value: desc || "—",
                    certUrl: cert || undefined,
                  });
                }
              });
            } else {
              const desc = (j.packagingDescription ?? "").trim();
              const cert = (j.packagingCertUrl ?? "").trim();
              if (desc || cert) {
                rows.push({
                  label: "Packaging description",
                  value: desc || "—",
                  certUrl: cert || undefined,
                });
              }
            }
          }
          return rows;
        }
      } catch {
        /* fall through */
      }
    }
    const segments = raw.split(/\s*\|\s*/).map((s) => s.trim()).filter(Boolean);
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
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm text-muted-foreground">
          <span>{businessCategoryLabel}</span>
          {locationStr && <span>• {locationStr}</span>}
          {biz.createdAt && <span>• Registered {formatDate(biz.createdAt)}</span>}
          {applications.length > 0 && (
            <span>• {applications.length} application{applications.length !== 1 ? "s" : ""}</span>
          )}
        </div>
      </div>

      {/* Owners / managers (full registration list) + primary contact fallback */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="shadow-sm border-emerald-200/50 dark:border-emerald-900/30 overflow-hidden">
          <CardHeader className="py-3 px-4">
            <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 text-sm font-semibold">
              {ownersManagersList ? (
                <Users className="h-4 w-4 text-emerald-600" />
              ) : (
                <User className="h-4 w-4 text-emerald-600" />
              )}
              {ownersManagersList ? "Owners & managers" : "Owner & contact"}
            </CardTitle>
            <CardDescription className="text-xs">
              {ownersManagersList
                ? "Everyone listed on the registration form."
                : "Primary contact on file (legacy or single owner)."}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            {ownersManagersList ? (
              <div className="space-y-4">
                {ownersManagersList.map((o, idx) => (
                  <div
                    key={`${o.email}-${idx}`}
                    className="rounded-lg border border-emerald-200/60 dark:border-emerald-800/40 bg-emerald-50/20 dark:bg-emerald-950/15 p-3 space-y-0"
                  >
                    <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-100 mb-2 pb-2 border-b border-emerald-200/50 dark:border-emerald-800/40">
                      {idx === 0 ? "Primary contact — " : ""}#{idx + 1} {o.fullName || "—"}
                    </p>
                    <InfoRow label="Email" value={o.email || "—"} href={o.email ? `mailto:${o.email}` : undefined} />
                    <InfoRow label="Phone" value={o.phone || "—"} />
                    {o.nationalId != null && String(o.nationalId).trim() !== "" && (
                      <InfoRow label="National ID / Passport" value={o.nationalId} />
                    )}
                    {o.gender != null && String(o.gender).trim() !== "" && <InfoRow label="Gender" value={o.gender} />}
                    {o.dateOfBirth != null && String(o.dateOfBirth).trim() !== "" && (
                      <InfoRow label="Date of birth" value={formatDate(o.dateOfBirth)} />
                    )}
                    {o.role != null && String(o.role).trim() !== "" && <InfoRow label="Role" value={o.role} />}
                    {o.homeAddress != null && String(o.homeAddress).trim() !== "" && (
                      <InfoRow label="Home address" value={o.homeAddress} />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <>
                <InfoRow label="Contact person" value={biz.contactName} />
                <InfoRow label="Email" value={biz.contactEmail} href={`mailto:${biz.contactEmail}`} />
                <InfoRow label="Phone" value={biz.contactPhone} />
                {biz.ownerNationalId && <InfoRow label="National ID" value={biz.ownerNationalId} />}
                {biz.ownerGender && <InfoRow label="Gender" value={biz.ownerGender} />}
                {biz.ownerDateOfBirth && <InfoRow label="Date of birth" value={formatDate(biz.ownerDateOfBirth)} />}
                {biz.ownerRole && <InfoRow label="Role" value={biz.ownerRole} />}
                {biz.ownerHomeAddress && <InfoRow label="Home address" value={biz.ownerHomeAddress} />}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-blue-200/50 dark:border-blue-900/30 overflow-hidden">
          <CardHeader className="py-3 px-4">
            <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200 text-sm font-semibold">
              <Building2 className="h-4 w-4 text-blue-600" />
              Business & legal
            </CardTitle>
            <CardDescription className="text-xs">Details from the registration form.</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <InfoRow label="Business name" value={biz.name} />
            <InfoRow label="Brand / trade name" value={biz.brandName?.trim() ? biz.brandName : "—"} />
            <InfoRow label="Category" value={businessCategoryLabel} />
            <InfoRow
              label="Year established"
              value={biz.yearEstablished != null && !Number.isNaN(Number(biz.yearEstablished)) ? String(biz.yearEstablished) : "—"}
            />
            <InfoRow label="Business type" value={biz.businessType?.trim() ? biz.businessType : "—"} />
            <InfoRow label="TIN number" value={biz.tinNumber?.trim() ? biz.tinNumber : "—"} />
            <InfoRow label="Business phone" value={biz.businessPhone?.trim() ? biz.businessPhone : "—"} />
            <InfoRow
              label="Business email"
              value={biz.businessEmail?.trim() ? biz.businessEmail : "—"}
              href={biz.businessEmail?.trim() ? `mailto:${biz.businessEmail.trim()}` : undefined}
            />
            <InfoRow
              label="Website"
              value={
                biz.businessWebsite?.trim() ? (
                  <a
                    href={biz.businessWebsite.trim().match(/^https?:\/\//i) ? biz.businessWebsite.trim() : `https://${biz.businessWebsite.trim()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline break-all"
                  >
                    {biz.businessWebsite.trim()}
                  </a>
                ) : (
                  "—"
                )
              }
            />
          </CardContent>
        </Card>
      </div>

      {biz.productionSystem ? (
        <Card className="shadow-sm border-sky-200/50 dark:border-sky-900/30 overflow-hidden">
          <CardHeader className="py-3 px-4">
            <CardTitle className="flex items-center gap-2 text-sky-800 dark:text-sky-200 text-sm font-semibold">
              <Factory className="h-4 w-4 text-sky-600" />
              Production system
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 grid gap-0 sm:grid-cols-2">
            <InfoRow
              label="Total company area"
              value={`${biz.productionSystem.totalCompanyAreaSqKm} sq km`}
            />
            <InfoRow
              label="Production area"
              value={`${biz.productionSystem.productionAreaSqKm} sq km`}
            />
            <InfoRow label="Production lines" value={String(biz.productionSystem.numProductionLines)} />
            <InfoRow label="Shifts" value={String(biz.productionSystem.numShifts)} />
            <InfoRow label="Employees" value={String(biz.productionSystem.numEmployees)} />
          </CardContent>
        </Card>
      ) : null}

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
            <InfoRow label="Street / area" value={biz.address?.trim() ? biz.address : "—"} />
            <InfoRow label="Kebele" value={biz.kebeleName?.trim() ? biz.kebeleName : "—"} />
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
            {!biz.address?.trim() && !biz.kebeleName?.trim() && !biz.region && !hasValidCoords && (
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
            <CardDescription className="text-xs">Certificates and IDs submitted with registration (plus license if uploaded).</CardDescription>
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
        <Card className="shadow-sm border-violet-200/50 dark:border-violet-900/30 overflow-hidden">
          <CardHeader className="py-3 px-4">
            <CardTitle className="flex items-center gap-2 text-violet-800 dark:text-violet-200 text-sm font-semibold">
              <Package className="h-4 w-4 text-violet-600" />
              Products / services
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            {productList.length > 0 ? (
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
                              <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider shrink-0 sm:w-36">
                                {row.label}
                              </dt>
                              <dd className="text-sm text-foreground break-words">{renderProductDetailValue(row)}</dd>
                            </div>
                          ))}
                        </dl>
                      ) : (
                        p.description && (
                          <p className="px-3 py-2 text-sm text-muted-foreground">{p.description}</p>
                        )
                      )}
                      {!p.description && rows.length === 0 && (
                        <p className="px-3 py-2 text-sm text-muted-foreground">No detail payload for this line.</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground py-1">No product lines were saved with this registration.</p>
            )}
          </CardContent>
        </Card>
        {(declarationChecklist || biz.declarationSignature || biz.declarationSignedAt) && (
          <Card className="shadow-sm border-amber-200/50 dark:border-amber-900/30 overflow-hidden">
            <CardHeader className="py-3 px-4">
              <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200 text-sm font-semibold">
                <PenLine className="h-4 w-4 text-amber-600" />
                Declaration & signature
              </CardTitle>
              <CardDescription className="text-xs">As submitted on registration.</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0 space-y-3">
              {declarationChecklist ? (
                <ul className="space-y-2">
                  {[
                    { key: "noAlcohol", label: "No alcohol or pork used", checked: !!declarationChecklist.noAlcohol },
                    {
                      key: "noProhibited",
                      label: "No prohibited ingredients used",
                      checked: !!declarationChecklist.noProhibited,
                    },
                    {
                      key: "majlisCompliance",
                      label: "Full compliance with Majlis standards",
                      checked: !!declarationChecklist.majlisCompliance,
                    },
                    { key: "dataAccurate", label: "All submitted data is accurate", checked: !!declarationChecklist.dataAccurate },
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
              ) : (
                <p className="text-sm text-muted-foreground">No declaration checklist stored for this record.</p>
              )}
              {biz.declarationSignature ? (
                <div className="pt-2 border-t border-amber-200/50 dark:border-amber-800/30">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Digital signature</span>
                  <p className="text-sm font-medium mt-1">{biz.declarationSignature}</p>
                </div>
              ) : null}
              {biz.declarationSignedAt ? (
                <p className="text-xs text-muted-foreground">Signed on {formatDate(biz.declarationSignedAt)}</p>
              ) : null}
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
      {bizStatus === "APPROVED" && (
        <Card className="shadow-sm border-emerald-200/50 dark:border-emerald-900/30 bg-gradient-to-br from-emerald-500/5 to-transparent">
          <CardContent className="py-4 px-4">
            <Button
              onClick={() => navigate("/halal/apply/new", { state: { businessId: biz.id } })}
              disabled={!canStartCert}
              className={canStartCert ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            >
              <FileText className="h-4 w-4 mr-2" />
              Apply for Halal certification
            </Button>
            {!canStartCert && activeApplication && (
              <p className="text-sm text-muted-foreground mt-2">Complete or withdraw the current application first.</p>
            )}
            {!canStartCert && !activeApplication && (
              <p className="text-sm text-muted-foreground mt-2">
                This business already has an active Halal certificate within its 3-year cycle. A new certification
                application opens when the cycle ends or for full recertification.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {isHalalAdmin && biz.halalCertificateLifecycle && (
        <Card className="shadow-sm border-violet-200/50 dark:border-violet-900/30 bg-violet-50/20 dark:bg-violet-950/20">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-semibold text-violet-900 dark:text-violet-100">
              Halal certificate cycle (admin)
            </CardTitle>
            <CardDescription>
              One certificate per business: up to two annual renewals per 3-year cycle, then full recertification.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2 text-sm">
            <p className="font-mono text-violet-800 dark:text-violet-200">
              {biz.halalCertificateLifecycle.certificate.certificateId}
            </p>
            <div className="grid sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
              <span>
                Cycle:{" "}
                {new Date(biz.halalCertificateLifecycle.lifecycle.certificationCycleStartedAt).toLocaleDateString()} →{" "}
                {new Date(biz.halalCertificateLifecycle.lifecycle.cycleEndsAt).toLocaleDateString()}
              </span>
              <span>
                Annual renewals used: {biz.halalCertificateLifecycle.lifecycle.annualRenewalsUsed} /{" "}
                {biz.halalCertificateLifecycle.lifecycle.maxAnnualRenewalsPerCycle} (remaining:{" "}
                {biz.halalCertificateLifecycle.lifecycle.annualRenewalsRemaining})
              </span>
            </div>
            {biz.halalCertificateLifecycle.lifecycle.fullRecertificationRequired && (
              <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                Full recertification is required (new application and issuance).
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Approval workflow */}
      <Card className="shadow-sm border-emerald-200/50 dark:border-emerald-900/30 bg-gradient-to-br from-emerald-50/40 via-teal-50/20 to-transparent dark:from-emerald-950/30 dark:via-teal-950/20">
        <CardHeader className="py-4 px-4 border-b border-emerald-200/40 dark:border-emerald-800/40">
          <CardTitle className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
            Business approval workflow
          </CardTitle>
          <CardDescription>
            {bizStatus === "APPROVED"
              ? "Approval completed by Supervisor and Department Head."
              : "Pending approval. Requires both Supervisor and Department Head."}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-4 space-y-4">
          {bizStatus !== "APPROVED" ? (
            <>
              <div className="flex flex-wrap gap-2">
                <Badge
                  className={
                    approvalProgress.supervisorApproved
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                  }
                >
                  Supervisor: {approvalProgress.supervisorApproved ? "Approved" : "Pending"}
                </Badge>
                <Badge
                  className={
                    approvalProgress.adminApproved
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                  }
                >
                  Department Head: {approvalProgress.adminApproved ? "Approved" : "Pending"}
                </Badge>
              </div>
              {isStaff && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-violet-300 text-violet-700 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-300 dark:hover:bg-violet-950/30"
                    disabled={!isSupervisor || approvalProgress.supervisorApproved || approveMutation.isPending}
                    onClick={() => openApprovalModal("SUPERVISOR")}
                  >
                    Supervisor review
                  </Button>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={!isAdmin || approvalProgress.adminApproved || approveMutation.isPending}
                    onClick={() => openApprovalModal("ADMIN")}
                  >
                    Department Head approval
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-2 text-sm rounded-md border border-emerald-200/50 dark:border-emerald-800/40 bg-background/70 p-3">
              {approvalProgress.approvedBySupervisor && (
                <p>
                  <span className="text-muted-foreground">Supervisor:</span>{" "}
                  {approvalProgress.approvedBySupervisor.name} ({approvalProgress.approvedBySupervisor.email}) on{" "}
                  {formatDate(approvalProgress.approvedBySupervisor.at)}
                </p>
              )}
              {approvalProgress.approvedByAdmin && (
                <p>
                  <span className="text-muted-foreground">Department Head:</span>{" "}
                  {approvalProgress.approvedByAdmin.name} ({approvalProgress.approvedByAdmin.email}) on{" "}
                  {formatDate(approvalProgress.approvedByAdmin.at)}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={approvalOpen} onOpenChange={(o) => !approveMutation.isPending && setApprovalOpen(o)}>
        <DialogContent>
          <DialogHeader className="pb-2">
            <DialogTitle className="text-emerald-900 dark:text-emerald-100">
              {approvalRole === "SUPERVISOR" ? "Supervisor on-site review" : "Department Head approval"}
            </DialogTitle>
            <DialogDescription>
              Answer the checklist, confirm business details, then approve this step.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-md border border-emerald-200/50 dark:border-emerald-800/40 bg-emerald-50/30 dark:bg-emerald-950/20 p-3 text-sm space-y-1">
              <p><span className="text-muted-foreground">Business:</span> {biz.name}</p>
              <p><span className="text-muted-foreground">Owner:</span> {biz.contactName}</p>
              <p><span className="text-muted-foreground">Category:</span> {businessCategoryLabel}</p>
              <p><span className="text-muted-foreground">TIN:</span> {biz.tinNumber || "—"}</p>
            </div>
            <div className="space-y-2 rounded-md border border-violet-200/50 dark:border-violet-800/40 bg-violet-50/20 dark:bg-violet-950/20 p-3">
              <p className="text-sm font-medium text-violet-900 dark:text-violet-100">Checklist</p>
              {(approvalRole === "SUPERVISOR" ? SUPERVISOR_QUESTIONS : ADMIN_QUESTIONS).map((q) => (
                <div key={q.key} className="flex items-center gap-2">
                  <Checkbox
                    id={`approval-${q.key}`}
                    checked={!!approvalChecklist[q.key]}
                    onCheckedChange={(v) => setApprovalChecklist((p) => ({ ...p, [q.key]: !!v }))}
                  />
                  <label htmlFor={`approval-${q.key}`} className="text-sm cursor-pointer">{q.label}</label>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Short note (optional)</label>
              <Textarea
                rows={3}
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                placeholder="Add brief observation/approval note..."
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="approval-details-confirmed"
                checked={detailsConfirmed}
                onCheckedChange={(v) => setDetailsConfirmed(!!v)}
              />
              <label htmlFor="approval-details-confirmed" className="text-sm cursor-pointer">
                I confirm the business details above are correct and ready for HC.
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalOpen(false)} disabled={approveMutation.isPending}>
              Cancel
            </Button>
            <Button
              disabled={
                approveMutation.isPending ||
                !approvalRole ||
                !detailsConfirmed ||
                Object.values(approvalChecklist).some((x) => !x)
              }
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() =>
                approvalRole &&
                approveMutation.mutate({
                  role: approvalRole,
                  checklist: approvalChecklist,
                  note: approvalNote || undefined,
                  detailsConfirmed,
                })
              }
            >
              {approveMutation.isPending ? "Approving…" : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
