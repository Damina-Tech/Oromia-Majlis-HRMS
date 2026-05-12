-- AlterEnum
ALTER TYPE "HalalBusinessCategory" ADD VALUE 'OTHER';

-- AlterTable
ALTER TABLE "HalalBusiness" ADD COLUMN "categoryOther" TEXT;
