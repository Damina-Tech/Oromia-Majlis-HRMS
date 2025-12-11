-- Lead management module schema objects

-- Enumerations
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LeadStage') THEN
    CREATE TYPE "LeadStage" AS ENUM (
      'NEW',
      'CONTACTED',
      'QUALIFIED',
      'ENGAGED',
      'PROPOSAL_SENT',
      'NEGOTIATION',
      'READY_TO_CONVERT',
      'CONVERTED',
      'ARCHIVED'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LeadStatus') THEN
    CREATE TYPE "LeadStatus" AS ENUM ('ACTIVE', 'CONVERTED', 'ARCHIVED');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LeadPriority') THEN
    CREATE TYPE "LeadPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LeadImportStatus') THEN
    CREATE TYPE "LeadImportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LeadDispositionReason') THEN
    CREATE TYPE "LeadDispositionReason" AS ENUM ('PRICE', 'NOT_INTERESTED', 'WRONG_CONTACT', 'COMPETITOR', 'POSTPONED', 'OTHER');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LeadHistoryAction') THEN
    CREATE TYPE "LeadHistoryAction" AS ENUM (
      'CREATED',
      'UPDATED',
      'STAGE_CHANGED',
      'ASSIGNED',
      'NOTE_ADDED',
      'IMPORTED',
      'CONTACT_ATTEMPT',
      'DISPOSITIONED'
    );
  END IF;
END $$;

-- Extend notification module enum
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationModule') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'NotificationModule' AND e.enumlabel = 'LEAD'
    ) THEN
      ALTER TYPE "NotificationModule" ADD VALUE 'LEAD';
    END IF;
  ELSE
    CREATE TYPE "NotificationModule" AS ENUM (
      'SYSTEM',
      'EMPLOYEE',
      'DEPARTMENT',
      'LEAVE',
      'ATTENDANCE',
      'PAYROLL',
      'TASK',
      'ASSET',
      'EXPENSE',
      'DOCUMENT',
      'ANNOUNCEMENT',
      'LEAD'
    );
  END IF;
END $$;

-- Core tables
CREATE TABLE IF NOT EXISTS "Lead" (
  "id" TEXT PRIMARY KEY,
  "fullName" TEXT NOT NULL,
  "phone" TEXT,
  "email" TEXT,
  "location" TEXT,
  "interest" TEXT,
  "source" TEXT,
  "companyName" TEXT,
  "website" TEXT,
  "potentialValue" DECIMAL(14, 2),
  "assignedDepartmentId" TEXT,
  "assignedToUserId" TEXT,
  "priority" "LeadPriority" NOT NULL DEFAULT 'MEDIUM',
  "stage" "LeadStage" NOT NULL DEFAULT 'NEW',
  "status" "LeadStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastContactedAt" TIMESTAMP(3),
  "nextFollowUpAt" TIMESTAMP(3),
  "convertedAt" TIMESTAMP(3),
  "archivedAt" TIMESTAMP(3),
  "duplicateOfId" TEXT,
  "importJobId" TEXT,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "timezone" TEXT
);

CREATE TABLE IF NOT EXISTS "LeadHistory" (
  "id" TEXT PRIMARY KEY,
  "leadId" TEXT NOT NULL,
  "action" "LeadHistoryAction" NOT NULL,
  "fromStage" "LeadStage",
  "toStage" "LeadStage",
  "actorId" TEXT,
  "note" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "LeadNote" (
  "id" TEXT PRIMARY KEY,
  "leadId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "attachments" JSONB DEFAULT '[]'::jsonb,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "LeadImportJob" (
  "id" TEXT PRIMARY KEY,
  "uploadedBy" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "status" "LeadImportStatus" NOT NULL DEFAULT 'PENDING',
  "summary" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3)
);

CREATE TABLE IF NOT EXISTS "LeadDisposition" (
  "id" TEXT PRIMARY KEY,
  "leadId" TEXT NOT NULL UNIQUE,
  "reason" "LeadDispositionReason" NOT NULL,
  "note" TEXT,
  "actorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "LeadTask" (
  "leadId" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LeadTask_pkey" PRIMARY KEY ("leadId", "taskId")
);

CREATE TABLE IF NOT EXISTS "LeadMetrics" (
  "id" TEXT PRIMARY KEY,
  "scope" TEXT NOT NULL DEFAULT 'GLOBAL',
  "filters" JSONB,
  "funnel" JSONB,
  "sources" JSONB,
  "totals" JSONB,
  "refreshedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "periodStart" DATE,
  "periodEnd" DATE,
  "leadId" TEXT
);

-- Foreign keys
ALTER TABLE "Lead"
  ADD CONSTRAINT "Lead_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "Lead_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "Lead_assignedDepartmentId_fkey" FOREIGN KEY ("assignedDepartmentId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "Lead_duplicateOfId_fkey" FOREIGN KEY ("duplicateOfId") REFERENCES "Lead" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "Lead_importJobId_fkey" FOREIGN KEY ("importJobId") REFERENCES "LeadImportJob" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LeadHistory"
  ADD CONSTRAINT "LeadHistory_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "LeadHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LeadNote"
  ADD CONSTRAINT "LeadNote_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "LeadNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "LeadImportJob"
  ADD CONSTRAINT "LeadImportJob_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "LeadDisposition"
  ADD CONSTRAINT "LeadDisposition_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "LeadDisposition_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "LeadTask"
  ADD CONSTRAINT "LeadTask_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "LeadTask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LeadMetrics"
  ADD CONSTRAINT "LeadMetrics_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Indexes
CREATE INDEX IF NOT EXISTS "Lead_email_idx" ON "Lead" ("email");
CREATE INDEX IF NOT EXISTS "Lead_phone_idx" ON "Lead" ("phone");
CREATE INDEX IF NOT EXISTS "Lead_stage_idx" ON "Lead" ("stage");
CREATE INDEX IF NOT EXISTS "Lead_status_idx" ON "Lead" ("status");
CREATE INDEX IF NOT EXISTS "Lead_priority_idx" ON "Lead" ("priority");
CREATE INDEX IF NOT EXISTS "Lead_assignedToUser_idx" ON "Lead" ("assignedToUserId");
CREATE INDEX IF NOT EXISTS "Lead_assignedDepartment_idx" ON "Lead" ("assignedDepartmentId");
CREATE INDEX IF NOT EXISTS "Lead_duplicateOf_idx" ON "Lead" ("duplicateOfId");
CREATE INDEX IF NOT EXISTS "Lead_createdAt_idx" ON "Lead" ("createdAt");

CREATE INDEX IF NOT EXISTS "LeadHistory_lead_idx" ON "LeadHistory" ("leadId");
CREATE INDEX IF NOT EXISTS "LeadHistory_actor_idx" ON "LeadHistory" ("actorId");
CREATE INDEX IF NOT EXISTS "LeadHistory_action_idx" ON "LeadHistory" ("action");
CREATE INDEX IF NOT EXISTS "LeadHistory_createdAt_idx" ON "LeadHistory" ("createdAt");

CREATE INDEX IF NOT EXISTS "LeadNote_lead_idx" ON "LeadNote" ("leadId");
CREATE INDEX IF NOT EXISTS "LeadNote_author_idx" ON "LeadNote" ("authorId");
CREATE INDEX IF NOT EXISTS "LeadNote_createdAt_idx" ON "LeadNote" ("createdAt");

CREATE INDEX IF NOT EXISTS "LeadTask_task_idx" ON "LeadTask" ("taskId");

CREATE INDEX IF NOT EXISTS "LeadMetrics_scope_idx" ON "LeadMetrics" ("scope");
CREATE INDEX IF NOT EXISTS "LeadMetrics_period_idx" ON "LeadMetrics" ("periodStart", "periodEnd");

