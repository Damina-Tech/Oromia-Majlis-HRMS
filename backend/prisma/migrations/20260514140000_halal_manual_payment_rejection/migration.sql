-- AlterTable
ALTER TABLE "HalalApplication" ADD COLUMN "manualPaymentRejectionReason" TEXT,
ADD COLUMN "manualPaymentRejectedAt" TIMESTAMP(3);
