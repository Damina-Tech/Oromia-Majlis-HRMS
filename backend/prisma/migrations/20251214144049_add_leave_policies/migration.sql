-- CreateTable
CREATE TABLE IF NOT EXISTS "LeavePolicy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "defaultAllocatedDays" DECIMAL(10,2) NOT NULL,
    "maxCarryOverDays" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "carryOverEnabled" BOOLEAN NOT NULL DEFAULT true,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT true,
    "requiresDocumentation" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "renewalMonth" INTEGER NOT NULL DEFAULT 1,
    "renewalDay" INTEGER NOT NULL DEFAULT 1,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeavePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "LeavePolicy_code_key" ON "LeavePolicy"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LeavePolicy_code_idx" ON "LeavePolicy"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LeavePolicy_isActive_idx" ON "LeavePolicy"("isActive");

