import { halalProductCertificateData } from "../documents/certificate-field-catalog.js";
import {
  getCertificateBrandingAssets,
  mergeCertificateBrandingIntoData,
} from "../documents/certificate-branding.service.js";

export type HalalProductCertificatePdfSource = {
  certificateNumber: string;
  businessName: string;
  parentCertificateId: string;
  productName: string;
  productAmount: string;
  destination: string;
  notes?: string | null;
  consignmentPcs: string;
  netWeightKg: string;
  grossWeightKg: string;
  shipping: string;
  voyageFlightNo: string;
  loadingPort: string;
  slaughteringDate: Date;
  productionDate: Date;
  expiryDate: Date;
  healthCertificateNo: string;
  slaughteringCertificate: string;
  authorizedRepresentative: string;
  issuedAt: Date;
};

export async function halalProductCertificatePdfData(
  row: HalalProductCertificatePdfSource,
  verifyUrl: string
): Promise<Record<string, string>> {
  const base = halalProductCertificateData({
    ...row,
    verifyUrl,
  });
  const branding = await getCertificateBrandingAssets();
  return mergeCertificateBrandingIntoData(base, branding);
}

/** Build PDF field source from a stored product certificate row. */
export function halalProductCertificatePdfSourceFromRow(
  pc: {
    productName: string;
    productAmount: string;
    destination: string;
    notes: string | null;
    consignmentPcs: string;
    netWeightKg: string;
    grossWeightKg: string;
    shipping: string;
    voyageFlightNo: string;
    loadingPort: string;
    slaughteringDate: Date;
    productionDate: Date;
    expiryDate: Date;
    healthCertificateNo: string;
    slaughteringCertificate: string;
    authorizedRepresentative: string;
    business: { name: string };
    halalCertificate: { certificateId: string };
  },
  certificateNumber: string,
  issuedAt: Date
): HalalProductCertificatePdfSource {
  return {
    certificateNumber,
    businessName: pc.business.name,
    parentCertificateId: pc.halalCertificate.certificateId,
    productName: pc.productName,
    productAmount: pc.productAmount,
    destination: pc.destination,
    notes: pc.notes,
    consignmentPcs: pc.consignmentPcs,
    netWeightKg: pc.netWeightKg,
    grossWeightKg: pc.grossWeightKg,
    shipping: pc.shipping,
    voyageFlightNo: pc.voyageFlightNo,
    loadingPort: pc.loadingPort,
    slaughteringDate: pc.slaughteringDate,
    productionDate: pc.productionDate,
    expiryDate: pc.expiryDate,
    healthCertificateNo: pc.healthCertificateNo,
    slaughteringCertificate: pc.slaughteringCertificate,
    authorizedRepresentative: pc.authorizedRepresentative,
    issuedAt,
  };
}
