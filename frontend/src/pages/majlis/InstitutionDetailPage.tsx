"use client";
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Building2,
  School,
  BookOpen,
  MapPin,
  Calendar,
  Users,
  Edit,
  ArrowLeft,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Droplets,
  Zap,
  BookMarked,
  FlaskConical,
  Library,
  GraduationCap,
  UserCheck,
  Award,
  Download,
  Loader2,
  CreditCard,
  Banknote,
  Eye,
  RefreshCw,
  Trash2,
} from "lucide-react";
import {
  institutionsApi,
  assignmentsApi,
  type Institution,
  type InstitutionRole,
} from "@/services/institutions";
import {
  institutionRecognitionApi,
  type InstitutionRecognition,
  type PreviewInstitutionRecognitionBody,
  INSTITUTION_RECOGNITION_FEE_ETB,
  INSTITUTION_RECOGNITION_VALIDITY_YEARS,
  recognitionCertificateLifecycle,
  recognitionExpiresAt,
  findActiveRecognition,
  findLatestExpiredRecognition,
  hasPendingRecognition,
} from "@/services/institution-recognition";
import { listTemplates } from "@/services/documents";
import { resolveFileUrl } from "@/config/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { listEmployees, type Employee } from "@/services/employees";
import GoogleMapEmbed from "@/components/institutions/GoogleMapEmbed";
import { MAJLIS_MANUAL_PAYMENT_BANKS } from "@/constants/majlis-banks";

type StatusBadgeConfig = Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className: string }>;

function formatCertDate(value: string | Date): string {
  return new Date(value).toLocaleDateString(undefined, { dateStyle: "medium" });
}

function recognitionLifecycleBadge(rec: InstitutionRecognition) {
  const life = recognitionCertificateLifecycle(rec);
  if (life === "active") {
    return {
      label: "Active",
      className: "bg-emerald-100 text-emerald-900 border-emerald-200",
    };
  }
  if (life === "expired") {
    return {
      label: "Expired — renew eligible",
      className: "bg-rose-100 text-rose-900 border-rose-200",
    };
  }
  if (life === "pending") {
    return {
      label: rec.status.replace(/_/g, " "),
      className:
        rec.status === "MANUAL_PENDING_APPROVAL"
          ? "bg-amber-100 text-amber-900 border-amber-200"
          : "bg-sky-100 text-sky-900 border-sky-200",
    };
  }
  return { label: "Cancelled", className: "" };
}

function openPdfBlob(blob: Blob, filename: string, mode: "download" | "view") {
  const url = URL.createObjectURL(blob);
  if (mode === "view") {
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return;
  }
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function recognitionPreviewBody(
  form: {
    institutionNameOnCert: string;
    zoneCityAdmin: string;
    districtSubcity: string;
    gandaKebele: string;
    issueDate: string;
  }
): PreviewInstitutionRecognitionBody {
  return {
    institutionNameOnCert: form.institutionNameOnCert.trim(),
    zoneCityAdmin: form.zoneCityAdmin.trim(),
    districtSubcity: form.districtSubcity.trim(),
    gandaKebele: form.gandaKebele.trim(),
    issueDate: new Date(form.issueDate).toISOString(),
  };
}

function validateRecognitionForm(form: {
  institutionNameOnCert: string;
  zoneCityAdmin: string;
  districtSubcity: string;
  gandaKebele: string;
  applicantRole: string;
  accurate: boolean;
}): string | null {
  if (!form.institutionNameOnCert.trim()) return "Institution name on certificate is required";
  if (!form.zoneCityAdmin.trim()) return "Zone / city administration is required";
  if (!form.districtSubcity.trim()) return "District / sub-city is required";
  if (!form.gandaKebele.trim()) return "Kebele is required";
  if (!form.applicantRole.trim()) return "Your role in this request is required";
  if (!form.accurate) return "Please confirm that the information is accurate";
  return null;
}

export default function InstitutionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasPermission, isSuperAdmin } = useAuth();
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [recognitionOpen, setRecognitionOpen] = useState(false);
  const [recognitionStep, setRecognitionStep] = useState<1 | 2>(1);
  const [createdRecognitionId, setCreatedRecognitionId] = useState<string | null>(null);
  const [paymentChoice, setPaymentChoice] = useState<"chapa" | "manual">("chapa");
  const [manualFile, setManualFile] = useState<File | null>(null);
  const [manualBankId, setManualBankId] = useState("");
  /** True when the dialog was opened from "Complete payment" (existing PENDING_PAYMENT row). */
  const [recognitionOpenedForPaymentResume, setRecognitionOpenedForPaymentResume] = useState(false);
  const [previewingRecognition, setPreviewingRecognition] = useState(false);
  const [deleteRecognitionTarget, setDeleteRecognitionTarget] = useState<InstitutionRecognition | null>(null);
  const [recognitionForm, setRecognitionForm] = useState({
    institutionNameOnCert: "",
    zoneCityAdmin: "",
    districtSubcity: "",
    gandaKebele: "",
    issueDate: new Date().toISOString().slice(0, 10),
    applicantRole: "",
    communityConsent: "yes" as "yes" | "no",
    accurate: false,
  });

  const canGiveRecognition = hasPermission("majlis.institutions.write");
  const canApproveManual =
    hasPermission("majlis.institutions.approve") || hasPermission("majlis.membership.admin");
  const canDeleteRecognition = canGiveRecognition || canApproveManual || isSuperAdmin();

  /** Resume Chapa or manual payment for an existing recognition (step 2 of the dialog). */
  const openRecognitionPaymentModal = (recognitionId: string) => {
    setRecognitionOpenedForPaymentResume(true);
    setCreatedRecognitionId(recognitionId);
    setRecognitionStep(2);
    setPaymentChoice("chapa");
    setManualBankId("");
    setManualFile(null);
    setRecognitionOpen(true);
  };

  const { data: institution, isLoading, error } = useQuery({
    queryKey: ["institution", id],
    queryFn: () => institutionsApi.get(id!),
    enabled: !!id,
  });

  const { data: assignments } = useQuery({
    queryKey: ["institution-assignments", id],
    queryFn: () => assignmentsApi.list({ institutionId: id }),
    enabled: !!id,
  });

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: () => listEmployees({ page: 1, pageSize: 1000 }),
  });

  const { data: recognitionList } = useQuery({
    queryKey: ["institution-recognitions", id],
    queryFn: () => institutionRecognitionApi.list(id!),
    enabled: !!id,
  });

  const isMosqueInstitution = institution?.type === "MOSQUE";
  const recognitionItems = recognitionList?.items ?? [];
  const activeRecognition = findActiveRecognition(recognitionItems);
  const latestExpiredRecognition = findLatestExpiredRecognition(recognitionItems);
  const pendingRecognitionExists = hasPendingRecognition(recognitionItems);
  const canRenewMosqueCert =
    isMosqueInstitution &&
    !!latestExpiredRecognition &&
    !activeRecognition &&
    !pendingRecognitionExists;
  const mosqueIssueDisabled =
    isMosqueInstitution && (!!activeRecognition || pendingRecognitionExists);
  const mosqueIssueDisabledReason = activeRecognition
    ? `Active certificate ${activeRecognition.certificateNumber ?? ""} is valid until ${formatCertDate(recognitionExpiresAt(activeRecognition))}. Renew after expiry (${INSTITUTION_RECOGNITION_VALIDITY_YEARS}-year validity).`
    : pendingRecognitionExists
      ? "Complete or cancel the pending recognition payment first."
      : undefined;

  const openRecognitionIssueDialog = (mode: "issue" | "renew") => {
    setRecognitionOpenedForPaymentResume(false);
    setRecognitionStep(1);
    setCreatedRecognitionId(null);
    setManualBankId("");
    setManualFile(null);
    const prefillFrom =
      mode === "renew"
        ? latestExpiredRecognition
        : recognitionItems.find((r) => r.status === "COMPLETED") ?? null;
    setRecognitionForm({
      institutionNameOnCert: prefillFrom?.institutionNameOnCert || institution?.name || "",
      zoneCityAdmin: prefillFrom?.zoneCityAdmin || institution?.zone?.name || "",
      districtSubcity: prefillFrom?.districtSubcity || institution?.woreda?.name || "",
      gandaKebele:
        prefillFrom?.gandaKebele || institution?.kebeleName || institution?.kebele?.name || "",
      issueDate: new Date().toISOString().slice(0, 10),
      applicantRole: "",
      communityConsent: "yes",
      accurate: false,
    });
    setRecognitionOpen(true);
  };

  const { data: mosqueTemplateList } = useQuery({
    queryKey: ["mosque-certificate-template"],
    queryFn: () =>
      listTemplates({
        templateEngine: "PDF_CERTIFICATE",
        certificateType: "MOSQUE_INSTITUTION",
        status: "ACTIVE",
        pageSize: 1,
      }),
    enabled: isMosqueInstitution,
  });

  const activeMosqueTemplate = mosqueTemplateList?.items?.[0];

  const createAssignmentMutation = useMutation({
    mutationFn: assignmentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institution-assignments", id] });
      setIsAssignmentDialogOpen(false);
      toast.success("Assignment created successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create assignment");
    },
  });

  const approveAssignmentMutation = useMutation({
    mutationFn: ({ id, approved, rejectionReason }: { id: string; approved: boolean; rejectionReason?: string }) =>
      assignmentsApi.approve(id, { approved, rejectionReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institution-assignments", id] });
      toast.success("Assignment updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update assignment");
    },
  });

  const createRecognitionMutation = useMutation({
    mutationFn: () =>
      institutionRecognitionApi.create(id!, {
        institutionNameOnCert: recognitionForm.institutionNameOnCert.trim(),
        zoneCityAdmin: recognitionForm.zoneCityAdmin.trim(),
        districtSubcity: recognitionForm.districtSubcity.trim(),
        gandaKebele: recognitionForm.gandaKebele.trim(),
        issueDate: new Date(recognitionForm.issueDate).toISOString(),
        questionnaire: {
          applicantRole: recognitionForm.applicantRole.trim(),
          operatingWithCommunityConsent: recognitionForm.communityConsent,
          informationAccurate: recognitionForm.accurate,
        },
      }),
    onSuccess: (row) => {
      setRecognitionOpenedForPaymentResume(false);
      setCreatedRecognitionId(row.id);
      setRecognitionStep(2);
      queryClient.invalidateQueries({ queryKey: ["institution-recognitions", id] });
      toast.success("Proceed to payment");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to start recognition");
    },
  });

  const approveRecognitionManualMutation = useMutation({
    mutationFn: (recognitionId: string) => institutionRecognitionApi.approveManual(recognitionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institution-recognitions", id] });
      toast.success("Manual payment approved. Certificate issued.");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Approval failed");
    },
  });

  const chapaInitMutation = useMutation({
    mutationFn: (recognitionId: string) => institutionRecognitionApi.initChapa(recognitionId),
    onSuccess: ({ checkoutUrl }) => {
      window.location.href = checkoutUrl;
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message;
      const detail =
        msg && typeof msg === "object" && !Array.isArray(msg)
          ? JSON.stringify(msg)
          : typeof msg === "string"
            ? msg
            : null;
      toast.error(detail || "Could not start Chapa checkout");
    },
  });

  const regenerateRecognitionMutation = useMutation({
    mutationFn: (recognitionId: string) => institutionRecognitionApi.regenerate(recognitionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institution-recognitions", id] });
      toast.success("Certificate regenerated with the current mosque template.");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to regenerate certificate");
    },
  });

  const deleteRecognitionMutation = useMutation({
    mutationFn: (recognitionId: string) => institutionRecognitionApi.delete(recognitionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institution-recognitions", id] });
      setDeleteRecognitionTarget(null);
      toast.success("Mosque certificate deleted");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete certificate");
    },
  });

  const manualSubmitMutation = useMutation({
    mutationFn: async () => {
      if (!createdRecognitionId) throw new Error("Missing recognition");
      if (!manualFile) throw new Error("Receipt required");
      const bank = MAJLIS_MANUAL_PAYMENT_BANKS.find((b) => b.id === manualBankId);
      if (!bank) throw new Error("Please select a bank");
      const fd = new FormData();
      fd.append("receipt", manualFile);
      fd.append("bankName", bank.name);
      return institutionRecognitionApi.submitManual(createdRecognitionId, fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institution-recognitions", id] });
      setRecognitionOpen(false);
      setRecognitionStep(1);
      setCreatedRecognitionId(null);
      setManualFile(null);
      setManualBankId("");
      toast.success("Receipt submitted. An approver will confirm payment.");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || "Upload failed");
    },
  });

  useEffect(() => {
    if (!institution) return;
    setRecognitionForm((f) => ({
      ...f,
      institutionNameOnCert: institution.name,
      zoneCityAdmin: institution.zone?.name ?? institution.region?.name ?? "",
      districtSubcity: institution.woreda?.name ?? "",
      gandaKebele: institution.kebeleName || institution.kebele?.name || "",
    }));
  }, [institution?.id, institution?.name, institution?.region?.name, institution?.zone?.name, institution?.woreda?.name, institution?.kebele?.name, institution?.kebeleName]);

  useEffect(() => {
    const success = searchParams.get("recognitionPayment");
    const rid = searchParams.get("recognitionId");
    if (success !== "success" || !rid || !id) return;

    let cancelled = false;
    let tries = 0;
    const poll = async () => {
      while (!cancelled && tries < 30) {
        tries++;
        try {
          const r = await institutionRecognitionApi.get(rid);
          queryClient.invalidateQueries({ queryKey: ["institution-recognitions", id] });
          if (r.status === "COMPLETED") {
            toast.success("Payment confirmed. Recognition certificate is ready.");
            setSearchParams({}, { replace: true });
            return;
          }
        } catch {
          /* ignore */
        }
        await new Promise((res) => setTimeout(res, 2000));
      }
      if (!cancelled) {
        toast.info("Still processing payment — refresh this page in a moment if the certificate does not appear.");
        setSearchParams({}, { replace: true });
      }
    };
    void poll();
    return () => {
      cancelled = true;
    };
  }, [searchParams, id, queryClient, setSearchParams]);

  const handlePreviewRecognition = async () => {
    if (!id || !isMosqueInstitution) return;
    if (
      !recognitionForm.institutionNameOnCert.trim() ||
      !recognitionForm.zoneCityAdmin.trim() ||
      !recognitionForm.districtSubcity.trim() ||
      !recognitionForm.gandaKebele.trim()
    ) {
      toast.error("Fill in all certificate fields before previewing");
      return;
    }
    setPreviewingRecognition(true);
    try {
      const blob = await institutionRecognitionApi.previewBlob(id, recognitionPreviewBody(recognitionForm));
      openPdfBlob(blob, "mosque-recognition-preview.pdf", "view");
    } catch (e: any) {
      const msg = e.response?.data?.message;
      toast.error(typeof msg === "string" ? msg : "Failed to preview certificate");
    } finally {
      setPreviewingRecognition(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "MOSQUE":
        return <Building2 className="h-5 w-5" />;
      case "MADRASAH":
        return <School className="h-5 w-5" />;
      case "MARKAZ":
        return <BookOpen className="h-5 w-5" />;
      default:
        return <Building2 className="h-5 w-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: StatusBadgeConfig = {
      ACTIVE: { variant: "default", className: "bg-green-100 text-green-800 border-green-200" },
      UNDER_CONSTRUCTION: { variant: "secondary", className: "bg-amber-100 text-amber-800 border-amber-200" },
      CLOSED: { variant: "destructive", className: "bg-red-100 text-red-800 border-red-200" },
      SUSPENDED: { variant: "outline", className: "bg-gray-100 text-gray-800 border-gray-200" },
      PENDING_APPROVAL: { variant: "secondary", className: "bg-amber-100 text-amber-800 border-amber-200" },
      ENDED: { variant: "outline", className: "bg-gray-100 text-gray-800 border-gray-200" },
    };
    const config = statusConfig[status] || { variant: "outline" as const, className: "bg-gray-100 text-gray-800 border-gray-200" };
    return <Badge variant={config.variant} className={config.className}>{status.split("_").join(" ")}</Badge>;
  };

  const getRoleBadge = (role: string) => {
    return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{role.split("_").join(" ")}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
        </div>
        <div className="h-80 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (error || !institution) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="rounded-full bg-red-100 p-4 w-fit mx-auto mb-4">
            <Building2 className="h-12 w-12 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Institution not found</h2>
          <p className="text-muted-foreground mb-6">
            The institution you're looking for may have been removed or the link is incorrect.
          </p>
          <Button onClick={() => navigate("/majlis/institutions")} className="bg-blue-600 hover:bg-blue-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Institutions
          </Button>
        </div>
      </div>
    );
  }

  const lat = institution.latitude != null ? Number(institution.latitude) : null;
  const lng = institution.longitude != null ? Number(institution.longitude) : null;
  const assignmentCount = assignments?.items?.length ?? 0;
  const activeCount = assignments?.items?.filter((a) => a.status === "ACTIVE").length ?? 0;

  return (
    <div className="p-6 space-y-6">
      {/* Hero header */}
      <div className="rounded-xl bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 text-white p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/majlis/institutions")}
              className="text-white/90 hover:text-white hover:bg-white/10 -ml-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/15">
                  {getTypeIcon(institution.type)}
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{institution.name}</h1>
                  <p className="text-white/80 font-mono text-sm mt-0.5">{institution.institutionCode}</p>
                </div>
                {getStatusBadge(institution.status)}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 self-start sm:self-center">
            <Dialog
              open={recognitionOpen}
              onOpenChange={(open) => {
                setRecognitionOpen(open);
                if (!open) {
                  setRecognitionStep(1);
                  setCreatedRecognitionId(null);
                  setManualFile(null);
                  setManualBankId("");
                  setPaymentChoice("chapa");
                  setRecognitionOpenedForPaymentResume(false);
                }
              }}
            >
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {isMosqueInstitution
                      ? "Mosque recognition certificate"
                      : "Institution recognition certificate"}
                  </DialogTitle>
                  <DialogDescription>
                    {recognitionStep === 1
                      ? isMosqueInstitution
                        ? "Confirm the details that will be printed on the official ORIASC mosque certificate template."
                        : "Confirm the details that will appear on the certificate and answer the declaration questions."
                      : recognitionOpenedForPaymentResume
                        ? `Complete payment for this request: ${INSTITUTION_RECOGNITION_FEE_ETB.toLocaleString()} ETB via Chapa or manual bank transfer with receipt.`
                        : `Official recognition fee: ${INSTITUTION_RECOGNITION_FEE_ETB.toLocaleString()} ETB. Pay online with Chapa or upload proof of manual bank payment.`}
                  </DialogDescription>
                </DialogHeader>
                {recognitionStep === 1 ? (
                  <div className="space-y-4 py-2">
                    {isMosqueInstitution ? (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 dark:bg-emerald-950/20 p-3 space-y-3">
                        <div className="flex flex-col sm:flex-row gap-3">
                          {activeMosqueTemplate?.sourceFileUrl ? (
                            <img
                              src={resolveFileUrl(activeMosqueTemplate.sourceFileUrl)}
                              alt="Mosque certificate template"
                              className="w-full sm:w-36 h-auto rounded border object-cover shrink-0"
                            />
                          ) : null}
                          <div className="text-sm space-y-1">
                            <p className="font-medium text-emerald-950 dark:text-emerald-100">
                              ORIASC mosque certificate template
                            </p>
                            {activeMosqueTemplate ? (
                              <p className="text-emerald-900/80 dark:text-emerald-200/80">
                                Issued PDFs use <span className="font-mono text-xs">{activeMosqueTemplate.code}</span>{" "}
                                with certificate number, zone, district, kebele, mosque name, date, and verification QR.
                              </p>
                            ) : (
                              <p className="text-amber-800 dark:text-amber-200">
                                No active mosque template found.{" "}
                                <Link to="/documents/templates" className="underline font-medium">
                                  Configure one in Documents
                                </Link>{" "}
                                before issuing.
                              </p>
                            )}
                          </div>
                        </div>
                        {activeMosqueTemplate ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto"
                            disabled={previewingRecognition}
                            onClick={() => void handlePreviewRecognition()}
                          >
                            {previewingRecognition ? (
                              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                            ) : (
                              <Eye className="h-3.5 w-3.5 mr-1.5" />
                            )}
                            Preview certificate
                          </Button>
                        ) : null}
                      </div>
                    ) : null}
                    <div className="space-y-2">
                      <Label htmlFor="ir-name">
                        {isMosqueInstitution ? "Mosque name on certificate" : "Institution name on certificate"}{" "}
                        <span className="text-red-600">*</span>
                      </Label>
                      <Input
                        id="ir-name"
                        value={recognitionForm.institutionNameOnCert}
                        onChange={(e) => setRecognitionForm((f) => ({ ...f, institutionNameOnCert: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ir-zone">
                        Godina / Bulchiinsa magaalaa (Zone / city administration) <span className="text-red-600">*</span>
                      </Label>
                      <Input
                        id="ir-zone"
                        value={recognitionForm.zoneCityAdmin}
                        onChange={(e) => setRecognitionForm((f) => ({ ...f, zoneCityAdmin: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ir-dist">
                        Aanaa / Kutaa magaalaa (District / sub-city) <span className="text-red-600">*</span>
                      </Label>
                      <Input
                        id="ir-dist"
                        value={recognitionForm.districtSubcity}
                        onChange={(e) => setRecognitionForm((f) => ({ ...f, districtSubcity: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ir-keb">
                        Ganda / Kebele <span className="text-red-600">*</span>
                      </Label>
                      <Input
                        id="ir-keb"
                        value={recognitionForm.gandaKebele}
                        onChange={(e) => setRecognitionForm((f) => ({ ...f, gandaKebele: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ir-date">Guyyaa ragaa (Issue date)</Label>
                      <Input
                        id="ir-date"
                        type="date"
                        value={recognitionForm.issueDate}
                        onChange={(e) => setRecognitionForm((f) => ({ ...f, issueDate: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ir-role">
                        Your role in this request <span className="text-red-600">*</span>
                      </Label>
                      <Input
                        id="ir-role"
                        placeholder="e.g. Majlis officer, institution chairperson"
                        value={recognitionForm.applicantRole}
                        onChange={(e) => setRecognitionForm((f) => ({ ...f, applicantRole: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Does the institution operate with community / committee awareness and consent?</Label>
                      <RadioGroup
                        value={recognitionForm.communityConsent}
                        onValueChange={(v) =>
                          setRecognitionForm((f) => ({ ...f, communityConsent: v as "yes" | "no" }))
                        }
                        className="flex gap-4 pt-1"
                      >
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="yes" id="ir-consent-yes" />
                          <Label htmlFor="ir-consent-yes" className="font-normal">
                            Yes
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="no" id="ir-consent-no" />
                          <Label htmlFor="ir-consent-no" className="font-normal">
                            No
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="flex items-start gap-2 rounded-md border p-3 bg-muted/40">
                      <Checkbox
                        id="ir-accurate"
                        checked={recognitionForm.accurate}
                        onCheckedChange={(c) => setRecognitionForm((f) => ({ ...f, accurate: c === true }))}
                      />
                      <Label htmlFor="ir-accurate" className="text-sm font-normal leading-snug cursor-pointer">
                        I confirm that the information provided is true and may be verified by the Majlis.
                      </Label>
                    </div>
                    <Button
                      className="w-full"
                      disabled={createRecognitionMutation.isPending}
                      onClick={() => {
                        const validationError = validateRecognitionForm(recognitionForm);
                        if (validationError) {
                          toast.error(validationError);
                          return;
                        }
                        createRecognitionMutation.mutate();
                      }}
                    >
                      {createRecognitionMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving…
                        </>
                      ) : (
                        "Continue to payment"
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 py-2">
                    <div className="rounded-lg border bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-sm">
                      Amount due: <strong>{INSTITUTION_RECOGNITION_FEE_ETB.toLocaleString()} ETB</strong>
                    </div>
                    <RadioGroup
                      value={paymentChoice}
                      onValueChange={(v) => setPaymentChoice(v as "chapa" | "manual")}
                      className="grid gap-3"
                    >
                      <div className="flex items-center gap-2 rounded-md border p-3">
                        <RadioGroupItem value="chapa" id="pay-chapa" />
                        <Label htmlFor="pay-chapa" className="flex items-center gap-2 font-normal cursor-pointer flex-1">
                          <CreditCard className="h-4 w-4" />
                          Pay with Chapa (card / mobile money)
                        </Label>
                      </div>
                      <div className="flex items-center gap-2 rounded-md border p-3">
                        <RadioGroupItem value="manual" id="pay-manual" />
                        <Label htmlFor="pay-manual" className="flex items-center gap-2 font-normal cursor-pointer flex-1">
                          <Banknote className="h-4 w-4" />
                          Manual bank payment (upload receipt)
                        </Label>
                      </div>
                    </RadioGroup>
                    {paymentChoice === "chapa" ? (
                      <Button
                        className="w-full"
                        disabled={!createdRecognitionId || chapaInitMutation.isPending}
                        onClick={() => createdRecognitionId && chapaInitMutation.mutate(createdRecognitionId)}
                      >
                        {chapaInitMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Redirecting…
                          </>
                        ) : (
                          "Pay with Chapa"
                        )}
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label>Bank you transferred from</Label>
                          <Select value={manualBankId} onValueChange={setManualBankId}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select bank" />
                            </SelectTrigger>
                            <SelectContent>
                              {MAJLIS_MANUAL_PAYMENT_BANKS.map((b) => (
                                <SelectItem key={b.id} value={b.id}>
                                  {b.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {manualBankId ? (
                          <div className="rounded-md border bg-muted/40 p-3 text-sm space-y-1">
                            {(() => {
                              const b = MAJLIS_MANUAL_PAYMENT_BANKS.find((x) => x.id === manualBankId);
                              if (!b) return null;
                              return (
                                <>
                                  <p className="font-medium text-foreground flex items-center gap-1">
                                    <Building2 className="h-4 w-4 shrink-0" /> Transfer to (Majlis)
                                  </p>
                                  <div>
                                    <span className="text-muted-foreground">Account name: </span>
                                    {b.accountName}
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Account number: </span>
                                    <span className="font-mono">{b.accountNumber}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground pt-1">
                                    Reference: institution recognition · {INSTITUTION_RECOGNITION_FEE_ETB.toLocaleString()} ETB
                                  </p>
                                </>
                              );
                            })()}
                          </div>
                        ) : null}
                        <div className="space-y-2">
                          <Label htmlFor="ir-receipt">Payment receipt (PDF or image)</Label>
                          <Input
                            id="ir-receipt"
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(e) => setManualFile(e.target.files?.[0] ?? null)}
                          />
                        </div>
                        <Button
                          className="w-full"
                          disabled={
                            !createdRecognitionId || !manualBankId || !manualFile || manualSubmitMutation.isPending
                          }
                          onClick={() => manualSubmitMutation.mutate()}
                        >
                          {manualSubmitMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Uploading…
                            </>
                          ) : (
                            "Submit receipt for approval"
                          )}
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          An approver with finance permissions must confirm the transfer before the PDF is generated.
                        </p>
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={() => {
                        if (recognitionOpenedForPaymentResume) {
                          setRecognitionOpen(false);
                        } else {
                          setRecognitionStep(1);
                        }
                      }}
                    >
                      {recognitionOpenedForPaymentResume ? "Close" : "Back"}
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
            {canGiveRecognition ? (
              <Button
                onClick={() => openRecognitionIssueDialog(canRenewMosqueCert ? "renew" : "issue")}
                disabled={isMosqueInstitution ? mosqueIssueDisabled && !canRenewMosqueCert : false}
                title={
                  isMosqueInstitution && mosqueIssueDisabled && !canRenewMosqueCert
                    ? mosqueIssueDisabledReason
                    : canRenewMosqueCert
                      ? `Renew recognition for another ${INSTITUTION_RECOGNITION_VALIDITY_YEARS} years`
                      : undefined
                }
                className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg border-0 disabled:opacity-60 disabled:pointer-events-auto"
              >
                <Award className="h-4 w-4 mr-2" />
                {isMosqueInstitution
                  ? canRenewMosqueCert
                    ? "Renew mosque recognition"
                    : "Issue mosque recognition"
                  : "Give Recognition"}
              </Button>
            ) : null}
            <Button
              onClick={() => navigate(`/majlis/institutions/${id}/edit`)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg border-0"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-gray-200 overflow-hidden">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="rounded-lg bg-blue-100 p-3">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{assignmentCount}</p>
              <p className="text-sm text-muted-foreground">Total Assignments</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-gray-200 overflow-hidden">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="rounded-lg bg-green-100 p-3">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-gray-200 overflow-hidden">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="rounded-lg bg-amber-100 p-3">
              <Calendar className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{institution.yearEstablished ?? "—"}</p>
              <p className="text-sm text-muted-foreground">Year Established</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-gray-200 overflow-hidden">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="rounded-lg bg-purple-100 p-3">
              {getTypeIcon(institution.type)}
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{institution.type}</p>
              <p className="text-sm text-muted-foreground">Type</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {isMosqueInstitution && canGiveRecognition ? (
        <Card className="shadow-sm border-amber-200/80 overflow-hidden">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-700" />
                Mosque certificate status
              </p>
              {activeRecognition ? (
                <p className="text-sm text-muted-foreground">
                  Active certificate{" "}
                  <span className="font-mono font-medium text-foreground">
                    {activeRecognition.certificateNumber}
                  </span>
                  {" · "}issued {formatCertDate(activeRecognition.issueDate)}
                  {" · "}expires {formatCertDate(recognitionExpiresAt(activeRecognition))}
                  {" · "}valid for {INSTITUTION_RECOGNITION_VALIDITY_YEARS} years. You can regenerate the PDF
                  anytime; renew after expiry.
                </p>
              ) : canRenewMosqueCert && latestExpiredRecognition ? (
                <p className="text-sm text-muted-foreground">
                  Last certificate{" "}
                  <span className="font-mono font-medium text-foreground">
                    {latestExpiredRecognition.certificateNumber}
                  </span>{" "}
                  expired on {formatCertDate(recognitionExpiresAt(latestExpiredRecognition))}. Renewal is
                  eligible — issue a new {INSTITUTION_RECOGNITION_VALIDITY_YEARS}-year certificate.
                </p>
              ) : pendingRecognitionExists ? (
                <p className="text-sm text-muted-foreground">
                  A recognition request is awaiting payment. Complete payment before issuing another certificate.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No active mosque recognition certificate. Certificates are valid for{" "}
                  {INSTITUTION_RECOGNITION_VALIDITY_YEARS} years from the issue date.
                </p>
              )}
            </div>
            {canRenewMosqueCert ? (
              <Button
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
                onClick={() => openRecognitionIssueDialog("renew")}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Renew now
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {(recognitionList?.items?.length ?? 0) > 0 ? (
        <Card className="shadow-md border-amber-200/80">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b py-4 rounded-t-lg">
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-700" />
              Recognition certificates
            </CardTitle>
            <CardDescription className="text-gray-600">
              {isMosqueInstitution
                ? `One active certificate per mosque · ${INSTITUTION_RECOGNITION_VALIDITY_YEARS}-year validity · View, PDF, Regenerate, Delete`
                : "Payment status and PDF downloads for Majlis recognition."}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Certificate #</TableHead>
                  <TableHead>Name on certificate</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right w-[1%] whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recognitionList!.items.map((row) => {
                  const life = recognitionCertificateLifecycle(row);
                  const lifeBadge = recognitionLifecycleBadge(row);
                  const expires = row.status === "COMPLETED" ? recognitionExpiresAt(row) : null;
                  return (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Badge
                        variant={life === "active" ? "default" : "secondary"}
                        className={lifeBadge.className}
                      >
                        {lifeBadge.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{row.certificateNumber ?? "—"}</TableCell>
                    <TableCell>{row.institutionNameOnCert}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {row.status === "COMPLETED" ? formatCertDate(row.issueDate) : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {expires ? formatCertDate(expires) : "—"}
                    </TableCell>
                    <TableCell className="text-right min-w-[220px]">
                      <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                      {row.status === "PENDING_PAYMENT" && canGiveRecognition ? (
                        <Button
                          size="sm"
                          className="bg-amber-600 hover:bg-amber-700 text-white"
                          onClick={() => openRecognitionPaymentModal(row.id)}
                        >
                          <CreditCard className="h-3.5 w-3.5 mr-1" />
                          Complete payment
                        </Button>
                      ) : null}
                      {row.status === "COMPLETED" && row.certificateNumber ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                const blob = await institutionRecognitionApi.downloadBlob(row.id);
                                openPdfBlob(blob, `${row.certificateNumber}.pdf`, "view");
                              } catch (e: any) {
                                toast.error(e.response?.data?.message || "Could not open certificate");
                              }
                            }}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                const blob = await institutionRecognitionApi.downloadBlob(row.id);
                                openPdfBlob(blob, `${row.certificateNumber}.pdf`, "download");
                              } catch (e: any) {
                                toast.error(e.response?.data?.message || "Download failed");
                              }
                            }}
                          >
                            <Download className="h-3.5 w-3.5 mr-1" />
                            PDF
                          </Button>
                          {isMosqueInstitution && canGiveRecognition && life === "active" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="px-2"
                              disabled={regenerateRecognitionMutation.isPending}
                              onClick={() => regenerateRecognitionMutation.mutate(row.id)}
                              title="Regenerate PDF with the current mosque certificate template"
                              aria-label="Regenerate certificate PDF"
                            >
                              {regenerateRecognitionMutation.isPending ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <RefreshCw className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          ) : null}
                          {isMosqueInstitution &&
                          canGiveRecognition &&
                          life === "expired" &&
                          canRenewMosqueCert &&
                          latestExpiredRecognition?.id === row.id ? (
                            <Button
                              size="sm"
                              className="bg-amber-600 hover:bg-amber-700 text-white"
                              onClick={() => openRecognitionIssueDialog("renew")}
                              title="Start renewal for a new 2-year certificate"
                            >
                              <RefreshCw className="h-3.5 w-3.5 mr-1" />
                              Renew
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
                            title="Delete certificate"
                            aria-label="Delete certificate"
                            onClick={() => setDeleteRecognitionTarget(row)}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Delete
                          </Button>
                        </>
                      ) : null}
                      {row.status === "MANUAL_PENDING_APPROVAL" && canApproveManual ? (
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700"
                          disabled={approveRecognitionManualMutation.isPending}
                          onClick={() => approveRecognitionManualMutation.mutate(row.id)}
                        >
                          Approve payment
                        </Button>
                      ) : null}
                      {(row.status === "PENDING_PAYMENT" ||
                        row.status === "MANUAL_PENDING_APPROVAL") &&
                      canDeleteRecognition ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
                          title="Delete recognition request"
                          aria-label="Delete recognition request"
                          onClick={() => setDeleteRecognitionTarget(row)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Delete
                        </Button>
                      ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Basic Information */}
        <Card className="shadow-md border-gray-200 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b py-4">
            <CardTitle className="text-lg font-semibold text-gray-800">Basic Information</CardTitle>
            <CardDescription className="text-gray-600">Registry and location details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div>
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Location</Label>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <MapPin className="h-4 w-4 text-gray-500 shrink-0" />
                <span className="text-sm">
                  {[
                    institution.kebeleName || institution.kebele?.name,
                    institution.woreda?.name,
                    institution.zone?.name,
                    institution.region?.name,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "Not specified"}
                </span>
              </div>
            </div>
            {institution.address && (
              <div>
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Area / Address</Label>
                <p className="mt-1 text-sm">{institution.address}</p>
              </div>
            )}
            {lat != null && lng != null && (
              <div>
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">GPS Coordinates</Label>
                <p className="mt-1 text-sm font-mono text-gray-700">{lat.toFixed(6)}, {lng.toFixed(6)}</p>
              </div>
            )}
            {institution.ownershipStatus && (
              <div>
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Ownership</Label>
                <p className="mt-1 text-sm">{institution.ownershipStatus.split("_").join(" ")}</p>
              </div>
            )}
            {institution.createdBy && (
              <div>
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Created by</Label>
                <p className="mt-1 text-sm">
                  {institution.createdBy.firstName} {institution.createdBy.lastName}
                </p>
              </div>
            )}
            {institution.approvedBy && (
              <div>
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Approved by</Label>
                <p className="mt-1 text-sm">
                  {institution.approvedBy.firstName} {institution.approvedBy.lastName}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Type-Specific Details */}
        <Card className="shadow-md border-gray-200 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b py-4">
            <CardTitle className="text-lg font-semibold text-gray-800">Institution Details</CardTitle>
            <CardDescription className="text-gray-600">Type-specific information</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {institution.type === "MOSQUE" && institution.mosqueData && (
              <div className="space-y-4">
                {institution.mosqueData.capacity != null && (
                  <div>
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Capacity</Label>
                    <p className="mt-1 font-medium">{institution.mosqueData.capacity} worshippers</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Friday Jummah</span>
                    <Badge variant={institution.mosqueData.jummahAvailable ? "default" : "secondary"}>
                      {institution.mosqueData.jummahAvailable ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Women Prayer Space</span>
                    <Badge variant={institution.mosqueData.womenPrayerSpace ? "default" : "secondary"}>
                      {institution.mosqueData.womenPrayerSpace ? "Yes" : "No"}
                    </Badge>
                  </div>
                </div>
                {institution.mosqueData.utilities && (institution.mosqueData.utilities.water || institution.mosqueData.utilities.electricity) && (
                  <div>
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider mb-2 block">Utilities</Label>
                    <div className="flex gap-4 flex-wrap">
                      {institution.mosqueData.utilities.water && (
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          <Droplets className="h-4 w-4 text-blue-600" /> Water
                        </span>
                      )}
                      {institution.mosqueData.utilities.electricity && (
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          <Zap className="h-4 w-4 text-amber-500" /> Electricity
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            {institution.type === "MADRASAH" && institution.madrasahData && (
              <div className="space-y-4">
                {institution.madrasahData.accreditationStatus && (
                  <div>
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Accreditation</Label>
                    <p className="mt-1 font-medium">{institution.madrasahData.accreditationStatus.split("_").join(" ")}</p>
                  </div>
                )}
                {institution.madrasahData.gradeLevels?.length ? (
                  <div>
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Grade Levels</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {institution.madrasahData.gradeLevels.map((g) => {
                        return <Badge key={g} variant="outline">{g.split("_").join(" ")}</Badge>;
                      })}
                    </div>
                  </div>
                ) : null}
                {((institution.madrasahData.students?.male != null) || (institution.madrasahData.students?.female != null)) && (
                  <div>
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Students</Label>
                    <p className="mt-1 text-sm">
                      Male: {institution.madrasahData.students?.male !== undefined ? institution.madrasahData.students.male : 0}, Female: {institution.madrasahData.students?.female !== undefined ? institution.madrasahData.students.female : 0}
                    </p>
                  </div>
                )}
                {(institution.madrasahData.teachers?.islamic != null || institution.madrasahData.teachers?.science != null) && (
                  <div>
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Teachers</Label>
                    <p className="mt-1 text-sm">
                      Islamic: {institution.madrasahData.teachers?.islamic !== undefined ? institution.madrasahData.teachers.islamic : 0}, Science: {institution.madrasahData.teachers?.science !== undefined ? institution.madrasahData.teachers.science : 0}
                    </p>
                  </div>
                )}
                {institution.madrasahData.classrooms != null && (
                  <div>
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Classrooms</Label>
                    <p className="mt-1 font-medium">{institution.madrasahData.classrooms}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-3">
                  {institution.madrasahData.hasLabs && (
                    <span className="inline-flex items-center gap-1.5 text-sm">
                      <FlaskConical className="h-4 w-4 text-green-600" /> Labs
                    </span>
                  )}
                  {institution.madrasahData.hasLibrary && (
                    <span className="inline-flex items-center gap-1.5 text-sm">
                      <Library className="h-4 w-4 text-blue-600" /> Library
                    </span>
                  )}
                </div>
              </div>
            )}
            {institution.type === "MARKAZ" && institution.markazData && (
              <div className="space-y-4">
                {institution.markazData.disciplines?.length ? (
                  <div>
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Disciplines</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {institution.markazData.disciplines.map((d) => {
                        return <Badge key={d} variant="outline">{d}</Badge>;
                      })}
                    </div>
                  </div>
                ) : null}
                {(institution.markazData.studyLevels?.length ?? 0) >= 1 ? (
                  <div>
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Study Levels</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {institution.markazData.studyLevels.map((l) => {
                        return <Badge key={l} variant="secondary">{l.split("_").join(" ")}</Badge>;
                      })}
                    </div>
                  </div>
                ) : null}
                {(institution.markazData.students != null || institution.markazData.scholars != null) && (
                  <div className="flex gap-6 flex-wrap">
                    {institution.markazData.students != null && (
                      <div>
                        <Label className="text-muted-foreground text-xs uppercase tracking-wider">Students</Label>
                        <p className="mt-1 font-medium">{institution.markazData.students}</p>
                      </div>
                    )}
                    {institution.markazData.scholars != null && (
                      <div>
                        <Label className="text-muted-foreground text-xs uppercase tracking-wider">Scholars</Label>
                        <p className="mt-1 font-medium">{institution.markazData.scholars}</p>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex flex-wrap gap-3">
                  {institution.markazData.daawahActivities && (
                    <span className="inline-flex items-center gap-1.5 text-sm">
                      <GraduationCap className="h-4 w-4 text-purple-600" /> Da'wah
                    </span>
                  )}
                  {institution.markazData.hasBoarding && (
                    <span className="inline-flex items-center gap-1.5 text-sm">Boarding</span>
                  )}
                  {institution.markazData.hasLibrary && (
                    <span className="inline-flex items-center gap-1.5 text-sm">
                      <Library className="h-4 w-4 text-blue-600" /> Library
                    </span>
                  )}
                </div>
              </div>
            )}
            {!institution.mosqueData && !institution.madrasahData && !institution.markazData && (
              <p className="text-sm text-muted-foreground">No type-specific details recorded.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Google Map */}
      {lat != null && lng != null && (
        <GoogleMapEmbed
          latitude={lat}
          longitude={lng}
          title={`${institution.name} — Location`}
          height={380}
          zoom={15}
        />
      )}

      {/* Assignments */}
      <Card className="shadow-md border-gray-200 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 border-b py-4">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-800">HR Assignments</CardTitle>
            <CardDescription className="text-gray-600">Personnel assigned to this institution</CardDescription>
          </div>
          <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200">
                <Plus className="h-4 w-4 mr-2" />
                New Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Assignment</DialogTitle>
                <DialogDescription>Assign an employee to this institution</DialogDescription>
              </DialogHeader>
              <CreateAssignmentForm
                institution={institution}
                employees={employees?.items || []}
                onSubmit={(data) => createAssignmentMutation.mutate(data)}
                onCancel={() => setIsAssignmentDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-gray-700">Employee</TableHead>
                <TableHead className="font-semibold text-gray-700">Role</TableHead>
                <TableHead className="font-semibold text-gray-700">Status</TableHead>
                <TableHead className="font-semibold text-gray-700">Start Date</TableHead>
                <TableHead className="font-semibold text-gray-700">End Date</TableHead>
                <TableHead className="font-semibold text-gray-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                    <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No assignments yet</p>
                    <p className="text-sm">Add an assignment to link employees to this institution.</p>
                  </TableCell>
                </TableRow>
              ) : (
                assignments?.items.map((assignment) => (
                  <TableRow key={assignment.id} className="hover:bg-blue-50/50 transition-colors duration-150">
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {assignment.employee?.firstName} {assignment.employee?.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {assignment.employee?.employeeCode}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(assignment.role)}</TableCell>
                    <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                    <TableCell>{new Date(assignment.startDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {assignment.endDate ? new Date(assignment.endDate).toLocaleDateString() : "Ongoing"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {assignment.status === "PENDING_APPROVAL" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                approveAssignmentMutation.mutate({ id: assignment.id, approved: true })
                              }
                              className="hover:bg-green-50 hover:text-green-600"
                              title="Approve"
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                approveAssignmentMutation.mutate({
                                  id: assignment.id,
                                  approved: false,
                                  rejectionReason: "Rejected by user",
                                })
                              }
                              className="hover:bg-red-50 hover:text-red-600"
                              title="Reject"
                            >
                              <XCircle className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        )}
                        {assignment.status === "ACTIVE" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm("End this assignment?")) {
                                assignmentsApi.end(assignment.id).then(() => {
                                  queryClient.invalidateQueries({ queryKey: ["institution-assignments", id] });
                                  toast.success("Assignment ended");
                                });
                              }
                            }}
                            className="hover:bg-orange-50 hover:text-orange-600"
                            title="End Assignment"
                          >
                            End
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={!!deleteRecognitionTarget}
        onOpenChange={(open) => {
          if (!open && !deleteRecognitionMutation.isPending) setDeleteRecognitionTarget(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete mosque certificate?</DialogTitle>
            <DialogDescription>
              {deleteRecognitionTarget?.certificateNumber
                ? `This permanently removes certificate ${deleteRecognitionTarget.certificateNumber} and its PDF.`
                : "This permanently removes this recognition request."}{" "}
              {deleteRecognitionTarget &&
              recognitionCertificateLifecycle(deleteRecognitionTarget) === "active"
                ? "After deletion you can issue a new certificate."
                : "This cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={deleteRecognitionMutation.isPending}
              onClick={() => setDeleteRecognitionTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteRecognitionMutation.isPending || !deleteRecognitionTarget}
              onClick={() => {
                if (deleteRecognitionTarget) {
                  deleteRecognitionMutation.mutate(deleteRecognitionTarget.id);
                }
              }}
            >
              {deleteRecognitionMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateAssignmentForm({
  institution,
  employees,
  onSubmit,
  onCancel,
}: {
  institution: Institution;
  employees: Employee[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    employeeId: "",
    role: "IMAM" as InstitutionRole,
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
  });

  const getAvailableRoles = (type: string): InstitutionRole[] => {
    switch (type) {
      case "MOSQUE":
        return ["IMAM", "MUAZZIN", "MOSQUE_COMMITTEE_MEMBER"];
      case "MADRASAH":
        return ["MADRASAH_DIRECTOR", "MADRASAH_BOARD_MEMBER"];
      case "MARKAZ":
        return ["MARKAZ_DIRECTOR", "MARKAZ_COMMITTEE_MEMBER"];
      default:
        return [];
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      employeeId: formData.employeeId,
      institutionId: institution.id,
      role: formData.role,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Employee *</Label>
        <Select
          value={formData.employeeId}
          onValueChange={(v) => setFormData({ ...formData, employeeId: v })}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select employee" />
          </SelectTrigger>
          <SelectContent>
            {employees.map((emp) => (
              <SelectItem key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName} ({emp.employeeCode})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Role *</Label>
        <Select
          value={formData.role}
          onValueChange={(v) => setFormData({ ...formData, role: v as InstitutionRole })}
          required
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {getAvailableRoles(institution.type).map((role) => (
              <SelectItem key={role} value={role}>
                {role.split("_").join(" ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Start Date *</Label>
        <Input
          type="date"
          value={formData.startDate}
          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          required
        />
      </div>
      <div>
        <Label>End Date (Optional)</Label>
        <Input
          type="date"
          value={formData.endDate}
          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Create Assignment</Button>
      </div>
    </form>
  );
}
