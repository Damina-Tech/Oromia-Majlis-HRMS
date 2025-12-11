-- CreateEnum (only if it doesn't exist, as it may have been created by an earlier migration)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LeaveType') THEN
        CREATE TYPE "LeaveType" AS ENUM ('CASUAL', 'SICK', 'VACATION', 'MATERNITY', 'PERSONAL');
    END IF;
END $$;

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "LeaveRequest" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" "LeaveType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "days" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "approverId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable (only if it doesn't exist - may have been created by earlier migration)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'LeaveBalance') THEN
        CREATE TABLE "LeaveBalance" (
            "id" TEXT NOT NULL,
            "employeeId" TEXT NOT NULL,
            "casualLeave" INTEGER NOT NULL DEFAULT 12,
            "sickLeave" INTEGER NOT NULL DEFAULT 10,
            "vacationLeave" INTEGER NOT NULL DEFAULT 21,
            "personalLeave" INTEGER NOT NULL DEFAULT 5,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,

            CONSTRAINT "LeaveBalance_pkey" PRIMARY KEY ("id")
        );

        CREATE UNIQUE INDEX "LeaveBalance_employeeId_key" ON "LeaveBalance"("employeeId");
        
        -- Add foreign key if Employee table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Employee') THEN
            ALTER TABLE "LeaveBalance" ADD CONSTRAINT "LeaveBalance_employeeId_fkey" 
            FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LeaveRequest_employeeId_idx" ON "LeaveRequest"("employeeId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LeaveRequest_status_idx" ON "LeaveRequest"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LeaveRequest_startDate_endDate_idx" ON "LeaveRequest"("startDate", "endDate");

-- AddForeignKey (only if not already exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Employee') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_schema = 'public'
            AND constraint_name = 'LeaveRequest_employeeId_fkey' 
            AND table_name = 'LeaveRequest'
        ) THEN
            ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_employeeId_fkey" 
            FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_schema = 'public'
            AND constraint_name = 'LeaveRequest_approverId_fkey' 
            AND table_name = 'LeaveRequest'
        ) THEN
            ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_approverId_fkey" 
            FOREIGN KEY ("approverId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
        
        -- Only add LeaveBalance foreign key if table exists and constraint doesn't exist
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'LeaveBalance') THEN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_schema = 'public'
                AND constraint_name = 'LeaveBalance_employeeId_fkey' 
                AND table_name = 'LeaveBalance'
            ) THEN
                ALTER TABLE "LeaveBalance" ADD CONSTRAINT "LeaveBalance_employeeId_fkey" 
                FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
            END IF;
        END IF;
    END IF;
END $$;
