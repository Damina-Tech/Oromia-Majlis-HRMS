-- Handle old AssetCategory enum migration
DO $$ 
BEGIN
    -- Check if AssetCategory is an enum type and being used
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AssetCategory') THEN
        -- Check if Asset table exists and uses the enum
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Asset') THEN
            -- Check if Asset table has a category column using the enum
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Asset' AND column_name = 'category' AND udt_name = 'AssetCategory') THEN
                -- Create category records from existing enum values
                INSERT INTO "AssetCategory" (id, name, "createdAt", "updatedAt")
                SELECT DISTINCT 
                    'cat-' || LOWER(category::text) as id,
                    INITCAP(REPLACE(category::text, '_', ' ')) as name,
                    NOW() as "createdAt",
                    NOW() as "updatedAt"
                FROM "Asset"
                WHERE category IS NOT NULL
                ON CONFLICT (name) DO NOTHING;
                
                -- Add categoryId column if it doesn't exist
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Asset' AND column_name = 'categoryId') THEN
                    ALTER TABLE "Asset" ADD COLUMN "categoryId" TEXT;
                    
                    -- Map old category enum values to new categoryId
                    UPDATE "Asset" a
                    SET "categoryId" = ac.id
                    FROM "AssetCategory" ac
                    WHERE LOWER(REPLACE(ac.name, ' ', '_')) = LOWER(a.category::text);
                END IF;
                
                -- Drop the old category column after migration (optional, can keep for compatibility)
                -- ALTER TABLE "Asset" DROP COLUMN IF EXISTS "category";
            END IF;
        END IF;
        
        -- Try to drop the enum if not in use elsewhere (be careful with this)
        -- We'll leave it for now to avoid breaking things
    END IF;
END $$;

-- CreateAssetCategoryTable (if enum was handled above, this will be idempotent)
CREATE TABLE IF NOT EXISTS "AssetCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetCategory_pkey" PRIMARY KEY ("id")
);

-- CreateAssetLocationTable
DO $$ BEGIN
 CREATE TYPE "AssetLocationType" AS ENUM('STORE', 'BRANCH', 'OFFICE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "AssetLocation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "type" "AssetLocationType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetLocation_pkey" PRIMARY KEY ("id")
);

-- CreateAssetVendorTable
CREATE TABLE IF NOT EXISTS "AssetVendor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetVendor_pkey" PRIMARY KEY ("id")
);

-- UpdateAssetEnums
DO $$ BEGIN
 CREATE TYPE "AssetStatus_new" AS ENUM('IN_STOCK', 'ASSIGNED', 'IN_MAINTENANCE', 'DISPOSED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "AssetCondition_new" AS ENUM('NEW', 'GOOD', 'NEEDS_REPAIR', 'RETIRED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "AssetMaintenanceType" AS ENUM('PREVENTIVE', 'CORRECTIVE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "AssetMaintenanceStatus" AS ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "AssetDisposalMethod" AS ENUM('SALE', 'DONATION', 'SCRAP', 'TRANSFER', 'OTHER');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "AssetDepreciationMethod" AS ENUM('STRAIGHT_LINE', 'DECLINING_BALANCE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "AssetHistoryAction_new" AS ENUM('CREATED', 'ASSIGNED', 'REVOKED', 'TRANSFERRED', 'MAINTENANCE_STARTED', 'MAINTENANCE_COMPLETED', 'STATUS_CHANGED', 'CONDITION_UPDATED', 'RETIRED', 'DISPOSED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Update existing Asset table to new schema
-- Add new columns if they don't exist
DO $$ 
BEGIN
    -- Add assetCode column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Asset' AND column_name = 'assetCode') THEN
        ALTER TABLE "Asset" ADD COLUMN "assetCode" TEXT;
        -- Generate asset codes for existing assets
        UPDATE "Asset" SET "assetCode" = 'CHIRO-' || TO_CHAR(NOW(), 'YYYY') || '-' || SUBSTRING(UPPER(COALESCE(REPLACE("name", ' ', ''), 'AST')), 1, 3) || '-' || LPAD(ROW_NUMBER() OVER()::text, 4, '0')
        WHERE "assetCode" IS NULL;
        ALTER TABLE "Asset" ALTER COLUMN "assetCode" SET NOT NULL;
        CREATE UNIQUE INDEX IF NOT EXISTS "Asset_assetCode_key" ON "Asset"("assetCode");
    END IF;
    
    -- Add categoryId if missing (already handled above for enum migration)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Asset' AND column_name = 'categoryId') THEN
        ALTER TABLE "Asset" ADD COLUMN "categoryId" TEXT;
    END IF;
    
    -- Add other new columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Asset' AND column_name = 'currency') THEN
        ALTER TABLE "Asset" ADD COLUMN "currency" TEXT DEFAULT 'USD';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Asset' AND column_name = 'vendorId') THEN
        ALTER TABLE "Asset" ADD COLUMN "vendorId" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Asset' AND column_name = 'warrantyUntil') THEN
        ALTER TABLE "Asset" ADD COLUMN "warrantyUntil" DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Asset' AND column_name = 'locationId') THEN
        ALTER TABLE "Asset" ADD COLUMN "locationId" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Asset' AND column_name = 'assignedToEmployeeId') THEN
        -- Migrate from old assignedTo if exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Asset' AND column_name = 'assignedTo') THEN
            ALTER TABLE "Asset" ADD COLUMN "assignedToEmployeeId" TEXT;
            UPDATE "Asset" SET "assignedToEmployeeId" = "assignedTo" WHERE "assignedTo" IS NOT NULL;
        ELSE
            ALTER TABLE "Asset" ADD COLUMN "assignedToEmployeeId" TEXT;
        END IF;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Asset' AND column_name = 'departmentId') THEN
        ALTER TABLE "Asset" ADD COLUMN "departmentId" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Asset' AND column_name = 'depreciationMethod') THEN
        ALTER TABLE "Asset" ADD COLUMN "depreciationMethod" "AssetDepreciationMethod";
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Asset' AND column_name = 'depreciationRate') THEN
        ALTER TABLE "Asset" ADD COLUMN "depreciationRate" DECIMAL(5,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Asset' AND column_name = 'lifeYears') THEN
        ALTER TABLE "Asset" ADD COLUMN "lifeYears" DECIMAL(5,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Asset' AND column_name = 'createdBy') THEN
        ALTER TABLE "Asset" ADD COLUMN "createdBy" TEXT;
    END IF;
END $$;

-- CreateAssetAssignmentTable
CREATE TABLE IF NOT EXISTS "AssetAssignment" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT NOT NULL,
    "returnedAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateAssetMaintenanceTable
CREATE TABLE IF NOT EXISTS "AssetMaintenance" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "type" "AssetMaintenanceType" NOT NULL,
    "vendorId" TEXT,
    "cost" DECIMAL(12,2),
    "performedBy" TEXT,
    "nextDueDate" DATE,
    "status" "AssetMaintenanceStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetMaintenance_pkey" PRIMARY KEY ("id")
);

-- CreateAssetDisposalTable
CREATE TABLE IF NOT EXISTS "AssetDisposal" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "disposalDate" DATE NOT NULL,
    "method" "AssetDisposalMethod" NOT NULL,
    "saleAmount" DECIMAL(12,2),
    "notes" TEXT,
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetDisposal_pkey" PRIMARY KEY ("id")
);

-- CreateAssetDepreciationTable
CREATE TABLE IF NOT EXISTS "AssetDepreciation" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER,
    "depreciationAmount" DECIMAL(12,2) NOT NULL,
    "accumulatedDepr" DECIMAL(12,2) NOT NULL,
    "bookValue" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetDepreciation_pkey" PRIMARY KEY ("id")
);

-- CreateAssetAuditLogTable
CREATE TABLE IF NOT EXISTS "AssetAuditLog" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changeSummary" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetAuditLog_pkey" PRIMARY KEY ("id")
);

-- UpdateAssetHistoryTable if needed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'AssetHistory') THEN
        CREATE TABLE "AssetHistory" (
            "id" TEXT NOT NULL,
            "assetId" TEXT NOT NULL,
            "action" "AssetHistoryAction_new" NOT NULL,
            "description" TEXT,
            "fromEmployeeId" TEXT,
            "toEmployeeId" TEXT,
            "previousStatus" "AssetStatus_new",
            "newStatus" "AssetStatus_new",
            "previousCondition" "AssetCondition_new",
            "newCondition" "AssetCondition_new",
            "performedBy" TEXT NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT "AssetHistory_pkey" PRIMARY KEY ("id")
        );
    ELSE
        -- Add new columns if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'AssetHistory' AND column_name = 'previousStatus') THEN
            ALTER TABLE "AssetHistory" ADD COLUMN "previousStatus" "AssetStatus_new";
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'AssetHistory' AND column_name = 'newStatus') THEN
            ALTER TABLE "AssetHistory" ADD COLUMN "newStatus" "AssetStatus_new";
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'AssetHistory' AND column_name = 'previousCondition') THEN
            ALTER TABLE "AssetHistory" ADD COLUMN "previousCondition" "AssetCondition_new";
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'AssetHistory' AND column_name = 'newCondition') THEN
            ALTER TABLE "AssetHistory" ADD COLUMN "newCondition" "AssetCondition_new";
        END IF;
    END IF;
END $$;

-- CreateUniqueConstraints
CREATE UNIQUE INDEX IF NOT EXISTS "AssetCategory_name_key" ON "AssetCategory"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "Asset_assetCode_key" ON "Asset"("assetCode") WHERE "assetCode" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Asset_serialNumber_key" ON "Asset"("serialNumber") WHERE "serialNumber" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "AssetDepreciation_assetId_year_month_key" ON "AssetDepreciation"("assetId", "year", COALESCE("month", 0));

-- CreateForeignKeys (with IF NOT EXISTS equivalent checks)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'Asset_categoryId_fkey') THEN
        ALTER TABLE "Asset" ADD CONSTRAINT "Asset_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "AssetCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'Asset_vendorId_fkey') THEN
        ALTER TABLE "Asset" ADD CONSTRAINT "Asset_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "AssetVendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'Asset_locationId_fkey') THEN
        ALTER TABLE "Asset" ADD CONSTRAINT "Asset_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "AssetLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'Asset_assignedToEmployeeId_fkey') THEN
        ALTER TABLE "Asset" ADD CONSTRAINT "Asset_assignedToEmployeeId_fkey" FOREIGN KEY ("assignedToEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'Asset_departmentId_fkey') THEN
        ALTER TABLE "Asset" ADD CONSTRAINT "Asset_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'Asset_createdBy_fkey') THEN
        ALTER TABLE "Asset" ADD CONSTRAINT "Asset_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'AssetAssignment_assetId_fkey') THEN
        ALTER TABLE "AssetAssignment" ADD CONSTRAINT "AssetAssignment_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'AssetAssignment_employeeId_fkey') THEN
        ALTER TABLE "AssetAssignment" ADD CONSTRAINT "AssetAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'AssetAssignment_assignedBy_fkey') THEN
        ALTER TABLE "AssetAssignment" ADD CONSTRAINT "AssetAssignment_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'AssetMaintenance_assetId_fkey') THEN
        ALTER TABLE "AssetMaintenance" ADD CONSTRAINT "AssetMaintenance_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'AssetMaintenance_vendorId_fkey') THEN
        ALTER TABLE "AssetMaintenance" ADD CONSTRAINT "AssetMaintenance_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "AssetVendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'AssetMaintenance_performedBy_fkey') THEN
        ALTER TABLE "AssetMaintenance" ADD CONSTRAINT "AssetMaintenance_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'AssetDisposal_assetId_fkey') THEN
        ALTER TABLE "AssetDisposal" ADD CONSTRAINT "AssetDisposal_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'AssetDisposal_approvedBy_fkey') THEN
        ALTER TABLE "AssetDisposal" ADD CONSTRAINT "AssetDisposal_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'AssetDepreciation_assetId_fkey') THEN
        ALTER TABLE "AssetDepreciation" ADD CONSTRAINT "AssetDepreciation_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'AssetAuditLog_assetId_fkey') THEN
        ALTER TABLE "AssetAuditLog" ADD CONSTRAINT "AssetAuditLog_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'AssetAuditLog_changedBy_fkey') THEN
        ALTER TABLE "AssetAuditLog" ADD CONSTRAINT "AssetAuditLog_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'AssetHistory_assetId_fkey') THEN
        ALTER TABLE "AssetHistory" ADD CONSTRAINT "AssetHistory_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'AssetHistory_fromEmployeeId_fkey') THEN
        ALTER TABLE "AssetHistory" ADD CONSTRAINT "AssetHistory_fromEmployeeId_fkey" FOREIGN KEY ("fromEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'AssetHistory_toEmployeeId_fkey') THEN
        ALTER TABLE "AssetHistory" ADD CONSTRAINT "AssetHistory_toEmployeeId_fkey" FOREIGN KEY ("toEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'AssetHistory_performedBy_fkey') THEN
        ALTER TABLE "AssetHistory" ADD CONSTRAINT "AssetHistory_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- CreateIndexes
CREATE INDEX IF NOT EXISTS "AssetLocation_type_idx" ON "AssetLocation"("type");
CREATE INDEX IF NOT EXISTS "Asset_categoryId_idx" ON "Asset"("categoryId");
CREATE INDEX IF NOT EXISTS "Asset_status_idx" ON "Asset"("status");
CREATE INDEX IF NOT EXISTS "Asset_condition_idx" ON "Asset"("condition");
CREATE INDEX IF NOT EXISTS "Asset_assignedToEmployeeId_idx" ON "Asset"("assignedToEmployeeId");
CREATE INDEX IF NOT EXISTS "Asset_departmentId_idx" ON "Asset"("departmentId");
CREATE INDEX IF NOT EXISTS "Asset_locationId_idx" ON "Asset"("locationId");
CREATE INDEX IF NOT EXISTS "Asset_vendorId_idx" ON "Asset"("vendorId");
CREATE INDEX IF NOT EXISTS "Asset_assetCode_idx" ON "Asset"("assetCode");
CREATE INDEX IF NOT EXISTS "Asset_serialNumber_idx" ON "Asset"("serialNumber");
CREATE INDEX IF NOT EXISTS "Asset_createdBy_idx" ON "Asset"("createdBy");
CREATE INDEX IF NOT EXISTS "AssetAssignment_assetId_idx" ON "AssetAssignment"("assetId");
CREATE INDEX IF NOT EXISTS "AssetAssignment_employeeId_idx" ON "AssetAssignment"("employeeId");
CREATE INDEX IF NOT EXISTS "AssetAssignment_assignedAt_idx" ON "AssetAssignment"("assignedAt");
CREATE INDEX IF NOT EXISTS "AssetMaintenance_assetId_idx" ON "AssetMaintenance"("assetId");
CREATE INDEX IF NOT EXISTS "AssetMaintenance_date_idx" ON "AssetMaintenance"("date");
CREATE INDEX IF NOT EXISTS "AssetMaintenance_status_idx" ON "AssetMaintenance"("status");
CREATE INDEX IF NOT EXISTS "AssetMaintenance_nextDueDate_idx" ON "AssetMaintenance"("nextDueDate");
CREATE INDEX IF NOT EXISTS "AssetMaintenance_performedBy_idx" ON "AssetMaintenance"("performedBy");
CREATE INDEX IF NOT EXISTS "AssetDisposal_assetId_idx" ON "AssetDisposal"("assetId");
CREATE INDEX IF NOT EXISTS "AssetDisposal_disposalDate_idx" ON "AssetDisposal"("disposalDate");
CREATE INDEX IF NOT EXISTS "AssetDisposal_method_idx" ON "AssetDisposal"("method");
CREATE INDEX IF NOT EXISTS "AssetDepreciation_assetId_idx" ON "AssetDepreciation"("assetId");
CREATE INDEX IF NOT EXISTS "AssetDepreciation_year_idx" ON "AssetDepreciation"("year");
CREATE INDEX IF NOT EXISTS "AssetDepreciation_year_month_idx" ON "AssetDepreciation"("year", "month");
CREATE INDEX IF NOT EXISTS "AssetAuditLog_assetId_idx" ON "AssetAuditLog"("assetId");
CREATE INDEX IF NOT EXISTS "AssetAuditLog_changedBy_idx" ON "AssetAuditLog"("changedBy");
CREATE INDEX IF NOT EXISTS "AssetAuditLog_timestamp_idx" ON "AssetAuditLog"("timestamp");
CREATE INDEX IF NOT EXISTS "AssetHistory_assetId_idx" ON "AssetHistory"("assetId");
CREATE INDEX IF NOT EXISTS "AssetHistory_action_idx" ON "AssetHistory"("action");
CREATE INDEX IF NOT EXISTS "AssetHistory_performedBy_idx" ON "AssetHistory"("performedBy");
CREATE INDEX IF NOT EXISTS "AssetHistory_createdAt_idx" ON "AssetHistory"("createdAt");
