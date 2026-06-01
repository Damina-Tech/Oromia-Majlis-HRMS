-- Halal product certificate consignment / shipment fields
ALTER TABLE "HalalProductCertificate" ADD COLUMN IF NOT EXISTS "consignmentPcs" TEXT;
ALTER TABLE "HalalProductCertificate" ADD COLUMN IF NOT EXISTS "netWeightKg" TEXT;
ALTER TABLE "HalalProductCertificate" ADD COLUMN IF NOT EXISTS "grossWeightKg" TEXT;
ALTER TABLE "HalalProductCertificate" ADD COLUMN IF NOT EXISTS "shipping" TEXT;
ALTER TABLE "HalalProductCertificate" ADD COLUMN IF NOT EXISTS "voyageFlightNo" TEXT;
ALTER TABLE "HalalProductCertificate" ADD COLUMN IF NOT EXISTS "loadingPort" TEXT NOT NULL DEFAULT 'Addis Ababa Airport';
ALTER TABLE "HalalProductCertificate" ADD COLUMN IF NOT EXISTS "slaughteringDate" TIMESTAMP(3);
ALTER TABLE "HalalProductCertificate" ADD COLUMN IF NOT EXISTS "productionDate" TIMESTAMP(3);
ALTER TABLE "HalalProductCertificate" ADD COLUMN IF NOT EXISTS "expiryDate" TIMESTAMP(3);
ALTER TABLE "HalalProductCertificate" ADD COLUMN IF NOT EXISTS "healthCertificateNo" TEXT;
ALTER TABLE "HalalProductCertificate" ADD COLUMN IF NOT EXISTS "slaughteringCertificate" TEXT;
ALTER TABLE "HalalProductCertificate" ADD COLUMN IF NOT EXISTS "authorizedRepresentative" TEXT;
ALTER TABLE "HalalProductCertificate" ADD COLUMN IF NOT EXISTS "signature" TEXT;
ALTER TABLE "HalalProductCertificate" ADD COLUMN IF NOT EXISTS "seal" TEXT;

UPDATE "HalalProductCertificate"
SET
  "consignmentPcs" = COALESCE("consignmentPcs", ''),
  "netWeightKg" = COALESCE("netWeightKg", "productAmount", ''),
  "grossWeightKg" = COALESCE("grossWeightKg", ''),
  "shipping" = COALESCE("shipping", ''),
  "voyageFlightNo" = COALESCE("voyageFlightNo", ''),
  "loadingPort" = COALESCE("loadingPort", 'Addis Ababa Airport'),
  "slaughteringDate" = COALESCE("slaughteringDate", "createdAt"),
  "productionDate" = COALESCE("productionDate", "createdAt"),
  "expiryDate" = COALESCE("expiryDate", "createdAt" + interval '1 year'),
  "healthCertificateNo" = COALESCE("healthCertificateNo", ''),
  "slaughteringCertificate" = COALESCE("slaughteringCertificate", ''),
  "authorizedRepresentative" = COALESCE("authorizedRepresentative", ''),
  "signature" = COALESCE("signature", ''),
  "seal" = COALESCE("seal", '');

ALTER TABLE "HalalProductCertificate" ALTER COLUMN "consignmentPcs" SET NOT NULL;
ALTER TABLE "HalalProductCertificate" ALTER COLUMN "netWeightKg" SET NOT NULL;
ALTER TABLE "HalalProductCertificate" ALTER COLUMN "grossWeightKg" SET NOT NULL;
ALTER TABLE "HalalProductCertificate" ALTER COLUMN "shipping" SET NOT NULL;
ALTER TABLE "HalalProductCertificate" ALTER COLUMN "voyageFlightNo" SET NOT NULL;
ALTER TABLE "HalalProductCertificate" ALTER COLUMN "slaughteringDate" SET NOT NULL;
ALTER TABLE "HalalProductCertificate" ALTER COLUMN "productionDate" SET NOT NULL;
ALTER TABLE "HalalProductCertificate" ALTER COLUMN "expiryDate" SET NOT NULL;
ALTER TABLE "HalalProductCertificate" ALTER COLUMN "healthCertificateNo" SET NOT NULL;
ALTER TABLE "HalalProductCertificate" ALTER COLUMN "slaughteringCertificate" SET NOT NULL;
ALTER TABLE "HalalProductCertificate" ALTER COLUMN "authorizedRepresentative" SET NOT NULL;
ALTER TABLE "HalalProductCertificate" ALTER COLUMN "signature" SET NOT NULL;
ALTER TABLE "HalalProductCertificate" ALTER COLUMN "seal" SET NOT NULL;
