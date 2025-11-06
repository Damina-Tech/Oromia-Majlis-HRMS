-- Fix schema drift and add missing enum values
-- This migration adds columns that were manually added to the database

-- Add GENERATE and EXPORT to AuditAction enum
DO $$
BEGIN
    -- Add GENERATE if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'GENERATE' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'AuditAction')
    ) THEN
        ALTER TYPE "AuditAction" ADD VALUE 'GENERATE';
    END IF;

    -- Add EXPORT if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'EXPORT' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'AuditAction')
    ) THEN
        ALTER TYPE "AuditAction" ADD VALUE 'EXPORT';
    END IF;
END $$;

-- Add notes column to Advance table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Advance' AND column_name = 'notes'
    ) THEN
        ALTER TABLE "Advance" ADD COLUMN "notes" TEXT;
    END IF;
END $$;

-- Add payrollRunId column to AdvanceRepayment table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'AdvanceRepayment' AND column_name = 'payrollRunId'
    ) THEN
        ALTER TABLE "AdvanceRepayment" ADD COLUMN "payrollRunId" TEXT;
    END IF;
END $$;

-- Create index on AdvanceRepayment.payrollRunId if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'AdvanceRepayment' AND indexname = 'AdvanceRepayment_payrollRunId_idx'
    ) THEN
        CREATE INDEX "AdvanceRepayment_payrollRunId_idx" ON "AdvanceRepayment"("payrollRunId");
    END IF;
END $$;

-- Add foreign key constraint for AdvanceRepayment.payrollRunId if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'AdvanceRepayment' 
        AND constraint_name = 'AdvanceRepayment_payrollRunId_fkey'
    ) THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'PayrollRun') THEN
            ALTER TABLE "AdvanceRepayment" 
            ADD CONSTRAINT "AdvanceRepayment_payrollRunId_fkey" 
            FOREIGN KEY ("payrollRunId") 
            REFERENCES "PayrollRun"("id") 
            ON DELETE SET NULL 
            ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

-- Add payrollRunId column to LoanRepayment table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'LoanRepayment' AND column_name = 'payrollRunId'
    ) THEN
        ALTER TABLE "LoanRepayment" ADD COLUMN "payrollRunId" TEXT;
    END IF;
END $$;

-- Create index on LoanRepayment.payrollRunId if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'LoanRepayment' AND indexname = 'LoanRepayment_payrollRunId_idx'
    ) THEN
        CREATE INDEX "LoanRepayment_payrollRunId_idx" ON "LoanRepayment"("payrollRunId");
    END IF;
END $$;

-- Add foreign key constraint for LoanRepayment.payrollRunId if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'LoanRepayment' 
        AND constraint_name = 'LoanRepayment_payrollRunId_fkey'
    ) THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'PayrollRun') THEN
            ALTER TABLE "LoanRepayment" 
            ADD CONSTRAINT "LoanRepayment_payrollRunId_fkey" 
            FOREIGN KEY ("payrollRunId") 
            REFERENCES "PayrollRun"("id") 
            ON DELETE SET NULL 
            ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

