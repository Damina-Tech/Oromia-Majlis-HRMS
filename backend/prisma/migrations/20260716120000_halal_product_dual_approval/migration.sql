-- Dual approval for Halal product certificates:
-- payment settled (Chapa or admin manual approve) + supervisor details approval before issuance.

ALTER TYPE "HalalProductCertificateStatus" ADD VALUE 'AWAITING_DETAILS_APPROVAL';

ALTER TABLE "HalalProductCertificate"
  ADD COLUMN IF NOT EXISTS "manualPaymentApprovedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "detailsApprovedById" TEXT,
  ADD COLUMN IF NOT EXISTS "detailsApprovedAt" TIMESTAMP(3);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'HalalProductCertificate_detailsApprovedById_fkey'
  ) THEN
    ALTER TABLE "HalalProductCertificate"
      ADD CONSTRAINT "HalalProductCertificate_detailsApprovedById_fkey"
      FOREIGN KEY ("detailsApprovedById") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
