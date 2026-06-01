import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  Building2,
  Image,
  Globe,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { resolveFileUrl } from "@/config/api";
import {
  getDocumentSettings,
  createDocumentSettings,
  updateDocumentSettings,
  uploadCertificateAsset,
  type DocumentSettings,
  type CreateDocumentSettingsData,
} from "@/services/documents";

type CertificateAssetKind = "signature" | "seal";

function CertificateAssetUploadBlock({
  label,
  description,
  imageUrl,
  inputId,
  uploading,
  disabled,
  onUpload,
}: {
  label: string;
  description: string;
  imageUrl: string;
  inputId: string;
  uploading: boolean;
  disabled?: boolean;
  onUpload: (file: File) => void;
}) {
  return (
    <div className="space-y-3 rounded-lg border p-4 bg-muted/30">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <Label className="text-sm font-medium">{label}</Label>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || uploading}
          onClick={() => document.getElementById(inputId)?.click()}
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5 mr-1.5" />
          )}
          {imageUrl ? "Replace image" : "Upload image"}
        </Button>
        <input
          id={inputId}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUpload(f);
            e.target.value = "";
          }}
        />
      </div>
      {imageUrl ? (
        <img
          src={resolveFileUrl(imageUrl) ?? imageUrl}
          alt={label}
          className="max-h-32 w-auto rounded-md border bg-white object-contain shadow-sm"
        />
      ) : (
        <p className="text-xs text-muted-foreground italic">No image uploaded yet.</p>
      )}
    </div>
  );
}

export default function DocumentSettingsPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("documents.manage");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState<CertificateAssetKind | null>(null);
  const [settings, setSettings] = useState<DocumentSettings | null>(null);

  const [formData, setFormData] = useState<CreateDocumentSettingsData>({
    companyName: "",
    companyLogo: "",
    headerText: "",
    footerText: "",
    stampImage: "",
    signatureImage: "",
    signatureName: "",
    signatureTitle: "",
    defaultLanguage: "EN",
    dateFormat: "DD/MM/YYYY",
    currency: "ETB",
    currencySymbol: "ETB",
    timezone: "Africa/Addis_Ababa",
    companyAddress: "",
    companyPhone: "",
    companyEmail: "",
    companyWebsite: "",
  });

  useEffect(() => {
    if (canManage) {
      loadSettings();
    }
  }, [canManage]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getDocumentSettings();
      setSettings(data);
      setFormData({
        companyName: data.companyName || "",
        companyLogo: data.companyLogo || "",
        headerText: data.headerText || "",
        footerText: data.footerText || "",
        stampImage: data.stampImage || "",
        signatureImage: data.signatureImage || "",
        signatureName: data.signatureName || "",
        signatureTitle: data.signatureTitle || "",
        defaultLanguage: data.defaultLanguage || "EN",
        dateFormat: data.dateFormat || "DD/MM/YYYY",
        currency: data.currency || "ETB",
        currencySymbol: data.currencySymbol || "ETB",
        timezone: data.timezone || "Africa/Addis_Ababa",
        companyAddress: data.companyAddress || "",
        companyPhone: data.companyPhone || "",
        companyEmail: data.companyEmail || "",
        companyWebsite: data.companyWebsite || "",
      });
    } catch (err: any) {
      if (err.response?.status === 404) {
        // Settings don't exist yet, that's okay
        console.log("No settings found, will create new ones");
      } else {
        console.error("Failed to load settings:", err);
        toast.error("Failed to load document settings");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCertificateAssetUpload = async (kind: CertificateAssetKind, file: File) => {
    if (!formData.companyName.trim()) {
      toast.error("Enter company name under Branding first, then upload signature or seal.");
      return;
    }

    setUploadingAsset(kind);
    try {
      const { url } = await uploadCertificateAsset(file);
      const patch =
        kind === "signature" ? { signatureImage: url } : { stampImage: url };

      if (settings) {
        const updated = await updateDocumentSettings(patch);
        setSettings(updated);
        setFormData((prev) => ({
          ...prev,
          ...(kind === "signature" ? { signatureImage: updated.signatureImage ?? url } : { stampImage: updated.stampImage ?? url }),
        }));
        toast.success(
          kind === "signature"
            ? "Signature image saved — used on all certificate PDFs"
            : "Seal image saved — used on all certificate PDFs"
        );
      } else {
        setFormData((prev) => ({
          ...prev,
          ...(kind === "signature" ? { signatureImage: url } : { stampImage: url }),
        }));
        toast.success("Image uploaded — click Save Settings below to store it permanently.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Upload failed");
    } finally {
      setUploadingAsset(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      toast.error("You don't have permission to manage document settings");
      return;
    }

    try {
      setSaving(true);
      if (settings) {
        await updateDocumentSettings(formData);
        toast.success("Document settings updated successfully");
      } else {
        await createDocumentSettings(formData);
        toast.success("Document settings created successfully");
      }
      await loadSettings();
    } catch (err: any) {
      console.error("Failed to save settings:", err);
      toast.error(err.response?.data?.message || "Failed to save document settings");
    } finally {
      setSaving(false);
    }
  };

  if (!canManage) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to manage document settings.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Document Settings</h1>
        <p className="text-gray-600 mt-1">
          Company branding, certificate signature/seal images (reused on every Halal certificate PDF), and localization
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="branding" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="stamp">Stamp & Signature</TabsTrigger>
            <TabsTrigger value="localization">Localization</TabsTrigger>
            <TabsTrigger value="contact">Contact Info</TabsTrigger>
          </TabsList>

          {/* Branding Tab */}
          <TabsContent value="branding">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Branding
                </CardTitle>
                <CardDescription>Configure company name, logo, and header/footer text</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>
                    Company Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label>Company Logo URL</Label>
                  <Input
                    value={formData.companyLogo}
                    onChange={(e) => setFormData({ ...formData, companyLogo: e.target.value })}
                    placeholder="https://example.com/logo.png"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    URL or path to company logo image
                  </p>
                </div>

                <div>
                  <Label>Header Text</Label>
                  <Textarea
                    value={formData.headerText}
                    onChange={(e) => setFormData({ ...formData, headerText: e.target.value })}
                    placeholder="Custom header text for documents"
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Footer Text</Label>
                  <Textarea
                    value={formData.footerText}
                    onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                    placeholder="Custom footer text for documents"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stamp & Signature Tab */}
          <TabsContent value="stamp">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Stamp & Signature
                </CardTitle>
                <CardDescription>
                  Upload signature and seal once. Halal certificate templates use these when you place{" "}
                  <strong>Signature</strong> and <strong>Seal</strong> image fields in the designer.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-sm text-muted-foreground rounded-lg border bg-muted/25 px-3 py-2">
                  PNG or JPEG with transparent background works best. Images are stored on the server and applied
                  automatically whenever a certificate PDF is generated or previewed.
                </p>

                <div className="grid gap-6 md:grid-cols-2">
                  <CertificateAssetUploadBlock
                    label="Signature image"
                    description="Scanned signature of the authorized signatory."
                    imageUrl={formData.signatureImage ?? ""}
                    inputId="doc-settings-signature-upload"
                    uploading={uploadingAsset === "signature"}
                    disabled={!formData.companyName.trim()}
                    onUpload={(file) => void handleCertificateAssetUpload("signature", file)}
                  />
                  <CertificateAssetUploadBlock
                    label="Seal / stamp image"
                    description="Official organization seal shown on certificates."
                    imageUrl={formData.stampImage ?? ""}
                    inputId="doc-settings-seal-upload"
                    uploading={uploadingAsset === "seal"}
                    disabled={!formData.companyName.trim()}
                    onUpload={(file) => void handleCertificateAssetUpload("seal", file)}
                  />
                </div>

                {!formData.companyName.trim() && (
                  <p className="text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 rounded-lg px-3 py-2">
                    Enter <strong>Company name</strong> on the Branding tab before uploading images.
                  </p>
                )}

                <div className="border-t pt-4 space-y-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Optional — signatory text
                  </p>
                <div>
                  <Label>Signature Name</Label>
                  <Input
                    value={formData.signatureName}
                    onChange={(e) => setFormData({ ...formData, signatureName: e.target.value })}
                    placeholder="Name of signatory"
                  />
                </div>

                <div>
                  <Label>Signature Title</Label>
                  <Input
                    value={formData.signatureTitle}
                    onChange={(e) => setFormData({ ...formData, signatureTitle: e.target.value })}
                    placeholder="Title of signatory (e.g., HR Manager)"
                  />
                </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Localization Tab */}
          <TabsContent value="localization">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Localization
                </CardTitle>
                <CardDescription>Configure date format, currency, and language settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Default Language</Label>
                  <Select
                    value={formData.defaultLanguage}
                    onValueChange={(value: "EN" | "AM" | "OR") =>
                      setFormData({ ...formData, defaultLanguage: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EN">English</SelectItem>
                      <SelectItem value="AM">Amharic</SelectItem>
                      <SelectItem value="OR">Oromo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Date Format</Label>
                  <Input
                    value={formData.dateFormat}
                    onChange={(e) => setFormData({ ...formData, dateFormat: e.target.value })}
                    placeholder="DD/MM/YYYY"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Examples: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
                  </p>
                </div>

                <div>
                  <Label>Currency</Label>
                  <Input
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    placeholder="ETB"
                  />
                </div>

                <div>
                  <Label>Currency Symbol</Label>
                  <Input
                    value={formData.currencySymbol}
                    onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                    placeholder="ETB"
                  />
                </div>

                <div>
                  <Label>Timezone</Label>
                  <Input
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    placeholder="Africa/Addis_Ababa"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    IANA timezone identifier (e.g., Africa/Addis_Ababa)
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Info Tab */}
          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Contact Information
                </CardTitle>
                <CardDescription>Company contact details for documents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Company Address</Label>
                  <Textarea
                    value={formData.companyAddress}
                    onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                    placeholder="Street address, City, Country"
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Company Phone</Label>
                  <Input
                    value={formData.companyPhone}
                    onChange={(e) => setFormData({ ...formData, companyPhone: e.target.value })}
                    placeholder="+251 XX XXX XXXX"
                  />
                </div>

                <div>
                  <Label>Company Email</Label>
                  <Input
                    type="email"
                    value={formData.companyEmail}
                    onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                    placeholder="info@company.com"
                  />
                </div>

                <div>
                  <Label>Company Website</Label>
                  <Input
                    value={formData.companyWebsite}
                    onChange={(e) => setFormData({ ...formData, companyWebsite: e.target.value })}
                    placeholder="https://www.company.com"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" variant="outline" onClick={loadSettings}>
            Reset
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

