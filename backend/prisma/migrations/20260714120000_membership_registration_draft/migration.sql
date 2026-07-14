-- CreateEnum
CREATE TYPE "MembershipRegistrationDraftStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "MembershipRegistrationDraft" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
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
    "chapaTxRef" TEXT,
    "subscriptionId" TEXT,
    "status" "MembershipRegistrationDraftStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MembershipRegistrationDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MembershipRegistrationDraft_chapaTxRef_idx" ON "MembershipRegistrationDraft"("chapaTxRef");

-- CreateIndex
CREATE INDEX "MembershipRegistrationDraft_status_idx" ON "MembershipRegistrationDraft"("status");

-- CreateIndex
CREATE INDEX "MembershipRegistrationDraft_expiresAt_idx" ON "MembershipRegistrationDraft"("expiresAt");
