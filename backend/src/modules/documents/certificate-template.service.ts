import { HalalCertificateTemplateType, DocumentTemplateEngine } from "@prisma/client";
import prisma from "../../db/client.js";

import { parseLayoutConfig } from "./certificate-layout.types.js";
import { generateCertificatePdfFromLayout } from "./certificate-pdf-generator.js";

export async function getActiveCertificateTemplateByCode(code: string) {
  const template = await prisma.documentTemplate.findFirst({
    where: {
      code,
      active: true,
      status: "ACTIVE",
      templateEngine: DocumentTemplateEngine.PDF_CERTIFICATE,
    },
  });
  if (!template?.sourceFileUrl?.trim()) return null;
  const layout = parseLayoutConfig(template.layoutConfig);
  if (!layout?.fields?.length) return null;
  return template;
}

export async function getActiveCertificateTemplateByType(certificateType: HalalCertificateTemplateType) {
  const template = await prisma.documentTemplate.findFirst({
    where: {
      certificateType,
      active: true,
      status: "ACTIVE",
      templateEngine: DocumentTemplateEngine.PDF_CERTIFICATE,
    },
    orderBy: { updatedAt: "desc" },
  });
  if (!template?.sourceFileUrl?.trim()) return null;
  const layout = parseLayoutConfig(template.layoutConfig);
  if (!layout?.fields?.length) return null;
  return template;
}

export async function renderCertificateToFile(params: {
  templateCode?: string;
  certificateType?: HalalCertificateTemplateType;
  data: Record<string, string>;
  outputFilePath: string;
}): Promise<{ templateId: string; templateCode: string } | null> {
  const template = params.templateCode
    ? await getActiveCertificateTemplateByCode(params.templateCode)
    : params.certificateType
      ? await getActiveCertificateTemplateByType(params.certificateType)
      : null;

  if (!template) return null;

  await generateCertificatePdfFromLayout({
    sourceFileUrl: template.sourceFileUrl!,
    layoutConfig: template.layoutConfig,
    data: params.data,
    outputFilePath: params.outputFilePath,
  });

  return { templateId: template.id, templateCode: template.code };
}
