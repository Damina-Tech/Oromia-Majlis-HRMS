import type { CertificateLayoutConfig } from "../documents/certificate-layout.types.js";

/** A4 landscape in PDF points (72 dpi). */
export const MOSQUE_CERT_PAGE_WIDTH = 841.89;
export const MOSQUE_CERT_PAGE_HEIGHT = 595.28;

export const MOSQUE_INSTITUTION_CERT_TEMPLATE_CODE = "MOSQUE_INSTITUTION_CERT_V1";

/**
 * Default field positions for the ORIASC mosque recognition certificate background.
 * Calibrated for `mosque-certificate.jpg` (1277×920 px) scaled to A4 landscape.
 */
export const DEFAULT_MOSQUE_INSTITUTION_CERTIFICATE_LAYOUT: CertificateLayoutConfig = {
  version: 1,
  pageWidth: MOSQUE_CERT_PAGE_WIDTH,
  pageHeight: MOSQUE_CERT_PAGE_HEIGHT,
  fields: [
    {
      key: "qrCode",
      label: "Verification QR",
      type: "qrcode",
      x: 30,
      y: 86,
      width: 92,
      height: 92,
    },
    {
      key: "certificateNumber",
      label: "Certificate number",
      type: "text",
      x: 646,
      y: 45,
      width: 145,
      height: 28,
      fontSize: 10,
      fontWeight: "bold",
      align: "center",
      color: "#111827",
    },
    {
      key: "zoneCity",
      label: "Zone / City",
      type: "text",
      x: 343,
      y: 126,
      width: 230,
      height: 16,
      fontSize: 9.5,
      align: "left",
      color: "#111827",
    },
    {
      key: "districtSubcity",
      label: "District / Sub-City",
      type: "text",
      x: 228,
      y: 142,
      width: 200,
      height: 16,
      fontSize: 9.5,
      align: "left",
      color: "#111827",
    },
    {
      key: "kebele",
      label: "Kebele",
      type: "text",
      x: 188,
      y: 158,
      width: 140,
      height: 16,
      fontSize: 9.5,
      align: "left",
      color: "#111827",
    },
    {
      key: "mosqueName",
      label: "Mosque name",
      type: "text",
      x: 234,
      y: 175,
      width: 350,
      height: 18,
      fontSize: 10,
      fontWeight: "bold",
      align: "left",
      color: "#7f1d1d",
    },
    {
      key: "issueDate",
      label: "Date",
      type: "date",
      x: 58,
      y: 262,
      width: 120,
      height: 16,
      fontSize: 9.5,
      align: "left",
      color: "#111827",
    },
  ],
};
