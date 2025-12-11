/*
  Warnings:

  - You are about to drop the column `fileSize` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `DocumentTemplate` table. All the data in the column will be lost.
  - Changed the type of `category` on the `DocumentTemplate` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "DocumentTemplateStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DRAFT');

-- DropIndex
DROP INDEX "public"."DocumentTemplate_isActive_idx";

-- AlterTable
ALTER TABLE "Document" DROP COLUMN "fileSize";

-- AlterTable
ALTER TABLE "DocumentTemplate" DROP COLUMN "isActive",
ADD COLUMN     "status" "DocumentTemplateStatus" NOT NULL DEFAULT 'ACTIVE',
DROP COLUMN "category",
ADD COLUMN     "category" TEXT NOT NULL;

-- DropEnum
DROP TYPE "public"."DocumentTemplateCategory";

-- CreateIndex
CREATE INDEX "DocumentTemplate_category_idx" ON "DocumentTemplate"("category");

-- CreateIndex
CREATE INDEX "DocumentTemplate_status_idx" ON "DocumentTemplate"("status");
