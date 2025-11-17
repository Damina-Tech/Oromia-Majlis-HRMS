import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Plus,
  Download,
  Send,
  CheckCircle,
  Clock,
  Archive,
  Signature,
  Search,
  Filter,
} from "lucide-react";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [activeTab, setActiveTab] = useState("documents");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [generateDialog, setGenerateDialog] = useState(false);
  const [templateDialog, setTemplateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const [templateForm, setTemplateForm] = useState({
    name: "",
    description: "",
    category: "contract",
    templateContent: "",
  });

  const [generateForm, setGenerateForm] = useState({
    templateId: "",
    employeeId: "",
    employeeName: "",
    variables: {},
  });

  const addNotification = ({ title, message, type }) => {
    setNotifications((prev) => [
      ...prev,
      { id: uuidv4(), title, message, type },
    ]);
  };

  const addTemplate = (template) => {
    const newTemplate = { id: uuidv4(), ...template };
    setTemplates((prev) => [...prev, newTemplate]);
  };

  const generateDocument = (
    templateId,
    variables,
    employeeId,
    employeeName
  ) => {
    const template = templates.find((t) => t.id === templateId);
    const content = Object.entries(variables).reduce(
      (acc, [key, val]) => acc.replaceAll(`{{${key}}}`, val),
      template.templateContent
    );
    const newDocument = {
      id: uuidv4(),
      title: `${template.name} - ${employeeName}`,
      content,
      templateId,
      variables,
      employeeId,
      employeeName,
      status: "generated",
      createdAt: new Date(),
    };
    setDocuments((prev) => [...prev, newDocument]);
    return newDocument.id;
  };

  const sendDocument = (documentId) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === documentId ? { ...d, status: "sent" } : d))
    );
  };

  const archiveDocument = (documentId) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === documentId ? { ...d, status: "archived" } : d))
    );
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "signed":
        return <Signature className="h-4 w-4 text-blue-500" />;
      case "sent":
        return <Send className="h-4 w-4 text-yellow-500" />;
      case "generated":
        return <FileText className="h-4 w-4 text-gray-500" />;
      case "archived":
        return <Archive className="h-4 w-4 text-gray-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "signed":
        return "bg-blue-100 text-blue-800";
      case "sent":
        return "bg-yellow-100 text-yellow-800";
      case "generated":
        return "bg-gray-100 text-gray-800";
      case "archived":
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleAddTemplate = () => {
    if (!templateForm.name || !templateForm.templateContent) {
      addNotification({
        title: "Missing Information",
        message: "Please provide template name and content",
        type: "error",
      });
      return;
    }

    addTemplate({
      name: templateForm.name,
      description: templateForm.description,
      category: templateForm.category,
      templateContent: templateForm.templateContent,
      variables: extractVariables(templateForm.templateContent),
      isActive: true,
      createdBy: "1",
    });

    addNotification({
      title: "Template Created",
      message: `Template '${templateForm.name}' has been created`,
      type: "success",
    });

    setTemplateDialog(false);
    setTemplateForm({
      name: "",
      description: "",
      category: "contract",
      templateContent: "",
    });
  };

  const extractVariables = (content) => {
    const regex = /{{(\w+)}}/g;
    const variables = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      if (!variables.some((v) => v.name === match[1])) {
        variables.push({
          name: match[1],
          label: match[1].charAt(0).toUpperCase() + match[1].slice(1),
          type: "text",
          required: true,
        });
      }
    }
    return variables;
  };

  const handleGenerateDocument = () => {
    if (!generateForm.templateId || !generateForm.employeeId) {
      addNotification({
        title: "Missing Information",
        message: "Please select template and employee",
        type: "error",
      });
      return;
    }

    const template = templates.find((t) => t.id === generateForm.templateId);
    if (!template) return;

    const missingVars = template.variables.filter(
      (v) => v.required && !generateForm.variables[v.name]
    );
    if (missingVars.length > 0) {
      addNotification({
        title: "Missing Variables",
        message: `Please fill in: ${missingVars
          .map((v) => v.label)
          .join(", ")}`,
        type: "error",
      });
      return;
    }

    generateDocument(
      generateForm.templateId,
      generateForm.variables,
      generateForm.employeeId,
      generateForm.employeeName
    );

    addNotification({
      title: "Document Generated",
      message: `Document has been generated successfully`,
      type: "success",
    });

    setGenerateDialog(false);
    setGenerateForm({
      templateId: "",
      employeeId: "",
      employeeName: "",
      variables: {},
    });
  };

  const handleSendDocument = (documentId) => {
    sendDocument(documentId);
    addNotification({
      title: "Document Sent",
      message: "Document has been sent to the employee",
      type: "success",
    });
  };

  const handleArchiveDocument = (documentId) => {
    archiveDocument(documentId);
    addNotification({
      title: "Document Archived",
      message: "Document has been archived",
      type: "success",
    });
  };

  const stats = {
    total: documents.length,
    generated: documents.filter((d) => d.status === "generated").length,
    sent: documents.filter((d) => d.status === "sent").length,
    signed: documents.filter((d) => d.status === "signed").length,
    completed: documents.filter((d) => d.status === "completed").length,
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Documents & Letters
          </h1>
          <p className="text-muted-foreground">
            Manage document templates and generate employee documents
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={templateDialog} onOpenChange={setTemplateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">New Template</Button>
            </DialogTrigger>
          </Dialog>
          <Dialog open={generateDialog} onOpenChange={setGenerateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Generate Document
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Generated</CardTitle>
            <FileText className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {stats.generated}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
            <Send className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.sent}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Signed</CardTitle>
            <Signature className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.signed}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.completed}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Generated Documents</CardTitle>
                  <CardDescription>
                    All generated documents and their status
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search documents..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="generated">Generated</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="signed">Signed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((document) => (
                    <TableRow key={document.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{document.title}</div>
                            <div className="text-sm text-muted-foreground">
                              Version {document.version}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{document.employeeName}</TableCell>
                      <TableCell>{document.templateName}</TableCell>
                      <TableCell>
                        {format(document.createdAt, "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(document.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(document.status)}
                            {document.status.charAt(0).toUpperCase() +
                              document.status.slice(1)}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {document.pdfUrl && (
                            <Button size="sm" variant="outline">
                              <Download className="h-3 w-3" />
                            </Button>
                          )}
                          {document.status === "generated" && (
                            <Button
                              size="sm"
                              onClick={() => handleSendDocument(document.id)}
                            >
                              <Send className="h-3 w-3" />
                            </Button>
                          )}
                          {(document.status === "completed" ||
                            document.status === "signed") && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleArchiveDocument(document.id)}
                            >
                              <Archive className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Document Templates</CardTitle>
              <CardDescription>
                Manage document templates for generating employee documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Variables</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{template.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {template.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {template.category.charAt(0).toUpperCase() +
                            template.category.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {template.variables.slice(0, 3).map((variable) => (
                            <Badge
                              key={variable.name}
                              variant="secondary"
                              className="text-xs"
                            >
                              {variable.label}
                            </Badge>
                          ))}
                          {template.variables.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{template.variables.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(template.createdAt, "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            template.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {template.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedTemplate(template.id);
                            setGenerateForm((prev) => ({
                              ...prev,
                              templateId: template.id,
                              variables: {},
                            }));
                            setGenerateDialog(true);
                          }}
                        >
                          Use Template
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Generate Document Dialog */}
      <Dialog open={generateDialog} onOpenChange={setGenerateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate Document</DialogTitle>
            <DialogDescription>
              Generate a new document from a template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="template">Template</Label>
                <Select
                  value={generateForm.templateId}
                  onValueChange={(value) => {
                    const template = templates.find((t) => t.id === value);
                    setGenerateForm((prev) => ({
                      ...prev,
                      templateId: value,
                      variables: {},
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates
                      .filter((t) => t.isActive)
                      .map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="employee">Employee</Label>
                <Select
                  value={generateForm.employeeId}
                  onValueChange={(value) => {
                    setGenerateForm((prev) => ({
                      ...prev,
                      employeeId: value,
                      employeeName:
                        value === "emp-001"
                          ? "John Doe"
                          : value === "emp-002"
                          ? "Jane Smith"
                          : "Alice Johnson",
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emp-001">John Doe</SelectItem>
                    <SelectItem value="emp-002">Jane Smith</SelectItem>
                    <SelectItem value="emp-003">Alice Johnson</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {generateForm.templateId && (
              <div>
                <Label>Template Variables</Label>
                <div className="space-y-3 mt-2">
                  {templates
                    .find((t) => t.id === generateForm.templateId)
                    ?.variables.map((variable) => (
                      <div key={variable.name}>
                        <Label htmlFor={variable.name}>
                          {variable.label} {variable.required && "*"}
                        </Label>
                        {variable.type === "select" && variable.options ? (
                          <Select
                            value={generateForm.variables[variable.name] || ""}
                            onValueChange={(value) => {
                              setGenerateForm((prev) => ({
                                ...prev,
                                variables: {
                                  ...prev.variables,
                                  [variable.name]: value,
                                },
                              }));
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue
                                placeholder={`Select ${variable.label.toLowerCase()}`}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {variable.options.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            id={variable.name}
                            type={
                              variable.type === "date"
                                ? "date"
                                : variable.type === "number"
                                ? "number"
                                : "text"
                            }
                            value={generateForm.variables[variable.name] || ""}
                            onChange={(e) => {
                              setGenerateForm((prev) => ({
                                ...prev,
                                variables: {
                                  ...prev.variables,
                                  [variable.name]: e.target.value,
                                },
                              }));
                            }}
                            placeholder={
                              variable.defaultValue ||
                              `Enter ${variable.label.toLowerCase()}`
                            }
                          />
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setGenerateDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleGenerateDocument}>
                Generate Document
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Template Dialog */}
      <Dialog open={templateDialog} onOpenChange={setTemplateDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Document Template</DialogTitle>
            <DialogDescription>
              Create a new document template with variables
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={templateForm.name}
                  onChange={(e) =>
                    setTemplateForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="e.g., Offer Letter"
                />
              </div>
              <div>
                <Label htmlFor="template-category">Category</Label>
                <Select
                  value={templateForm.category}
                  onValueChange={(value) =>
                    setTemplateForm((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="offer">Offer Letter</SelectItem>
                    <SelectItem value="policy">Policy</SelectItem>
                    <SelectItem value="form">Form</SelectItem>
                    <SelectItem value="certificate">Certificate</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="template-description">Description</Label>
              <Textarea
                id="template-description"
                value={templateForm.description}
                onChange={(e) =>
                  setTemplateForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Brief description of the template"
              />
            </div>

            <div>
              <Label htmlFor="template-content">Template Content</Label>
              <Textarea
                id="template-content"
                value={templateForm.templateContent}
                onChange={(e) =>
                  setTemplateForm((prev) => ({
                    ...prev,
                    templateContent: e.target.value,
                  }))
                }
                placeholder="Enter template content. Use {{variableName}} for dynamic content."
                className="min-h-[200px] font-mono"
              />
              <div className="text-sm text-muted-foreground mt-1">
            
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setTemplateDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAddTemplate}>Create Template</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
