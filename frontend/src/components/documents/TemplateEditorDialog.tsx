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
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
} from "lucide-react";
import { type DocumentTemplate, type CreateTemplateData, type UpdateTemplateData, type MergeField } from "@/services/documents";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TemplateEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mergeFields: MergeField;
  template?: DocumentTemplate;
  mode: "create" | "edit";
  onSubmit: (data: CreateTemplateData | UpdateTemplateData) => Promise<void>;
}

export default function TemplateEditorDialog({
  open,
  onOpenChange,
  mergeFields,
  template,
  mode,
  onSubmit,
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

  useEffect(() => {
    if (template && open) {
      setFormData({
        code: template.code,
        name: template.name,
        category: template.category,
        description: template.description || "",
        content: template.content,
        language: template.language,
        tags: template.tags?.join(", ") || "",
      });
    } else if (!template && open) {
      setFormData({
        code: "",
        name: "",
        category: "HR",
        description: "",
        content: "",
        language: "EN",
        tags: "",
      });
    }
  }, [template, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || !formData.name || !formData.content) {
      return;
    }

    const data: CreateTemplateData | UpdateTemplateData = {
      ...formData,
      tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    };

    await onSubmit(data);
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

