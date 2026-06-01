-- CreateEnum
CREATE TYPE "HalalApplicationCompetencyWorkerProposalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "HalalCompetencyCertificate" ADD COLUMN "businessRegisteredWorker" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "externalCertificateUrl" TEXT;

-- CreateTable
CREATE TABLE "HalalApplicationCompetencyWorkerProposal" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "dateOfBirth" DATE,
    "phone" TEXT,
    "email" TEXT,
    "jobTitle" TEXT,
    "employerName" TEXT NOT NULL,
    "uploadedCertificateUrl" TEXT NOT NULL,
    "status" "HalalApplicationCompetencyWorkerProposalStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "competencyCertificateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HalalApplicationCompetencyWorkerProposal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HalalApplicationCompetencyWorkerProposal_competencyCertificateId_key" ON "HalalApplicationCompetencyWorkerProposal"("competencyCertificateId");

-- CreateIndex
CREATE INDEX "HalalApplicationCompetencyWorkerProposal_applicationId_idx" ON "HalalApplicationCompetencyWorkerProposal"("applicationId");

-- CreateIndex
CREATE INDEX "HalalApplicationCompetencyWorkerProposal_status_idx" ON "HalalApplicationCompetencyWorkerProposal"("status");

-- AddForeignKey
ALTER TABLE "HalalApplicationCompetencyWorkerProposal" ADD CONSTRAINT "HalalApplicationCompetencyWorkerProposal_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "HalalApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HalalApplicationCompetencyWorkerProposal" ADD CONSTRAINT "HalalApplicationCompetencyWorkerProposal_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HalalApplicationCompetencyWorkerProposal" ADD CONSTRAINT "HalalApplicationCompetencyWorkerProposal_competencyCertificateId_fkey" FOREIGN KEY ("competencyCertificateId") REFERENCES "HalalCompetencyCertificate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
