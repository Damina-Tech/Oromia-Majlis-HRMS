-- CreateEnum
CREATE TYPE "InstitutionRecognitionStatus" AS ENUM ('PENDING_PAYMENT', 'MANUAL_PENDING_APPROVAL', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InstitutionRecognitionPaymentMethod" AS ENUM ('CHAPA', 'MANUAL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "InstitutionAuditAction" ADD VALUE 'INSTITUTION_RECOGNITION_CREATED';
ALTER TYPE "InstitutionAuditAction" ADD VALUE 'INSTITUTION_RECOGNITION_ISSUED';

-- CreateTable
CREATE TABLE "InstitutionRecognition" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "status" "InstitutionRecognitionStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "amountEtb" DECIMAL(12,2) NOT NULL DEFAULT 10000,
    "institutionNameOnCert" TEXT NOT NULL,
    "zoneCityAdmin" TEXT NOT NULL,
    "districtSubcity" TEXT NOT NULL,
    "gandaKebele" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "questionnaire" JSONB NOT NULL,
    "certificateNumber" TEXT,
    "pdfUrl" TEXT,
    "issuedAt" TIMESTAMP(3),
    "paymentMethod" "InstitutionRecognitionPaymentMethod",
    "chapaTxRef" TEXT,
    "chapaRefId" TEXT,
    "paymentReceiptUrl" TEXT,
    "bankName" TEXT,
    "manualPaymentApprovedById" TEXT,
    "manualPaymentApprovedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstitutionRecognition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InstitutionRecognition_certificateNumber_key" ON "InstitutionRecognition"("certificateNumber");

-- CreateIndex
CREATE INDEX "InstitutionRecognition_institutionId_idx" ON "InstitutionRecognition"("institutionId");

-- CreateIndex
CREATE INDEX "InstitutionRecognition_status_idx" ON "InstitutionRecognition"("status");

-- AddForeignKey
ALTER TABLE "InstitutionRecognition" ADD CONSTRAINT "InstitutionRecognition_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionRecognition" ADD CONSTRAINT "InstitutionRecognition_manualPaymentApprovedById_fkey" FOREIGN KEY ("manualPaymentApprovedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionRecognition" ADD CONSTRAINT "InstitutionRecognition_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
