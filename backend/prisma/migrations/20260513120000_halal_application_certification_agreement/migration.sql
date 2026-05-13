-- AlterTable
ALTER TABLE "HalalApplication" ADD COLUMN "certificationAgreementAcceptedAt" TIMESTAMP(3);

-- Existing applications already in inspection workflow: treat agreement as accepted
UPDATE "HalalApplication" AS a
SET "certificationAgreementAcceptedAt" = COALESCE(a."submittedAt", a."createdAt")
WHERE a."certificationAgreementAcceptedAt" IS NULL
  AND (
    a."status" IN ('INSPECTION', 'REVIEW', 'APPROVED')
    OR EXISTS (SELECT 1 FROM "HalalInspection" i WHERE i."applicationId" = a."id")
  );
