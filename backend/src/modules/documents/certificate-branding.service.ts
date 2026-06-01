import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export type CertificateBrandingAssets = {
  signatureImageUrl: string;
  sealImageUrl: string;
};

/** Organization-wide signature & seal images (DocumentSettings), reused on all certificate PDFs. */
export async function getCertificateBrandingAssets(): Promise<CertificateBrandingAssets> {
  const settings = await prisma.documentSettings.findFirst({
    where: { isActive: true },
    select: { signatureImage: true, stampImage: true },
  });
  return {
    signatureImageUrl: settings?.signatureImage?.trim() ?? "",
    sealImageUrl: settings?.stampImage?.trim() ?? "",
  };
}

/** Layout field keys `signature` and `seal` receive uploaded image paths from settings. */
export function mergeCertificateBrandingIntoData(
  data: Record<string, string>,
  branding: CertificateBrandingAssets
): Record<string, string> {
  return {
    ...data,
    signature: branding.signatureImageUrl || data.signature || "",
    seal: branding.sealImageUrl || data.seal || "",
  };
}
