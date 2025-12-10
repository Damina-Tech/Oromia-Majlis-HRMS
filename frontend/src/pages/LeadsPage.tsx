import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  LeadSummary,
  LeadStage,
  LeadPriority,
  LeadStatus,
  LeadListResponse,
  LeadKanbanResponse,
  LeadDashboardResponse,
  createLead,
  listLeads,
  changeLeadStage,
  assignLead,
  importLeads,
  fetchLeadKanban,
  fetchLeadDashboard,
  dispositionLead,
  LeadDispositionReason,
  downloadLeadTemplate,
  deleteAllLeads,
} from "@/services/leads";
import { listUsers, User } from "@/services/users";
import { listDepartments, Department } from "@/services/departments";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Filter,
  Flame,
  Loader2,
  Mail,
  Menu,
  Phone,
  Plus,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
  UsersRound,
  KanbanSquare,
  Inbox,
  CalendarClock,
  Download,
  Trash2,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
  PaginationLink,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Progress } from "@/components/ui/progress";

type LeadFormState = {
  fullName: string;
  email: string;
  phone: string;
  source: string;
  interest: string;
  companyName: string;
  stage: LeadStage;
  priority: LeadPriority;
  assignedToUserId: string;
  assignedDepartmentId: string;
  tags: string;
  allowDuplicate?: boolean;
};

const STAGE_OPTIONS: { value: LeadStage; label: string }[] = [
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "QUALIFIED", label: "Qualified" },
  { value: "ENGAGED", label: "Engaged" },
  { value: "PROPOSAL_SENT", label: "Proposal Sent" },
  { value: "NEGOTIATION", label: "Negotiation" },
  { value: "READY_TO_CONVERT", label: "Ready" },
  { value: "CONVERTED", label: "Converted" },
  { value: "ARCHIVED", label: "Archived" },
];

const PRIORITY_OPTIONS: { value: LeadPriority; label: string }[] = [
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
];

const DISPOSITION_REASONS: LeadDispositionReason[] = [
  "PRICE",
  "NOT_INTERESTED",
  "WRONG_CONTACT",
  "COMPETITOR",
  "POSTPONED",
  "OTHER",
];

const ALL_VALUE = "__ALL__";
const NONE_VALUE = "__NONE__";

function stageLabel(stage: LeadStage) {
  return STAGE_OPTIONS.find((opt) => opt.value === stage)?.label ?? stage;
}

function priorityBadgeClasses(priority: LeadPriority) {
  switch (priority) {
    case "HIGH":
      return "bg-rose-100 text-rose-700 border-rose-300";
    case "LOW":
      return "bg-emerald-100 text-emerald-700 border-emerald-300";
    default:
      return "bg-blue-100 text-blue-700 border-blue-300";
  }
}

const defaultForm: LeadFormState = {
  fullName: "",
  email: "",
  phone: "",
  source: "",
  interest: "",
  companyName: "",
  stage: "NEW",
  priority: "MEDIUM",
  assignedToUserId: "",
  assignedDepartmentId: "",
  tags: "",
};

const LeadsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission("leads.write") || hasPermission("leads.manage");

  const [activeTab, setActiveTab] = useState<"list" | "kanban" | "insights">("list");
  const [leads, setLeads] = useState<LeadSummary[]>([]);
  const [summary, setSummary] = useState<LeadListResponse["summary"] | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<{ search?: string; stage?: LeadStage; priority?: LeadPriority; assignedToUserId?: string }>({});

  const [kanbanData, setKanbanData] = useState<LeadKanbanResponse | null>(null);
  const [kanbanLoading, setKanbanLoading] = useState(false);
  const [draggingLead, setDraggingLead] = useState<string | null>(null);

  const [dashboard, setDashboard] = useState<LeadDashboardResponse | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState<LeadFormState>(defaultForm);
  const [savingLead, setSavingLead] = useState(false);
  const [duplicateCandidates, setDuplicateCandidates] = useState<LeadSummary[] | null>(null);
  const [pendingPayload, setPendingPayload] = useState<LeadFormState | null>(null);

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignLeadId, setAssignLeadId] = useState<string | null>(null);
  const [assignForm, setAssignForm] = useState<{
    assignedToUserId: string;
    assignedDepartmentId: string;
    priority: LeadPriority;
  }>({ assignedToUserId: "", assignedDepartmentId: "", priority: "MEDIUM" });
  const [assigning, setAssigning] = useState(false);

  const [dispositionDialogOpen, setDispositionDialogOpen] = useState(false);
  const [dispositionLeadId, setDispositionLeadId] = useState<string | null>(null);
  const [dispositionForm, setDispositionForm] = useState<{ reason: LeadDispositionReason; note: string }>({
    reason: "NOT_INTERESTED",
    note: "",
  });
  const [dispositionSaving, setDispositionSaving] = useState(false);

  const [importSheetOpen, setImportSheetOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<{ total: number; created: number; duplicates: number; failed: number } | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  const stageFilterOptions = useMemo(() => STAGE_OPTIONS.filter((stage) => stage.value !== "ARCHIVED"), []);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listLeads({
        page,
        pageSize,
        search: filters.search,
        stage: filters.stage,
        priority: filters.priority,
        assignedToUserId: filters.assignedToUserId,
      });
      setLeads(response.items);
      setSummary(response.summary);
      setTotal(response.total);
    } catch (error: any) {
      console.error("Failed to list leads", error);
      toast.error("Failed to load leads", {
        description: error?.response?.data?.message ?? "Unexpected error",
      });
    } finally {
      setLoading(false);
    }
  }, [filters.assignedToUserId, filters.priority, filters.search, filters.stage, page, pageSize]);

  const loadKanban = useCallback(async () => {
    setKanbanLoading(true);
    try {
      const data = await fetchLeadKanban({
        assignedToUserId: filters.assignedToUserId,
        priority: filters.priority,
      });
      setKanbanData(data);
    } catch (error: any) {
      toast.error("Failed to load kanban board", {
        description: error?.response?.data?.message ?? "Unexpected error",
      });
    } finally {
      setKanbanLoading(false);
    }
  }, [filters.assignedToUserId, filters.priority]);

  const loadDashboard = useCallback(async () => {
    setDashboardLoading(true);
    try {
      const data = await fetchLeadDashboard();
      setDashboard(data);
    } catch (error: any) {
      toast.error("Failed to load insights", {
        description: error?.response?.data?.message ?? "Unexpected error",
      });
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  useEffect(() => {
    if (activeTab === "kanban") {
      loadKanban();
    }
    if (activeTab === "insights" && !dashboard) {
      loadDashboard();
    }
  }, [activeTab, dashboard, loadDashboard, loadKanban]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [userResp, deptResp] = await Promise.all([
          listUsers({ page: 1, pageSize: 100 }),
          listDepartments(),
        ]);
        setUsers(userResp.items);
        setDepartments(deptResp);
      } catch (error) {
        console.warn("Failed to load helpers", error);
      }
    };
    bootstrap();
  }, []);

  const handleCreateLead = async (override?: boolean) => {
    if (!createForm.fullName.trim() || (!createForm.email && !createForm.phone)) {
      toast.error("Missing information", {
        description: "Full name and at least one contact field are required.",
      });
      return;
    }
    setSavingLead(true);
    setDuplicateCandidates(null);
    try {
      const payload = {
        ...createForm,
        allowDuplicate: override ? true : createForm.allowDuplicate,
        tags: createForm.tags
          ? createForm.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
          : [],
      };
      await createLead(payload);
      toast.success("Lead created", {
        description: `${createForm.fullName} is now in your pipeline.`,
      });
      setCreateDialogOpen(false);
      setCreateForm(defaultForm);
      loadLeads();
      if (activeTab === "kanban") loadKanban();
      if (activeTab === "insights") loadDashboard();
    } catch (error: any) {
      if (error?.response?.status === 409) {
        setDuplicateCandidates(error.response.data?.duplicates ?? []);
        setPendingPayload({ ...createForm, allowDuplicate: true });
      } else {
        toast.error("Failed to create lead", {
          description: error?.response?.data?.message ?? "Please try again.",
        });
      }
    } finally {
      setSavingLead(false);
    }
  };

  const refreshAll = useCallback(() => {
    loadLeads();
    if (activeTab === "kanban") loadKanban();
    if (activeTab === "insights") loadDashboard();
  }, [activeTab, loadDashboard, loadKanban, loadLeads]);

  const handleStageChange = async (leadId: string, stage: LeadStage) => {
    try {
      await changeLeadStage(leadId, { stage });
      toast.success("Stage updated", {
        description: `Lead moved to ${stageLabel(stage)}.`,
      });
      refreshAll();
    } catch (error: any) {
      toast.error("Failed to update stage", {
        description: error?.response?.data?.message ?? "Please try again.",
      });
    }
  };

  const handleAssign = async () => {
    if (!assignLeadId) return;
    if (!assignForm.assignedToUserId) {
      toast.error("Choose an owner", {
        description: "Pick a teammate to own this lead.",
      });
      return;
    }
    setAssigning(true);
    try {
      await assignLead(assignLeadId, {
        assignedToUserId: assignForm.assignedToUserId,
        assignedDepartmentId: assignForm.assignedDepartmentId || undefined,
        priority: assignForm.priority,
      });
      toast.success("Lead assigned", {
        description: "The new owner has been notified.",
      });
      setAssignDialogOpen(false);
      refreshAll();
    } catch (error: any) {
      toast.error("Assignment failed", {
        description: error?.response?.data?.message ?? "Please try again.",
      });
    } finally {
      setAssigning(false);
    }
  };

  const handleDisposition = async () => {
    if (!dispositionLeadId) return;
    setDispositionSaving(true);
    try {
      await dispositionLead(dispositionLeadId, dispositionForm);
      toast.success("Lead archived", {
        description: dispositionForm.note || "This opportunity was closed.",
      });
      setDispositionDialogOpen(false);
      refreshAll();
    } catch (error: any) {
      toast.error("Could not archive lead", {
        description: error?.response?.data?.message ?? "Please try again.",
      });
    } finally {
      setDispositionSaving(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      toast.error("Select a file", {
        description: "Choose a CSV/XLSX file to start importing.",
      });
      return;
    }
    setImporting(true);
    setImportSummary(null);
    setImportErrors([]);
    try {
      const result = await importLeads(importFile);
      setImportSummary(result.summary ?? result);
      setImportErrors(result.errors ?? []);
      const createdCount = result.summary?.created ?? result.summary?.total ?? "";
      const failedCount = result.summary?.failed ?? 0;
      const duplicatesCount = result.summary?.duplicates ?? 0;
      
      if (failedCount > 0 || duplicatesCount > 0) {
        toast.warning("Import completed with issues", {
          description: `${createdCount} created, ${duplicatesCount} duplicates, ${failedCount} failed.`,
        });
      } else {
        toast.success("Import complete", {
          description: createdCount ? `${createdCount} leads synced successfully.` : "Lead import finished.",
        });
      }
      refreshAll();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message ?? "Check your file and try again.";
      const errorDetails = error?.response?.data?.errors;
      setImportErrors(errorDetails ?? [errorMessage]);
      toast.error("Import failed", {
        description: errorMessage,
      });
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await downloadLeadTemplate();
      toast.success("Template downloaded", {
        description: "Sample CSV template saved to your downloads.",
      });
    } catch (error: any) {
      toast.error("Failed to download template", {
        description: error?.response?.data?.message ?? "Please try again.",
      });
    }
  };

  const handleDeleteAll = async () => {
    setDeletingAll(true);
    try {
      const result = await deleteAllLeads();
      toast.success("All leads deleted", {
        description: `${result.deletedCount} leads have been removed.`,
      });
      setDeleteAllDialogOpen(false);
      refreshAll();
    } catch (error: any) {
      toast.error("Failed to delete leads", {
        description: error?.response?.data?.message ?? "Please try again.",
      });
    } finally {
      setDeletingAll(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (page <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(totalPages);
      } else if (page >= totalPages - 3) {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = page - 1; i <= page + 1; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const groupedStageCounts = useMemo(() => {
    const map = new Map<LeadStage, number>();
    summary?.stageCounts.forEach((row) => map.set(row.stage, row.count));
    return STAGE_OPTIONS.map((opt) => ({
      label: opt.label,
      value: opt.value,
      count: map.get(opt.value) ?? 0,
    }));
  }, [summary]);

  const heroStats = useMemo(() => {
    const stages = summary?.stageCounts ?? [];
    const converted = stages.find((s) => s.stage === "CONVERTED")?.count ?? 0;
    const activePipeline =
      stages.reduce((acc, stage) => (stage.stage === "ARCHIVED" ? acc : acc + stage.count), 0) || total;
    const hotLeads = leads.filter((lead) => lead.priority === "HIGH" && lead.stage !== "ARCHIVED").length;

    return [
      {
        title: "Active pipeline",
        value: activePipeline,
        description: "Leads across all live stages",
        trend: "+12% vs last week",
        icon: Sparkles,
        accent: "from-sky-500/70 via-blue-500/70 to-indigo-500/70",
      },
      {
        title: "Ready to convert",
        value: stages.find((s) => s.stage === "READY_TO_CONVERT")?.count ?? 0,
        description: "Leads awaiting final approval",
        trend: "+4 deals ready",
        icon: Target,
        accent: "from-emerald-500/70 to-lime-500/70",
      },
      {
        title: "Won (30d)",
        value: converted,
        description: "Closed in the last 30 days",
        trend: "+18% velocity",
        icon: CheckCircle2,
        accent: "from-amber-500/70 to-orange-500/70",
      },
      {
        title: "Hot opportunities",
        value: hotLeads,
        description: "High-priority leads needing attention",
        trend: "Heat index",
        icon: Flame,
        accent: "from-rose-500/70 to-pink-500/70",
      },
    ];
  }, [summary, leads, total]);

  const renderListTab = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {heroStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className={cn(
                "relative overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br p-5 text-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl",
                stat.accent
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-wide text-white/80">{stat.title}</p>
                  <p className="mt-2 text-3xl font-semibold">{stat.value}</p>
                  <p className="text-sm text-white/80">{stat.description}</p>
                </div>
                <div className="rounded-full bg-white/20 p-3">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs font-medium text-white/80">
                <span className="inline-flex h-2 w-2 rounded-full bg-white/80" />
                {stat.trend}
              </div>
            </div>
          );
        })}
      </div>
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Lead Directory</CardTitle>
            <CardDescription>Filter and manage every inbound opportunity.</CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex gap-2">
              <Input
                placeholder="Search leads"
                value={filters.search ?? ""}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, search: e.target.value || undefined }));
                  setPage(1);
                }}
                className="w-48"
              />
              <Select
                value={filters.stage ?? ALL_VALUE}
                onValueChange={(value) => {
                  const next = value === ALL_VALUE ? undefined : (value as LeadStage);
                  setFilters((prev) => ({ ...prev, stage: next }));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All stages</SelectItem>
                  {stageFilterOptions.map((stage) => (
                    <SelectItem key={stage.value} value={stage.value}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.priority ?? ALL_VALUE}
                onValueChange={(value) => {
                  const next = value === ALL_VALUE ? undefined : (value as LeadPriority);
                  setFilters((prev) => ({ ...prev, priority: next }));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-28">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All</SelectItem>
                  {PRIORITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => loadLeads()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              {canEdit && (
                <>
                  <Button variant="outline" size="sm" onClick={() => setImportSheetOpen(true)}>
                    <Upload className="mr-2 h-4 w-4" />
                    Import
                  </Button>
                  <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Lead
                  </Button>
                  {hasPermission("leads.manage") && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteAllDialogOpen(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete All
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {groupedStageCounts.map((item) => (
              <div
                key={item.value}
                className="rounded-2xl border border-dashed border-muted-foreground/30 bg-gradient-to-br from-muted/40 via-background to-background p-4 shadow-sm"
              >
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-semibold">{item.count}</p>
                  <span className="text-xs text-muted-foreground">leads</span>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-lg border max-h-[600px] overflow-hidden">
            <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      <div className="flex items-center justify-center gap-2 py-6">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading leads...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No leads match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{lead.fullName}</p>
                          <p className="text-xs text-muted-foreground">
                            {lead.companyName || lead.interest || "—"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1 text-sm">
                          {lead.email && (
                            <span className="inline-flex items-center gap-1 text-muted-foreground">
                              <Mail className="h-3.5 w-3.5" />
                              {lead.email}
                            </span>
                          )}
                          {lead.phone && (
                            <span className="inline-flex items-center gap-1 text-muted-foreground">
                              <Phone className="h-3.5 w-3.5" />
                              {lead.phone}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{lead.source ?? "N/A"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={lead.stage}
                          disabled={!canEdit}
                          onValueChange={(value) => handleStageChange(lead.id, value as LeadStage)}
                        >
                          <SelectTrigger className="w-40 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STAGE_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("border", priorityBadgeClasses(lead.priority))}>
                          {lead.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {lead.assignedToUser ? (
                          <div className="text-sm">
                            <p className="font-medium">
                              {lead.assignedToUser.firstName} {lead.assignedToUser.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {lead.assignedDepartment?.name ?? "—"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Menu className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Quick actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <a href={`/leads/${lead.id}`} className="flex items-center gap-2">
                                <ArrowUpRight className="h-4 w-4" />
                                View details
                              </a>
                            </DropdownMenuItem>
                            {canEdit && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setAssignLeadId(lead.id);
                                    setAssignForm({
                                      assignedToUserId: lead.assignedToUser?.id ?? "",
                                      assignedDepartmentId: lead.assignedDepartment?.id ?? "",
                                      priority: lead.priority,
                                    });
                                    setAssignDialogOpen(true);
                                  }}
                                >
                                  <UsersRound className="mr-2 h-4 w-4" />
                                  Assign owner
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setDispositionLeadId(lead.id);
                                    setDispositionDialogOpen(true);
                                  }}
                                >
                                  <AlertTriangle className="mr-2 h-4 w-4 text-amber-600" />
                                  Disposition
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              </Table>
            </div>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * pageSize + 1} -{" "}
                {Math.min(page * pageSize, total)} of {total} leads
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Per page:</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(value) => {
                    setPageSize(Number(value));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="30">30</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    className={cn(
                      "cursor-pointer",
                      page === 1 && "pointer-events-none opacity-50 cursor-not-allowed"
                    )}
                    aria-disabled={page === 1}
                  />
                </PaginationItem>
                {getPageNumbers().map((pageNum, idx) => {
                  if (pageNum === "ellipsis") {
                    return (
                      <PaginationItem key={`ellipsis-${idx}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  const pageNumber = pageNum as number;
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        onClick={() => setPage(pageNumber)}
                        isActive={page === pageNumber}
                        className="cursor-pointer"
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    className={cn(
                      "cursor-pointer",
                      page >= totalPages && "pointer-events-none opacity-50 cursor-not-allowed"
                    )}
                    aria-disabled={page >= totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderKanbanTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Pipeline kanban</h2>
          <p className="text-sm text-muted-foreground">Drag and drop cards to advance stages.</p>
        </div>
        <div className="flex gap-2">
          <Select
            value={filters.assignedToUserId ?? ALL_VALUE}
            onValueChange={(value) => {
              const next = value === ALL_VALUE ? undefined : value;
              setFilters((prev) => ({ ...prev, assignedToUserId: next }));
              loadKanban();
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter owner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>All owners</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.firstName} {user.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={loadKanban}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync
          </Button>
        </div>
      </div>
      {kanbanLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading board...
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {STAGE_OPTIONS.map((stage) => (
            <div
              key={stage.value}
              className="flex h-full flex-col rounded-3xl border border-border/60 bg-card/80 shadow-lg shadow-black/5 dark:shadow-white/5"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                if (draggingLead) {
                  handleStageChange(draggingLead, stage.value);
                }
                setDraggingLead(null);
              }}
            >
              <div className="flex items-center justify-between border-b border-border/60 p-4">
                <div>
                  <p className="text-sm font-semibold">{stage.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {kanbanData?.[stage.value]?.length ?? 0} leads
                  </p>
                </div>
                <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
                  {stage.value.replace("_", " ")}
                </Badge>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {(kanbanData?.[stage.value] ?? []).map((lead) => (
                  <div
                    key={lead.id}
                    draggable={canEdit}
                    onDragStart={() => setDraggingLead(lead.id)}
                    className="cursor-grab rounded-2xl border border-border/50 bg-gradient-to-br from-background to-muted/40 p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{lead.fullName}</p>
                        <p className="text-xs text-muted-foreground">{lead.source ?? "Unknown source"}</p>
                      </div>
                      <Badge className={cn("border text-xs", priorityBadgeClasses(lead.priority))}>
                        {lead.priority}
                      </Badge>
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                      {lead.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {lead.email}
                        </div>
                      )}
                      {lead.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {lead.phone}
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {lead.assignedToUser
                          ? `${lead.assignedToUser.firstName} ${lead.assignedToUser.lastName}`
                          : "Unassigned"}
                      </span>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" asChild>
                        <a href={`/leads/${lead.id}`}>Open</a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderInsightsTab = () => (
    <div className="space-y-4">
      {dashboardLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading insights...
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="overflow-hidden border-none bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <TrendingUp className="h-5 w-5" />
                  Conversion
                </CardTitle>
                <CardDescription className="text-emerald-50">This month's conversion rate.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-semibold">
                  {(dashboard?.metrics?.totals?.conversionRate ?? 0).toLocaleString(undefined, {
                    style: "percent",
                    maximumFractionDigits: 1,
                  })}
                </div>
                <p className="text-sm text-emerald-50/80">
                  {dashboard?.metrics?.totals?.converted ?? 0} / {dashboard?.metrics?.totals?.total ?? 0} converted
                </p>
              </CardContent>
            </Card>
            <Card className="border border-border/60 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Inbox className="h-4 w-4 text-blue-500" />
                  Hot leads
                </CardTitle>
                <CardDescription>High priority opportunities.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {dashboard?.hotLeads.slice(0, 4).map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/40 p-3"
                  >
                    <div>
                      <p className="text-sm font-semibold">{lead.fullName}</p>
                      <p className="text-xs text-muted-foreground">{stageLabel(lead.stage)}</p>
                    </div>
                    <Badge className={cn("border", priorityBadgeClasses(lead.priority))}>{lead.priority}</Badge>
                  </div>
                ))}
                {dashboard?.hotLeads.length === 0 && (
                  <p className="text-sm text-muted-foreground">No hot leads yet.</p>
                )}
              </CardContent>
            </Card>
            <Card className="border border-border/60 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UsersRound className="h-4 w-4 text-purple-500" />
                  Top sources
                </CardTitle>
                <CardDescription>Channels bringing the most leads.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(dashboard?.metrics?.sources ?? []).map((source) => (
                  <div key={source.source} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{source.source}</span>
                      <span className="text-muted-foreground">{source.count}</span>
                    </div>
                    <Progress
                      value={
                        ((source.count ?? 0) / Math.max(dashboard?.metrics?.totals?.total ?? 1, 1)) *
                        100
                      }
                    />
                  </div>
                ))}
                {(dashboard?.metrics?.sources ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground">No source data yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
          <Card className="border border-border/60 shadow-lg">
            <CardHeader>
              <CardTitle>Funnel overview</CardTitle>
              <CardDescription>Stage distribution across your pipeline.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(dashboard?.metrics?.funnel ?? []).map((stage) => (
                <div key={stage.stage}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{stageLabel(stage.stage)}</span>
                    <span>{stage.count}</span>
                  </div>
                  <Progress
                    value={
                      ((stage.count ?? 0) / Math.max(dashboard?.metrics?.totals?.total ?? 1, 1)) *
                      100
                    }
                  />
                </div>
              ))}
              {(dashboard?.metrics?.funnel ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">No funnel data yet.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as typeof activeTab)}
        className="space-y-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Lead Management</h1>
            <p className="text-muted-foreground">Track every interaction from capture to conversion.</p>
          </div>
          <TabsList>
            <TabsTrigger value="list">List</TabsTrigger>
            <TabsTrigger value="kanban" className="flex items-center gap-2">
              <KanbanSquare className="h-4 w-4" />
              Kanban
            </TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="list">{renderListTab()}</TabsContent>
        <TabsContent value="kanban">{renderKanbanTab()}</TabsContent>
        <TabsContent value="insights">{renderInsightsTab()}</TabsContent>
      </Tabs>

      {/* Create lead dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create lead</DialogTitle>
            <DialogDescription>Capture core contact and routing info.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input
                value={createForm.fullName}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, fullName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Company</Label>
              <Input
                value={createForm.companyName}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, companyName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={createForm.phone}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Source</Label>
              <Input
                value={createForm.source}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, source: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Interest</Label>
              <Input
                value={createForm.interest}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, interest: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Stage</Label>
              <Select
                value={createForm.stage}
                onValueChange={(value) => setCreateForm((prev) => ({ ...prev, stage: value as LeadStage }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGE_OPTIONS.map((stage) => (
                    <SelectItem key={stage.value} value={stage.value}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={createForm.priority}
                onValueChange={(value) => setCreateForm((prev) => ({ ...prev, priority: value as LeadPriority }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select
                value={createForm.assignedToUserId || NONE_VALUE}
                onValueChange={(value) =>
                  setCreateForm((prev) => ({ ...prev, assignedToUserId: value === NONE_VALUE ? "" : value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>Unassigned</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select
                value={createForm.assignedDepartmentId || NONE_VALUE}
                onValueChange={(value) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    assignedDepartmentId: value === NONE_VALUE ? "" : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>None</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Tags (comma separated)</Label>
              <Input
                value={createForm.tags}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, tags: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleCreateLead()} disabled={savingLead}>
              {savingLead && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
          {duplicateCandidates && pendingPayload && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
              <p className="font-medium text-amber-900">Potential duplicates detected</p>
              <p className="text-amber-800">
                These leads share the same contact. Review before forcing creation.
              </p>
              <ul className="mt-2 list-disc pl-4 text-amber-900">
                {duplicateCandidates.map((dup) => (
                  <li key={dup.id}>
                    {dup.fullName} · {dup.email || dup.phone || "No contact"}
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setDuplicateCandidates(null)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={() => handleCreateLead(true)}>
                  Force create
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign lead</DialogTitle>
            <DialogDescription>Pick an owner and department.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Owner</Label>
              <Select
                value={assignForm.assignedToUserId || NONE_VALUE}
                onValueChange={(value) =>
                  setAssignForm((prev) => ({ ...prev, assignedToUserId: value === NONE_VALUE ? "" : value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>Unassigned</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select
                value={assignForm.assignedDepartmentId || NONE_VALUE}
                onValueChange={(value) =>
                  setAssignForm((prev) => ({
                    ...prev,
                    assignedDepartmentId: value === NONE_VALUE ? "" : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>None</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={assignForm.priority}
                onValueChange={(value) => setAssignForm((prev) => ({ ...prev, priority: value as LeadPriority }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={assigning}>
              {assigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disposition dialog */}
      <Dialog open={dispositionDialogOpen} onOpenChange={setDispositionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive lead</DialogTitle>
            <DialogDescription>Capture a disposition before archiving.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Reason</Label>
              <Select
                value={dispositionForm.reason}
                onValueChange={(value) =>
                  setDispositionForm((prev) => ({ ...prev, reason: value as LeadDispositionReason }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISPOSITION_REASONS.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={dispositionForm.note}
                onChange={(e) => setDispositionForm((prev) => ({ ...prev, note: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDispositionDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDisposition} disabled={dispositionSaving}>
              {dispositionSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Archive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete All Dialog */}
      <Dialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete All Leads</DialogTitle>
            <DialogDescription>
              This action will permanently delete all leads from the database. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <p className="text-sm font-medium text-destructive">
              Warning: You are about to delete {total} leads. This action is irreversible.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteAllDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAll} disabled={deletingAll}>
              {deletingAll && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete All Leads
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import sheet */}
      <Sheet open={importSheetOpen} onOpenChange={setImportSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Import leads</SheetTitle>
            <SheetDescription>Upload CSV or Excel file to bulk create leads. Duplicate phone numbers are allowed.</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">CSV Template</p>
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </div>
            <div className="rounded-lg border border-dashed p-6 text-center">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(event) => {
                  setImportFile(event.target.files?.[0] ?? null);
                  setImportErrors([]);
                  setImportSummary(null);
                }}
                className="w-full"
              />
              <p className="mt-2 text-xs text-muted-foreground">Supported: CSV, XLSX</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Required fields: <strong>full_name</strong> (or fullName, name)
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Optional: phone, email, gender, education, address, interest, source, company_name, priority, stage
              </p>
            </div>
            {importFile && (
              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                <p className="font-medium">Selected file:</p>
                <p className="text-muted-foreground">{importFile.name}</p>
                <p className="text-xs text-muted-foreground">{(importFile.size / 1024).toFixed(2)} KB</p>
              </div>
            )}
            {importErrors.length > 0 && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm">
                <p className="font-medium text-destructive">Validation Errors:</p>
                <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-destructive">
                  {importErrors.map((error, idx) => (
                    <li key={idx} className="list-disc list-inside">
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {importSummary && (
              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                <p className="font-medium">Import Summary</p>
                <ul className="mt-2 space-y-1">
                  <li className="flex justify-between">
                    <span>Total rows:</span>
                    <span className="font-medium">{importSummary.total}</span>
                  </li>
                  <li className="flex justify-between text-emerald-600">
                    <span>Created:</span>
                    <span className="font-medium">{importSummary.created}</span>
                  </li>
                  <li className="flex justify-between text-amber-600">
                    <span>Duplicates:</span>
                    <span className="font-medium">{importSummary.duplicates}</span>
                  </li>
                  <li className="flex justify-between text-destructive">
                    <span>Failed:</span>
                    <span className="font-medium">{importSummary.failed}</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={() => {
              setImportSheetOpen(false);
              setImportFile(null);
              setImportErrors([]);
              setImportSummary(null);
            }}>
              Close
            </Button>
            <Button onClick={handleImport} disabled={importing || !importFile}>
              {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Import
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default LeadsPage;

