import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import { toast } from "sonner";
import { resolveFileUrl } from "@/config/api";
import {
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getMergeFields,
  type DocumentTemplate,
  type CreateTemplateData,
  type UpdateTemplateData,
  getCategoryLabel,
  getStatusLabel,
  getStatusColor,
  getCategoryColor,
  type MergeField,
} from "@/services/documents";
import TemplateEditorDialog from "@/components/documents/TemplateEditorDialog";

export default function DocumentTemplatesPage() {
  const { hasPermission } = useAuth();
  const canView = hasPermission("documents.view");
  const canManage = hasPermission("documents.manage");

  // State
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("all");

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [createAgreementPreset, setCreateAgreementPreset] = useState<"halal" | null>(null);

  // Merge fields
  const [mergeFields, setMergeFields] = useState<MergeField>({});

  useEffect(() => {
    if (canView) {
      loadTemplates();
      loadMergeFields();
    }
  }, [canView, page, searchTerm, categoryFilter, statusFilter, activeFilter]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await listTemplates({
        page,
        pageSize,
        search: searchTerm || undefined,
        category: categoryFilter !== "all" ? categoryFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        active: activeFilter !== "all" ? (activeFilter === "true" ? true : false) : undefined,
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
      loadTemplates();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete template");
    }
  };

  const handleCreate = async (data: CreateTemplateData) => {
    try {
      await createTemplate(data);
      toast.success("Template created successfully");
      setCreateDialogOpen(false);
      loadTemplates();
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
      loadTemplates();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update template");
      throw err;
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
          <p className="text-gray-600">You don't have permission to view document templates.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Document Templates</h1>
          <p className="text-gray-600 mt-1">Manage document templates and generate letters</p>
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
              onClick={() => {
                setCreateAgreementPreset("halal");
                setCreateDialogOpen(true);
              }}
            >
              <Upload className="h-4 w-4 mr-2" />
              Halal agreement (blank)
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
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
            {(searchTerm || categoryFilter !== "all" || statusFilter !== "all" || activeFilter !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setCategoryFilter("all");
                  setStatusFilter("all");
                  setActiveFilter("all");
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Templates Table */}
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
                  <Button
                    onClick={() => {
                      setCreateAgreementPreset("halal");
                      setCreateDialogOpen(true);
                    }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Halal agreement (blank)
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
                      <TableHead>Status</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Generated</TableHead>
                      <TableHead>Source file</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">{template.name}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {template.code}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge className={getCategoryColor(template.category)}>
                            {getCategoryLabel(template.category)}
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
                          {template.sourceFileUrl ? (
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
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(template)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedTemplate(template);
                                  setPreviewDialogOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                              </DropdownMenuItem>
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
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {total > pageSize && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} templates
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

      {/* Create Template Dialog */}
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

      {/* Edit Template Dialog */}
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

      {/* Preview Dialog */}
      {previewDialogOpen && selectedTemplate && (
        <TemplatePreviewDialog
          open={previewDialogOpen}
          onOpenChange={setPreviewDialogOpen}
          template={selectedTemplate}
        />
      )}

      {/* Delete Confirmation Dialog */}
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
    </div>
  );
}

// Simple Preview Dialog Component
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
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: template.content }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

