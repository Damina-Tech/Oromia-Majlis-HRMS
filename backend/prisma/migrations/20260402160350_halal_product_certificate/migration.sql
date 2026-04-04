-- CreateEnum
CREATE TYPE "HalalProductCertificateStatus" AS ENUM ('PAYMENT_PENDING', 'ISSUED', 'CANCELLED');

-- AlterTable
ALTER TABLE "HalalCertificate" ALTER COLUMN "certificationCycleStartedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "HalalProductCertificate" (
    "id" TEXT NOT NULL,
    "certificateNumber" TEXT,
    "halalCertificateId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "productAmount" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "notes" TEXT,
    "status" "HalalProductCertificateStatus" NOT NULL DEFAULT 'PAYMENT_PENDING',
    "feeAmount" DECIMAL(12,2) NOT NULL DEFAULT 3500,
    "feePaidAt" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "paymentBankName" TEXT,
    "paymentReceiptUrl" TEXT,
    "chapaTxRef" TEXT,
    "chapaRefId" TEXT,
    "pdfUrl" TEXT,
    "issuedAt" TIMESTAMP(3),
    "manualPaymentApprovedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HalalProductCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HalalProductCertificate_certificateNumber_key" ON "HalalProductCertificate"("certificateNumber");

-- CreateIndex
CREATE INDEX "HalalProductCertificate_businessId_idx" ON "HalalProductCertificate"("businessId");

-- CreateIndex
CREATE INDEX "HalalProductCertificate_halalCertificateId_idx" ON "HalalProductCertificate"("halalCertificateId");

-- CreateIndex
CREATE INDEX "HalalProductCertificate_status_idx" ON "HalalProductCertificate"("status");

-- AddForeignKey
ALTER TABLE "HalalProductCertificate" ADD CONSTRAINT "HalalProductCertificate_halalCertificateId_fkey" FOREIGN KEY ("halalCertificateId") REFERENCES "HalalCertificate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HalalProductCertificate" ADD CONSTRAINT "HalalProductCertificate_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "HalalBusiness"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HalalProductCertificate" ADD CONSTRAINT "HalalProductCertificate_manualPaymentApprovedById_fkey" FOREIGN KEY ("manualPaymentApprovedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
