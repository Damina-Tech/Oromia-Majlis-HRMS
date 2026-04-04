-- AlterTable: add lifecycle columns (businessId nullable first for backfill)
ALTER TABLE "HalalCertificate" ADD COLUMN "annualRenewalCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "HalalCertificate" ADD COLUMN "businessId" TEXT;
ALTER TABLE "HalalCertificate" ADD COLUMN "certificationCycleStartedAt" TIMESTAMP(3);

-- Backfill businessId from linked application
UPDATE "HalalCertificate" hc
SET "businessId" = a."businessId"
FROM "HalalApplication" a
WHERE hc."applicationId" = a.id AND hc."businessId" IS NULL;

-- Cycle start = issue date for existing certificates
UPDATE "HalalCertificate"
SET "certificationCycleStartedAt" = "issuedAt"
WHERE "certificationCycleStartedAt" IS NULL;

ALTER TABLE "HalalCertificate" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "HalalCertificate" ALTER COLUMN "certificationCycleStartedAt" SET NOT NULL;

-- AlterTable HalalRenewal
ALTER TABLE "HalalRenewal" ADD COLUMN "renewalKind" TEXT NOT NULL DEFAULT 'ANNUAL';

-- CreateIndex
CREATE INDEX "HalalCertificate_businessId_idx" ON "HalalCertificate"("businessId");

-- CreateIndex
CREATE INDEX "HalalCertificate_businessId_status_idx" ON "HalalCertificate"("businessId", "status");

-- AddForeignKey
ALTER TABLE "HalalCertificate" ADD CONSTRAINT "HalalCertificate_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "HalalBusiness"("id") ON DELETE CASCADE ON UPDATE CASCADE;
