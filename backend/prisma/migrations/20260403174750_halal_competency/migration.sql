-- CreateEnum
CREATE TYPE "HalalCompetencyStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'THEORETICAL_SCHEDULED', 'THEORETICAL_PASSED', 'THEORETICAL_FAILED', 'TECHNICAL_SCHEDULED', 'TECHNICAL_PASSED', 'TECHNICAL_FAILED', 'PAYMENT_PENDING', 'ISSUED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "HalalCompetencyRenewalStatus" AS ENUM ('PAYMENT_PENDING', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "HalalCompetencyCertificate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "employerName" TEXT NOT NULL,
    "jobTitle" TEXT,
    "religiousAnswers" JSONB NOT NULL,
    "supportLetterUrl" TEXT,
    "status" "HalalCompetencyStatus" NOT NULL DEFAULT 'DRAFT',
    "theoreticalScheduledAt" TIMESTAMP(3),
    "theoreticalNotes" TEXT,
    "theoreticalPassed" BOOLEAN,
    "theoreticalRecordedAt" TIMESTAMP(3),
    "theoreticalRecordedById" TEXT,
    "technicalScheduledAt" TIMESTAMP(3),
    "technicalNotes" TEXT,
    "technicalPassed" BOOLEAN,
    "technicalRecordedAt" TIMESTAMP(3),
    "technicalRecordedById" TEXT,
    "feeAmount" DECIMAL(12,2) NOT NULL DEFAULT 1000,
    "feePaidAt" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "paymentBankName" TEXT,
    "paymentReceiptUrl" TEXT,
    "chapaTxRef" TEXT,
    "chapaRefId" TEXT,
    "manualPaymentApprovedById" TEXT,
    "certificateNumber" TEXT,
    "pdfUrl" TEXT,
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HalalCompetencyCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HalalCompetencyRenewal" (
    "id" TEXT NOT NULL,
    "competencyId" TEXT NOT NULL,
    "status" "HalalCompetencyRenewalStatus" NOT NULL DEFAULT 'PAYMENT_PENDING',
    "feeAmount" DECIMAL(12,2) NOT NULL DEFAULT 1000,
    "feePaidAt" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "paymentBankName" TEXT,
    "paymentReceiptUrl" TEXT,
    "chapaTxRef" TEXT,
    "chapaRefId" TEXT,
    "manualPaymentApprovedById" TEXT,
    "previousExpiry" TIMESTAMP(3) NOT NULL,
    "newExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HalalCompetencyRenewal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HalalCompetencyCertificate_certificateNumber_key" ON "HalalCompetencyCertificate"("certificateNumber");

-- CreateIndex
CREATE INDEX "HalalCompetencyCertificate_userId_idx" ON "HalalCompetencyCertificate"("userId");

-- CreateIndex
CREATE INDEX "HalalCompetencyCertificate_status_idx" ON "HalalCompetencyCertificate"("status");

-- CreateIndex
CREATE INDEX "HalalCompetencyCertificate_certificateNumber_idx" ON "HalalCompetencyCertificate"("certificateNumber");

-- CreateIndex
CREATE INDEX "HalalCompetencyRenewal_competencyId_idx" ON "HalalCompetencyRenewal"("competencyId");

-- CreateIndex
CREATE INDEX "HalalCompetencyRenewal_status_idx" ON "HalalCompetencyRenewal"("status");

-- AddForeignKey
ALTER TABLE "HalalCompetencyCertificate" ADD CONSTRAINT "HalalCompetencyCertificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HalalCompetencyCertificate" ADD CONSTRAINT "HalalCompetencyCertificate_theoreticalRecordedById_fkey" FOREIGN KEY ("theoreticalRecordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HalalCompetencyCertificate" ADD CONSTRAINT "HalalCompetencyCertificate_technicalRecordedById_fkey" FOREIGN KEY ("technicalRecordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HalalCompetencyCertificate" ADD CONSTRAINT "HalalCompetencyCertificate_manualPaymentApprovedById_fkey" FOREIGN KEY ("manualPaymentApprovedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HalalCompetencyRenewal" ADD CONSTRAINT "HalalCompetencyRenewal_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "HalalCompetencyCertificate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HalalCompetencyRenewal" ADD CONSTRAINT "HalalCompetencyRenewal_manualPaymentApprovedById_fkey" FOREIGN KEY ("manualPaymentApprovedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
