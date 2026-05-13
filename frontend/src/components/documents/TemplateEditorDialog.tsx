import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Bold,
  Italic,
  Underline,
  List,
  Loader2,
} from "lucide-react";
import { type DocumentTemplate, type CreateTemplateData, type UpdateTemplateData, type MergeField, uploadTemplateSourceFile } from "@/services/documents";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const HALAL_AGREEMENT_DEFAULT_HTML = `<p><strong>Halal certification agreement</strong></p><p>This template is used with a printable PDF. Download the attached file, sign and stamp it, then upload the signed copy from the Halal application page.</p>`;

interface TemplateEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mergeFields: MergeField;
  template?: DocumentTemplate;
  mode: "create" | "edit";
  onSubmit: (data: CreateTemplateData | UpdateTemplateData) => Promise<void>;
  agreementPreset?: "halal" | null;
}

export default function TemplateEditorDialog({
  open,
  onOpenChange,
  mergeFields,
  template,
  mode,
  onSubmit,
  agreementPreset = null,
}: TemplateEditorDialogProps) {
  const [formData, setFormData] = useState({
    code: template?.code || "",
    name: template?.name || "",
    category: template?.category || ("HR" as const),
    description: template?.description || "",
    content: template?.content || "",
    language: template?.language || ("EN" as const),
    tags: template?.tags?.join(", ") || "",
  });

  const [activeTab, setActiveTab] = useState<"visual" | "html">("visual");
  const [selectedCategory, setSelectedCategory] = useState<string>("employee");
  const [showMergeFields, setShowMergeFields] = useState(false);
  const [sourceFileUrl, setSourceFileUrl] = useState("");
  const [uploadingSource, setUploadingSource] = useState(false);

  useEffect(() => {
    if (!open) {
      setSourceFileUrl("");
      setUploadingSource(false);
      return;
    }
    if (template) {
      setFormData({
        code: template.code,
        name: template.name,
        category: template.category,
        description: template.description || "",
        content: template.content,
        language: template.language,
        tags: template.tags?.join(", ") || "",
      });
      setSourceFileUrl(template.sourceFileUrl || "");
    } else if (agreementPreset === "halal" && mode === "create") {
      setFormData({
        code: "HALAL_CERTIFICATION_AGREEMENT",
        name: "Halal certification agreement (blank)",
        category: "CERTIFICATE",
        description: "Blank agreement for Halal certification. Upload the printable PDF below.",
        content: HALAL_AGREEMENT_DEFAULT_HTML,
        language: "EN",
        tags: "halal, agreement",
      });
      setSourceFileUrl("");
    } else {
      setFormData({
        code: "",
        name: "",
        category: "HR",
        description: "",
        content: "",
        language: "EN",
        tags: "",
      });
      setSourceFileUrl("");
    }
  }, [template, open, agreementPreset, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || !formData.name) {
      return;
    }
    if (!formData.content?.trim() && !sourceFileUrl) {
      toast.error("Add template HTML content or upload a PDF/DOC agreement file");
      return;
    }

    const tags = formData.tags ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];

    if (mode === "create") {
      const data: CreateTemplateData = {
        code: formData.code,
        name: formData.name,
        category: formData.category,
        description: formData.description || undefined,
        content: formData.content?.trim() || "<p></p>",
        language: formData.language,
        tags,
        sourceFileUrl: sourceFileUrl || undefined,
      };
      await onSubmit(data);
    } else {
      const data: UpdateTemplateData = {
        name: formData.name,
        category: formData.category,
        description: formData.description || undefined,
        content: formData.content,
        language: formData.language,
        tags,
        sourceFileUrl: sourceFileUrl || null,
      };
      await onSubmit(data);
    }
  };

  const insertMergeField = (field: string) => {
    const fieldPath = `${selectedCategory}.${field}`;
    const mergeTag = `{{${fieldPath}}}`;
    
    // Insert at cursor position or append
    const textarea = document.querySelector("#template-content") as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = formData.content;
      const newContent = text.substring(0, start) + mergeTag + text.substring(end);
      setFormData({ ...formData, content: newContent });
      
      // Restore cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + mergeTag.length, start + mergeTag.length);
      }, 0);
    } else {
      setFormData({ ...formData, content: formData.content + mergeTag });
    }
  };

  const getAvailableFields = (): string[] => {
    const category = mergeFields[selectedCategory as keyof MergeField];
    return category ? Object.keys(category) : [];
  };

  const formatContent = (action: string) => {
    const textarea = document.querySelector("#template-content") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.content.substring(start, end);
    let replacement = "";

    switch (action) {
      case "bold":
        replacement = `<strong>${selectedText || "bold text"}</strong>`;
        break;
      case "italic":
        replacement = `<em>${selectedText || "italic text"}</em>`;
        break;
      case "underline":
        replacement = `<u>${selectedText || "underlined text"}</u>`;
        break;
      case "ul":
        replacement = `<ul><li>${selectedText || "List item"}</li></ul>`;
        break;
      case "ol":
        replacement = `<ol><li>${selectedText || "List item"}</li></ol>`;
        break;
      case "p":
        replacement = `<p>${selectedText || "Paragraph"}</p>`;
        break;
      case "br":
        replacement = selectedText + "<br />";
        break;
      default:
        return;
    }

    const newContent =
      formData.content.substring(0, start) + replacement + formData.content.substring(end);
    setFormData({ ...formData, content: newContent });

    setTimeout(() => {
      textarea.focus();
      const newPos = action === "br" ? start + replacement.length : start + replacement.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create" : "Edit"} Document Template</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new document template with merge fields"
              : "Update the document template"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="code">
                Template Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="OFFER_LETTER"
                required
                disabled={mode === "edit"}
              />
              <p className="text-xs text-gray-500 mt-1">
                Unique identifier (e.g., OFFER_LETTER, APPOINTMENT_LETTER)
              </p>
            </div>

            <div>
              <Label htmlFor="name">
                Template Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Offer Letter"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">
                Category <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value: any) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="PAYROLL">Payroll</SelectItem>
                  <SelectItem value="LEGAL">Legal</SelectItem>
                  <SelectItem value="CERTIFICATE">Certificate</SelectItem>
                  <SelectItem value="WARNING">Warning</SelectItem>
                  <SelectItem value="CONTRACT">Contract</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="language">Language</Label>
              <Select
                value={formData.language}
                onValueChange={(value: any) => setFormData({ ...formData, language: value })}
              >
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EN">English</SelectItem>
                  <SelectItem value="AM">Amharic</SelectItem>
                  <SelectItem value="OR">Oromo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Template description..."
              rows={2}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="content">
                Template Content <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMergeFields(!showMergeFields)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Merge Fields
                </Button>
                <div className="flex gap-1 border rounded-md p-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => formatContent("bold")}
                    title="Bold"
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => formatContent("italic")}
                    title="Italic"
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => formatContent("underline")}
                    title="Underline"
                  >
                    <Underline className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => formatContent("ul")}
                    title="Bullet List"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Merge Fields Panel */}
            {showMergeFields && (
              <div className="mb-4 p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-semibold">Insert Merge Fields</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="department">Department</SelectItem>
                      <SelectItem value="payroll">Payroll</SelectItem>
                      <SelectItem value="company">Company</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-wrap gap-2">
                  {getAvailableFields().map((field) => {
                    const description =
                      mergeFields[selectedCategory as keyof MergeField]?.[field] || field;
                    return (
                      <Button
                        key={field}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => insertMergeField(field)}
                        title={description}
                      >
                        {field}
                      </Button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Click a field to insert it into your template at the cursor position
                </p>
              </div>
            )}

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList>
                <TabsTrigger value="visual">Visual Editor</TabsTrigger>
                <TabsTrigger value="html">HTML Source</TabsTrigger>
              </TabsList>
              <TabsContent value="visual" className="mt-4">
                <Textarea
                  id="template-content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Enter template content... Use {{field}} for merge fields"
                  rows={15}
                  className="font-mono text-sm"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  Tip: Use HTML tags for formatting (e.g., &lt;strong&gt;, &lt;p&gt;, &lt;br /&gt;)
                </p>
              </TabsContent>
              <TabsContent value="html" className="mt-4">
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="HTML content..."
                  rows={15}
                  className="font-mono text-sm"
                  required
                />
              </TabsContent>
            </Tabs>

            {/* Live Preview */}
            {formData.content && (
              <div className="mt-4">
                <Label>Preview</Label>
                <div className="mt-2 p-4 border rounded-lg bg-white min-h-[200px]">
                  <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: formData.content }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-4 space-y-3">
            <div>
              <Label>Printable agreement file (PDF / DOC)</Label>
              <p className="text-xs text-gray-500 mt-1">
                For Halal certification, applicants download this file from their application. You can keep the HTML
                above as short instructions; the uploaded file is what they print and sign.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                disabled={uploadingSource}
                className="max-w-md"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploadingSource(true);
                  try {
                    const { url } = await uploadTemplateSourceFile(file);
                    setSourceFileUrl(url);
                    toast.success("File attached to template");
                  } catch (err: unknown) {
                    const msg =
                      err && typeof err === "object" && "response" in err
                        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
                        : undefined;
                    toast.error(msg || "Upload failed");
                  } finally {
                    setUploadingSource(false);
                    e.target.value = "";
                  }
                }}
              />
              {uploadingSource ? <Loader2 className="h-4 w-4 animate-spin text-gray-500" aria-hidden /> : null}
            </div>
            {sourceFileUrl ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm">
                <code className="text-xs break-all text-gray-700">{sourceFileUrl}</code>
                <Button type="button" variant="outline" size="sm" onClick={() => setSourceFileUrl("")}>
                  Remove file
                </Button>
              </div>
            ) : null}
          </div>

          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="offer, letter, appointment"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{mode === "create" ? "Create" : "Update"} Template</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

