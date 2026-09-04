import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Upload,
  Pencil,
  Settings,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import { resolveFileUrl } from "@/config/api";
import {
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getMergeFields,
  uploadTemplateSourceFile,
  type DocumentTemplate,
  type CreateTemplateData,
  type UpdateTemplateData,
  type CertificateLayoutConfig,
  type HalalCertificateTemplateType,
  getCategoryLabel,
  getStatusLabel,
  getStatusColor,
  getCategoryColor,
  type MergeField,
} from "@/services/documents";
import TemplateEditorDialog from "@/components/documents/TemplateEditorDialog";
import CertificateDesignerDialog from "@/components/documents/CertificateDesignerDialog";
import {
  countLayoutFields,
  defaultMembershipIdLayout,
} from "@/components/documents/certificateFieldCatalog";

const CERT_TYPE_LABEL: Record<HalalCertificateTemplateType, string> = {
  HALAL_BUSINESS: "Halal business certificate",
  HALAL_PRODUCT: "Halal product certificate",
  MOSQUE_INSTITUTION: "Mosque institution certificate",
  MEMBERSHIP_ID: "Membership ID / certificate",
};

function isPdfCertificate(template: DocumentTemplate): boolean {
  return template.templateEngine === "PDF_CERTIFICATE";
}

export default function DocumentTemplatesPage() {
  const { hasPermission } = useAuth();
  const canView = hasPermission("documents.view");
  const canManage = hasPermission("documents.manage");

  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [engineFilter, setEngineFilter] = useState<string>("all");

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [createAgreementPreset, setCreateAgreementPreset] = useState<"halal" | null>(null);

  const [certCreateOpen, setCertCreateOpen] = useState(false);
  const [designTemplate, setDesignTemplate] = useState<DocumentTemplate | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [creatingCert, setCreatingCert] = useState(false);
  const [certForm, setCertForm] = useState({
    code: "",
    name: "",
    certificateType: "HALAL_BUSINESS" as HalalCertificateTemplateType,
  });

  const [mergeFields, setMergeFields] = useState<MergeField>({});

  useEffect(() => {
    if (canView) {
      void loadTemplates();
      void loadMergeFields();
    }
  }, [canView, page, searchTerm, categoryFilter, statusFilter, activeFilter, engineFilter]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await listTemplates({
        page,
        pageSize,
        search: searchTerm || undefined,
        category: categoryFilter !== "all" ? categoryFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        active: activeFilter !== "all" ? activeFilter === "true" : undefined,
        templateEngine:
          engineFilter === "PDF_CERTIFICATE" || engineFilter === "HTML_MERGE"
            ? engineFilter
            : undefined,
        sortBy: "updatedAt",
        sortOrder: "desc",
      });
      setTemplates(response.items || []);
      setTotal(response.total || 0);
    } catch (err: any) {
      console.error("Failed to load templates:", err);
      toast.error(err.response?.data?.message || "Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const loadMergeFields = async () => {
    try {
      const fields = await getMergeFields();
      setMergeFields(fields);
    } catch (err: any) {
      console.error("Failed to load merge fields:", err);
    }
  };

  const handleDelete = async () => {
    if (!selectedTemplate) return;
    try {
      await deleteTemplate(selectedTemplate.id);
      toast.success("Template deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedTemplate(null);
      void loadTemplates();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete template");
    }
  };

  const handleCreate = async (data: CreateTemplateData) => {
    try {
      await createTemplate(data);
      toast.success("Template created successfully");
      setCreateDialogOpen(false);
      void loadTemplates();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create template");
      throw err;
    }
  };

  const handleUpdate = async (id: string, data: UpdateTemplateData) => {
    try {
      await updateTemplate(id, data);
      toast.success("Template updated successfully");
      setEditDialogOpen(false);
      setSelectedTemplate(null);
      void loadTemplates();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update template");
      throw err;
    }
  };

  const handleCreateCertificate = async () => {
    if (!certForm.code.trim() || !certForm.name.trim()) {
      toast.error("Code and name are required");
      return;
    }
    setCreatingCert(true);
    try {
      const isMembershipId = certForm.certificateType === "MEMBERSHIP_ID";
      await createTemplate({
        code: certForm.code.trim(),
        name: certForm.name.trim(),
        category: "CERTIFICATE",
        templateEngine: "PDF_CERTIFICATE",
        certificateType: certForm.certificateType,
        tags: ["certificate", certForm.certificateType.toLowerCase()],
        ...(isMembershipId ? { layoutConfig: defaultMembershipIdLayout() } : {}),
      });
      toast.success(
        isMembershipId
          ? "Membership ID template created — upload Front/Back backgrounds in Design"
          : "Certificate template created — upload a PDF/image background, then open Design"
      );
      setCertCreateOpen(false);
      setCertForm({ code: "", name: "", certificateType: "HALAL_BUSINESS" });
      void loadTemplates();
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? "Failed to create certificate template");
    } finally {
      setCreatingCert(false);
    }
  };

  const handleUploadBackground = async (templateId: string, file: File) => {
    setUploadingId(templateId);
    try {
      const { url } = await uploadTemplateSourceFile(file);
      const updated = await updateTemplate(templateId, { sourceFileUrl: url });
      toast.success("Background file uploaded");
      setTemplates((prev) => prev.map((t) => (t.id === templateId ? updated : t)));
      if (designTemplate?.id === templateId) setDesignTemplate(updated);
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? "Upload failed");
    } finally {
      setUploadingId(null);
    }
  };

  const handleSaveLayout = async (layout: CertificateLayoutConfig) => {
    if (!designTemplate) return;
    const firstPageBg = layout.pages?.[0]?.sourceFileUrl;
    const updated = await updateTemplate(designTemplate.id, {
      layoutConfig: layout,
      ...(firstPageBg ? { sourceFileUrl: firstPageBg } : {}),
    });
    setDesignTemplate(updated);
    void loadTemplates();
  };

  const handleActivate = async (t: DocumentTemplate) => {
    try {
      await updateTemplate(t.id, { status: "ACTIVE", active: true });
      toast.success(
        isPdfCertificate(t)
          ? "Template activated — other templates of the same certificate type were archived."
          : "Template activated"
      );
      void loadTemplates();
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? "Failed to activate");
    }
  };

  const openEditDialog = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setDeleteDialogOpen(true);
  };

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to view templates.</p>
        </div>
      </div>
    );
  }

  const filtersActive =
    searchTerm ||
    categoryFilter !== "all" ||
    statusFilter !== "all" ||
    activeFilter !== "all" ||
    engineFilter !== "all";

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Templates</h1>
          <p className="text-gray-600 mt-1">
            Manage letter templates, Halal agreements, and PDF certificate layouts
          </p>
        </div>
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setCreateAgreementPreset(null);
                setCreateDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create template
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setCreateAgreementPreset("halal");
                setCreateDialogOpen(true);
              }}
            >
              <Upload className="h-4 w-4 mr-2" />
              Halal agreement (blank)
            </Button>
            <Button onClick={() => setCertCreateOpen(true)}>
              <Award className="h-4 w-4 mr-2" />
              PDF certificate
            </Button>
          </div>
        )}
      </div>

      {canManage && (
        <div className="rounded-lg border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-amber-950 dark:text-amber-100">
            For PDF certificates, upload <strong>signature</strong> and <strong>seal</strong> images under Document
            Settings, then place those fields in the designer.
          </p>
          <Button variant="outline" size="sm" className="shrink-0" asChild>
            <Link to="/documents/settings">
              <Settings className="h-3.5 w-3.5 mr-1.5" />
              Document settings
            </Link>
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={engineFilter} onValueChange={setEngineFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All engines</SelectItem>
                <SelectItem value="HTML_MERGE">Letters / HTML</SelectItem>
                <SelectItem value="PDF_CERTIFICATE">PDF certificates</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="HR">HR</SelectItem>
                <SelectItem value="PAYROLL">Payroll</SelectItem>
                <SelectItem value="LEGAL">Legal</SelectItem>
                <SelectItem value="CERTIFICATE">Certificate</SelectItem>
                <SelectItem value="WARNING">Warning</SelectItem>
                <SelectItem value="CONTRACT">Contract</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={activeFilter} onValueChange={setActiveFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Active Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
            {filtersActive && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setCategoryFilter("all");
                  setStatusFilter("all");
                  setActiveFilter("all");
                  setEngineFilter("all");
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
          <CardDescription>
            {total} template{total !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No templates found</p>
              {canManage && (
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCreateAgreementPreset(null);
                      setCreateDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create template
                  </Button>
                  <Button onClick={() => setCertCreateOpen(true)}>
                    <Award className="h-4 w-4 mr-2" />
                    PDF certificate
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Engine</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Generated</TableHead>
                      <TableHead>Source / layout</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">
                          <div>{template.name}</div>
                          {isPdfCertificate(template) && template.certificateType && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {CERT_TYPE_LABEL[template.certificateType]}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">{template.code}</code>
                        </TableCell>
                        <TableCell>
                          <Badge className={getCategoryColor(template.category)}>
                            {getCategoryLabel(template.category)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {isPdfCertificate(template) ? "PDF certificate" : "HTML letter"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(template.status)}>
                              {getStatusLabel(template.status)}
                            </Badge>
                            {template.active ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>v{template.version}</TableCell>
                        <TableCell>{template._count?.generatedDocuments || 0}</TableCell>
                        <TableCell>
                          {isPdfCertificate(template) ? (
                            <span className="text-sm text-muted-foreground">
                              {template.sourceFileUrl ? "Background ✓" : "No file"}
                              {countLayoutFields(template.layoutConfig)
                                ? ` · ${countLayoutFields(template.layoutConfig)} field(s)`
                                : ""}
                              {template.layoutConfig?.pages && template.layoutConfig.pages.length > 1
                                ? ` · ${template.layoutConfig.pages.length} pages`
                                : ""}
                            </span>
                          ) : template.sourceFileUrl ? (
                            <a
                              href={resolveFileUrl(template.sourceFileUrl) || template.sourceFileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary underline"
                            >
                              Open
                            </a>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 justify-end">
                            {canManage && isPdfCertificate(template) && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={uploadingId === template.id}
                                  onClick={() => {
                                    const input = document.getElementById(
                                      `cert-upload-${template.id}`
                                    ) as HTMLInputElement | null;
                                    input?.click();
                                  }}
                                  title="Upload background"
                                >
                                  {uploadingId === template.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Upload className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                                <input
                                  id={`cert-upload-${template.id}`}
                                  type="file"
                                  accept=".pdf,image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) void handleUploadBackground(template.id, f);
                                    e.target.value = "";
                                  }}
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={
                                    uploadingId === template.id ||
                                    (!template.sourceFileUrl &&
                                      !template.layoutConfig?.pages?.some((p) => p.sourceFileUrl) &&
                                      template.certificateType !== "MEMBERSHIP_ID")
                                  }
                                  onClick={() => setDesignTemplate(template)}
                                  title="Design layout"
                                >
                                  <Pencil className="h-3.5 w-3.5 mr-1" />
                                  Design
                                </Button>
                                {template.status !== "ACTIVE" && (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => void handleActivate(template)}
                                  >
                                    Activate
                                  </Button>
                                )}
                              </>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {!isPdfCertificate(template) && (
                                  <DropdownMenuItem onClick={() => openEditDialog(template)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                )}
                                {!isPdfCertificate(template) && (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedTemplate(template);
                                      setPreviewDialogOpen(true);
                                    }}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    Preview
                                  </DropdownMenuItem>
                                )}
                                {canManage && template.status !== "ACTIVE" && !isPdfCertificate(template) && (
                                  <DropdownMenuItem onClick={() => void handleActivate(template)}>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Activate
                                  </DropdownMenuItem>
                                )}
                                {canManage && (
                                  <DropdownMenuItem
                                    onClick={() => openDeleteDialog(template)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {total > pageSize && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}{" "}
                    templates
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= Math.ceil(total / pageSize)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {createDialogOpen && (
        <TemplateEditorDialog
          open={createDialogOpen}
          onOpenChange={(open) => {
            setCreateDialogOpen(open);
            if (!open) setCreateAgreementPreset(null);
          }}
          mergeFields={mergeFields}
          onSubmit={handleCreate}
          mode="create"
          agreementPreset={createAgreementPreset}
        />
      )}

      {editDialogOpen && selectedTemplate && (
        <TemplateEditorDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          mergeFields={mergeFields}
          template={selectedTemplate}
          onSubmit={(data) => handleUpdate(selectedTemplate.id, data)}
          mode="edit"
        />
      )}

      {previewDialogOpen && selectedTemplate && (
        <TemplatePreviewDialog
          open={previewDialogOpen}
          onOpenChange={setPreviewDialogOpen}
          template={selectedTemplate}
        />
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedTemplate?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={certCreateOpen} onOpenChange={setCertCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New PDF certificate template</DialogTitle>
            <DialogDescription>
              Unique code used for env overrides. Upload a background and design field positions after creating.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Code</Label>
              <Input
                value={certForm.code}
                onChange={(e) => setCertForm((f) => ({ ...f, code: e.target.value }))}
                placeholder="HALAL_BUSINESS_CERT_V1"
              />
            </div>
            <div className="space-y-1">
              <Label>Name</Label>
              <Input
                value={certForm.name}
                onChange={(e) => setCertForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Halal business certificate 2026"
              />
            </div>
            <div className="space-y-1">
              <Label>Certificate type</Label>
              <Select
                value={certForm.certificateType}
                onValueChange={(v) =>
                  setCertForm((f) => ({ ...f, certificateType: v as HalalCertificateTemplateType }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HALAL_BUSINESS">Halal business certificate</SelectItem>
                  <SelectItem value="HALAL_PRODUCT">Halal product certificate</SelectItem>
                  <SelectItem value="MOSQUE_INSTITUTION">Mosque institution certificate</SelectItem>
                  <SelectItem value="MEMBERSHIP_ID">Membership ID / certificate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCertCreateOpen(false)}>
              Cancel
            </Button>
            <Button disabled={creatingCert} onClick={() => void handleCreateCertificate()}>
              {creatingCert ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {designTemplate && (
        <CertificateDesignerDialog
          open={!!designTemplate}
          onOpenChange={(o) => !o && setDesignTemplate(null)}
          template={designTemplate}
          onSaveLayout={handleSaveLayout}
        />
      )}
    </div>
  );
}

function TemplatePreviewDialog({
  open,
  onOpenChange,
  template,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: DocumentTemplate;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preview: {template.name}</DialogTitle>
          <DialogDescription>Template content preview</DialogDescription>
        </DialogHeader>
        <div className="mt-4 p-4 border rounded-lg bg-white">
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: template.content }} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
