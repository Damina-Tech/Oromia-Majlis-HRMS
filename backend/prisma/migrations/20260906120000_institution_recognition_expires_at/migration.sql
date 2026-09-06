-- Add 2-year expiry for institution recognition certificates
ALTER TABLE "InstitutionRecognition" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);

-- Backfill completed certificates: expiry = issueDate + 2 years
UPDATE "InstitutionRecognition"
SET "expiresAt" = "issueDate" + INTERVAL '2 years'
WHERE "status" = 'COMPLETED' AND "expiresAt" IS NULL;

CREATE INDEX IF NOT EXISTS "InstitutionRecognition_expiresAt_idx" ON "InstitutionRecognition"("expiresAt");
