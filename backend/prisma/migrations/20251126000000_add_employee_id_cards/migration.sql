-- CreateEnum
CREATE TYPE "IdCardGenerationMode" AS ENUM ('SINGLE', 'BATCH');

-- AlterTable
ALTER TABLE "Employee"
    ADD COLUMN "idCardGeneratedAt" TIMESTAMP(3),
    ADD COLUMN "idCardPdfUrl" TEXT,
    ADD COLUMN "idCardPngUrl" TEXT,
    ADD COLUMN "idCardTemplateId" TEXT;

-- CreateTable
CREATE TABLE "EmployeeIdTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "settings" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EmployeeIdTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeIdCard" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "generatedById" TEXT NOT NULL,
    "pdfUrl" TEXT NOT NULL,
    "pngUrl" TEXT NOT NULL,
    "zipUrl" TEXT,
    "metadata" JSONB,
    "codeType" TEXT,
    "mode" "IdCardGenerationMode" NOT NULL DEFAULT 'SINGLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmployeeIdCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmployeeIdTemplate_isDefault_idx" ON "EmployeeIdTemplate"("isDefault");

-- CreateIndex
CREATE INDEX "EmployeeIdTemplate_createdAt_idx" ON "EmployeeIdTemplate"("createdAt");

-- CreateIndex
CREATE INDEX "EmployeeIdCard_employeeId_idx" ON "EmployeeIdCard"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeIdCard_templateId_idx" ON "EmployeeIdCard"("templateId");

-- CreateIndex
CREATE INDEX "EmployeeIdCard_createdAt_idx" ON "EmployeeIdCard"("createdAt");

-- AddForeignKey
ALTER TABLE "Employee"
    ADD CONSTRAINT "Employee_idCardTemplateId_fkey"
    FOREIGN KEY ("idCardTemplateId") REFERENCES "EmployeeIdTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeIdTemplate"
    ADD CONSTRAINT "EmployeeIdTemplate_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeIdTemplate"
    ADD CONSTRAINT "EmployeeIdTemplate_updatedById_fkey"
    FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeIdCard"
    ADD CONSTRAINT "EmployeeIdCard_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeIdCard"
    ADD CONSTRAINT "EmployeeIdCard_templateId_fkey"
    FOREIGN KEY ("templateId") REFERENCES "EmployeeIdTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeIdCard"
    ADD CONSTRAINT "EmployeeIdCard_generatedById_fkey"
    FOREIGN KEY ("generatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

