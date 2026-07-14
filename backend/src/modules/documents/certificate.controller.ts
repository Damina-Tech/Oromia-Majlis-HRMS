import { Request, Response } from "express";
import prisma from "../../db/client.js";

import { z } from "zod";
import { HalalCertificateTemplateTypeEnum } from "./document.dto.js";

import {
  getCertificateFieldCatalog,
  buildSampleCertificateData,
} from "./certificate-field-catalog.js";
import { CertificateLayoutConfigSchema } from "./certificate-layout.types.js";
import { generateCertificatePdfBuffer } from "./certificate-pdf-generator.js";
import { parseLayoutConfig } from "./certificate-layout.types.js";

const PreviewCertificateDto = z.object({
  templateId: z.string().min(1),
  data: z.record(z.string(), z.string()).optional(),
});

/**
 * GET /documents/certificates/field-catalog/:certificateType
 */
export async function getCertificateFieldCatalogHandler(req: Request, res: Response) {
  try {
    const parsed = HalalCertificateTemplateTypeEnum.safeParse(req.params.certificateType);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid certificate type" });
    }
    const fields = getCertificateFieldCatalog(parsed.data);
    return res.json({ certificateType: parsed.data, fields });
  } catch (e: any) {
    return res.status(500).json({ message: e.message || "Failed to load field catalog" });
  }
}

/**
 * POST /documents/certificates/preview — returns application/pdf
 */
export async function previewCertificatePdf(req: Request, res: Response) {
  try {
    const body = PreviewCertificateDto.parse(req.body);
    const template = await prisma.documentTemplate.findUnique({ where: { id: body.templateId } });
    if (!template) return res.status(404).json({ message: "Template not found" });
    if (!template.sourceFileUrl?.trim()) {
      return res.status(400).json({ message: "Upload a PDF or image template first" });
    }
    const layout = parseLayoutConfig(template.layoutConfig);
    if (!layout?.fields?.length) {
      return res.status(400).json({ message: "Open the certificate designer and place at least one field" });
    }

    const data =
      body.data ??
      (template.certificateType
        ? await buildSampleCertificateData(template.certificateType)
        : {});

    const buffer = await generateCertificatePdfBuffer({
      sourceFileUrl: template.sourceFileUrl,
      layoutConfig: template.layoutConfig,
      data,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="certificate-preview.pdf"`);
    return res.send(buffer);
  } catch (e: any) {
    console.error("Certificate preview error:", e);
    return res.status(400).json({ message: e.message || "Failed to generate preview" });
  }
}

export { CertificateLayoutConfigSchema };
