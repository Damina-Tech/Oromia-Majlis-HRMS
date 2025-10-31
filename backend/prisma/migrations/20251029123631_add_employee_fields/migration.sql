/*
  Warnings:

  - You are about to drop the `Document` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DocumentTemplate` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Document" DROP CONSTRAINT "Document_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Document" DROP CONSTRAINT "Document_generatedBy_fkey";

-- DropForeignKey
ALTER TABLE "public"."Document" DROP CONSTRAINT "Document_templateId_fkey";

-- DropForeignKey
ALTER TABLE "public"."DocumentTemplate" DROP CONSTRAINT "DocumentTemplate_createdBy_fkey";

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "dateOfBirth" DATE,
ADD COLUMN     "employmentType" TEXT;

-- DropTable
DROP TABLE "public"."Document";

-- DropTable
DROP TABLE "public"."DocumentTemplate";

-- DropEnum
DROP TYPE "public"."DocumentStatus";

-- DropEnum
DROP TYPE "public"."DocumentTemplateStatus";
