-- Signature/seal on product certs are optional; images come from DocumentSettings
ALTER TABLE "HalalProductCertificate" ALTER COLUMN "signature" DROP NOT NULL;
ALTER TABLE "HalalProductCertificate" ALTER COLUMN "seal" DROP NOT NULL;
