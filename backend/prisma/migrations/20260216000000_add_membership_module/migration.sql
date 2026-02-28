-- CreateEnum
CREATE TYPE "MembershipPlanType" AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "MemberCategory" AS ENUM ('REGULAR_MEMBER', 'BUSINESS_OWNER', 'YOUTH_WOMEN_COUNCIL', 'FARMER', 'ELDER_MOTHER');

-- CreateEnum
CREATE TYPE "MembershipSubscriptionStatus" AS ENUM ('PENDING_PAYMENT', 'ACTIVE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "MembershipPaymentMethod" AS ENUM ('CHAPA', 'MANUAL', 'CASH');

-- CreateEnum
CREATE TYPE "MembershipPaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- AlterEnum
ALTER TYPE "NotificationModule" ADD VALUE 'MEMBERSHIP';

-- CreateTable
CREATE TABLE "MembershipPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "planType" "MembershipPlanType" NOT NULL,
    "feeAmount" DECIMAL(10,2) NOT NULL,
    "durationMonths" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MembershipPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "regionId" TEXT,
    "zoneId" TEXT,
    "woredaId" TEXT,
    "addressLine" TEXT,
    "profilePhotoUrl" TEXT,
    "nationalId" TEXT,
    "category" "MemberCategory" NOT NULL,
    "categoryData" JSONB,
    "userId" TEXT,
    "registeredById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipSubscription" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "MembershipSubscriptionStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "chapaTxRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MembershipSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipPayment" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ETB',
    "method" "MembershipPaymentMethod" NOT NULL,
    "status" "MembershipPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "chapaTxRef" TEXT,
    "chapaRefId" TEXT,
    "receiptUrl" TEXT,
    "paidAt" TIMESTAMP(3),
    "processedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MembershipPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipCertificate" (
    "id" TEXT NOT NULL,
    "certificateId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "pdfUrl" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MembershipCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MembershipPlan_planType_key" ON "MembershipPlan"("planType");

-- CreateIndex
CREATE UNIQUE INDEX "Member_phone_key" ON "Member"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Member_userId_key" ON "Member"("userId");

-- CreateIndex
CREATE INDEX "Member_phone_idx" ON "Member"("phone");

-- CreateIndex
CREATE INDEX "Member_category_idx" ON "Member"("category");

-- CreateIndex
CREATE INDEX "Member_userId_idx" ON "Member"("userId");

-- CreateIndex
CREATE INDEX "Member_registeredById_idx" ON "Member"("registeredById");

-- CreateIndex
CREATE INDEX "MembershipPlan_isActive_idx" ON "MembershipPlan"("isActive");

-- CreateIndex
CREATE INDEX "MembershipSubscription_memberId_idx" ON "MembershipSubscription"("memberId");

-- CreateIndex
CREATE INDEX "MembershipSubscription_planId_idx" ON "MembershipSubscription"("planId");

-- CreateIndex
CREATE INDEX "MembershipSubscription_status_idx" ON "MembershipSubscription"("status");

-- CreateIndex
CREATE INDEX "MembershipSubscription_chapaTxRef_idx" ON "MembershipSubscription"("chapaTxRef");

-- CreateIndex
CREATE INDEX "MembershipPayment_subscriptionId_idx" ON "MembershipPayment"("subscriptionId");

-- CreateIndex
CREATE INDEX "MembershipPayment_status_idx" ON "MembershipPayment"("status");

-- CreateIndex
CREATE INDEX "MembershipPayment_chapaTxRef_idx" ON "MembershipPayment"("chapaTxRef");

-- CreateIndex
CREATE UNIQUE INDEX "MembershipCertificate_certificateId_key" ON "MembershipCertificate"("certificateId");

-- CreateIndex
CREATE UNIQUE INDEX "MembershipCertificate_subscriptionId_key" ON "MembershipCertificate"("subscriptionId");

-- CreateIndex
CREATE INDEX "MembershipCertificate_memberId_idx" ON "MembershipCertificate"("memberId");

-- CreateIndex
CREATE INDEX "MembershipCertificate_expiresAt_idx" ON "MembershipCertificate"("expiresAt");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_woredaId_fkey" FOREIGN KEY ("woredaId") REFERENCES "Woreda"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipSubscription" ADD CONSTRAINT "MembershipSubscription_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipSubscription" ADD CONSTRAINT "MembershipSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "MembershipPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipPayment" ADD CONSTRAINT "MembershipPayment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "MembershipSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipCertificate" ADD CONSTRAINT "MembershipCertificate_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "MembershipSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipCertificate" ADD CONSTRAINT "MembershipCertificate_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
