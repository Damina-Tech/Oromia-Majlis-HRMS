"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Award, Loader2, Pencil, Plus, Settings, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  createTemplate,
  listTemplates,
  updateTemplate,
  uploadTemplateSourceFile,
  type CertificateLayoutConfig,
  type DocumentTemplate,
  type HalalCertificateTemplateType,
} from "@/services/documents";
import CertificateDesignerDialog from "@/components/documents/CertificateDesignerDialog";

const CERT_TYPE_LABEL: Record<HalalCertificateTemplateType, string> = {
  HALAL_BUSINESS: "Halal business certificate",
  HALAL_PRODUCT: "Halal product certificate",
  MOSQUE_INSTITUTION: "Mosque institution certificate",
};

export default function CertificateTemplatesPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("documents.manage");

  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [designTemplate, setDesignTemplate] = useState<DocumentTemplate | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    code: "",
    name: "",
    certificateType: "HALAL_BUSINESS" as HalalCertificateTemplateType,
  });
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listTemplates({
        templateEngine: "PDF_CERTIFICATE",
        pageSize: 50,
        sortBy: "updatedAt",
        sortOrder: "desc",
      });
      setTemplates(res.items ?? []);
    } catch {
      toast.error("Failed to load certificate templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      toast.error("Code and name are required");
      return;
    }
    setCreating(true);
    try {
      await createTemplate({
        code: form.code.trim(),
        name: form.name.trim(),
        category: "CERTIFICATE",
        templateEngine: "PDF_CERTIFICATE",
        certificateType: form.certificateType,
        tags: ["halal", form.certificateType.toLowerCase()],
      });
      toast.success("Template created — upload a PDF/image background, then open the designer");
      setCreateOpen(false);
      setForm({ code: "", name: "", certificateType: "HALAL_BUSINESS" });
      void load();
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? "Failed to create template");
    } finally {
      setCreating(false);
    }
  };

  const handleUpload = async (templateId: string, file: File) => {
    setUploadingId(templateId);
    try {
      const { url } = await uploadTemplateSourceFile(file);
      const updated = await updateTemplate(templateId, { sourceFileUrl: url });
      toast.success("Template file uploaded");
      setTemplates((prev) => prev.map((t) => (t.id === templateId ? updated : t)));
      if (designTemplate?.id === templateId) {
        setDesignTemplate(updated);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? "Upload failed");
    } finally {
      setUploadingId(null);
    }
  };

  const handleSaveLayout = async (layout: CertificateLayoutConfig) => {
    if (!designTemplate) return;
    const updated = await updateTemplate(designTemplate.id, { layoutConfig: layout });
    setDesignTemplate(updated);
    void load();
  };

  const handleActivate = async (t: DocumentTemplate) => {
    try {
      await updateTemplate(t.id, { status: "ACTIVE", active: true });
      toast.success(
        "Template activated — other templates of the same type were archived. Halal View/Download will use this layout."
      );
      void load();
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? "Failed to activate");
    }
  };

  if (!canManage) {
    return (
      <div className="p-6 text-muted-foreground text-sm">You need documents.manage permission to edit certificate templates.</div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Award className="h-7 w-7 text-emerald-600" />
            Certificate templates
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Design PDF layouts for Halal business/product certificates and more certificates here.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New template
        </Button>
      </div>

      <div className="rounded-lg border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-amber-950 dark:text-amber-100">
          Upload <strong>signature</strong> and <strong>seal</strong> images once under Document Settings, then place
          those fields in the designer below.
        </p>
        <Button variant="outline" size="sm" className="shrink-0" asChild>
          <Link to="/documents/settings">
            <Settings className="h-3.5 w-3.5 mr-1.5" />
            Document settings
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Templates</CardTitle>
          <CardDescription>
            Upload background PDF or image, place fields in the designer (including consignment, weights, shipping, dates,
            and authorization fields for product certificates), then activate.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : templates.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">No certificate templates yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Layout</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div className="font-medium">{t.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{t.code}</div>
                    </TableCell>
                    <TableCell>
                      {t.certificateType ? CERT_TYPE_LABEL[t.certificateType] : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={t.status === "ACTIVE" ? "default" : "outline"}>{t.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {t.sourceFileUrl ? "Background ✓" : "No file"}
                      {t.layoutConfig?.fields?.length
                        ? ` · ${t.layoutConfig.fields.length} field(s)`
                        : ""}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={uploadingId === t.id}
                        onClick={() => {
                          const input = document.getElementById(`cert-upload-${t.id}`) as HTMLInputElement | null;
                          input?.click();
                        }}
                      >
                        {uploadingId === t.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Upload className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <input
                        id={`cert-upload-${t.id}`}
                        type="file"
                        accept=".pdf,image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void handleUpload(t.id, f);
                          e.target.value = "";
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!t.sourceFileUrl || uploadingId === t.id}
                        onClick={() => {
                          const row = templates.find((x) => x.id === t.id) ?? t;
                          setDesignTemplate(row);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1" />
                        Design
                      </Button>
                      {t.status !== "ACTIVE" && (
                        <Button size="sm" variant="secondary" onClick={() => void handleActivate(t)}>
                          Activate
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New certificate template</DialogTitle>
            <DialogDescription>Unique code used for env overrides and identification.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Code</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                placeholder="HALAL_BUSINESS_CERT_V1"
              />
            </div>
            <div className="space-y-1">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Halal business certificate 2026"
              />
            </div>
            <div className="space-y-1">
              <Label>Certificate type</Label>
              <Select
                value={form.certificateType}
                onValueChange={(v) => setForm((f) => ({ ...f, certificateType: v as HalalCertificateTemplateType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HALAL_BUSINESS">Halal business certificate</SelectItem>
                  <SelectItem value="HALAL_PRODUCT">Halal product certificate</SelectItem>
                  <SelectItem value="MOSQUE_INSTITUTION">Mosque institution certificate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button disabled={creating} onClick={() => void handleCreate()}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
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
