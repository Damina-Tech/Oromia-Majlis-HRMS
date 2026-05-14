-- AlterEnum
ALTER TYPE "HalalApplicationStatus" ADD VALUE 'PENDING_COMPETENCY_LINK';

-- CreateTable
CREATE TABLE "HalalApplicationCompetencyWorker" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "competencyCertificateId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HalalApplicationCompetencyWorker_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HalalApplicationCompetencyWorker_applicationId_competencyCertificateId_key" ON "HalalApplicationCompetencyWorker"("applicationId", "competencyCertificateId");

-- CreateIndex
CREATE INDEX "HalalApplicationCompetencyWorker_competencyCertificateId_idx" ON "HalalApplicationCompetencyWorker"("competencyCertificateId");

-- AddForeignKey
ALTER TABLE "HalalApplicationCompetencyWorker" ADD CONSTRAINT "HalalApplicationCompetencyWorker_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "HalalApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HalalApplicationCompetencyWorker" ADD CONSTRAINT "HalalApplicationCompetencyWorker_competencyCertificateId_fkey" FOREIGN KEY ("competencyCertificateId") REFERENCES "HalalCompetencyCertificate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
