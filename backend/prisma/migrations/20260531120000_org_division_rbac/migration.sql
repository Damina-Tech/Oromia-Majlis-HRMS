-- CreateEnum
CREATE TYPE "OrgDivisionCode" AS ENUM ('HR', 'HALAL', 'MEMBERSHIP', 'INSTITUTION', 'FINANCE', 'DOCUMENTS');

-- CreateTable
CREATE TABLE "OrgDivision" (
    "id" TEXT NOT NULL,
    "code" "OrgDivisionCode" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "headUserId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgDivision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDivisionAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "divisionId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserDivisionAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrgDivision_code_key" ON "OrgDivision"("code");

-- CreateIndex
CREATE INDEX "OrgDivision_headUserId_idx" ON "OrgDivision"("headUserId");

-- CreateIndex
CREATE INDEX "OrgDivision_active_idx" ON "OrgDivision"("active");

-- CreateIndex
CREATE INDEX "UserDivisionAssignment_userId_idx" ON "UserDivisionAssignment"("userId");

-- CreateIndex
CREATE INDEX "UserDivisionAssignment_divisionId_idx" ON "UserDivisionAssignment"("divisionId");

-- CreateIndex
CREATE INDEX "UserDivisionAssignment_roleId_idx" ON "UserDivisionAssignment"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "UserDivisionAssignment_userId_divisionId_roleId_key" ON "UserDivisionAssignment"("userId", "divisionId", "roleId");

-- AddForeignKey
ALTER TABLE "OrgDivision" ADD CONSTRAINT "OrgDivision_headUserId_fkey" FOREIGN KEY ("headUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDivisionAssignment" ADD CONSTRAINT "UserDivisionAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDivisionAssignment" ADD CONSTRAINT "UserDivisionAssignment_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "OrgDivision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDivisionAssignment" ADD CONSTRAINT "UserDivisionAssignment_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
