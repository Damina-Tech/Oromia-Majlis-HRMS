import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Download,
  Mail,
  Users,
  Building2,
  Eye,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { format as formatDate } from "date-fns";
import {
  listTemplates,
  generateDocument,
  previewTemplate,
  listGeneratedDocuments,
  downloadDocument,
  type DocumentTemplate,
  type GeneratedDocument,
  type GenerateDocumentData,
  type PreviewDocumentData,
} from "@/services/documents";
import { listEmployees, type Employee } from "@/services/employees";
import { listDepartments, type Department } from "@/services/departments";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function DocumentGenerationPage() {
  const { hasPermission } = useAuth();
  const canView = hasPermission("documents.view");
  const canManage = hasPermission("documents.manage");

  // State
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [generatedDocuments, setGeneratedDocuments] = useState<GeneratedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  
  // Search and filters for generated documents
  const [searchTerm, setSearchTerm] = useState("");
  const [templateFilter, setTemplateFilter] = useState<string>("all");
  const [dateFromFilter, setDateFromFilter] = useState<string>("");
  const [dateToFilter, setDateToFilter] = useState<string>("");

  // Generation form
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [generationMode, setGenerationMode] = useState<"single" | "multiple" | "department">("single");
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [sendEmail, setSendEmail] = useState(false);
  const [format, setFormat] = useState<"pdf" | "docx" | "html">("pdf");

  // Dialogs
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState<string>("");

  useEffect(() => {
    if (canView) {
      loadData();
    }
  }, [canView, page, searchTerm, templateFilter, dateFromFilter, dateToFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [templatesRes, employeesRes, departmentsRes] = await Promise.all([
        listTemplates({ active: true, status: "ACTIVE" }),
        listEmployees({ pageSize: 1000 }),
        listDepartments(),
      ]);

      setTemplates(templatesRes.items || []);
      setEmployees(employeesRes.items || []);
      setDepartments(departmentsRes || []);
      
      // Load generated documents with filters
      await loadGeneratedDocuments();
    } catch (err: any) {
      console.error("Failed to load data:", err);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const loadGeneratedDocuments = async () => {
    try {
      const query: any = {
        page,
        pageSize,
      };

      if (searchTerm) {
        query.search = searchTerm;
      }

      if (templateFilter !== "all") {
        query.templateId = templateFilter;
      }

      if (dateFromFilter) {
        query.dateFrom = dateFromFilter;
      }

      if (dateToFilter) {
        query.dateTo = dateToFilter;
      }

      const documentsRes = await listGeneratedDocuments(query);
      setGeneratedDocuments(documentsRes.items || []);
      setTotal(documentsRes.total || 0);
    } catch (err: any) {
      console.error("Failed to load generated documents:", err);
      toast.error("Failed to load generated documents");
    }
  };

  const handlePreview = async (employeeId?: string) => {
    if (!selectedTemplate) {
      toast.error("Please select a template");
      return;
    }

    try {
      const data: PreviewDocumentData = {
        templateId: selectedTemplate,
        employeeId,
        useSampleData: !employeeId,
      };

      const response = await previewTemplate(data);
      setPreviewContent(response.processed);
      setPreviewDialogOpen(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to preview template");
    }
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) {
      toast.error("Please select a template");
      return;
    }

    if (generationMode === "single" && selectedEmployees.length !== 1) {
      toast.error("Please select exactly one employee");
      return;
    }

    if (generationMode === "multiple" && selectedEmployees.length === 0) {
      toast.error("Please select at least one employee");
      return;
    }

    if (generationMode === "department" && !selectedDepartment) {
      toast.error("Please select a department");
      return;
    }

    try {
      setGenerating(true);

      const data: GenerateDocumentData = {
        templateId: selectedTemplate,
        email: sendEmail,
        format,
      };

      if (generationMode === "single") {
        data.employeeId = selectedEmployees[0];
      } else if (generationMode === "multiple") {
        data.employeeIds = selectedEmployees;
      } else if (generationMode === "department") {
        data.departmentId = selectedDepartment;
      }

      const response = await generateDocument(data);
      toast.success(response.message || "Documents generated successfully");
      
      // Reset form
      setSelectedTemplate("");
      setSelectedEmployees([]);
      setSelectedDepartment("");
      
      // Reload generated documents
      await loadGeneratedDocuments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to generate documents");
    } finally {
      setGenerating(false);
    }
  };

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to generate documents.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Generate Documents</h1>
        <p className="text-gray-600 mt-1">Generate documents from templates for employees</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generation Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Generation Settings</CardTitle>
              <CardDescription>Select template and target employees</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Template Selection */}
              <div>
                <Label>
                  Template <span className="text-red-500">*</span>
                </Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} ({template.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Generation Mode */}
              <div>
                <Label>Generation Mode</Label>
                <Select value={generationMode} onValueChange={(v: any) => setGenerationMode(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single Employee</SelectItem>
                    <SelectItem value="multiple">Multiple Employees</SelectItem>
                    <SelectItem value="department">Entire Department</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Single Employee Selection */}
              {generationMode === "single" && (
                <div>
                  <Label>Employee</Label>
                  <Select
                    value={selectedEmployees[0] || ""}
                    onValueChange={(value) => setSelectedEmployees([value])}
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
              )}

              {/* Multiple Employees Selection */}
              {generationMode === "multiple" && (
                <div>
                  <Label>Select Employees</Label>
                  <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                    {employees.map((emp) => (
                      <div key={emp.id} className="flex items-center space-x-2 py-2">
                        <Checkbox
                          checked={selectedEmployees.includes(emp.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedEmployees([...selectedEmployees, emp.id]);
                            } else {
                              setSelectedEmployees(selectedEmployees.filter((id) => id !== emp.id));
                            }
                          }}
                        />
                        <Label className="flex-1 cursor-pointer">
                          {emp.firstName} {emp.lastName} ({emp.employeeCode})
                        </Label>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {selectedEmployees.length} employee{selectedEmployees.length !== 1 ? "s" : ""}{" "}
                    selected
                  </p>
                </div>
              )}

              {/* Department Selection */}
              {generationMode === "department" && (
                <div>
                  <Label>Department</Label>
                  <Select
                    value={selectedDepartment}
                    onValueChange={setSelectedDepartment}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Options */}
              <div className="space-y-3">
                <Label>Options</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="email"
                    checked={sendEmail}
                    onCheckedChange={(checked) => setSendEmail(checked as boolean)}
                  />
                  <Label htmlFor="email" className="cursor-pointer">
                    Send via email
                  </Label>
                </div>
                <div>
                  <Label>Output Format</Label>
                  <Select value={format} onValueChange={(v: any) => setFormat(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="docx">DOCX</SelectItem>
                      <SelectItem value="html">HTML</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handlePreview(selectedEmployees[0])}
                  disabled={!selectedTemplate || generating}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={!selectedTemplate || generating}
                  className="flex-1"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Documents
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Generated Documents List */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>My Documents</CardTitle>
              <CardDescription>Generated documents</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search and Filters */}
              <div className="space-y-3 mb-4">
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Select value={templateFilter} onValueChange={setTemplateFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Templates" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Templates</SelectItem>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    placeholder="From Date"
                    value={dateFromFilter}
                    onChange={(e) => setDateFromFilter(e.target.value)}
                  />
                  <Input
                    type="date"
                    placeholder="To Date"
                    value={dateToFilter}
                    onChange={(e) => setDateToFilter(e.target.value)}
                  />
                </div>
                {(searchTerm || templateFilter !== "all" || dateFromFilter || dateToFilter) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm("");
                      setTemplateFilter("all");
                      setDateFromFilter("");
                      setDateToFilter("");
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : generatedDocuments.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No documents found</p>
              ) : (
                <>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {generatedDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.fileName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {doc.template.category}
                            </Badge>
                            <p className="text-xs text-gray-500">
                              {doc.employee
                                ? `${doc.employee.firstName} ${doc.employee.lastName}`
                                : "Bulk"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {doc.createdAt ? formatDate(new Date(doc.createdAt), "MMM dd, yyyy") : "N/A"}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadDocument(doc.id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  {total > pageSize && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <p className="text-sm text-gray-600">
                        Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}
                      </p>
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
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
            <DialogDescription>Preview of the generated document</DialogDescription>
          </DialogHeader>
          <div className="mt-4 p-6 border rounded-lg bg-white">
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: previewContent }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                if (selectedTemplate && selectedEmployees[0]) {
                  handleGenerate();
                  setPreviewDialogOpen(false);
                }
              }}
              disabled={!selectedTemplate || !selectedEmployees[0]}
            >
              Generate Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DocumentGenerationPage;
