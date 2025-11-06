-- CreateEnums
CREATE TYPE "DocumentCategory" AS ENUM('HR', 'PAYROLL', 'LEGAL', 'CERTIFICATE', 'WARNING', 'CONTRACT', 'OTHER');
CREATE TYPE "DocumentLanguage" AS ENUM('EN', 'AM', 'OR');
CREATE TYPE "DocumentTemplateStatus" AS ENUM('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "DocumentTemplate" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "DocumentCategory" NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "contentPlain" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "DocumentTemplateStatus" NOT NULL DEFAULT 'DRAFT',
    "language" "DocumentLanguage" NOT NULL DEFAULT 'EN',
    "tags" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "mergeFields" JSONB,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedDocument" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "employeeId" TEXT,
    "generatedBy" TEXT NOT NULL,
    "generatedFor" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'pdf',
    "fileSize" INTEGER,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneratedDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentAuditLog" (
    "id" TEXT NOT NULL,
    "templateId" TEXT,
    "documentId" TEXT,
    "action" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "targetId" TEXT,
    "details" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentTemplatePermission" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "roleId" TEXT,
    "userId" TEXT,
    "permissionType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentTemplatePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentRetention" (
    "id" TEXT NOT NULL,
    "templateId" TEXT,
    "retentionDays" INTEGER NOT NULL,
    "autoArchive" BOOLEAN NOT NULL DEFAULT false,
    "autoDelete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentRetention_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DocumentTemplate_code_key" ON "DocumentTemplate"("code");

-- CreateIndex
CREATE INDEX "DocumentTemplate_code_idx" ON "DocumentTemplate"("code");
CREATE INDEX "DocumentTemplate_category_idx" ON "DocumentTemplate"("category");
CREATE INDEX "DocumentTemplate_status_idx" ON "DocumentTemplate"("status");
CREATE INDEX "DocumentTemplate_active_idx" ON "DocumentTemplate"("active");
CREATE INDEX "DocumentTemplate_createdBy_idx" ON "DocumentTemplate"("createdBy");
CREATE INDEX "GeneratedDocument_templateId_idx" ON "GeneratedDocument"("templateId");
CREATE INDEX "GeneratedDocument_employeeId_idx" ON "GeneratedDocument"("employeeId");
CREATE INDEX "GeneratedDocument_generatedBy_idx" ON "GeneratedDocument"("generatedBy");
CREATE INDEX "GeneratedDocument_createdAt_idx" ON "GeneratedDocument"("createdAt");
CREATE INDEX "GeneratedDocument_generatedFor_idx" ON "GeneratedDocument"("generatedFor");
CREATE INDEX "DocumentAuditLog_templateId_idx" ON "DocumentAuditLog"("templateId");
CREATE INDEX "DocumentAuditLog_documentId_idx" ON "DocumentAuditLog"("documentId");
CREATE INDEX "DocumentAuditLog_actorId_idx" ON "DocumentAuditLog"("actorId");
CREATE INDEX "DocumentAuditLog_action_idx" ON "DocumentAuditLog"("action");
CREATE INDEX "DocumentAuditLog_timestamp_idx" ON "DocumentAuditLog"("timestamp");
CREATE UNIQUE INDEX "DocumentTemplatePermission_templateId_roleId_userId_permissionType_key" ON "DocumentTemplatePermission"("templateId", "roleId", "userId", "permissionType");
CREATE INDEX "DocumentTemplatePermission_templateId_idx" ON "DocumentTemplatePermission"("templateId");
CREATE INDEX "DocumentTemplatePermission_roleId_idx" ON "DocumentTemplatePermission"("roleId");
CREATE INDEX "DocumentTemplatePermission_userId_idx" ON "DocumentTemplatePermission"("userId");
CREATE INDEX "DocumentRetention_templateId_idx" ON "DocumentRetention"("templateId");

-- AddForeignKey
ALTER TABLE "DocumentTemplate" ADD CONSTRAINT "DocumentTemplate_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DocumentTemplate" ADD CONSTRAINT "DocumentTemplate_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GeneratedDocument" ADD CONSTRAINT "GeneratedDocument_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "DocumentTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GeneratedDocument" ADD CONSTRAINT "GeneratedDocument_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GeneratedDocument" ADD CONSTRAINT "GeneratedDocument_generatedBy_fkey" FOREIGN KEY ("generatedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DocumentAuditLog" ADD CONSTRAINT "DocumentAuditLog_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "DocumentTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentAuditLog" ADD CONSTRAINT "DocumentAuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DocumentTemplatePermission" ADD CONSTRAINT "DocumentTemplatePermission_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "DocumentTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentRetention" ADD CONSTRAINT "DocumentRetention_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "DocumentTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

