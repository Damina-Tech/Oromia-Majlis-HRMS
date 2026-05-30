-- AlterTable
ALTER TABLE "HalalApplication" ADD COLUMN "pausedAt" TIMESTAMP(3),
ADD COLUMN "pausedReason" TEXT,
ADD COLUMN "pausedById" TEXT;

-- AddForeignKey
ALTER TABLE "HalalApplication" ADD CONSTRAINT "HalalApplication_pausedById_fkey" FOREIGN KEY ("pausedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
