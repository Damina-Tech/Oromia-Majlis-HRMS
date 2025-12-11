-- Ensure LeaveType enum exists (create if it doesn't)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LeaveType') THEN
        CREATE TYPE "LeaveType" AS ENUM ('CASUAL', 'SICK', 'VACATION', 'MATERNITY', 'PERSONAL');
    END IF;
END $$;

-- Check if LeaveBalance table exists, if not create it first
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'LeaveBalance') THEN
        -- Create the old format table first (it will be transformed below)
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
        
        -- Only add foreign key if Employee table exists (it may not exist yet due to migration order)
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Employee') THEN
            ALTER TABLE "LeaveBalance" ADD CONSTRAINT "LeaveBalance_employeeId_fkey" 
            FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

-- CreateTable
CREATE TABLE "LeaveBalance_new" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "leaveType" "LeaveType" NOT NULL,
    "year" INTEGER NOT NULL,
    "allocatedDays" DECIMAL(10,2) NOT NULL,
    "usedDays" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "carriedOver" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "availableDays" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveBalance_new_pkey" PRIMARY KEY ("id")
);

-- Migrate existing data: Convert old format (one row per employee with separate leave type fields) 
-- to new format (one row per employee per leave type per year)
-- Get current year
DO $$
DECLARE
    current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
BEGIN
    -- Migrate Casual Leave
    INSERT INTO "LeaveBalance_new" ("id", "employeeId", "leaveType", "year", "allocatedDays", "usedDays", "carriedOver", "availableDays", "createdAt", "updatedAt")
    SELECT 
        gen_random_uuid()::text,
        "employeeId",
        'CASUAL'::"LeaveType",
        current_year,
        COALESCE("casualLeave", 12),
        0,
        0,
        COALESCE("casualLeave", 12),
        "createdAt",
        "updatedAt"
    FROM "LeaveBalance"
    WHERE "casualLeave" IS NOT NULL AND "casualLeave" > 0;

    -- Migrate Sick Leave
    INSERT INTO "LeaveBalance_new" ("id", "employeeId", "leaveType", "year", "allocatedDays", "usedDays", "carriedOver", "availableDays", "createdAt", "updatedAt")
    SELECT 
        gen_random_uuid()::text,
        "employeeId",
        'SICK'::"LeaveType",
        current_year,
        COALESCE("sickLeave", 10),
        0,
        0,
        COALESCE("sickLeave", 10),
        "createdAt",
        "updatedAt"
    FROM "LeaveBalance"
    WHERE "sickLeave" IS NOT NULL AND "sickLeave" > 0;

    -- Migrate Vacation Leave
    INSERT INTO "LeaveBalance_new" ("id", "employeeId", "leaveType", "year", "allocatedDays", "usedDays", "carriedOver", "availableDays", "createdAt", "updatedAt")
    SELECT 
        gen_random_uuid()::text,
        "employeeId",
        'VACATION'::"LeaveType",
        current_year,
        COALESCE("vacationLeave", 21),
        0,
        0,
        COALESCE("vacationLeave", 21),
        "createdAt",
        "updatedAt"
    FROM "LeaveBalance"
    WHERE "vacationLeave" IS NOT NULL AND "vacationLeave" > 0;

    -- Migrate Personal Leave
    INSERT INTO "LeaveBalance_new" ("id", "employeeId", "leaveType", "year", "allocatedDays", "usedDays", "carriedOver", "availableDays", "createdAt", "updatedAt")
    SELECT 
        gen_random_uuid()::text,
        "employeeId",
        'PERSONAL'::"LeaveType",
        current_year,
        COALESCE("personalLeave", 5),
        0,
        0,
        COALESCE("personalLeave", 5),
        "createdAt",
        "updatedAt"
    FROM "LeaveBalance"
    WHERE "personalLeave" IS NOT NULL AND "personalLeave" > 0;
END $$;

-- Drop old table
DROP TABLE "LeaveBalance";

-- Rename new table to old name
ALTER TABLE "LeaveBalance_new" RENAME TO "LeaveBalance";

-- CreateIndex
CREATE INDEX "LeaveBalance_employeeId_idx" ON "LeaveBalance"("employeeId");

-- CreateIndex
CREATE INDEX "LeaveBalance_year_idx" ON "LeaveBalance"("year");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveBalance_employeeId_leaveType_year_key" ON "LeaveBalance"("employeeId", "leaveType", "year");

-- AddForeignKey (only if Employee table exists - it will be added by later migration if not)
DO $$
BEGIN
    -- Drop constraint if it exists (from earlier in this migration)
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public'
        AND constraint_name = 'LeaveBalance_employeeId_fkey' 
        AND table_name = 'LeaveBalance'
    ) THEN
        ALTER TABLE "LeaveBalance" DROP CONSTRAINT "LeaveBalance_employeeId_fkey";
    END IF;
    
    -- Add constraint only if Employee table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Employee') THEN
        ALTER TABLE "LeaveBalance" ADD CONSTRAINT "LeaveBalance_employeeId_fkey" 
        FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

