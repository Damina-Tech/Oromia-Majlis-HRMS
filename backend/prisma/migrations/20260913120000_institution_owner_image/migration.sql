-- Link public registrants to institutions + store institution image
ALTER TABLE "Institution" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "Institution" ADD COLUMN IF NOT EXISTS "ownerUserId" TEXT;

CREATE INDEX IF NOT EXISTS "Institution_ownerUserId_idx" ON "Institution"("ownerUserId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Institution_ownerUserId_fkey'
  ) THEN
    ALTER TABLE "Institution"
      ADD CONSTRAINT "Institution_ownerUserId_fkey"
      FOREIGN KEY ("ownerUserId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
