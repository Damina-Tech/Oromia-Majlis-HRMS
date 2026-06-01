-- CreateEnum
CREATE TYPE "DocumentTemplateEngine" AS ENUM ('HTML_MERGE', 'PDF_CERTIFICATE');

-- CreateEnum
CREATE TYPE "HalalCertificateTemplateType" AS ENUM ('HALAL_BUSINESS', 'HALAL_PRODUCT');

-- AlterTable
ALTER TABLE "DocumentTemplate" ADD COLUMN     "templateEngine" "DocumentTemplateEngine" NOT NULL DEFAULT 'HTML_MERGE',
ADD COLUMN     "certificateType" "HalalCertificateTemplateType",
ADD COLUMN     "layoutConfig" JSONB;
