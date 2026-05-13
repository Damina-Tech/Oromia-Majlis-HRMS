-- Halal certification agreement: two-party document workflow (replaces checkbox acceptance).

ALTER TABLE "HalalApplication" ADD COLUMN "agreementTemplateUrl" TEXT;
ALTER TABLE "HalalApplication" ADD COLUMN "agreementOwnerSignedUrl" TEXT;
ALTER TABLE "HalalApplication" ADD COLUMN "agreementOwnerSubmittedAt" TIMESTAMP(3);
ALTER TABLE "HalalApplication" ADD COLUMN "agreementMajlisSignedUrl" TEXT;
ALTER TABLE "HalalApplication" ADD COLUMN "agreementMajlisApprovedAt" TIMESTAMP(3);

-- Migrate prior one-click acceptance when that column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'HalalApplication' AND column_name = 'certificationAgreementAcceptedAt'
  ) THEN
    UPDATE "HalalApplication"
    SET
      "agreementMajlisApprovedAt" = "certificationAgreementAcceptedAt",
      "agreementOwnerSubmittedAt" = "certificationAgreementAcceptedAt"
    WHERE "certificationAgreementAcceptedAt" IS NOT NULL;
    ALTER TABLE "HalalApplication" DROP COLUMN "certificationAgreementAcceptedAt";
  END IF;
END $$;

-- Applications already in later stages without populated agreement fields
UPDATE "HalalApplication" AS a
SET
  "agreementMajlisApprovedAt" = COALESCE(a."agreementMajlisApprovedAt", a."submittedAt", a."createdAt"),
  "agreementOwnerSubmittedAt" = COALESCE(a."agreementOwnerSubmittedAt", a."submittedAt", a."createdAt")
WHERE a."agreementMajlisApprovedAt" IS NULL
  AND (
    a."status" IN ('INSPECTION', 'REVIEW', 'APPROVED')
    OR EXISTS (SELECT 1 FROM "HalalInspection" i WHERE i."applicationId" = a."id")
  );
