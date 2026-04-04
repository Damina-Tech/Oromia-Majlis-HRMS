-- CreateEnum
CREATE TYPE "HalalPaymentMethod" AS ENUM ('CHAPA', 'MANUAL');

-- CreateEnum
CREATE TYPE "HalalPaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REJECTED');

-- CreateTable
CREATE TABLE "HalalPayment" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ETB',
    "method" "HalalPaymentMethod" NOT NULL,
    "status" "HalalPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "bankName" TEXT,
    "chapaTxRef" TEXT,
    "chapaRefId" TEXT,
    "receiptUrl" TEXT,
    "paidAt" TIMESTAMP(3),
    "processedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HalalPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HalalPayment_applicationId_idx" ON "HalalPayment"("applicationId");

-- CreateIndex
CREATE INDEX "HalalPayment_status_idx" ON "HalalPayment"("status");

-- CreateIndex
CREATE INDEX "HalalPayment_chapaTxRef_idx" ON "HalalPayment"("chapaTxRef");

-- AddForeignKey
ALTER TABLE "HalalPayment" ADD CONSTRAINT "HalalPayment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "HalalApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HalalPayment" ADD CONSTRAINT "HalalPayment_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
