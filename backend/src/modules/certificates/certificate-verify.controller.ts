import { Request, Response } from "express";
import {
  HalalCertificateStatus,
  HalalCompetencyStatus,
  HalalProductCertificateStatus,
  InstitutionRecognitionStatus,
  PrismaClient,
} from "@prisma/client";

const prisma = new PrismaClient();

export type CertificateVerifyType =
  | "HALAL_BUSINESS"
  | "HALAL_PRODUCT"
  | "HALAL_COMPETENCY"
  | "MEMBERSHIP"
  | "INSTITUTION_RECOGNITION";

type VerifyField = { label: string; value: string };

type UnifiedVerifyResult = {
  found: boolean;
  valid: boolean;
  status: "Verified" | "Expired" | "Invalid" | "Not found";
  type: CertificateVerifyType | null;
  typeLabel: string | null;
  certificateCode: string;
  subjectName: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  fields: VerifyField[];
  verifiedAt: string;
  message?: string;
};

function notFound(code: string): UnifiedVerifyResult {
  return {
    found: false,
    valid: false,
    status: "Not found",
    type: null,
    typeLabel: null,
    certificateCode: code,
    subjectName: null,
    issuedAt: null,
    expiresAt: null,
    fields: [],
    verifiedAt: new Date().toISOString(),
    message: "No certificate found for this code.",
  };
}

function detectPreferredOrder(code: string): CertificateVerifyType[] {
  const upper = code.toUpperCase();
  if (upper.startsWith("HAL-COMP-")) {
    return ["HALAL_COMPETENCY", "HALAL_BUSINESS", "HALAL_PRODUCT", "MEMBERSHIP", "INSTITUTION_RECOGNITION"];
  }
  if (upper.startsWith("HAL-P-")) {
    return ["HALAL_PRODUCT", "HALAL_BUSINESS", "HALAL_COMPETENCY", "MEMBERSHIP", "INSTITUTION_RECOGNITION"];
  }
  if (upper.startsWith("IRR-")) {
    return ["INSTITUTION_RECOGNITION", "MEMBERSHIP", "HALAL_BUSINESS", "HALAL_PRODUCT", "HALAL_COMPETENCY"];
  }
  if (upper.startsWith("MAJ-")) {
    return ["MEMBERSHIP", "INSTITUTION_RECOGNITION", "HALAL_BUSINESS", "HALAL_PRODUCT", "HALAL_COMPETENCY"];
  }
  if (upper.startsWith("HAL-")) {
    return ["HALAL_BUSINESS", "HALAL_PRODUCT", "HALAL_COMPETENCY", "MEMBERSHIP", "INSTITUTION_RECOGNITION"];
  }
  return ["HALAL_BUSINESS", "HALAL_PRODUCT", "HALAL_COMPETENCY", "MEMBERSHIP", "INSTITUTION_RECOGNITION"];
}

async function lookupHalalBusiness(code: string): Promise<UnifiedVerifyResult | null> {
  const cert = await prisma.halalCertificate.findUnique({
    where: { certificateId: code },
    include: { application: { include: { business: true } } },
  });
  if (!cert) return null;
  const now = new Date();
  const valid = cert.status === HalalCertificateStatus.VALID && now < cert.expiresAt;
  const status: UnifiedVerifyResult["status"] =
    cert.status !== HalalCertificateStatus.VALID ? "Invalid" : valid ? "Verified" : "Expired";
  return {
    found: true,
    valid,
    status,
    type: "HALAL_BUSINESS",
    typeLabel: "Halal Certificate",
    certificateCode: cert.certificateId,
    subjectName: cert.application.business.name,
    issuedAt: cert.issuedAt.toISOString(),
    expiresAt: cert.expiresAt.toISOString(),
    fields: [
      { label: "Business", value: cert.application.business.name },
      { label: "Category", value: String(cert.application.business.category || "").replace(/_/g, " ") || "—" },
      { label: "Certificate status", value: cert.status.replace(/_/g, " ") },
    ],
    verifiedAt: now.toISOString(),
  };
}

async function lookupHalalProduct(code: string): Promise<UnifiedVerifyResult | null> {
  const row = await prisma.halalProductCertificate.findUnique({
    where: { certificateNumber: code },
    include: { business: true, halalCertificate: true },
  });
  if (!row || row.status !== HalalProductCertificateStatus.ISSUED) return null;
  const parentOk =
    row.halalCertificate.status === HalalCertificateStatus.VALID && new Date() < row.halalCertificate.expiresAt;
  const valid = true;
  const fields: VerifyField[] = [
    { label: "Business", value: row.business.name },
    { label: "Product", value: row.productName },
    { label: "Amount", value: row.productAmount },
    { label: "Destination", value: row.destination },
  ];
  if (!parentOk) {
    fields.push({
      label: "Note",
      value: "Parent business Halal certificate may be expired or invalid",
    });
  }
  return {
    found: true,
    valid,
    status: "Verified",
    type: "HALAL_PRODUCT",
    typeLabel: "Halal Product Certificate",
    certificateCode: row.certificateNumber!,
    subjectName: row.productName,
    issuedAt: row.issuedAt?.toISOString() ?? null,
    expiresAt: null,
    fields,
    verifiedAt: new Date().toISOString(),
  };
}

async function lookupHalalCompetency(code: string): Promise<UnifiedVerifyResult | null> {
  const row = await prisma.halalCompetencyCertificate.findUnique({
    where: { certificateNumber: code },
  });
  if (!row || row.status !== HalalCompetencyStatus.ISSUED || !row.certificateNumber) return null;
  const expiresAt = row.expiresAt ? new Date(row.expiresAt) : null;
  const notExpired = expiresAt ? expiresAt.getTime() >= Date.now() : false;
  const valid = notExpired;
  return {
    found: true,
    valid,
    status: valid ? "Verified" : "Expired",
    type: "HALAL_COMPETENCY",
    typeLabel: "Halal Competency Certificate",
    certificateCode: row.certificateNumber,
    subjectName: row.fullName,
    issuedAt: row.issuedAt?.toISOString() ?? null,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    fields: [
      { label: "Holder", value: row.fullName },
      { label: "Employer", value: row.employerName },
      ...(row.jobTitle ? [{ label: "Role", value: row.jobTitle }] : []),
    ],
    verifiedAt: new Date().toISOString(),
  };
}

async function lookupMembership(code: string): Promise<UnifiedVerifyResult | null> {
  const cert = await prisma.membershipCertificate.findUnique({
    where: { certificateId: code },
    include: {
      member: {
        include: {
          region: { select: { name: true } },
          zone: { select: { name: true } },
          woreda: { select: { name: true } },
        },
      },
      subscription: { include: { plan: true } },
    },
  });
  if (!cert) return null;
  const now = new Date();
  const valid = cert.expiresAt >= now;
  const location = [cert.member.region?.name, cert.member.zone?.name, cert.member.woreda?.name]
    .filter(Boolean)
    .join(", ");
  return {
    found: true,
    valid,
    status: valid ? "Verified" : "Expired",
    type: "MEMBERSHIP",
    typeLabel: "Membership Certificate",
    certificateCode: cert.certificateId,
    subjectName: cert.member.fullName,
    issuedAt: cert.issuedAt.toISOString(),
    expiresAt: cert.expiresAt.toISOString(),
    fields: [
      { label: "Member", value: cert.member.fullName },
      { label: "Category", value: String(cert.member.category || "").replace(/_/g, " ") },
      { label: "Plan", value: cert.subscription.plan.name },
      ...(location ? [{ label: "Location", value: location }] : []),
    ],
    verifiedAt: now.toISOString(),
  };
}

async function lookupInstitutionRecognition(code: string): Promise<UnifiedVerifyResult | null> {
  const rec = await prisma.institutionRecognition.findFirst({
    where: { certificateNumber: code, status: InstitutionRecognitionStatus.COMPLETED },
    include: {
      institution: {
        include: {
          region: { select: { name: true } },
          zone: { select: { name: true } },
          woreda: { select: { name: true } },
        },
      },
    },
  });
  if (!rec || !rec.certificateNumber) return null;
  const location = [rec.zoneCityAdmin, rec.districtSubcity, rec.gandaKebele].filter(Boolean).join(" · ");
  return {
    found: true,
    valid: true,
    status: "Verified",
    type: "INSTITUTION_RECOGNITION",
    typeLabel: "Institution Recognition",
    certificateCode: rec.certificateNumber,
    subjectName: rec.institutionNameOnCert || rec.institution.name,
    issuedAt: rec.issuedAt?.toISOString() ?? rec.issueDate?.toISOString() ?? null,
    expiresAt: null,
    fields: [
      { label: "Institution", value: rec.institution.name },
      { label: "Type", value: String(rec.institution.type || "").replace(/_/g, " ") },
      ...(location ? [{ label: "Location", value: location }] : []),
      { label: "Registry status", value: String(rec.institution.status || "").replace(/_/g, " ") },
    ],
    verifiedAt: new Date().toISOString(),
  };
}

const LOOKUPS: Record<CertificateVerifyType, (code: string) => Promise<UnifiedVerifyResult | null>> = {
  HALAL_BUSINESS: lookupHalalBusiness,
  HALAL_PRODUCT: lookupHalalProduct,
  HALAL_COMPETENCY: lookupHalalCompetency,
  MEMBERSHIP: lookupMembership,
  INSTITUTION_RECOGNITION: lookupInstitutionRecognition,
};

/**
 * Public: GET /api/v1/certificates/verify/:code
 * Resolves any known certificate type by code and returns a compact verification payload.
 */
export async function verifyAnyCertificate(req: Request, res: Response) {
  try {
    const code = String(req.params.code || "").trim();
    if (!code) {
      return res.status(400).json({ ...notFound(""), message: "Certificate code is required" });
    }

    const order = detectPreferredOrder(code);
    for (const type of order) {
      const result = await LOOKUPS[type](code);
      if (result) return res.json(result);
    }

    return res.status(404).json(notFound(code));
  } catch (e: any) {
    res.status(500).json({
      ...notFound(String(req.params.code || "")),
      message: e.message || "Verification failed",
    });
  }
}
