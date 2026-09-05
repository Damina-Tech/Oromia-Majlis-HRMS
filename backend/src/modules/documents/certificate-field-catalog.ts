import type { HalalCertificateTemplateType } from "@prisma/client";
import {
  getCertificateBrandingAssets,
  mergeCertificateBrandingIntoData,
} from "./certificate-branding.service.js";

export type CertificateCatalogField = {
  key: string;
  label: string;
  type: "text" | "date" | "qrcode" | "image";
  sampleValue?: string;
};

const HALAL_BUSINESS_FIELDS: CertificateCatalogField[] = [
  { key: "certificateId", label: "Certificate ID", type: "text", sampleValue: "HAL-2026-0001" },
  { key: "businessName", label: "Business name", type: "text", sampleValue: "Sample Halal Business PLC" },
  { key: "category", label: "Category", type: "text", sampleValue: "Food processing" },
  { key: "issuedAt", label: "Issued date", type: "date" },
  { key: "expiresAt", label: "Expires date", type: "date" },
  { key: "signature", label: "Signature (uploaded asset)", type: "image" },
  { key: "seal", label: "Seal (uploaded asset)", type: "image" },
  { key: "qrCode", label: "Verification QR", type: "qrcode" },
];

const HALAL_PRODUCT_FIELDS: CertificateCatalogField[] = [
  { key: "certificateNumber", label: "Certificate number", type: "text", sampleValue: "HAL-P-2026-00001" },
  { key: "businessName", label: "Business name", type: "text", sampleValue: "Sample Halal Business PLC" },
  { key: "parentCertificateId", label: "Parent Halal certificate", type: "text", sampleValue: "HAL-2026-0001" },
  { key: "productName", label: "Product name", type: "text", sampleValue: "Halal beef export batch" },
  { key: "productAmount", label: "Amount / quantity (legacy)", type: "text", sampleValue: "12,000 kg" },
  { key: "consignmentPcs", label: "Consignment details (PCS)", type: "text", sampleValue: "240 cartons" },
  { key: "netWeightKg", label: "Net weight (kg)", type: "text", sampleValue: "12,000" },
  { key: "grossWeightKg", label: "Gross weight (kg)", type: "text", sampleValue: "12,480" },
  { key: "shipping", label: "Shipping", type: "text", sampleValue: "Air freight" },
  { key: "voyageFlightNo", label: "Voyage / flight no.", type: "text", sampleValue: "ET 302" },
  { key: "loadingPort", label: "Loading port", type: "text", sampleValue: "Addis Ababa Airport" },
  { key: "destination", label: "Destination", type: "text", sampleValue: "Dubai, UAE" },
  { key: "slaughteringDate", label: "Slaughtering date", type: "date" },
  { key: "productionDate", label: "Production date", type: "date" },
  { key: "expiryDate", label: "Expiry date", type: "date" },
  { key: "healthCertificateNo", label: "Health certificate no.", type: "text", sampleValue: "HC-2026-001" },
  { key: "slaughteringCertificate", label: "Slaughtering certificate", type: "text", sampleValue: "SC-2026-001" },
  { key: "authorizedRepresentative", label: "Authorized representative", type: "text", sampleValue: "Ahmed Hassan" },
  { key: "signature", label: "Signature (uploaded asset)", type: "image" },
  { key: "seal", label: "Seal (uploaded asset)", type: "image" },
  { key: "notes", label: "Notes", type: "text", sampleValue: "Batch #A-42" },
  { key: "issuedAt", label: "Issued date", type: "date" },
  { key: "qrCode", label: "Verification QR", type: "qrcode" },
];

const MOSQUE_INSTITUTION_FIELDS: CertificateCatalogField[] = [
  { key: "certificateNumber", label: "Certificate number", type: "text", sampleValue: "IRR-2026-00001" },
  { key: "zoneCity", label: "Zone / City", type: "text", sampleValue: "East Shewa" },
  { key: "districtSubcity", label: "District / Sub-City", type: "text", sampleValue: "Adama" },
  { key: "kebele", label: "Kebele", type: "text", sampleValue: "Ganda 05" },
  { key: "mosqueName", label: "Mosque name", type: "text", sampleValue: "Al-Huda Mosque" },
  { key: "issueDate", label: "Date", type: "date" },
  { key: "qrCode", label: "Verification QR", type: "qrcode" },
];

const MEMBERSHIP_ID_FIELDS: CertificateCatalogField[] = [
  { key: "photo", label: "Member photo", type: "image" },
  { key: "certificateId", label: "Lakk ID / Certificate ID", type: "text", sampleValue: "MAJ-2026-0001" },
  { key: "fullName", label: "Full name", type: "text", sampleValue: "Ahmed Hassan Ali" },
  { key: "position", label: "Position / job role", type: "text", sampleValue: "Teacher" },
  { key: "membershipRole", label: "Membership role", type: "text", sampleValue: "Regular Member" },
  { key: "phone", label: "Phone number", type: "text", sampleValue: "0912345678" },
  { key: "issuedAt", label: "Issued date", type: "date" },
  { key: "expiresAt", label: "Expiry date", type: "date" },
  { key: "zone", label: "Zone / City", type: "text", sampleValue: "East Shewa" },
  { key: "cityDistrict", label: "City / District (Aanaa)", type: "text", sampleValue: "Adama" },
  { key: "kebele", label: "Kebele (Ganda)", type: "text", sampleValue: "Ganda 05" },
  { key: "mosque", label: "Mosque", type: "text", sampleValue: "Al-Huda Mosque" },
  { key: "signature", label: "Signature (uploaded asset)", type: "image" },
  { key: "seal", label: "Stamp / seal (uploaded asset)", type: "image" },
  { key: "qrCode", label: "Verification QR", type: "qrcode" },
];

export function getCertificateFieldCatalog(
  certificateType: HalalCertificateTemplateType
): CertificateCatalogField[] {
  switch (certificateType) {
    case "HALAL_BUSINESS":
      return HALAL_BUSINESS_FIELDS;
    case "HALAL_PRODUCT":
      return HALAL_PRODUCT_FIELDS;
    case "MOSQUE_INSTITUTION":
      return MOSQUE_INSTITUTION_FIELDS;
    case "MEMBERSHIP_ID":
      return MEMBERSHIP_ID_FIELDS;
    default:
      return [];
  }
}

export async function buildSampleCertificateData(
  certificateType: HalalCertificateTemplateType
): Promise<Record<string, string>> {
  const fields = getCertificateFieldCatalog(certificateType);
  const now = new Date();
  const issued = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const expires = new Date(now);
  expires.setFullYear(expires.getFullYear() + 1);
  const expiresStr = expires.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const base = process.env.FRONTEND_URL || "http://localhost:8080";

  const data: Record<string, string> = {};
  for (const f of fields) {
    if (f.type === "date") {
      if (f.key === "expiresAt") data[f.key] = expiresStr;
      else if (f.key === "expiryDate") data[f.key] = expiresStr;
      else data[f.key] = issued;
    } else if (f.type === "qrcode") {
      data[f.key] =
        certificateType === "HALAL_BUSINESS"
          ? `${base}/verify/HAL-2026-0001`
          : certificateType === "HALAL_PRODUCT"
            ? `${base}/verify/HAL-P-2026-00001`
            : certificateType === "MEMBERSHIP_ID"
              ? `${base}/verify/MAJ-2026-0001`
              : `${base}/verify/IRR-2026-00001`;
    } else if (f.type === "image") {
      data[f.key] = "";
    } else {
      data[f.key] = f.sampleValue ?? `[${f.label}]`;
    }
  }
  const branding = await getCertificateBrandingAssets();
  return mergeCertificateBrandingIntoData(data, {
    signatureImageUrl: branding.signatureImageUrl,
    sealImageUrl: branding.sealImageUrl,
  });
}

/** Map Halal business certificate issuance params to layout field keys */
export function halalBusinessCertificateData(params: {
  certificateId: string;
  businessName: string;
  category: string;
  issuedAt: Date;
  expiresAt: Date;
  verifyUrl: string;
}): Record<string, string> {
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  return {
    certificateId: params.certificateId,
    businessName: params.businessName,
    category: params.category.replace(/_/g, " "),
    issuedAt: fmt(params.issuedAt),
    expiresAt: fmt(params.expiresAt),
    qrCode: params.verifyUrl,
  };
}

/** Map Halal product certificate issuance params to layout field keys */
export function halalProductCertificateData(params: {
  certificateNumber: string;
  businessName: string;
  parentCertificateId: string;
  productName: string;
  productAmount: string;
  consignmentPcs: string;
  netWeightKg: string;
  grossWeightKg: string;
  shipping: string;
  voyageFlightNo: string;
  loadingPort: string;
  destination: string;
  slaughteringDate: Date;
  productionDate: Date;
  expiryDate: Date;
  healthCertificateNo: string;
  slaughteringCertificate: string;
  authorizedRepresentative: string;
  notes?: string | null;
  issuedAt: Date;
  verifyUrl: string;
}): Record<string, string> {
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  return {
    certificateNumber: params.certificateNumber,
    businessName: params.businessName,
    parentCertificateId: params.parentCertificateId,
    productName: params.productName,
    productAmount: params.productAmount,
    consignmentPcs: params.consignmentPcs,
    netWeightKg: params.netWeightKg,
    grossWeightKg: params.grossWeightKg,
    shipping: params.shipping,
    voyageFlightNo: params.voyageFlightNo,
    loadingPort: params.loadingPort,
    destination: params.destination,
    slaughteringDate: fmt(params.slaughteringDate),
    productionDate: fmt(params.productionDate),
    expiryDate: fmt(params.expiryDate),
    healthCertificateNo: params.healthCertificateNo,
    slaughteringCertificate: params.slaughteringCertificate,
    authorizedRepresentative: params.authorizedRepresentative,
    notes: params.notes?.trim() ?? "",
    issuedAt: fmt(params.issuedAt),
    qrCode: params.verifyUrl,
  };
}

function fmtDateDMY(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/** Map mosque institution recognition issuance params to layout field keys */
export function mosqueInstitutionCertificateData(params: {
  certificateNumber: string;
  zoneCityAdmin: string;
  districtSubcity: string;
  gandaKebele: string;
  institutionNameOnCert: string;
  issueDate: Date;
  verifyUrl: string;
}): Record<string, string> {
  return {
    certificateNumber: params.certificateNumber,
    zoneCity: params.zoneCityAdmin,
    districtSubcity: params.districtSubcity,
    kebele: params.gandaKebele,
    mosqueName: params.institutionNameOnCert,
    issueDate: fmtDateDMY(params.issueDate),
    qrCode: params.verifyUrl,
  };
}

const MEMBERSHIP_CATEGORY_LABELS: Record<string, string> = {
  REGULAR_MEMBER: "Regular Member",
  BUSINESS_OWNER: "Business Owner",
  YOUTH_WOMEN_COUNCIL: "Youth / Women Council",
  FARMER: "Farmer",
  ELDER_MOTHER: "Elder / Mother",
};

function pickCategoryDataString(data: Record<string, unknown> | null | undefined, keys: string[]): string {
  if (!data) return "";
  for (const key of keys) {
    const v = data[key];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (Array.isArray(v) && v.length) return v.map(String).filter(Boolean).join(", ");
  }
  return "";
}

/** Map membership ID card issuance params to layout field keys */
export function membershipIdCertificateData(params: {
  certificateId: string;
  fullName: string;
  phone: string;
  category: string;
  categoryData?: Record<string, unknown> | null;
  zoneName?: string | null;
  woredaName?: string | null;
  addressLine?: string | null;
  profilePhotoUrl?: string | null;
  issuedAt: Date;
  expiresAt: Date;
  verifyUrl: string;
}): Record<string, string> {
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const cd = params.categoryData ?? {};
  const position = pickCategoryDataString(cd, [
    "position",
    "jobTitle",
    "gaeeHojii",
    "teachingLocation",
    "communityRole",
    "businessType",
    "leadershipExperience",
    "academicQualification",
  ]);
  const mosque = pickCategoryDataString(cd, ["mosque", "mosqueName", "masjiida", "placeOfStudy"]);
  const kebele =
    pickCategoryDataString(cd, ["kebele", "ganda", "gandaKebele"]) || (params.addressLine ?? "").trim();

  return {
    certificateId: params.certificateId,
    fullName: params.fullName,
    position,
    membershipRole: MEMBERSHIP_CATEGORY_LABELS[params.category] ?? params.category.replace(/_/g, " "),
    phone: params.phone,
    issuedAt: fmt(params.issuedAt),
    expiresAt: fmt(params.expiresAt),
    zone: (params.zoneName ?? "").trim(),
    cityDistrict: (params.woredaName ?? "").trim(),
    kebele,
    mosque,
    photo: params.profilePhotoUrl?.trim() ?? "",
    qrCode: params.verifyUrl,
  };
}
