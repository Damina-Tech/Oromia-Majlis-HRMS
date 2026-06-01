"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

export type HalalCertificatePdfPreviewState = {
  title: string;
  url: string | null;
  loading: boolean;
};

type Props = {
  preview: HalalCertificatePdfPreviewState | null;
  onClose: () => void;
};

export default function HalalCertificatePdfPreviewDialog({ preview, onClose }: Props) {
  return (
    <Dialog
      open={!!preview}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-4xl w-[95vw] h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <DialogTitle className="text-base pr-8">{preview?.title ?? "Certificate"}</DialogTitle>
          <DialogDescription className="sr-only">PDF preview</DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 px-4 pb-4">
          {preview?.loading ? (
            <div className="flex h-full min-h-[320px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : preview?.url ? (
            <iframe
              title={preview.title}
              src={preview.url}
              className="w-full h-full min-h-[320px] rounded-md border bg-muted/30"
            />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">Could not load certificate.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
