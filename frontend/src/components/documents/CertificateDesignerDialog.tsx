"use client";

import React, { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";
import * as pdfjsLib from "pdfjs-dist";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { resolveFileUrl } from "@/config/api";
import {
  type CertificateLayoutConfig,
  type CertificateLayoutField,
  DEFAULT_FIELD_SIZE,
  getCertificatePageDimensions,
} from "./certificateFieldCatalog";
import {
  getCertificateFieldCatalog,
  previewCertificatePdf,
  type DocumentTemplate,
  type HalalCertificateTemplateType,
} from "@/services/documents";

 // Serve worker from /public as .js so nginx always uses application/javascript
// (some servers omit .mjs MIME; X-Content-Type-Options: nosniff then breaks pdf.js).
pdfjsLib.GlobalWorkerOptions.workerSrc = `${import.meta.env.BASE_URL}pdf.worker.min.js`;

const DISPLAY_SCALE = 0.72;

type FabricFieldObject = fabric.Object & {
  fieldKey?: string;
  fieldLabel?: string;
  fieldType?: "text" | "date" | "qrcode" | "image";
};

type CatalogField = { key: string; label: string; type: "text" | "date" | "qrcode" | "image" };

function createFieldObject(
  field: CatalogField,
  layout?: Partial<CertificateLayoutField>
): fabric.Group {
  const defaults = DEFAULT_FIELD_SIZE[field.type];
  const w = (layout?.width ?? defaults.width) * DISPLAY_SCALE;
  const h = (layout?.height ?? defaults.height) * DISPLAY_SCALE;
  const left = (layout?.x ?? 40) * DISPLAY_SCALE;
  const top = (layout?.y ?? 40) * DISPLAY_SCALE;

  const rect = new fabric.Rect({
    width: w,
    height: h,
    fill:
      field.type === "qrcode"
        ? "rgba(13, 148, 136, 0.12)"
        : field.type === "image"
          ? "rgba(234, 179, 8, 0.15)"
          : "rgba(255, 255, 255, 0.85)",
    stroke: field.type === "qrcode" ? "#0d9488" : field.type === "image" ? "#ca8a04" : "#0369a1",
    strokeWidth: 1.5,
    rx: 2,
    ry: 2,
  });

  const text = new fabric.Text(field.label, {
    fontSize: Math.min(11, h * 0.35),
    fill: "#0f172a",
    fontFamily: "Helvetica, Arial, sans-serif",
    originX: "center",
    originY: "center",
    left: w / 2,
    top: h / 2,
    textAlign: "center",
    width: w - 8,
  });

  const group = new fabric.Group([rect, text], {
    left,
    top,
    hasControls: true,
    hasBorders: true,
    lockRotation: true,
    subTargetCheck: true,
  }) as FabricFieldObject;

  group.fieldKey = field.key;
  group.fieldLabel = field.label;
  group.fieldType = field.type;
  return group;
}

async function loadBackgroundImageUrl(url: string): Promise<string> {
  const lower = url.toLowerCase().split("?")[0];
  if (lower.endsWith(".pdf")) {
    const loadingTask = pdfjsLib.getDocument(url);
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    await page.render({ canvasContext: ctx, viewport }).promise;
    return canvas.toDataURL("image/png");
  }
  return url;
}

function loadFabricImage(url: string): Promise<fabric.Image> {
  const isDataOrBlob = url.startsWith("data:") || url.startsWith("blob:");
  return new Promise((resolve, reject) => {
    fabric.Image.fromURL(
      url,
      (img) => {
        if (!img) {
          reject(new Error("Failed to load template image"));
          return;
        }
        resolve(img);
      },
      isDataOrBlob ? undefined : { crossOrigin: "anonymous" }
    );
  });
}

function disposeFabricCanvas(canvas: fabric.Canvas | null) {
  if (!canvas) return;
  try {
    canvas.dispose();
  } catch {
    /* already torn down */
  }
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: DocumentTemplate;
  onSaveLayout: (layout: CertificateLayoutConfig) => Promise<void>;
};

export default function CertificateDesignerDialog({ open, onOpenChange, template, onSaveLayout }: Props) {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const initTokenRef = useRef(0);
  const catalogRef = useRef<CatalogField[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [catalog, setCatalog] = useState<CatalogField[]>([]);
  const [placedKeys, setPlacedKeys] = useState<Set<string>>(new Set());
  /** Remount canvas DOM when dialog opens or template file changes (avoids Fabric insertBefore errors). */
  const [canvasMountKey, setCanvasMountKey] = useState(0);

  const pageDims = getCertificatePageDimensions(template.certificateType);
  const canvasW = (template.layoutConfig?.pageWidth ?? pageDims.width) * DISPLAY_SCALE;
  const canvasH = (template.layoutConfig?.pageHeight ?? pageDims.height) * DISPLAY_SCALE;

  useEffect(() => {
    if (!open || !template.certificateType) {
      setCatalog([]);
      return;
    }
    let cancelled = false;
    getCertificateFieldCatalog(template.certificateType as HalalCertificateTemplateType)
      .then((res) => {
        if (!cancelled) setCatalog(res.fields);
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load field catalog");
      });
    return () => {
      cancelled = true;
    };
  }, [open, template.certificateType]);

  catalogRef.current = catalog;

  useEffect(() => {
    if (open && template.sourceFileUrl) {
      setCanvasMountKey((k) => k + 1);
    }
  }, [open, template.id, template.sourceFileUrl]);

  useEffect(() => {
    if (!open || !template.sourceFileUrl) {
      disposeFabricCanvas(fabricRef.current);
      fabricRef.current = null;
      return;
    }

    const token = ++initTokenRef.current;
    const el = canvasElRef.current;
    if (!el) return;

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      disposeFabricCanvas(fabricRef.current);
      fabricRef.current = null;

      const canvas = new fabric.Canvas(el, {
        width: canvasW,
        height: canvasH,
        selection: true,
        preserveObjectStacking: true,
      });
      fabricRef.current = canvas;

      try {
        const resolved = resolveFileUrl(template.sourceFileUrl!);
        if (!resolved) throw new Error("Invalid template file URL");
        const bgUrl = await loadBackgroundImageUrl(resolved);
        if (cancelled || token !== initTokenRef.current) return;

        const img = await loadFabricImage(bgUrl);
        if (cancelled || token !== initTokenRef.current || fabricRef.current !== canvas) return;

        img.set({
          left: 0,
          top: 0,
          selectable: false,
          evented: false,
        });
        const scaleX = canvasW / (img.width || canvasW);
        const scaleY = canvasH / (img.height || canvasH);
        img.scale(Math.min(scaleX, scaleY));

        canvas.setBackgroundImage(img, () => {
          if (cancelled || token !== initTokenRef.current || fabricRef.current !== canvas) return;
          canvas.requestRenderAll();
        });

        const layout = template.layoutConfig;
        if (layout?.fields?.length) {
          for (const f of layout.fields) {
            const cat: CatalogField = catalogRef.current.find((c) => c.key === f.key) ?? {
              key: f.key,
              label: f.label,
              type: f.type,
            };
            canvas.add(createFieldObject(cat, f));
          }
          setPlacedKeys(new Set(layout.fields.map((f) => f.key)));
        } else {
          setPlacedKeys(new Set());
        }
      } catch (e: unknown) {
        if (!cancelled && token === initTokenRef.current) {
          const msg = e instanceof Error ? e.message : "Failed to load designer";
          toast.error(msg);
        }
      } finally {
        if (!cancelled && token === initTokenRef.current) {
          setLoading(false);
        }
      }
    };

    const frame = requestAnimationFrame(() => {
      void run();
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      disposeFabricCanvas(fabricRef.current);
      fabricRef.current = null;
    };
  }, [open, canvasMountKey, template.sourceFileUrl, template.layoutConfig, canvasW, canvasH]);

  const syncPlacedKeys = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const keys = new Set<string>();
    canvas.getObjects().forEach((obj) => {
      const fo = obj as FabricFieldObject;
      if (fo.fieldKey) keys.add(fo.fieldKey);
    });
    setPlacedKeys(keys);
  };

  const addField = (field: CatalogField) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    if (placedKeys.has(field.key)) {
      toast.info("Field already on canvas — select and drag to reposition");
      return;
    }
    const offset = canvas.getObjects().length * 12;
    const obj = createFieldObject(field, { x: 48 + offset, y: 120 + offset });
    canvas.add(obj);
    canvas.setActiveObject(obj);
    canvas.requestRenderAll();
    syncPlacedKeys();
  };

  const removeSelected = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active) {
      canvas.remove(active);
      canvas.discardActiveObject();
      canvas.requestRenderAll();
      syncPlacedKeys();
    }
  };

  const buildLayoutConfig = (): CertificateLayoutConfig => {
    const canvas = fabricRef.current!;
    const fields: CertificateLayoutField[] = [];
    canvas.getObjects().forEach((obj) => {
      const fo = obj as FabricFieldObject;
      if (!fo.fieldKey) return;
      const bound = fo.getBoundingRect(true);
      fields.push({
        key: fo.fieldKey,
        label: fo.fieldLabel ?? fo.fieldKey,
        type: fo.fieldType ?? "text",
        x: Math.round(bound.left / DISPLAY_SCALE),
        y: Math.round(bound.top / DISPLAY_SCALE),
        width: Math.round(bound.width / DISPLAY_SCALE),
        height: Math.round(bound.height / DISPLAY_SCALE),
        fontSize: fo.fieldType === "qrcode" ? undefined : 12,
        align: "left",
      });
    });
    return {
      version: 1,
      pageWidth: template.layoutConfig?.pageWidth ?? pageDims.width,
      pageHeight: template.layoutConfig?.pageHeight ?? pageDims.height,
      fields,
    };
  };

  const handleSave = async () => {
    const layout = buildLayoutConfig();
    if (layout.fields.length === 0) {
      toast.error("Place at least one field on the template");
      return;
    }
    setSaving(true);
    try {
      await onSaveLayout(layout);
      toast.success("Layout saved");
      onOpenChange(false);
    } catch (e: unknown) {
      const msg = e && typeof e === "object" && "response" in e
        ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      toast.error(msg ?? "Failed to save layout");
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    setPreviewing(true);
    try {
      const layout = buildLayoutConfig();
      await onSaveLayout(layout);
      const blob = await previewCertificatePdf(template.id);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e: unknown) {
      const msg = e && typeof e === "object" && "response" in e
        ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      toast.error(msg ?? "Preview failed — save layout and ensure template file is valid");
    } finally {
      setPreviewing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1100px] max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Certificate designer — {template.name}</DialogTitle>
          <DialogDescription>
            Drag fields onto the template. Positions are saved as JSON and used by pdf-lib when certificates are issued
            (Halal business/product and mosque institution recognition).
          </DialogDescription>
        </DialogHeader>

        {!template.sourceFileUrl ? (
          <p className="text-sm text-amber-700 px-1">Upload a PDF or image template before using the designer.</p>
        ) : (
          <div className="flex flex-col lg:flex-row gap-4 min-h-0 flex-1 overflow-hidden">
            <div className="lg:w-52 shrink-0 space-y-2 overflow-y-auto max-h-[60vh]">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Available fields</p>
              {catalog.map((f) => (
                <Button
                  key={f.key}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left h-auto py-2"
                  onClick={() => addField(f)}
                  disabled={loading}
                >
                  <span className="truncate">{f.label}</span>
                  <Badge variant="secondary" className="ml-auto text-[10px] shrink-0">
                    {f.type}
                  </Badge>
                </Button>
              ))}
              <Button type="button" variant="ghost" size="sm" className="w-full text-red-600" onClick={removeSelected}>
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Remove selected
              </Button>
            </div>

            <div className="flex-1 min-w-0 overflow-auto flex justify-center bg-muted/40 rounded-lg p-3 relative min-h-[480px]">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 z-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
              <div key={canvasMountKey} className="inline-block">
                <canvas ref={canvasElRef} width={canvasW} height={canvasH} />
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="outline" disabled={previewing || saving || loading} onClick={() => void handlePreview()}>
            {previewing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            Preview PDF
          </Button>
          <Button type="button" disabled={saving || loading || !template.sourceFileUrl} onClick={() => void handleSave()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save layout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
