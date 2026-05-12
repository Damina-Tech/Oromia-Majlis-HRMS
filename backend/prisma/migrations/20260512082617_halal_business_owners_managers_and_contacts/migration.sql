-- AlterTable
ALTER TABLE "HalalBusiness" ADD COLUMN     "businessEmail" TEXT,
ADD COLUMN     "businessPhone" TEXT,
ADD COLUMN     "businessWebsite" TEXT,
ADD COLUMN     "ownersManagers" JSONB;
