-- Public Majlis institution registration contact details
ALTER TABLE "Institution" ADD COLUMN IF NOT EXISTS "submitter" JSONB;
