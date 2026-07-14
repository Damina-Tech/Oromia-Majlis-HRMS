"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate, useSearchParams, useLocation } from "react-router-dom";
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
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Send,
  CreditCard,
  Award,
  FileText,
  Building2,
  AlertCircle,
  XCircle,
  Eye,
  CheckCircle2,
  Wallet,
  Landmark,
  Upload,
  UserPlus,
  GraduationCap,
  Copy,
  ExternalLink,
  MapPin,
  Mail,
  Phone,
  User,
  Shield,
  Download,
  Users,
  Pause,
  PlayCircle,
  X,
} from "lucide-react";
import {
  halalApi,
  HALAL_COMPETENCY_FEE_ETB,
  type HalalApplication,
  type HalalApplicationStatus,
  type HalalInspectionExpertRole,
  isHalalApplicationWithdrawLockedByAgreement,
  getHalalApplicationStatusBadgeLabel,
  getHalalInspectionExpertRoleLabel,
  hasRequiredOwnerEvidenceForHrc,
  halalInspectionsAwaitingOwnerEvidence,
} from "@/services/halal";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { resolveFileUrl } from "@/config/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import HalalCertificatePdfPreviewDialog, {
  type HalalCertificatePdfPreviewState,
} from "@/components/halal/HalalCertificatePdfPreviewDialog";

const STATUS_COLORS: Record<HalalApplicationStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
  SUBMITTED: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200",
  REVIEW: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200",
  PENDING_COMPETENCY_LINK: "bg-cyan-100 text-cyan-900 dark:bg-cyan-950/50 dark:text-cyan-200",
  INSPECTION: "bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200",
  APPROVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200",
};

const NEXT_ACTION_HINTS: Record<HalalApplicationStatus, { title: string; description: string }> = {
  DRAFT: {
    title: "Complete and submit your application",
    description: "Review your application details and click Submit when ready. You can edit until you submit.",
  },
  SUBMITTED: {
    title: "Certification agreement",
    description:
      "Download the agreement template, sign and stamp it, then upload your signed copy. After Majlis signs and uploads the executed agreement, inspection can be scheduled.",
  },
  REVIEW: {
    title: "Pay certification fee",
    description: "Committee approved your application. Pay 20,000 ETB to generate your Halal certificate.",
  },
  PENDING_COMPETENCY_LINK: {
    title: "Confirm Halal competency workers",
    description:
      "Your certification fee is paid. Link at least two Halal competency workers—by selecting from the list, registering external certificate holders for admin review, or after staff complete platform certification. Pay the competency fee for each approved registered worker; your business Halal certificate is issued automatically when all are paid.",
  },
  INSPECTION: {
    title: "Committee review",
    description: "The committee is reviewing your full business profile and inspection results.",
  },
  APPROVED: {
    title: "Certificate issued",
    description: "Your application was approved. Download your Halal certificate below.",
  },
  REJECTED: {
    title: "Application not approved",
    description:
      "Your application was not approved. You may submit a new application when you are ready. Contact the certification office if you need more information.",
  },
};

type HalalWorkflowDisplayKey =
  | "DRAFT"
  | "AGREEMENT"
  | "INSPECTION_QUEUE"
  | "INSPECTION"
  | "REVIEW"
  | "COMPETENCY_WORKERS"
  | "APPROVED"
  | "REJECTED";

const WORKFLOW_STEPS: { key: HalalWorkflowDisplayKey; label: string; icon: typeof FileText }[] = [
  { key: "DRAFT", label: "Application", icon: FileText },
  { key: "AGREEMENT", label: "Agreement", icon: Shield },
  { key: "INSPECTION_QUEUE", label: "Inspection", icon: Building2 },
  { key: "INSPECTION", label: "HRC", icon: AlertCircle },
  { key: "REVIEW", label: "Payment", icon: CreditCard },
  { key: "COMPETENCY_WORKERS", label: "Competency staff", icon: Users },
  { key: "APPROVED", label: "Certificate", icon: Award },
];

function getHalalWorkflowDisplayKey(app: HalalApplication): HalalWorkflowDisplayKey {
  switch (app.status) {
    case "REJECTED":
      return "REJECTED";
    case "DRAFT":
      return "DRAFT";
    case "SUBMITTED":
      return app.agreementMajlisApprovedAt ? "INSPECTION_QUEUE" : "AGREEMENT";
    case "INSPECTION":
      return "INSPECTION";
    case "REVIEW":
      return "REVIEW";
    case "PENDING_COMPETENCY_LINK":
      return "COMPETENCY_WORKERS";
    case "APPROVED":
      return "APPROVED";
    default:
      return "DRAFT";
  }
}

const ETHIOPIAN_BANKS = [
  "Commercial Bank of Ethiopia",
  "Cooperative Bank of Oromia",
  "Oromia Bank",
  "Awash Bank",
  "Hijra Bank",
  "Ramis Bank",
  "Sinqee Bank",
  "Zemzem Bank",
  "Other",
];

const ACCOUNT_NAME = "Oromia Islamic Affairs Supreme Council";
const HALAL_CERTIFICATION_FEE = 2;

const BANK_ACCOUNT_DETAILS: Record<string, { accountName: string; accountNumber: string }> = {
  "Commercial Bank of Ethiopia": { accountName: ACCOUNT_NAME, accountNumber: "1000600162447" },
  "Cooperative Bank of Oromia": { accountName: ACCOUNT_NAME, accountNumber: "1042200124748" },
  "Oromia Bank": { accountName: ACCOUNT_NAME, accountNumber: "1371866200002" },
  "Awash Bank": { accountName: ACCOUNT_NAME, accountNumber: "014100449821400" },
  "Hijra Bank": { accountName: ACCOUNT_NAME, accountNumber: "1000044440001" },
  "Ramis Bank": { accountName: ACCOUNT_NAME, accountNumber: "1030000551101" },
  "Sinqee Bank": { accountName: ACCOUNT_NAME, accountNumber: "1058169471818" },
  "Zemzem Bank": { accountName: ACCOUNT_NAME, accountNumber: "0006692210301" },
  "Other": { accountName: "Contact admin for account details", accountNumber: "—" },
};

function getOwnerIdDocumentUrl(
  documents?: { name: string; url: string }[]
): string | undefined {
  if (!documents?.length) return undefined;
  const doc = documents.find(
    (d) =>
      d.name?.toLowerCase().includes("owner id") ||
      d.name?.toLowerCase().includes("passport") ||
      d.name === "Owner ID/Passport"
  );
  return doc ? resolveFileUrl(doc.url) : undefined;
}

export default function HalalMyApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { hasPermission, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const isAdminContext = location.pathname.startsWith("/admin/halal/applications");
  const canCommitteeReview =
    hasPermission("halal.admin") || hasPermission("halal.supervisor") || hasPermission("halal.committee");
  const canCommitteeApprove = hasPermission("halal.committee");
  const canCommitteeReject = hasPermission("halal.admin") || hasPermission("halal.committee");
  const isStaff = canCommitteeReview;
  const canCompleteInspection =
    hasPermission("halal.admin") || hasPermission("halal.supervisor") || hasPermission("halal.inspector");
  const canApproveManualPayment = hasPermission("halal.admin") || hasPermission("halal.finance");
  const isHalalAdmin = hasPermission("halal.admin");
  const canViewCommitteeDetails =
    hasPermission("halal.admin") ||
    hasPermission("halal.supervisor") ||
    hasPermission("halal.committee") ||
    hasPermission("halal.inspector") ||
    hasPermission("halal.audit") ||
    hasPermission("halal.finance");

  const [paymentMethod, setPaymentMethod] = useState<"chapa" | "manual">("chapa");
  const [manualBank, setManualBank] = useState("");
  const [certPdfPreview, setCertPdfPreview] = useState<HalalCertificatePdfPreviewState | null>(null);

  const closeCertPdfPreview = () => {
    if (certPdfPreview?.url) URL.revokeObjectURL(certPdfPreview.url);
    setCertPdfPreview(null);
  };

  const openApplicationCertPreview = (certId: string, title: string) => {
    setCertPdfPreview((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return { title, url: null, loading: true };
    });
    void halalApi.certificates
      .loadPdfPreviewUrl(certId)
      .then((url) => setCertPdfPreview({ title, url, loading: false }))
      .catch((err: Error) => {
        setCertPdfPreview(null);
        toast.error(err.message ?? "Could not load certificate");
      });
  };
  const [manualReceipt, setManualReceipt] = useState<File | null>(null);
  const ownerAgreementFileRef = useRef<HTMLInputElement>(null);
  const majlisAgreementFileRef = useRef<HTMLInputElement>(null);

  const { data: app, isLoading } = useQuery({
    queryKey: ["halal-application", id],
    queryFn: () => halalApi.applications.get(id!),
    enabled: !!id,
    refetchOnWindowFocus: true,
  });

  const submitMutation = useMutation({
    mutationFn: () => halalApi.applications.submit(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["halal-application", id] });
      queryClient.invalidateQueries({ queryKey: ["halal-applications"] });
      toast.success("Application submitted successfully");
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed to submit"),
  });

  const ownerAgreementUploadMutation = useMutation({
    mutationFn: (file: File) => halalApi.applications.uploadAgreementOwnerDocument(id!, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["halal-application", id] });
      queryClient.invalidateQueries({ queryKey: ["halal-applications"] });
      toast.success("Signed agreement uploaded");
      if (ownerAgreementFileRef.current) ownerAgreementFileRef.current.value = "";
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed to upload agreement"),
  });

  const majlisAgreementUploadMutation = useMutation({
    mutationFn: (file: File) => halalApi.applications.uploadAgreementMajlisDocument(id!, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["halal-application", id] });
      queryClient.invalidateQueries({ queryKey: ["halal-applications"] });
      toast.success("Majlis agreement recorded. Inspection may now be scheduled.");
      if (majlisAgreementFileRef.current) majlisAgreementFileRef.current.value = "";
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed to upload Majlis agreement"),
  });

  const chapaInitMutation = useMutation({
    mutationFn: () => halalApi.applications.initChapaPayment(id!),
    onSuccess: (data) => {
      if (data.checkoutUrl) window.location.href = data.checkoutUrl;
    },
    onError: (e: any) => {
      const msg = e.response?.data?.message;
      toast.error(typeof msg === "string" ? msg : "Failed to initialize Chapa payment");
    },
  });

  const manualPaymentMutation = useMutation({
    mutationFn: (data: { bankName: string; receipt: File }) =>
      halalApi.applications.confirmManualPayment(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["halal-application", id] });
      queryClient.invalidateQueries({ queryKey: ["halal-applications"] });
      toast.success("Receipt submitted. Payment pending approval.");
      setManualBank("");
      setManualReceipt(null);
    },
    onError: (e: any) => {
      const msg = e.response?.data?.message;
      toast.error(typeof msg === "string" ? msg : "Failed to submit receipt");
    },
  });

  const approveManualPaymentMutation = useMutation({
    mutationFn: () => halalApi.applications.approveManualPayment(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["halal-application", id] });
      queryClient.invalidateQueries({ queryKey: ["halal-applications"] });
      toast.success("Manual payment approved. The owner must link Halal competency workers before the certificate is issued.");
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed to approve manual payment"),
  });

  const [rejectManualPaymentOpen, setRejectManualPaymentOpen] = useState(false);
  const [rejectManualPaymentReason, setRejectManualPaymentReason] = useState("");

  const rejectManualPaymentMutation = useMutation({
    mutationFn: (reason: string) => halalApi.applications.rejectManualPayment(id!, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["halal-application", id] });
      queryClient.invalidateQueries({ queryKey: ["halal-applications"] });
      toast.success("Receipt rejected. The owner can upload a new receipt or pay with Chapa.");
      setRejectManualPaymentOpen(false);
      setRejectManualPaymentReason("");
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed to reject receipt"),
  });

  const [competencySearch, setCompetencySearch] = useState("");
  const [selectedCompetencyIds, setSelectedCompetencyIds] = useState<string[]>([]);
  const [competencyWorkerTab, setCompetencyWorkerTab] = useState<"existing" | "register" | "platform">("existing");

  type WorkerProposalDraft = {
    fullName: string;
    dateOfBirth: string;
    phone: string;
    email: string;
    jobTitle: string;
    certificateFile: File | null;
  };

  const emptyWorkerProposalDraft = (): WorkerProposalDraft => ({
    fullName: "",
    dateOfBirth: "",
    phone: "",
    email: "",
    jobTitle: "",
    certificateFile: null,
  });

  const [workerProposalDrafts, setWorkerProposalDrafts] = useState<WorkerProposalDraft[]>([
    emptyWorkerProposalDraft(),
    emptyWorkerProposalDraft(),
  ]);
  const [workerRegistrationFormExpanded, setWorkerRegistrationFormExpanded] = useState(true);
  const [rejectWorkerProposalOpen, setRejectWorkerProposalOpen] = useState(false);
  const [rejectWorkerProposalId, setRejectWorkerProposalId] = useState<string | null>(null);
  const [rejectWorkerProposalReason, setRejectWorkerProposalReason] = useState("");

  const { data: competencyCandidatesRes, isLoading: loadingCompetencyCandidates } = useQuery({
    queryKey: ["halal-application-competency-candidates", id],
    queryFn: () => halalApi.applications.competencyWorkerCandidates(id!),
    enabled: !!id && app?.status === "PENDING_COMPETENCY_LINK",
  });

  useEffect(() => {
    if (app?.status !== "PENDING_COMPETENCY_LINK") {
      setSelectedCompetencyIds([]);
      setCompetencySearch("");
    }
  }, [app?.status]);

  useEffect(() => {
    if (app?.status !== "PENDING_COMPETENCY_LINK") return;
    const proposalCount = app.competencyWorkerProposals?.length ?? 0;
    if (proposalCount > 0) {
      setWorkerRegistrationFormExpanded(false);
      setWorkerProposalDrafts([]);
    }
  }, [app?.status, app?.competencyWorkerProposals?.length]);

  const filteredCompetencyCandidates = useMemo(() => {
    const items = competencyCandidatesRes?.items ?? [];
    const q = competencySearch.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        (c.certificateNumber && c.certificateNumber.toLowerCase().includes(q)) ||
        c.employerName.toLowerCase().includes(q)
    );
  }, [competencyCandidatesRes?.items, competencySearch]);

  const submitCompetencyWorkersMutation = useMutation({
    mutationFn: () => halalApi.applications.submitCompetencyWorkers(id!, selectedCompetencyIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["halal-application", id] });
      queryClient.invalidateQueries({ queryKey: ["halal-applications"] });
      toast.success("Competency workers saved. Your Halal certificate has been generated.");
    },
    onError: (e: any) => {
      const msg = e.response?.data?.message;
      toast.error(typeof msg === "string" ? msg : "Failed to confirm workers");
    },
  });

  const submitWorkerProposalsMutation = useMutation({
    mutationFn: async () => {
      const workers = await Promise.all(
        workerProposalDrafts.map(async (w) => {
          if (!w.fullName.trim() || !w.dateOfBirth || !w.phone.trim() || !w.email.trim()) {
            throw new Error("Each worker needs full name, date of birth, phone, and email.");
          }
          if (!w.certificateFile) {
            throw new Error(`Upload a Halal competency certificate for ${w.fullName.trim() || "each worker"}.`);
          }
          const { url } = await halalApi.businesses.uploadDocument(w.certificateFile);
          return {
            fullName: w.fullName.trim(),
            dateOfBirth: w.dateOfBirth,
            phone: w.phone.trim(),
            email: w.email.trim(),
            jobTitle: w.jobTitle.trim() || undefined,
            uploadedCertificateUrl: url,
          };
        })
      );
      return halalApi.applications.submitCompetencyWorkerProposals(id!, workers);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["halal-application", id] });
      queryClient.invalidateQueries({ queryKey: ["halal-competency-certificates"] });
      toast.success("Worker registrations submitted for admin review.");
      setWorkerRegistrationFormExpanded(false);
      setWorkerProposalDrafts([]);
      setCompetencyWorkerTab("register");
    },
    onError: (e: any) => {
      const msg = e.response?.data?.message ?? e.message;
      toast.error(typeof msg === "string" ? msg : "Failed to submit worker registrations");
    },
  });

  const approveWorkerProposalMutation = useMutation({
    mutationFn: (proposalId: string) => halalApi.applications.approveCompetencyWorkerProposal(id!, proposalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["halal-application", id] });
      queryClient.invalidateQueries({ queryKey: ["halal-competency-certificates"] });
      toast.success("Worker registration approved.");
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed to approve worker registration"),
  });

  const rejectWorkerProposalMutation = useMutation({
    mutationFn: ({ proposalId, reason }: { proposalId: string; reason: string }) =>
      halalApi.applications.rejectCompetencyWorkerProposal(id!, proposalId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["halal-application", id] });
      toast.success("Worker registration rejected.");
      setRejectWorkerProposalOpen(false);
      setRejectWorkerProposalId(null);
      setRejectWorkerProposalReason("");
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed to reject worker registration"),
  });

  useEffect(() => {
    if (searchParams.get("payment") !== "chapa" || !id) return;

    let cancelled = false;
    const trx_ref = searchParams.get("trx_ref") || searchParams.get("trxRef") || undefined;
    const ref_id = searchParams.get("ref_id") || searchParams.get("refId") || undefined;

    const confirm = async () => {
      const delays = [0, 1500, 3000];
      let lastError: unknown;
      for (const delay of delays) {
        if (delay > 0) await new Promise((r) => setTimeout(r, delay));
        if (cancelled) return;
        try {
          await halalApi.applications.confirmChapaPayment(id, {
            ...(trx_ref ? { trx_ref } : {}),
            ...(ref_id ? { ref_id } : {}),
          });
          if (cancelled) return;
          await queryClient.invalidateQueries({ queryKey: ["halal-application", id] });
          await queryClient.invalidateQueries({ queryKey: ["halal-applications"] });
          toast.success("Payment successful");
          setSearchParams({}, { replace: true });
          return;
        } catch (e) {
          lastError = e;
        }
      }
      if (cancelled) return;
      const msg = (lastError as any)?.response?.data?.message;
      toast.error(
        typeof msg === "string"
          ? msg
          : "Payment could not be confirmed yet. If you were charged, use Confirm payment below or refresh this page."
      );
      setSearchParams({}, { replace: true });
      queryClient.invalidateQueries({ queryKey: ["halal-application", id] });
    };

    void confirm();
    return () => {
      cancelled = true;
    };
  }, [searchParams, id, queryClient, setSearchParams]);

  const chapaConfirmMutation = useMutation({
    mutationFn: () => halalApi.applications.confirmChapaPayment(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["halal-application", id] });
      queryClient.invalidateQueries({ queryKey: ["halal-applications"] });
      toast.success("Payment confirmed");
    },
    onError: (e: any) => {
      const msg = e.response?.data?.message;
      toast.error(typeof msg === "string" ? msg : "Could not confirm Chapa payment");
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: () => halalApi.applications.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["halal-application", id] });
      queryClient.invalidateQueries({ queryKey: ["halal-applications"] });
      toast.success("Application withdrawn");
      navigate("/halal/dashboard");
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed to withdraw"),
  });

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [assignInspectorsOpen, setAssignInspectorsOpen] = useState(false);
  const [assignTechnicalIds, setAssignTechnicalIds] = useState<string[]>([]);
  const [assignShariaIds, setAssignShariaIds] = useState<string[]>([]);
  const [assignScheduledAt, setAssignScheduledAt] = useState("");
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [meetingMinutesFile, setMeetingMinutesFile] = useState<File | null>(null);
  const [isUploadingMeetingMinutes, setIsUploadingMeetingMinutes] = useState(false);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [pauseReason, setPauseReason] = useState("");
  const [ownerEvidenceFiles, setOwnerEvidenceFiles] = useState<Record<string, File | null>>({});
  const [uploadingOwnerEvidenceId, setUploadingOwnerEvidenceId] = useState<string | null>(null);

  const submitOwnerEvidenceMutation = useMutation({
    mutationFn: async ({
      inspectionId,
      file,
    }: {
      inspectionId: string;
      file: File;
    }) => {
      const upload = await halalApi.businesses.uploadDocument(file);
      return halalApi.inspections.submitOwnerEvidence(inspectionId, {
        evidenceReportUrl: upload.url,
        evidenceReportFileName: file.name,
      });
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["halal-application", id] });
      queryClient.invalidateQueries({ queryKey: ["halal-inspections"] });
      setOwnerEvidenceFiles((prev) => ({ ...prev, [vars.inspectionId]: null }));
      toast.success("Evidence report submitted successfully");
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message ?? "Failed to submit evidence report");
    },
    onSettled: () => setUploadingOwnerEvidenceId(null),
  });

  const pauseApplicationMutation = useMutation({
    mutationFn: (reason: string) => halalApi.applications.pause(id!, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["halal-application", id] });
      queryClient.invalidateQueries({ queryKey: ["halal-applications"] });
      toast.success("Application paused");
      setPauseOpen(false);
      setPauseReason("");
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed to pause application"),
  });

  const resumeApplicationMutation = useMutation({
    mutationFn: () => halalApi.applications.resume(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["halal-application", id] });
      queryClient.invalidateQueries({ queryKey: ["halal-applications"] });
      toast.success("Application resumed");
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed to resume application"),
  });

  const { data: inspectorsForAssign, isLoading: loadingInspectorsForAssign } = useQuery({
    queryKey: ["halal-inspectors"],
    queryFn: () => halalApi.inspectors.list(),
    enabled: assignInspectorsOpen,
  });

  const assignInspectorsMutation = useMutation({
    mutationFn: (data: {
      applicationId: string;
      scheduledAt?: string;
      assignments: { inspectorId: string; expertRole: HalalInspectionExpertRole }[];
    }) => halalApi.inspections.assign(data),
    onSuccess: (response) => {
      toast.success(
        response.assignedCount > 1
          ? `${response.assignedCount} inspectors assigned successfully`
          : "Inspection assigned successfully"
      );
      queryClient.invalidateQueries({ queryKey: ["halal-application", id] });
      queryClient.invalidateQueries({ queryKey: ["halal-inspections"] });
      queryClient.invalidateQueries({ queryKey: ["halal-applications"] });
      setAssignInspectorsOpen(false);
      setAssignTechnicalIds([]);
      setAssignShariaIds([]);
      setAssignScheduledAt("");
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message ?? "Failed to assign inspection");
    },
  });

  const approveMutation = useMutation({
    mutationFn: (payload: { approved: boolean; notes?: string; rejectionReason?: string; meetingMinutesUrl?: string }) =>
      halalApi.applications.approve(id!, payload),
    onSuccess: (_, vars) => {
      toast.success(vars.approved ? "Application approved" : "Application rejected");
      queryClient.invalidateQueries({ queryKey: ["halal-application", id] });
      queryClient.invalidateQueries({ queryKey: ["halal-applications"] });
      setApproveOpen(false);
      setRejectOpen(false);
      setNotes("");
      setRejectionReason("");
      setMeetingMinutesFile(null);
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message ?? "Action failed");
    },
  });

  if (!id || isLoading)
    return (
      <div className="p-6 flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    );
  if (!app) return <div className="p-6 text-muted-foreground">Application not found</div>;

  const application = app as HalalApplication;
  const agreementTemplateRaw =
    application.agreementTemplateResolvedUrl || application.agreementTemplateUrl || "";
  const agreementTemplateFullUrl = agreementTemplateRaw ? resolveFileUrl(agreementTemplateRaw) : undefined;
  const feeAmount = HALAL_CERTIFICATION_FEE;
  const isPaid = !!application.feePaidAt;
  const manualReceiptUrl = application.paymentReceiptUrl?.trim() ?? "";
  const manualReceiptFullUrl = manualReceiptUrl ? resolveFileUrl(manualReceiptUrl) : undefined;
  const hasPendingManualPayment =
    application.status === "REVIEW" &&
    !isPaid &&
    application.paymentMethod === "MANUAL" &&
    Boolean(manualReceiptUrl);
  const manualPaymentRejectionNotice = application.manualPaymentRejectionReason?.trim() ?? "";
  const rejectedManualReceiptUrl = application.manualPaymentRejectedReceiptUrl?.trim() ?? "";
  const rejectedManualReceiptFullUrl = rejectedManualReceiptUrl
    ? resolveFileUrl(rejectedManualReceiptUrl)
    : undefined;
  const showManualPaymentRejection =
    application.status === "REVIEW" && !isPaid && !hasPendingManualPayment && Boolean(manualPaymentRejectionNotice);
  const hasCompletedInspection = application.inspections?.some((i) => i.completedAt != null) ?? false;
  const inspectionsAwaitingOwnerEvidence = halalInspectionsAwaitingOwnerEvidence(
    application.inspections ?? []
  );
  const awaitingOwnerEvidence = inspectionsAwaitingOwnerEvidence.length > 0;
  const hasOwnerEvidenceForHrc = hasRequiredOwnerEvidenceForHrc(application.inspections);
  const effectiveStatus = application.status;
  const isPaused = !!application.pausedAt;
  const agreementDone = !!application.agreementMajlisApprovedAt;
  const withdrawLockedByAgreement = isHalalApplicationWithdrawLockedByAgreement(application);
  const isApplicationOwner = !!user?.id && application.business?.userId === user.id;
  const displayStepKey = getHalalWorkflowDisplayKey(application);
  const currentStepIndex =
    displayStepKey === "REJECTED" ? -1 : WORKFLOW_STEPS.findIndex((s) => s.key === displayStepKey);
  const baseHint = (() => {
    // Stepper is on "Inspection" while API status stays SUBMITTED until owner evidence unlocks HRC
    if (application.status === "SUBMITTED" && agreementDone) {
      if (awaitingOwnerEvidence) {
        return {
          title: isApplicationOwner ? "Upload evidence report" : "Awaiting owner evidence",
          description: isApplicationOwner
            ? "An inspection non-conformity report has been submitted. Upload your evidence report below to respond. The application can only move to Halal Review Committee (HRC) after your evidence is received."
            : "An inspection non-conformity report is on file. The business owner must upload an evidence report response before this application can proceed to HRC.",
        };
      }
      if (isApplicationOwner) {
        return {
          title: "Inspection scheduling",
          description:
            "Your certification agreement is complete. Majlis will assign inspectors and arrange site visits. You will see inspection details here once they are scheduled.",
        };
      }
      if (canCompleteInspection) {
        return {
          title: "Inspection stage",
          description:
            "The agreement is finalized. Assign inspectors and complete non-conformity reports. After the business owner uploads the required evidence response, the application moves to committee review (HRC).",
        };
      }
      if (isStaff) {
        return {
          title: "Inspection stage",
          description:
            "The agreement is complete. Inspectors will be assigned and facility inspections carried out. HRC begins only after the owner submits evidence for each non-conformity report.",
        };
      }
      return {
        title: "Inspection stage",
        description:
          "The certification agreement is complete. The workflow continues with inspections, owner evidence response, then committee review and certification fee payment.",
      };
    }
    if (application.status === "SUBMITTED" && !agreementDone) {
      if (isApplicationOwner) {
        if (!application.agreementOwnerSubmittedAt) {
          return {
            title: "Sign and upload your agreement",
            description:
              "Download the blank agreement, sign and stamp it, then upload the scanned or PDF copy. Majlis will countersign and finalize before inspection begins.",
          };
        }
        return {
          title: "Waiting for Majlis",
          description:
            "Your signed agreement has been received. Majlis will review it, sign and stamp their side, and upload the executed agreement before inspection can be scheduled.",
        };
      }
      if (!application.agreementOwnerSubmittedAt) {
        return {
          title: "Agreement — awaiting applicant",
          description:
            "The business owner must download the agreement template, sign and stamp it, and upload their signed copy before Majlis can countersign.",
        };
      }
      return {
        title: "Agreement — Majlis action required",
        description:
          "The owner has uploaded their signed agreement. Review it, complete Majlis signing and stamping, then upload the fully executed agreement.",
      };
    }
    return NEXT_ACTION_HINTS[application.status];
  })();
  // When inspection is completed, show awaiting-admin message
  const hint = isPaused
    ? {
        title: "Application paused",
        description: isApplicationOwner
          ? application.pausedReason?.trim() ||
            "Majlis has paused this application. You cannot take further steps until it is resumed. Contact the certification office if you have questions."
          : application.pausedReason?.trim() ||
            "This application is paused. Resume it when the issue is resolved to allow the workflow to continue.",
      }
    : application.status === "INSPECTION" && awaitingOwnerEvidence
      ? {
          title: isApplicationOwner ? "Upload evidence report" : "Awaiting owner evidence",
          description: isApplicationOwner
            ? "Upload your evidence report in response to the non-conformity report before the Halal Review Committee can decide on this application."
            : "Evidence report responses are still outstanding. Committee approval is blocked until the business owner uploads them.",
        }
      : application.status === "INSPECTION" && hasCompletedInspection && hasOwnerEvidenceForHrc
        ? {
            title: "Ready for committee review",
            description:
              "Inspection and owner evidence are complete. The committee can now review and decide whether to approve this application for payment.",
          }
        : baseHint;
  const hideInspectionsUntilOwnerAgreement =
    application.status === "SUBMITTED" && isApplicationOwner && !agreementDone;
  const isRejected = application.status === "REJECTED";
  const showInteractiveAgreementCard = !isRejected && application.status === "SUBMITTED" && !agreementDone;
  const showAgreementDocumentsReadonly =
    application.status !== "DRAFT" &&
    !showInteractiveAgreementCard &&
    Boolean(
      agreementTemplateFullUrl ||
        (application.agreementOwnerSignedUrl && String(application.agreementOwnerSignedUrl).trim()) ||
        (application.agreementMajlisSignedUrl && String(application.agreementMajlisSignedUrl).trim())
    );
  const bizDocs = application.documents ?? application.business?.documents ?? [];
  const ownerIdUrl = getOwnerIdDocumentUrl(bizDocs);

  const biz = application.business;
  const canApprove =
    !isPaused &&
    canCommitteeApprove &&
    application.status === "INSPECTION" &&
    hasCompletedInspection &&
    hasOwnerEvidenceForHrc;
  const canReject =
    !isPaused && canCommitteeReject && application.status === "INSPECTION";
  const canPauseApplication =
    isHalalAdmin && !isPaused && application.status !== "REJECTED";
  const canResumeApplication = isHalalAdmin && isPaused;
  const isApproved = application.status === "APPROVED";
  /** After HRC starts (owner evidence unlocked INSPECTION), hide other inspectors' pending assignments. */
  const inCommitteeReviewAfterFirstInspection =
    hasCompletedInspection &&
    hasOwnerEvidenceForHrc &&
    ["INSPECTION", "REVIEW", "PENDING_COMPETENCY_LINK", "APPROVED"].includes(application.status);
  const visibleInspections = inCommitteeReviewAfterFirstInspection
    ? (application.inspections ?? []).filter((i) => i.completedAt != null)
    : (application.inspections ?? []);
  const competencyWorkerProposals = application.competencyWorkerProposals ?? [];
  const pendingWorkerProposals = competencyWorkerProposals.filter((p) => p.status === "PENDING");
  const approvedWorkerProposals = competencyWorkerProposals.filter((p) => p.status === "APPROVED");
  const hasPendingWorkerProposals = pendingWorkerProposals.length > 0;
  const hasWorkerProposalHistory = competencyWorkerProposals.length > 0;
  const approvedWorkersAwaitingPayment = approvedWorkerProposals.filter(
    (p) => p.competencyCertificate?.status === "PAYMENT_PENDING"
  );
  const allApprovedWorkersPaid =
    approvedWorkerProposals.length >= 2 &&
    !hasPendingWorkerProposals &&
    approvedWorkerProposals.every((p) => p.competencyCertificate?.status === "ISSUED");
  const registeredWorkersAwaitingPayment =
    approvedWorkerProposals.length >= 2 &&
    !hasPendingWorkerProposals &&
    approvedWorkersAwaitingPayment.length > 0 &&
    application.status === "PENDING_COMPETENCY_LINK";
  const workersPaymentPhase =
    approvedWorkerProposals.length >= 2 &&
    !hasPendingWorkerProposals &&
    (registeredWorkersAwaitingPayment || allApprovedWorkersPaid);
  const businessNameForWorkers = application.business?.name ?? "your business";
  const workerCompetencyShareUrl = `${window.location.origin}/halal/competency/new?${new URLSearchParams({
    employer: businessNameForWorkers,
  }).toString()}`;
  const workerCompetencyProgressPath = isAdminContext
    ? `/admin/halal/applications/${id}/worker-competency`
    : `/halal/applications/${id}/worker-competency`;

  const copyWorkerCompetencyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(workerCompetencyShareUrl);
      toast.success("Worker registration link copied. Share it with your staff so they can apply on the platform.");
    } catch {
      toast.error("Could not copy link to clipboard");
    }
  };

  const closeWorkerRegistrationDraftForm = () => {
    setWorkerRegistrationFormExpanded(false);
    setWorkerProposalDrafts([]);
  };

  const removeWorkerProposalDraft = (idx: number) => {
    setWorkerProposalDrafts((rows) => {
      const next = rows.filter((_, i) => i !== idx);
      if (hasWorkerProposalHistory && next.length === 0) {
        setWorkerRegistrationFormExpanded(false);
      }
      return next;
    });
  };

  const isAddingMoreWorkerProposals = hasWorkerProposalHistory && workerRegistrationFormExpanded;

  const handleApproveWithMeetingMinutes = async () => {
    try {
      let meetingMinutesUrl: string | undefined;
      if (meetingMinutesFile) {
        setIsUploadingMeetingMinutes(true);
        const uploadResult = await halalApi.businesses.uploadDocument(meetingMinutesFile);
        meetingMinutesUrl = uploadResult.url;
      }
      approveMutation.mutate({
        approved: true,
        notes: notes || undefined,
        meetingMinutesUrl,
      });
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      toast.error(typeof msg === "string" ? msg : "Failed to upload meeting minutes");
    } finally {
      setIsUploadingMeetingMinutes(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500/10 via-teal-500/5 to-transparent dark:from-blue-600/20 dark:via-teal-600/10 border border-blue-200/50 dark:border-blue-800/30 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(isStaff ? "/halal/apply" : "/halal/dashboard")}
            className="self-start text-blue-800 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900/40"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-100">
              Application details
            </h1>
            <p className="text-blue-700/80 dark:text-blue-300/80 text-sm mt-1">
              {application.business?.name ?? application.businessId}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <Badge
              className={`text-sm font-medium px-3 py-1 ${
                isPaused
                  ? "bg-orange-100 text-orange-900 dark:bg-orange-950/50 dark:text-orange-200"
                  : STATUS_COLORS[effectiveStatus]
              }`}
            >
              {getHalalApplicationStatusBadgeLabel(application)}
            </Badge>
            {isHalalAdmin && (canPauseApplication || canResumeApplication) && (
              <div className="flex flex-wrap gap-2 justify-end">
                {canPauseApplication && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-orange-300 text-orange-800 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-200"
                    onClick={() => {
                      setPauseReason("");
                      setPauseOpen(true);
                    }}
                  >
                    <Pause className="h-4 w-4 mr-1" />
                    Pause
                  </Button>
                )}
                {canResumeApplication && (
                  <Button
                    type="button"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={resumeApplicationMutation.isPending}
                    onClick={() => resumeApplicationMutation.mutate()}
                  >
                    <PlayCircle className="h-4 w-4 mr-1" />
                    {resumeApplicationMutation.isPending ? "Resuming…" : "Resume"}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {isPaused && (
        <Card className="border-2 border-orange-300/70 dark:border-orange-800/60 bg-orange-50/40 dark:bg-orange-950/25 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-orange-900 dark:text-orange-100">
              <Pause className="h-5 w-5 shrink-0" />
              Application paused
            </CardTitle>
            <CardDescription className="text-orange-900/80 dark:text-orange-200/80">
              {isApplicationOwner
                ? "Your certification application is on hold. The reason below was provided by Majlis."
                : "Workflow actions are disabled until an administrator resumes this application."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">Reason:
            {application.pausedReason?.trim() ? (
              <p className="whitespace-pre-wrap text-orange-950 dark:text-orange-100">{application.pausedReason.trim()}</p>
            ) : (
              <p className="text-muted-foreground">No reason was recorded.</p>
            )}
            <p className="text-xs text-muted-foreground">
              Paused {application.pausedAt ? new Date(application.pausedAt).toLocaleString() : "—"}
              {application.pausedBy
                ? ` · ${application.pausedBy.firstName} ${application.pausedBy.lastName}`
                : ""}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Workflow progress - visual stepper */}
      <Card className="shadow-sm border-blue-200/50 dark:border-blue-900/30 overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Application progress</CardTitle>
          <CardDescription>Current stage and next steps</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-stretch">
            {WORKFLOW_STEPS.map((step, i) => {
              const Icon = step.icon;
              const isPast = isRejected || i < currentStepIndex;
              const isCurrent = !isRejected && displayStepKey === step.key;
              const isLast = i === WORKFLOW_STEPS.length - 1;

              return (
                <React.Fragment key={step.key}>
                  <div
                    className={`flex flex-col items-center flex-1 min-w-0 ${
                      isPast
                        ? "text-emerald-600 dark:text-emerald-400"
                        : isCurrent
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-muted-foreground"
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 transition-colors ${
                        isPast
                          ? "bg-emerald-100 dark:bg-emerald-900/50 ring-2 ring-emerald-500/30"
                          : isCurrent
                            ? "bg-blue-100 dark:bg-blue-900/50 ring-2 ring-blue-500 shadow-md"
                            : "bg-muted"
                      }`}
                    >
                      {isPast ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <span
                      className={`mt-2 text-xs font-medium text-center truncate w-full px-0.5 ${
                        isCurrent ? "text-foreground font-semibold" : ""
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {!isLast && (
                    <div
                      className={`flex-1 min-w-[16px] self-center h-0.5 -mx-1 rounded ${
                        isPast ? "bg-emerald-500/60" : "bg-muted"
                      }`}
                      aria-hidden
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
          {isRejected && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-3 text-center font-medium">
              Application was rejected
            </p>
          )}
        </CardContent>
      </Card>

      {/* Certification agreement: template, owner upload, Majlis countersign (before inspection) */}
      {showInteractiveAgreementCard && !isPaused && (
        <Card className="shadow-sm border-amber-200/70 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/15">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
              <Shield className="h-5 w-5 shrink-0" />
              Halal certification agreement
            </CardTitle>
            <CardDescription>
              Download the standard agreement, read it carefully and complete signing and stamping on it, reupload scanned quality PDF, then proceed to
              inspection once Majlis has uploaded the executed document.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">1. Agreement template</p>
              {agreementTemplateFullUrl ? (
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <a href={agreementTemplateFullUrl} target="_blank" rel="noopener noreferrer">
                      <Eye className="h-4 w-4 mr-2" />
                      View template
                    </a>
                  </Button>
                  <Button type="button" variant="outline" size="sm" asChild>
                    <a href={agreementTemplateFullUrl} download>
                      <Download className="h-4 w-4 mr-2" />
                      Download template
                    </a>
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-amber-800 dark:text-amber-200 rounded-md border border-amber-300/60 bg-amber-100/40 dark:bg-amber-950/40 px-3 py-2">
                  No agreement template is available yet. Majlis can upload the blank PDF under{" "}
                  <strong>Document Templates</strong> (template code{" "}
                  <code className="text-xs">HALAL_CERTIFICATION_AGREEMENT</code>, with a file attached), set{" "}
                  <code className="text-xs">HALAL_AGREEMENT_TEMPLATE_URL</code> on the server, or set a custom template
                  URL on this application. Refresh the page after the template is saved.
                </p>
              )}
            </div>

            <div className="space-y-3 border-t pt-4">
              <p className="text-sm font-medium text-foreground">2. Business owner — signed agreement</p>
              {application.agreementOwnerSignedUrl && (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Uploaded:</span>
                  <Button type="button" variant="link" className="h-auto p-0" asChild>
                    <a
                      href={resolveFileUrl(application.agreementOwnerSignedUrl) ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View owner-signed file
                    </a>
                  </Button>
                  {application.agreementOwnerSubmittedAt && (
                    <span className="text-xs text-muted-foreground">
                      ({new Date(application.agreementOwnerSubmittedAt).toLocaleString()})
                    </span>
                  )}
                </div>
              )}
              {isApplicationOwner && (
                <div className="space-y-2 max-w-md">
                  <Label htmlFor="halal-owner-agreement-file">Upload signed & stamped agreement</Label>
                  <Input
                    id="halal-owner-agreement-file"
                    ref={ownerAgreementFileRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    disabled={ownerAgreementUploadMutation.isPending}
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    disabled={ownerAgreementUploadMutation.isPending}
                    onClick={() => {
                      const f = ownerAgreementFileRef.current?.files?.[0];
                      if (!f) {
                        toast.error("Choose a file to upload");
                        return;
                      }
                      ownerAgreementUploadMutation.mutate(f);
                    }}
                  >
                    {ownerAgreementUploadMutation.isPending ? "Uploading…" : "Submit owner-signed agreement"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Sign and stamp the printed agreement (or use a qualified e-signature), then upload a clear PDF or
                    scan. You may replace your upload until Majlis finalizes.
                  </p>
                </div>
              )}
              {!isApplicationOwner && !application.agreementOwnerSubmittedAt && (
                <p className="text-sm text-muted-foreground">Waiting for the business owner to upload their signed copy.</p>
              )}
            </div>

            {canCommitteeReview && (
              <div className="space-y-3 border-t pt-4">
                <p className="text-sm font-medium text-foreground">3. Majlis — countersign & finalize</p>
                {!application.agreementOwnerSubmittedAt ? (
                  <p className="text-sm text-muted-foreground">
                    The owner must upload their signed agreement before you can add the Majlis signature and finalize.
                  </p>
                ) : (
                  <>
                    {!application.agreementMajlisApprovedAt && (
                      <div className="space-y-2 max-w-md">
                        <Label htmlFor="halal-majlis-agreement-file">Upload Majlis signed & stamped agreement</Label>
                        <Input
                          id="halal-majlis-agreement-file"
                          ref={majlisAgreementFileRef}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          disabled={majlisAgreementUploadMutation.isPending}
                        />
                        <Button
                          type="button"
                          size="sm"
                          disabled={majlisAgreementUploadMutation.isPending}
                          onClick={() => {
                            const f = majlisAgreementFileRef.current?.files?.[0];
                            if (!f) {
                              toast.error("Choose the executed agreement file to upload");
                              return;
                            }
                            majlisAgreementUploadMutation.mutate(f);
                          }}
                        >
                          {majlisAgreementUploadMutation.isPending
                            ? "Uploading…"
                            : "Submit Majlis-signed agreement & finalize"}
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          After reviewing the owner&apos;s copy, add Majlis signing and stamping, then upload the fully
                          executed document. This completes the agreement stage and allows inspector assignment.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      
      {/* Next action hint */}
      <Card
        className={`border-2 ${
          isPaused
            ? "border-orange-200/60 dark:border-orange-900/50 bg-orange-50/20 dark:bg-orange-950/15"
            : isRejected
              ? "border-red-200/60 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/20"
              : "border-blue-200/60 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-950/20"
        }`}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle className="h-5 w-5" />
            {hint.title}
          </CardTitle>
          <CardDescription>{hint.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {application.status === "DRAFT" && !isPaused && (
            <>
              <Button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}>
                <Send className="h-4 w-4 mr-2" />
                {submitMutation.isPending ? "Submitting…" : "Submit application"}
              </Button>
              {!withdrawLockedByAgreement && (
                <Button
                  variant="outline"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setWithdrawOpen(true)}
                  disabled={withdrawMutation.isPending}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Withdraw application
                </Button>
              )}
            </>
          )}
          {(application.status === "APPROVED" || application.status === "PENDING_COMPETENCY_LINK") && isPaid && (
            <div className="w-full space-y-3">
              <div className="flex items-center gap-2 rounded-lg bg-emerald-100/80 dark:bg-emerald-900/30 px-3 py-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm text-emerald-800 dark:text-emerald-200 font-medium">
                    Certification fee: {feeAmount} ETB
                  </p>
                  <p className="text-sm text-emerald-800 dark:text-emerald-200">
                    Paid on{" "}
                    {application.feePaidAt
                      ? new Date(application.feePaidAt).toLocaleDateString()
                      : "—"}
                    {(application as any).paymentMethod === "MANUAL" && (application as any).paymentBankName && (
                      <span className="text-emerald-700/80 dark:text-emerald-300/80">
                        {" "}via {(application as any).paymentBankName}
                      </span>
                    )}
                    {(application as any).paymentMethod === "CHAPA" && (
                      <span className="text-emerald-700/80 dark:text-emerald-300/80"> via Chapa</span>
                    )}
                  </p>
                </div>
              </div>
              {application.paymentReceiptUrl && (
                <a
                  href={resolveFileUrl(application.paymentReceiptUrl) ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 hover:underline flex items-center gap-1"
                >
                  <Eye className="h-4 w-4" /> View receipt
                </a>
              )}
            </div>
          )}
          {application.status === "REVIEW" && !isPaid && hasPendingManualPayment && (
            <div className="w-full space-y-4 rounded-lg border border-amber-200/70 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/25 p-4">
              <div className="flex items-start gap-3">
                <Landmark className="h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300 mt-0.5" />
                <div className="space-y-1 min-w-0">
                  <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">
                    Manual payment receipt submitted
                  </p>
                  <p className="text-sm text-amber-900/80 dark:text-amber-200/80">
                    {isApplicationOwner
                      ? "Your bank transfer receipt is on file. Majlis will verify it before your application can proceed."
                      : "Review the uploaded receipt below. Approve the payment once the transfer is verified."}
                  </p>
                </div>
              </div>
              <dl className="grid gap-1.5 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Certification fee</dt>
                  <dd className="font-medium">{feeAmount} ETB</dd>
                </div>
                {application.paymentBankName ? (
                  <div>
                    <dt className="text-muted-foreground">Bank</dt>
                    <dd className="font-medium">{application.paymentBankName}</dd>
                  </div>
                ) : null}
              </dl>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {manualReceiptFullUrl ? (
                  <>
                    <Button type="button" variant="outline" size="sm" asChild>
                      <a href={manualReceiptFullUrl} target="_blank" rel="noopener noreferrer">
                        <Eye className="h-4 w-4 mr-2" />
                        View receipt
                      </a>
                    </Button>
                    <Button type="button" variant="outline" size="sm" asChild>
                      <a href={manualReceiptFullUrl} download>
                        <Download className="h-4 w-4 mr-2" />
                        Download receipt
                      </a>
                    </Button>
                  </>
                ) : null}
                {canApproveManualPayment && (
                  <>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => approveManualPaymentMutation.mutate()}
                      disabled={isPaused || approveManualPaymentMutation.isPending}
                    >
                      {approveManualPaymentMutation.isPending ? "Approving…" : "Approve manual payment"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300"
                      disabled={isPaused || rejectManualPaymentMutation.isPending}
                      onClick={() => {
                        setRejectManualPaymentReason("");
                        setRejectManualPaymentOpen(true);
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject receipt
                    </Button>
                  </>
                )}
              </div>
              {isPaused && hasPendingManualPayment && (
                <p className="text-xs text-orange-800 dark:text-orange-200">
                  This application is paused. Payment approval is available after an administrator resumes it.
                </p>
              )}
              {!canApproveManualPayment && !isApplicationOwner && (
                <p className="text-xs text-muted-foreground">
                  Halal finance staff will verify and approve this receipt.
                </p>
              )}
            </div>
          )}
          {application.status === "REVIEW" && !isPaid && !isPaused && !hasPendingManualPayment && (
            <>
              {showManualPaymentRejection && (
                <div className="w-full space-y-2 rounded-lg border border-red-200/70 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/25 p-4 mb-4">
                  <p className="text-sm font-semibold text-red-900 dark:text-red-100 flex items-center gap-2">
                    <XCircle className="h-4 w-4 shrink-0" />
                    Manual payment receipt not accepted
                  </p>
                  <p className="text-sm text-red-900/85 dark:text-red-200/85 whitespace-pre-wrap">
                    {manualPaymentRejectionNotice}
                  </p>
                  {application.manualPaymentRejectedAt && (
                    <p className="text-xs text-muted-foreground">
                      Rejected {new Date(application.manualPaymentRejectedAt).toLocaleString()}
                      {rejectedManualReceiptFullUrl ? (
                        <>
                          {" · "}
                          <a
                            href={rejectedManualReceiptFullUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-500 hover:underline"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View receipt
                          </a>
                        </>
                      ) : null}
                    </p>
                  )}
                  {isApplicationOwner && (
                    <p className="text-sm text-red-900/80 dark:text-red-200/80">
                      Upload a corrected bank transfer receipt below, or pay online with Chapa.
                    </p>
                  )}
                </div>
              )}
              <div className="w-full space-y-4">
                <p className="text-sm text-muted-foreground">
                  Fee: {feeAmount} ETB. Choose your payment method:
                </p>
                <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "chapa" | "manual")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="chapa" className="flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      Pay online (Chapa)
                    </TabsTrigger>
                    <TabsTrigger value="manual" className="flex items-center gap-2">
                      <Landmark className="h-4 w-4" />
                      Bank transfer
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="chapa" className="mt-4 space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Pay securely with Chapa. You will be redirected to complete the payment.
                    </p>
                    {application.chapaTxRef && (isApplicationOwner || isStaff) && (
                      <div className="rounded-md border border-amber-200 dark:border-amber-800/50 bg-amber-50/70 dark:bg-amber-950/20 p-3 space-y-2">
                        <p className="text-sm text-amber-900 dark:text-amber-100">
                          A Chapa checkout was started earlier. If you already paid, confirm it here so the application can continue.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={chapaConfirmMutation.isPending}
                          onClick={() => chapaConfirmMutation.mutate()}
                        >
                          {chapaConfirmMutation.isPending ? "Confirming…" : "Confirm Chapa payment"}
                        </Button>
                      </div>
                    )}
                    <Button
                      onClick={() => chapaInitMutation.mutate()}
                      disabled={chapaInitMutation.isPending}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {chapaInitMutation.isPending ? (
                        "Redirecting…"
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Pay {feeAmount} ETB with Chapa
                        </>
                      )}
                    </Button>
                  </TabsContent>
                  <TabsContent value="manual" className="mt-4 space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Transfer {feeAmount} ETB to the designated bank account, then upload your receipt.
                    </p>
                    <div>
                      <Label>Bank name</Label>
                      <select
                        value={manualBank}
                        onChange={(e) => setManualBank(e.target.value)}
                        className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="">Select bank</option>
                        {ETHIOPIAN_BANKS.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                      {manualBank && BANK_ACCOUNT_DETAILS[manualBank] && (
                        <div className="mt-2 rounded-md border border-muted bg-muted/30 px-3 py-2 text-xs">
                          <p className="font-medium text-muted-foreground">Transfer to:</p>
                          <p><span className="text-muted-foreground">Account Name:</span> {BANK_ACCOUNT_DETAILS[manualBank].accountName}</p>
                          <p><span className="text-muted-foreground">Account Number:</span> {BANK_ACCOUNT_DETAILS[manualBank].accountNumber}</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <Label>Payment receipt (PDF or image)</Label>
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="mt-1"
                        onChange={(e) => setManualReceipt(e.target.files?.[0] ?? null)}
                      />
                    </div>
                    <Button
                      onClick={() => {
                        if (!manualBank.trim()) {
                          toast.error("Select a bank");
                          return;
                        }
                        if (!manualReceipt) {
                          toast.error("Upload your payment receipt");
                          return;
                        }
                        manualPaymentMutation.mutate({ bankName: manualBank, receipt: manualReceipt });
                      }}
                      disabled={manualPaymentMutation.isPending || !manualBank || !manualReceipt}
                    >
                      {manualPaymentMutation.isPending ? (
                        "Submitting…"
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Submit receipt
                        </>
                      )}
                    </Button>
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
          {application.status === "APPROVED" && application.certificate && (
            <Button
              variant="outline"
              onClick={() =>
                halalApi.certificates.download(
                  application.certificate!.id,
                  application.certificate!.certificateId
                )
              }
            >
              <Award className="h-4 w-4 mr-2" />
              Download certificate
            </Button>
          )}
          {(application.status === "APPROVED" ||
            application.status === "PENDING_COMPETENCY_LINK" ||
            application.status === "REJECTED") && (
            <Button variant="outline" onClick={() => navigate("/halal/dashboard")}>
              Back to dashboard
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Business info */}
      <Card className="shadow-sm border-slate-200/60 dark:border-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" /> Business
          </CardTitle>
          <CardDescription>Business and contact details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-lg">{application.business?.name}</p>
              <p className="text-sm text-muted-foreground">
                Category: {application.business?.category?.replace("_", " ")}
              </p>
            </div>
            {application.business?.id && (
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                onClick={() => navigate(`/halal/businesses/${application.business!.id}`)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View
              </Button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t">
            <p className="text-sm">
              <span className="text-muted-foreground">Contact:</span>{" "}
              {application.business?.contactName}
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Email:</span>{" "}
              <a
                href={`mailto:${application.business?.contactEmail}`}
                className="text-primary hover:underline"
              >
                {application.business?.contactEmail}
              </a>
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Phone:</span>{" "}
              {application.business?.contactPhone}
            </p>
            <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
              <p className="text-sm">
                <span className="text-muted-foreground">Owner ID / Passport:</span>{" "}
                {application.business?.ownerNationalId || "—"}
              </p>
              {ownerIdUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                  onClick={() => window.open(ownerIdUrl, "_blank", "noopener,noreferrer")}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View document
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Payment status
      {application.status !== "DRAFT" && (
        <Card
          className={`shadow-sm ${
            isPaid
              ? "border-emerald-200/70 dark:border-emerald-800/50 bg-emerald-50/40 dark:bg-emerald-950/20"
              : "border-amber-200/70 dark:border-amber-800/50 bg-amber-50/40 dark:bg-amber-950/20"
          }`}
        >
          <CardHeader>
            <CardTitle
              className={`flex items-center gap-2 ${
                isPaid ? "text-emerald-800 dark:text-emerald-200" : "text-amber-800 dark:text-amber-200"
              }`}
            >
              <CreditCard className={`h-5 w-5 ${isPaid ? "text-emerald-600" : "text-amber-600"}`} />
              Certification fee
            </CardTitle>
            <CardDescription>Fee amount: {feeAmount} ETB</CardDescription>
          </CardHeader>
          <CardContent>
            {isPaid ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-lg bg-emerald-100/80 dark:bg-emerald-900/30 px-3 py-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <p className="text-sm text-emerald-800 dark:text-emerald-200 font-medium">
                    Paid on{" "}
                    {application.feePaidAt
                      ? new Date(application.feePaidAt).toLocaleDateString()
                      : "—"}
                    {(application as any).paymentMethod === "MANUAL" && (application as any).paymentBankName && (
                      <span className="text-emerald-700/80 dark:text-emerald-300/80">
                        {" "}via {(application as any).paymentBankName}
                      </span>
                    )}
                    {(application as any).paymentMethod === "CHAPA" && (
                      <span className="text-emerald-700/80 dark:text-emerald-300/80"> via Chapa</span>
                    )}
                  </p>
                </div>
                {(application as any).paymentReceiptUrl && (
                  <a
                    href={resolveFileUrl((application as any).paymentReceiptUrl) ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:underline flex items-center gap-1"
                  >
                    <Eye className="h-4 w-4" /> View receipt
                  </a>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      )} */}

      {/* Inspections - read-only for owner; staff sees Complete button + result when completed */}
      {visibleInspections.length > 0 && !hideInspectionsUntilOwnerAgreement && (
        <Card className="shadow-sm border-slate-200/60 dark:border-slate-800/50">
          <CardHeader>
            <CardTitle>Inspections</CardTitle>
            <CardDescription>
              {inCommitteeReviewAfterFirstInspection
                ? "Submitted inspection reports for Halal Review Committee"
                : canCompleteInspection
                  ? "Scheduled and completed inspections"
                  : "Assigned inspections"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {visibleInspections.map((ins) => {
                const data = ins.checklistData as Record<string, unknown> | undefined;
                const recommendations =
                  typeof data?.recommendations === "string" ? data.recommendations.trim() : "";
                const ncUrlRaw = data?.nonConformityReportUrl as string | undefined;
                const ncName = (data?.nonConformityReportFileName as string) || "Non-conformity report";
                const evUrlRaw = data?.evidenceReportUrl as string | undefined;
                const evName = (data?.evidenceReportFileName as string) || "Evidence report";
                const ncUrl = ncUrlRaw ? resolveFileUrl(ncUrlRaw) : undefined;
                const evUrl = evUrlRaw ? resolveFileUrl(evUrlRaw) : undefined;
                const evidenceSubmittedAt =
                  typeof data?.evidenceReportSubmittedAt === "string"
                    ? data.evidenceReportSubmittedAt
                    : undefined;
                const needsOwnerEvidence =
                  isApplicationOwner &&
                  !!ins.completedAt &&
                  !!ncUrlRaw &&
                  !evUrlRaw &&
                  !isPaused;
                const hasReports = Boolean(ncUrlRaw || evUrlRaw);
                const inspectionNotes = ins.notes?.trim() || "";
                const hasResult = Boolean(
                  ins.completedAt && (hasReports || recommendations || inspectionNotes || needsOwnerEvidence)
                );
                const selectedEvidenceFile = ownerEvidenceFiles[ins.id] ?? null;
                const isUploadingThisEvidence = uploadingOwnerEvidenceId === ins.id;

                return (
                  <li
                    key={ins.id}
                    className={`rounded-md border overflow-hidden ${canCompleteInspection ? "" : "bg-muted/30"}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2 px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {ins.inspector?.firstName} {ins.inspector?.lastName}
                        </p>
                        <Badge variant="outline" className="text-[10px] font-normal mt-0.5">
                          {getHalalInspectionExpertRoleLabel(ins.expertRole ?? "TECHNICAL_EXPERT")}
                        </Badge>
                        {ins.scheduledAt && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Scheduled: {new Date(ins.scheduledAt).toLocaleString()}
                          </p>
                        )}
                        {ins.completedAt && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Submitted: {new Date(ins.completedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={ins.completedAt ? "default" : "secondary"}
                          className={
                            ins.completedAt
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200"
                              : ""
                          }
                        >
                          {ins.completedAt ? "Completed" : canCompleteInspection ? "Pending" : "Scheduled"}
                        </Badge>
                        {!ins.completedAt && canCompleteInspection && !isPaused && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/40"
                            onClick={() => navigate(`/admin/halal/inspections/${ins.id}/complete`)}
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                    {hasResult && (
                      <div className="border-t bg-muted/20 px-3 py-2.5 space-y-2">
                        {hasReports && (
                          <div className="space-y-1.5">
                            <span className="text-xs font-bold text-foreground/80 uppercase tracking-wide">
                              Inspection documents
                            </span>
                            <div className="flex flex-col gap-1.5">
                              {ncUrl && (
                                <a
                                  href={ncUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline"
                                >
                                  Non-conformity report: {ncName}
                                </a>
                              )}
                              {evUrl && (
                                <div className="space-y-0.5">
                                  <a
                                    href={evUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline"
                                  >
                                    Owner evidence response: {evName}
                                  </a>
                                  {evidenceSubmittedAt && (
                                    <p className="text-[11px] text-muted-foreground">
                                      Submitted {new Date(evidenceSubmittedAt).toLocaleString()}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        {needsOwnerEvidence && (
                          <div className="rounded-md border border-amber-200 dark:border-amber-800/60 bg-amber-50/80 dark:bg-amber-950/20 p-3 space-y-2">
                            <div className="flex items-start gap-2">
                              <Upload className="h-4 w-4 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                                  Upload evidence report
                                </p>
                                <p className="text-xs text-amber-800/80 dark:text-amber-200/80 mt-0.5">
                                  Respond to the non-conformity report with your evidence (PDF, Word, or image).
                                </p>
                              </div>
                            </div>
                            <Input
                              type="file"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              className="bg-background"
                              onChange={(e) => {
                                const file = e.target.files?.[0] ?? null;
                                setOwnerEvidenceFiles((prev) => ({ ...prev, [ins.id]: file }));
                              }}
                            />
                            <Button
                              size="sm"
                              disabled={!selectedEvidenceFile || isUploadingThisEvidence || submitOwnerEvidenceMutation.isPending}
                              onClick={() => {
                                if (!selectedEvidenceFile) return;
                                setUploadingOwnerEvidenceId(ins.id);
                                submitOwnerEvidenceMutation.mutate({
                                  inspectionId: ins.id,
                                  file: selectedEvidenceFile,
                                });
                              }}
                            >
                              {isUploadingThisEvidence ? "Uploading…" : "Submit evidence response"}
                            </Button>
                          </div>
                        )}
                        {!isApplicationOwner && !!ins.completedAt && !!ncUrlRaw && !evUrlRaw && (
                          <p className="text-xs text-amber-700 dark:text-amber-300">
                            Awaiting business owner evidence response
                          </p>
                        )}
                        {recommendations ? (
                          <div>
                            <p className="text-xs font-bold text-foreground/80 uppercase tracking-wide mb-1">
                              Recommendations
                            </p>
                            <p className="text-sm text-foreground/90 whitespace-pre-wrap">{recommendations}</p>
                          </div>
                        ) : null}
                        {inspectionNotes ? (
                          <div>
                            <p className="text-xs font-bold text-foreground/80 uppercase tracking-wide mb-1">
                              Additional notes
                            </p>
                            <p className="text-sm text-foreground/90 whitespace-pre-wrap">{inspectionNotes}</p>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
      
      {/* Agreement files (read-only): visible after the interactive agreement step, for all later statuses */}
      {showAgreementDocumentsReadonly && (
        <Card className="shadow-sm border-slate-200/60 dark:border-slate-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <FileText className="h-5 w-5 shrink-0 text-slate-600 dark:text-slate-300" />
              Certification agreement (documents)
            </CardTitle>
            <CardDescription>
              Blank template, owner-signed copy, and executed Majlis agreement. These links stay available for the rest
              of this application (inspection, committee review, payment, and completion).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {agreementTemplateFullUrl ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Agreement template</p>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <a href={agreementTemplateFullUrl} target="_blank" rel="noopener noreferrer">
                      <Eye className="h-4 w-4 mr-2" />
                      View template
                    </a>
                  </Button>
                  <Button type="button" variant="outline" size="sm" asChild>
                    <a href={agreementTemplateFullUrl} download>
                      <Download className="h-4 w-4 mr-2" />
                      Download template
                    </a>
                  </Button>
                </div>
              </div>
            ) : null}
            {application.agreementOwnerSignedUrl ? (
              <div className="space-y-2 border-t pt-4">
                <p className="text-sm font-medium text-foreground">Owner-signed agreement</p>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <a
                      href={resolveFileUrl(application.agreementOwnerSignedUrl) ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View owner-signed file
                    </a>
                  </Button>
                  {application.agreementOwnerSubmittedAt && (
                    <span className="text-xs text-muted-foreground">
                      Submitted {new Date(application.agreementOwnerSubmittedAt).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            ) : null}
            {application.agreementMajlisSignedUrl ? (
              <div className="space-y-2 border-t pt-4">
                <p className="text-sm font-medium text-foreground">Executed agreement (Majlis finalized)</p>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <a
                      href={resolveFileUrl(application.agreementMajlisSignedUrl) ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View executed agreement
                    </a>
                  </Button>
                  {application.agreementMajlisApprovedAt && (
                    <span className="text-xs text-muted-foreground">
                      Finalized {new Date(application.agreementMajlisApprovedAt).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Owner: after payment, confirm Halal competency workers before business certificate is generated */}
      {application.status === "PENDING_COMPETENCY_LINK" && isApplicationOwner && !isPaused && (
        <Card className="shadow-sm border-cyan-200/70 dark:border-cyan-900/40 bg-cyan-50/20 dark:bg-cyan-950/15">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-cyan-900 dark:text-cyan-100">
              <Users className="h-5 w-5 shrink-0" />
              Halal competency workers
            </CardTitle>
            <CardDescription>
              Your certification fee is paid. Link at least two Halal competency-certified workers at{" "}
              <strong>{businessNameForWorkers}</strong> before your business Halal certificate is generated.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasPendingWorkerProposals && (
              <div className="rounded-lg border border-amber-200/70 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/25 p-3 text-sm text-amber-950 dark:text-amber-100">
                {pendingWorkerProposals.length} worker registration
                {pendingWorkerProposals.length === 1 ? "" : "s"} awaiting admin review. After Majlis approves at least
                two workers, pay the competency fee for each to generate your business Halal certificate.
              </div>
            )}
            {registeredWorkersAwaitingPayment && (
              <div className="rounded-lg border border-amber-200/70 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/25 p-3 text-sm text-amber-950 dark:text-amber-100 space-y-3">
                <div className="space-y-1">
                  <p>
                    {approvedWorkersAwaitingPayment.length} approved worker
                    {approvedWorkersAwaitingPayment.length === 1 ? "" : "s"} still need competency certificate payment (
                    {HALAL_COMPETENCY_FEE_ETB.toLocaleString()} ETB each).
                  </p>
                  <p className="text-xs text-amber-900/85 dark:text-amber-200/85">
                    Pay for each worker below. When every approved worker&apos;s payment is complete, your business Halal
                    certificate is generated automatically.
                  </p>
                </div>
                <ul className="space-y-2">
                  {approvedWorkersAwaitingPayment.map((p) => (
                    <li
                      key={p.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-200/60 bg-background/60 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="font-medium">{p.fullName}</p>
                        <p className="text-xs text-muted-foreground">{p.email ?? p.phone ?? "—"}</p>
                      </div>
                      {p.competencyCertificate?.id && (
                        <Button
                          size="sm"
                          className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
                          onClick={() => navigate(`/halal/competency/${p.competencyCertificate!.id}`)}
                        >
                          <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                          Pay now
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {allApprovedWorkersPaid && application.status === "PENDING_COMPETENCY_LINK" && (
              <div className="rounded-lg border border-emerald-200/70 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/25 p-3 text-sm text-emerald-950 dark:text-emerald-100">
                All approved workers are paid. Your business Halal certificate will be issued momentarily…
              </div>
            )}

            <Tabs value={competencyWorkerTab} onValueChange={(v) => setCompetencyWorkerTab(v as typeof competencyWorkerTab)}>
              <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto">
                <TabsTrigger value="existing" className="text-xs sm:text-sm">
                  Select from list
                </TabsTrigger>
                <TabsTrigger value="register" className="text-xs sm:text-sm">
                  Register workers
                </TabsTrigger>
                <TabsTrigger value="platform" className="text-xs sm:text-sm">
                  Platform registration
                </TabsTrigger>
              </TabsList>

              <TabsContent value="existing" className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  Choose from issued Halal competency certificate holders already in the system. Workers whose employer
                  matches <strong>{businessNameForWorkers}</strong> appear first.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="competency-worker-search">Search list</Label>
                  <Input
                    id="competency-worker-search"
                    placeholder="Name, certificate number, or employer…"
                    value={competencySearch}
                    onChange={(e) => setCompetencySearch(e.target.value)}
                  />
                </div>
                {loadingCompetencyCandidates ? (
                  <p className="text-sm text-muted-foreground">Loading competency certificate holders…</p>
                ) : (
                  <div className="max-h-72 overflow-y-auto rounded-md border border-border">
                    <ul className="divide-y divide-border">
                      {filteredCompetencyCandidates.length === 0 ? (
                        <li className="px-3 py-6 text-sm text-muted-foreground text-center">
                          No matching issued certificates yet. Use <strong>Register workers</strong> if staff already
                          hold external competency certificates, or <strong>Platform registration</strong> to have them
                          apply through the normal process.
                        </li>
                      ) : (
                        filteredCompetencyCandidates.map((c) => {
                          const checked = selectedCompetencyIds.includes(c.id);
                          return (
                            <li key={c.id} className="flex items-start gap-3 px-3 py-2.5 hover:bg-muted/40">
                              <Checkbox
                                id={`comp-worker-${c.id}`}
                                checked={checked}
                                disabled={hasPendingWorkerProposals}
                                onCheckedChange={() => {
                                  setSelectedCompetencyIds((prev) =>
                                    prev.includes(c.id) ? prev.filter((x) => x !== c.id) : [...prev, c.id]
                                  );
                                }}
                                className="mt-0.5"
                              />
                          <label htmlFor={`comp-worker-${c.id}`} className="min-w-0 flex-1 cursor-pointer space-y-0.5">
                            <p className="text-sm font-medium leading-tight flex flex-wrap items-center gap-2">
                              {c.fullName}
                              {c.businessRegisteredWorker && (
                                <Badge variant="outline" className="text-[10px] font-normal border-cyan-300 text-cyan-800">
                                  Admin-approved registration
                                </Badge>
                              )}
                            </p>
                                <p className="text-xs text-muted-foreground">
                                  Cert. {c.certificateNumber ?? "—"} · {c.employerName}
                                  {c.jobTitle ? ` · ${c.jobTitle}` : ""}
                                </p>
                                {c.expiresAt && (
                                  <p className="text-xs text-muted-foreground">
                                    Valid until {new Date(c.expiresAt).toLocaleDateString()}
                                  </p>
                                )}
                              </label>
                              {c.certificateNumber ? (
                                <Button variant="ghost" size="sm" className="shrink-0 h-8 text-xs" asChild>
                                  <a
                                    href={`/verify/${encodeURIComponent(c.certificateNumber)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </a>
                                </Button>
                              ) : null}
                            </li>
                          );
                        })
                      )}
                    </ul>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  Selected: <strong>{selectedCompetencyIds.length}</strong> (minimum 2 required)
                </p>
                <Button
                  className="bg-cyan-700 hover:bg-cyan-800 text-white"
                  disabled={
                    hasPendingWorkerProposals ||
                    selectedCompetencyIds.length < 2 ||
                    submitCompetencyWorkersMutation.isPending ||
                    loadingCompetencyCandidates
                  }
                  onClick={() => submitCompetencyWorkersMutation.mutate()}
                >
                  {submitCompetencyWorkersMutation.isPending ? "Confirming…" : "Confirm workers and issue certificate"}
                </Button>
              </TabsContent>

              <TabsContent value="register" className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  If your workers already hold Halal competency certificates but are not in the system, register at least
                  two of them with their details and upload a copy of each certificate. After Majlis approves each worker,
                  pay the competency fee ({HALAL_COMPETENCY_FEE_ETB.toLocaleString()} ETB per worker) to link them to{" "}
                  <strong>{businessNameForWorkers}</strong>. Your business Halal certificate is issued automatically once
                  all approved workers are paid.
                </p>

                {hasWorkerProposalHistory && (
                  <div className="space-y-2 rounded-md border border-border p-3">
                    <p className="text-sm font-medium">Submitted registrations</p>
                    <ul className="space-y-2">
                      {competencyWorkerProposals.map((p) => (
                        <li key={p.id} className="flex flex-wrap items-start justify-between gap-2 text-sm border-b border-border/60 pb-2 last:border-0 last:pb-0">
                          <div className="min-w-0">
                            <p className="font-medium">{p.fullName}</p>
                            <p className="text-xs text-muted-foreground">
                              {p.email ?? "—"} · {p.phone ?? "—"}
                            </p>
                            {p.status === "REJECTED" && p.rejectionReason && (
                              <p className="text-xs text-red-700 dark:text-red-300 mt-1 whitespace-pre-wrap">Reason: {p.rejectionReason}</p>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <Badge
                              variant="outline"
                              className={
                                p.status === "PENDING"
                                  ? "border-amber-300 text-amber-800 dark:border-amber-800 dark:text-amber-200"
                                  : p.status === "APPROVED"
                                    ? p.competencyCertificate?.status === "ISSUED"
                                      ? "border-teal-300 text-teal-800 dark:border-teal-800 dark:text-teal-200"
                                      : "border-emerald-300 text-emerald-800 dark:border-emerald-800 dark:text-emerald-200"
                                    : "border-red-300 text-red-800 dark:border-red-800 dark:text-red-200"
                              }
                            >
                              {p.status === "APPROVED" && p.competencyCertificate?.status === "PAYMENT_PENDING"
                                ? "Approved · payment due"
                                : p.status === "APPROVED" && p.competencyCertificate?.status === "ISSUED"
                                  ? "Paid · issued"
                                  : p.status.replace(/_/g, " ")}
                            </Badge>
                            {p.status === "APPROVED" &&
                              p.competencyCertificate?.status === "PAYMENT_PENDING" &&
                              p.competencyCertificate.id && (
                                <Button
                                  size="sm"
                                  className="h-8 bg-amber-600 hover:bg-amber-700 text-white"
                                  onClick={() => navigate(`/halal/competency/${p.competencyCertificate!.id}`)}
                                >
                                  <CreditCard className="h-3.5 w-3.5 mr-1" />
                                  Pay
                                </Button>
                              )}
                            <Button variant="ghost" size="sm" className="h-8" asChild>
                              <a href={resolveFileUrl(p.uploadedCertificateUrl) ?? "#"} target="_blank" rel="noopener noreferrer">
                                <Eye className="h-4 w-4" />
                              </a>
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {!hasPendingWorkerProposals && !workersPaymentPhase && (
                  <div className="space-y-4">
                    {workerRegistrationFormExpanded && workerProposalDrafts.length > 0 && (
                      <>
                        {isAddingMoreWorkerProposals && (
                          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
                            <p className="text-sm font-medium">Add more workers</p>
                            <Button type="button" variant="ghost" size="sm" onClick={closeWorkerRegistrationDraftForm}>
                              <X className="h-4 w-4 mr-1" />
                              Close
                            </Button>
                          </div>
                        )}
                        {workerProposalDrafts.map((w, idx) => (
                          <div key={idx} className="rounded-lg border border-border p-4 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-medium">Worker {idx + 1}</p>
                              {(isAddingMoreWorkerProposals && workerProposalDrafts.length >= 1) ||
                              (!isAddingMoreWorkerProposals && workerProposalDrafts.length > 2) ? (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 h-8"
                                  onClick={() => removeWorkerProposalDraft(idx)}
                                >
                                  Remove
                                </Button>
                              ) : null}
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="space-y-1 sm:col-span-2">
                                <Label>Full name</Label>
                                <Input
                                  value={w.fullName}
                                  onChange={(e) =>
                                    setWorkerProposalDrafts((rows) =>
                                      rows.map((r, i) => (i === idx ? { ...r, fullName: e.target.value } : r))
                                    )
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <Label>Date of birth</Label>
                                <Input
                                  type="date"
                                  value={w.dateOfBirth}
                                  onChange={(e) =>
                                    setWorkerProposalDrafts((rows) =>
                                      rows.map((r, i) => (i === idx ? { ...r, dateOfBirth: e.target.value } : r))
                                    )
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <Label>Phone</Label>
                                <Input
                                  type="tel"
                                  value={w.phone}
                                  onChange={(e) =>
                                    setWorkerProposalDrafts((rows) =>
                                      rows.map((r, i) => (i === idx ? { ...r, phone: e.target.value } : r))
                                    )
                                  }
                                />
                              </div>
                              <div className="space-y-1 sm:col-span-2">
                                <Label>Email</Label>
                                <Input
                                  type="email"
                                  value={w.email}
                                  onChange={(e) =>
                                    setWorkerProposalDrafts((rows) =>
                                      rows.map((r, i) => (i === idx ? { ...r, email: e.target.value } : r))
                                    )
                                  }
                                />
                              </div>
                              <div className="space-y-1 sm:col-span-2">
                                <Label>Job title (optional)</Label>
                                <Input
                                  value={w.jobTitle}
                                  onChange={(e) =>
                                    setWorkerProposalDrafts((rows) =>
                                      rows.map((r, i) => (i === idx ? { ...r, jobTitle: e.target.value } : r))
                                    )
                                  }
                                />
                              </div>
                              <div className="space-y-1 sm:col-span-2">
                                <Label>Halal competency certificate (PDF or image)</Label>
                                <Input
                                  type="file"
                                  accept=".pdf,image/*"
                                  onChange={(e) =>
                                    setWorkerProposalDrafts((rows) =>
                                      rows.map((r, i) =>
                                        i === idx ? { ...r, certificateFile: e.target.files?.[0] ?? null } : r
                                      )
                                    )
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        <div className="flex flex-wrap items-center gap-2">
                          {!isAddingMoreWorkerProposals && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setWorkerProposalDrafts((rows) => [...rows, emptyWorkerProposalDraft()])}
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                              Add another worker
                            </Button>
                          )}
                          {isAddingMoreWorkerProposals && (
                            <Button type="button" variant="outline" size="sm" onClick={closeWorkerRegistrationDraftForm}>
                              Close
                            </Button>
                          )}
                          <Button
                            className="bg-cyan-700 hover:bg-cyan-800 text-white"
                            disabled={
                              (isAddingMoreWorkerProposals
                                ? workerProposalDrafts.length < 1
                                : workerProposalDrafts.length < 2) || submitWorkerProposalsMutation.isPending
                            }
                            onClick={() => submitWorkerProposalsMutation.mutate()}
                          >
                            {submitWorkerProposalsMutation.isPending
                              ? "Submitting…"
                              : isAddingMoreWorkerProposals
                                ? "Submit worker for admin review"
                                : "Submit workers for admin review"}
                          </Button>
                        </div>
                      </>
                    )}

                    {hasWorkerProposalHistory && !workerRegistrationFormExpanded && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setWorkerRegistrationFormExpanded(true);
                          setWorkerProposalDrafts([emptyWorkerProposalDraft()]);
                        }}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Add another worker
                      </Button>
                    )}
                  </div>
                )}

              </TabsContent>

              <TabsContent value="platform" className="space-y-4 mt-4">
                <div className="rounded-lg border border-border bg-background/60 p-4 space-y-3">
                  <p className="text-sm flex items-start gap-2">
                    <GraduationCap className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
                    <span>
                      If your staff do not yet have Halal competency certification, each worker should create their own
                      account and apply through the normal competency programme. When completing the application they
                      should enter <strong>{businessNameForWorkers}</strong> as their employer.
                    </span>
                  </p>
                  <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1 pl-1">
                    <li>Worker registers on the platform and starts a Halal competency application.</li>
                    <li>They complete interviews, pay the competency fee, and receive an issued certificate.</li>
                    <li>Return here and use <strong>Select from list</strong> to link them to this business application.</li>
                  </ol>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button variant="outline" size="sm" type="button" onClick={() => void copyWorkerCompetencyShareLink()}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy link for workers
                    </Button>
                    <Button variant="outline" size="sm" type="button" onClick={() => navigate(workerCompetencyProgressPath)}>
                      <Users className="h-4 w-4 mr-2" />
                      View worker competency progress
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {application.status === "PENDING_COMPETENCY_LINK" && canCommitteeReview && hasWorkerProposalHistory && (
        <Card className="shadow-sm border-violet-200/70 dark:border-violet-900/40">
          <CardHeader>
            <CardTitle className="text-base">Review registered competency workers</CardTitle>
            <CardDescription>
              The business owner submitted worker details with external competency certificates. Approve valid workers so
              the owner can pay the competency fee for each. When every approved worker is paid, the business Halal
              certificate is issued automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {competencyWorkerProposals.map((p) => (
              <div key={p.id} className="rounded-md border border-border p-3 space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{p.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.email ?? "—"} · {p.phone ?? "—"}
                      {p.jobTitle ? ` · ${p.jobTitle}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">Employer: {p.employerName}</p>
                  </div>
                  <Badge variant="outline">{p.status.replace(/_/g, " ")}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={resolveFileUrl(p.uploadedCertificateUrl) ?? "#"} target="_blank" rel="noopener noreferrer">
                      <Eye className="h-4 w-4 mr-1" />
                      View certificate
                    </a>
                  </Button>
                  {p.status === "PENDING" && (
                    <>
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        disabled={approveWorkerProposalMutation.isPending || isPaused}
                        onClick={() => approveWorkerProposalMutation.mutate(p.id)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-700"
                        disabled={isPaused}
                        onClick={() => {
                          setRejectWorkerProposalId(p.id);
                          setRejectWorkerProposalReason("");
                          setRejectWorkerProposalOpen(true);
                        }}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </div>
                {p.status === "REJECTED" && p.rejectionReason && (
                  <p className="text-xs text-red-700 dark:text-red-300 whitespace-pre-wrap">{p.rejectionReason}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {application.status === "PENDING_COMPETENCY_LINK" && !isApplicationOwner && (
        <Card className="shadow-sm border-cyan-200/60 dark:border-cyan-900/40">
          <CardHeader>
            <CardTitle className="text-base">Halal competency workers</CardTitle>
            <CardDescription>
              Payment is complete. The business owner must link at least two Halal competency workers—by selecting from the
              list, registering external certificate holders for review and payment, or after staff complete platform
              competency certification—before the business Halal certificate is generated.
              {hasPendingWorkerProposals
                ? ` ${pendingWorkerProposals.length} worker registration(s) awaiting review.`
                : registeredWorkersAwaitingPayment
                  ? ` ${approvedWorkersAwaitingPayment.length} approved worker(s) awaiting competency payment.`
                  : null}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Linked workers (read-only) after confirmation */}
      {(application.competencyWorkerLinks?.length ?? 0) > 0 && (
        <Card className="shadow-sm border-slate-200/60 dark:border-slate-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Users className="h-5 w-5 shrink-0 text-slate-600 dark:text-slate-300" />
              Linked Halal competency staff
            </CardTitle>
            <CardDescription>
              Workers linked to this certification application (issued Halal competency certificates).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {application.competencyWorkerLinks!.map((link) => {
                const c = link.competencyCertificate;
                const verifyUrl =
                  c.certificateNumber != null && String(c.certificateNumber).trim()
                    ? `/verify/${encodeURIComponent(String(c.certificateNumber).trim())}`
                    : null;
                return (
                  <li
                    key={link.id}
                    className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{c.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        Certificate {c.certificateNumber ?? "—"} · {c.employerName}
                        {c.jobTitle ? ` · ${c.jobTitle}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      {verifyUrl ? (
                        <Button variant="outline" size="sm" asChild>
                          <a href={verifyUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Verify
                          </a>
                        </Button>
                      ) : null}
                      {c.pdfUrl ? (
                        <Button variant="outline" size="sm" asChild>
                          <a href={resolveFileUrl(c.pdfUrl) ?? "#"} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4 mr-1" />
                            PDF
                          </a>
                        </Button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Rejection: business owner sees a generic message (detailed reason is admin-only). Staff see the recorded reason. */}
      {application.status === "REJECTED" && isApplicationOwner && !canViewCommitteeDetails && (
        <Card className="border-2 border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="text-red-700 dark:text-red-300">Application not approved</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-800/90 dark:text-red-200/90">
              Your application was not approved. Please contact the certification office if you need more information.
            </p>
          </CardContent>
        </Card>
      )}
      {application.status === "REJECTED" &&
        !isApplicationOwner &&
        application.rejectionReason &&
        !canViewCommitteeDetails && (
        <Card className="border-2 border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="text-red-700 dark:text-red-300">Rejection reason</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-800/90 dark:text-red-200/90">{application.rejectionReason}</p>
          </CardContent>
        </Card>
      )}

      {/* Staff-only: Supplier info */}
      {isStaff && application.supplierInfo && application.supplierInfo.length > 0 && (
        <Card className="shadow-sm border-slate-200/60 dark:border-slate-800/50">
          <CardHeader>
            <CardTitle>Suppliers</CardTitle>
            <CardDescription>Listed suppliers and their certification</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {application.supplierInfo.map((s, i) => (
                <li key={i} className="flex justify-between py-2 border-b last:border-0">
                  <span>{s.name}</span>
                  <span className="text-sm text-muted-foreground">{s.certification ?? "—"}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Staff-only: Certificate card (View + Download) */}
      {isStaff && application.certificate && isApproved && (
        <Card className="shadow-sm border-slate-200/60 dark:border-slate-800/50">
          <CardHeader>
            <CardTitle>Certificate</CardTitle>
            <CardDescription>{application.certificate.certificateId}</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button
              variant="outline"
              onClick={() =>
                openApplicationCertPreview(
                  application.certificate!.id,
                  application.certificate!.certificateId
                )
              }
            >
              View certificate
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                halalApi.certificates.download(
                  application.certificate!.id,
                  application.certificate!.certificateId
                )
              }
            >
              Download PDF
            </Button>
          </CardContent>
        </Card>
      )}

      {isHalalAdmin && application.certificate && application.certificateLifecycle && (
        <Card className="shadow-sm border-violet-200/50 dark:border-violet-900/30 bg-violet-50/20 dark:bg-violet-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-violet-900 dark:text-violet-100">
              <Shield className="h-5 w-5" />
              Certification cycle (admin)
            </CardTitle>
            <CardDescription>
              One active certificate per business: annual renewals (max two per 3-year cycle), then full
              recertification.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid sm:grid-cols-2 gap-2 text-xs">
              <p>
                <span className="text-muted-foreground">Cycle window: </span>
                {new Date(application.certificateLifecycle.certificationCycleStartedAt).toLocaleDateString()} →{" "}
                {new Date(application.certificateLifecycle.cycleEndsAt).toLocaleDateString()}
              </p>
              <p>
                <span className="text-muted-foreground">Annual renewals: </span>
                {application.certificateLifecycle.annualRenewalsUsed} /{" "}
                {application.certificateLifecycle.maxAnnualRenewalsPerCycle} used (
                {application.certificateLifecycle.annualRenewalsRemaining} remaining)
              </p>
            </div>
            {application.certificateLifecycle.fullRecertificationRequired && (
              <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                Full recertification is due for this business when the current cycle ends.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Staff-only: assign inspectors after agreement (Inspection stage) — before HRC */}
      {canCommitteeReview &&
        !isPaused &&
        application.status === "SUBMITTED" &&
        agreementDone &&
        !hasCompletedInspection && (
          <Card className="shadow-sm border-violet-200/50 dark:border-violet-900/30">
            <CardHeader>
              <CardTitle className="text-violet-800 dark:text-violet-200">Inspection assignment</CardTitle>
              <CardDescription>
                Assign Technical (and optionally Sharia) inspectors for the facility visit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setAssignTechnicalIds([]);
                  setAssignShariaIds([]);
                  setAssignScheduledAt("");
                  setAssignInspectorsOpen(true);
                }}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Assign inspectors
              </Button>
            </CardContent>
          </Card>
        )}

      {/* Staff-only: Committee actions at HRC stage only */}
      {canCommitteeReview && !isPaused && application.status === "INSPECTION" && (
        <Card className="shadow-sm border-blue-200/50 dark:border-blue-900/30">
          <CardHeader>
            <CardTitle className="text-blue-800 dark:text-blue-200">Committee actions</CardTitle>
            <CardDescription>Review this application and inspection outcome</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {awaitingOwnerEvidence && (
              <span className="text-xs text-amber-700 dark:text-amber-300 w-full">
                Awaiting business owner evidence report(s) before approval is allowed
              </span>
            )}
            {canReject && !canApprove && !awaitingOwnerEvidence && (
              <span className="text-xs text-muted-foreground w-full">
                Complete an inspection before approving
              </span>
            )}
            {canApprove && (
              <Button size="sm" variant="default" onClick={() => setApproveOpen(true)}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve
              </Button>
            )}
            {canReject && (
              <Button size="sm" variant="destructive" onClick={() => setRejectOpen(true)}>
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Committee decision: visible to privileged Halal staff (not to the business owner unless they also hold staff permissions). */}
      {canViewCommitteeDetails &&
        ["INSPECTION", "REVIEW", "PENDING_COMPETENCY_LINK", "REJECTED", "APPROVED"].includes(application.status) &&
        (Boolean(
          (application.committeeNotes && String(application.committeeNotes).trim()) ||
            (application.meetingMinutesUrl && String(application.meetingMinutesUrl).trim()) ||
            (application.status === "REJECTED" && application.rejectionReason?.trim())
        )) && (
          <Card className="shadow-sm border-indigo-200/60 dark:border-indigo-900/40 bg-indigo-50/20 dark:bg-indigo-950/20">
            <CardHeader>
              <CardTitle className="text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
                <FileText className="h-5 w-5 shrink-0" />
                Halal Review Committee decision
              </CardTitle>
              <CardDescription>
                Halal Review Committee notes, meeting minutes, and recorded rejection rationale. 
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {application.committeeNotes?.trim() ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                    Committee notes
                  </p>
                  <p className="text-foreground/90 whitespace-pre-wrap">{application.committeeNotes.trim()}</p>
                </div>
              ) : null}
              {application.meetingMinutesUrl?.trim() ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                    Meeting minutes
                  </p>
                  <a
                    href={resolveFileUrl(application.meetingMinutesUrl.trim()) ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium"
                  >
                    <Eye className="h-4 w-4" />
                    View uploaded minutes
                  </a>
                </div>
              ) : null}
              {application.status === "REJECTED" && application.rejectionReason?.trim() ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                    Rejection reason (record)
                  </p>
                  <p className="text-red-900/90 dark:text-red-200/90 whitespace-pre-wrap">
                    {application.rejectionReason.trim()}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        )}

      {/* Approve dialog */}
      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve application</DialogTitle>
            <DialogDescription>
              Optional notes and meeting minutes are saved for Halal staff review; they are not shown to the business
              owner on their application view unless they also hold a staff role.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Approval notes…"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Meeting minutes (optional)</Label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => setMeetingMinutesFile(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-muted-foreground">
                Committee head can attach the meeting minutes when approving this application.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleApproveWithMeetingMinutes}
              disabled={approveMutation.isPending || isUploadingMeetingMinutes || !canCommitteeApprove}
            >
              {isUploadingMeetingMinutes
                ? "Uploading minutes..."
                : approveMutation.isPending
                  ? "Approving..."
                  : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={rejectWorkerProposalOpen}
        onOpenChange={(o) => !rejectWorkerProposalMutation.isPending && setRejectWorkerProposalOpen(o)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject worker registration</DialogTitle>
            <DialogDescription>
              The business owner will see your reason and can submit a corrected registration.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="reject-worker-proposal-reason">Reason for rejection</Label>
            <Textarea
              id="reject-worker-proposal-reason"
              rows={4}
              value={rejectWorkerProposalReason}
              onChange={(e) => setRejectWorkerProposalReason(e.target.value)}
              placeholder="Explain what was wrong and what the owner should provide…"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectWorkerProposalOpen(false)} disabled={rejectWorkerProposalMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={
                rejectWorkerProposalMutation.isPending ||
                !rejectWorkerProposalId ||
                rejectWorkerProposalReason.trim().length < 10
              }
              onClick={() =>
                rejectWorkerProposalId &&
                rejectWorkerProposalMutation.mutate({
                  proposalId: rejectWorkerProposalId,
                  reason: rejectWorkerProposalReason.trim(),
                })
              }
            >
              {rejectWorkerProposalMutation.isPending ? "Rejecting…" : "Reject worker"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={rejectManualPaymentOpen}
        onOpenChange={(o) => !rejectManualPaymentMutation.isPending && setRejectManualPaymentOpen(o)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject manual payment receipt</DialogTitle>
            <DialogDescription>
              The uploaded receipt will be removed from this application. The business owner will see your reason and
              can submit a new receipt or pay with Chapa instead.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="reject-manual-payment-reason">Reason for rejection</Label>
            <Textarea
              id="reject-manual-payment-reason"
              rows={4}
              value={rejectManualPaymentReason}
              onChange={(e) => setRejectManualPaymentReason(e.target.value)}
              placeholder="Explain what was wrong with the receipt and what the owner should do…"
            />
            <p className="text-xs text-muted-foreground">Minimum 10 characters. This message is shown to the owner.</p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectManualPaymentOpen(false)}
              disabled={rejectManualPaymentMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={rejectManualPaymentMutation.isPending || rejectManualPaymentReason.trim().length < 10}
              onClick={() => rejectManualPaymentMutation.mutate(rejectManualPaymentReason.trim())}
            >
              {rejectManualPaymentMutation.isPending ? "Rejecting…" : "Reject receipt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pauseOpen} onOpenChange={(o) => !pauseApplicationMutation.isPending && setPauseOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pause application</DialogTitle>
            <DialogDescription>
              The business owner will see this reason on their application page. Workflow actions are blocked until you
              resume the application.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="pause-reason">Reason for pause</Label>
            <Textarea
              id="pause-reason"
              rows={4}
              value={pauseReason}
              onChange={(e) => setPauseReason(e.target.value)}
              placeholder="Explain why this application is paused and what the owner should do…"
            />
            <p className="text-xs text-muted-foreground">Minimum 10 characters.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPauseOpen(false)} disabled={pauseApplicationMutation.isPending}>
              Cancel
            </Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700 text-white"
              disabled={pauseApplicationMutation.isPending || pauseReason.trim().length < 10}
              onClick={() => pauseApplicationMutation.mutate(pauseReason.trim())}
            >
              {pauseApplicationMutation.isPending ? "Pausing…" : "Pause application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject application</DialogTitle>
            <DialogDescription>
              Provide a reason for rejection. It is stored for Halal administrators; the applicant only sees a general
              notice on their application.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rejection reason *</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Reason for rejection…"
                rows={4}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                approveMutation.mutate({
                  approved: false,
                  rejectionReason: rejectionReason || "No reason provided",
                })
              }
              disabled={approveMutation.isPending || !rejectionReason.trim()}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign inspectors — modal on this page (no navigation to inspections list) */}
      <Dialog
        open={assignInspectorsOpen}
        onOpenChange={(open) => {
          if (assignInspectorsMutation.isPending) return;
          setAssignInspectorsOpen(open);
          if (!open) {
            setAssignTechnicalIds([]);
            setAssignShariaIds([]);
            setAssignScheduledAt("");
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-violet-600" />
              Assign inspectors
            </DialogTitle>
            <DialogDescription>
              Choose at least one <strong>Technical expert</strong> and a total of <strong>at least two</strong>{" "}
              inspectors. <strong>Sharia expert</strong> is optional (for example, one technical + one sharia, or two
              technical). Committee review can continue once <strong>at least one</strong> inspection report has been
              submitted.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!id) return;
              if (assignTechnicalIds.length < 1) {
                toast.error("Select at least one Technical expert");
                return;
              }
              const assignments: { inspectorId: string; expertRole: HalalInspectionExpertRole }[] = [
                ...assignTechnicalIds.map((inspectorId) => ({
                  inspectorId,
                  expertRole: "TECHNICAL_EXPERT" as const,
                })),
                ...assignShariaIds.map((inspectorId) => ({
                  inspectorId,
                  expertRole: "SHARIA_EXPERT" as const,
                })),
              ];
              if (assignments.length < 2) {
                toast.error(
                  "At least two inspectors are required (for example two technical experts, or one technical and one sharia expert)."
                );
                return;
              }
              assignInspectorsMutation.mutate({
                applicationId: id,
                assignments,
                scheduledAt: assignScheduledAt
                  ? new Date(assignScheduledAt).toISOString()
                  : undefined,
              });
            }}
          >
            <div className="space-y-2">
              <Label>Application</Label>
              <p className="text-sm rounded-md border bg-muted/30 px-3 py-2">
                {application.business?.name ?? application.businessId}
                <span className="text-muted-foreground"> · {application.status}</span>
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 min-w-0">
                <Label>Technical expert</Label>
                <p className="text-xs text-muted-foreground">Required — at least one. Counts toward the minimum of two.</p>
                <div className="max-h-52 overflow-y-auto rounded-md border p-3 space-y-2">
                  {loadingInspectorsForAssign && (
                    <p className="text-sm text-muted-foreground">Loading inspectors…</p>
                  )}
                  {!loadingInspectorsForAssign &&
                    inspectorsForAssign?.map((inspector) => {
                      const checked = assignTechnicalIds.includes(inspector.id);
                      return (
                        <label
                          key={inspector.id}
                          className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted/50 cursor-pointer"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(next) => {
                              if (next && assignShariaIds.includes(inspector.id)) {
                                toast.error("Each inspector can only be selected in one column.");
                                return;
                              }
                              if (next) {
                                setAssignShariaIds((s) => s.filter((x) => x !== inspector.id));
                                setAssignTechnicalIds((prev) => Array.from(new Set([...prev, inspector.id])));
                              } else {
                                setAssignTechnicalIds((prev) => prev.filter((x) => x !== inspector.id));
                              }
                            }}
                          />
                          <span className="text-sm break-words">
                            {inspector.firstName} {inspector.lastName}
                            <span className="text-muted-foreground"> ({inspector.email})</span>
                          </span>
                        </label>
                      );
                    })}
                </div>
                <p className="text-xs text-muted-foreground">Selected: {assignTechnicalIds.length}</p>
              </div>
              <div className="space-y-2 min-w-0">
                <Label>Sharia expert</Label>
                <p className="text-xs text-muted-foreground">Optional — use when a dedicated Sharia inspector is assigned.</p>
                <div className="max-h-52 overflow-y-auto rounded-md border p-3 space-y-2">
                  {loadingInspectorsForAssign && (
                    <p className="text-sm text-muted-foreground">Loading inspectors…</p>
                  )}
                  {!loadingInspectorsForAssign &&
                    inspectorsForAssign?.map((inspector) => {
                      const checked = assignShariaIds.includes(inspector.id);
                      return (
                        <label
                          key={`sharia-${inspector.id}`}
                          className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted/50 cursor-pointer"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(next) => {
                              if (next && assignTechnicalIds.includes(inspector.id)) {
                                toast.error("Each inspector can only be selected in one column.");
                                return;
                              }
                              if (next) {
                                setAssignTechnicalIds((t) => t.filter((x) => x !== inspector.id));
                                setAssignShariaIds((prev) => Array.from(new Set([...prev, inspector.id])));
                              } else {
                                setAssignShariaIds((prev) => prev.filter((x) => x !== inspector.id));
                              }
                            }}
                          />
                          <span className="text-sm break-words">
                            {inspector.firstName} {inspector.lastName}
                            <span className="text-muted-foreground"> ({inspector.email})</span>
                          </span>
                        </label>
                      );
                    })}
                </div>
                <p className="text-xs text-muted-foreground">Selected: {assignShariaIds.length}</p>
              </div>
            </div>
            {!loadingInspectorsForAssign &&
              (!inspectorsForAssign || inspectorsForAssign.length === 0) && (
                <p className="text-sm text-muted-foreground">No eligible inspectors available.</p>
              )}
            <div className="space-y-2">
              <Label htmlFor="assign-scheduled-at">Scheduled date (optional)</Label>
              <Input
                id="assign-scheduled-at"
                type="datetime-local"
                value={assignScheduledAt}
                onChange={(e) => setAssignScheduledAt(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Total selected: {assignTechnicalIds.length + assignShariaIds.length} (minimum 2, with at least 1
                technical)
              </p>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAssignInspectorsOpen(false)}
                disabled={assignInspectorsMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  assignInspectorsMutation.isPending ||
                  assignTechnicalIds.length < 1 ||
                  assignTechnicalIds.length + assignShariaIds.length < 2
                }
              >
                {assignInspectorsMutation.isPending ? "Assigning…" : "Assign inspectors"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Withdraw confirmation dialog */}
      <AlertDialog
        open={withdrawOpen}
        onOpenChange={(o) => !withdrawMutation.isPending && setWithdrawOpen(o)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw application?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel your application. You can submit a new application later if needed.
              This action cannot be undone.
              {!isPaid && ["SUBMITTED", "INSPECTION", "REVIEW"].includes(application.status) && (
                <span className="block mt-2 text-amber-600">
                  Payment has not been confirmed yet, so you can still withdraw this application.
                </span>
              )}
              {withdrawLockedByAgreement && (
                <span className="block mt-2 text-destructive font-medium">
                  Withdrawal is not allowed after the certification agreement has been signed and uploaded.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={withdrawMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => withdrawMutation.mutate()}
              disabled={withdrawMutation.isPending || withdrawLockedByAgreement}
            >
              {withdrawMutation.isPending ? "Withdrawing…" : "Withdraw"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <HalalCertificatePdfPreviewDialog preview={certPdfPreview} onClose={closeCertPdfPreview} />
    </div>
  );
}
