-- AlterTable: Add salary grade and step fields to Employee table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Employee' AND column_name = 'salaryGradeId') THEN
        ALTER TABLE "Employee" ADD COLUMN "salaryGradeId" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Employee' AND column_name = 'salaryStepId') THEN
        ALTER TABLE "Employee" ADD COLUMN "salaryStepId" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Employee' AND column_name = 'lastIncrementDate') THEN
        ALTER TABLE "Employee" ADD COLUMN "lastIncrementDate" TIMESTAMP(3);
    END IF;
END $$;

-- CreateIndex
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Employee_salaryGradeId_idx') THEN
        CREATE INDEX "Employee_salaryGradeId_idx" ON "Employee"("salaryGradeId");
    END IF;
END $$;

-- AddForeignKey (only if SalaryGrade table exists and constraint doesn't exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'SalaryGrade') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'Employee_salaryGradeId_fkey'
        ) THEN
            ALTER TABLE "Employee" 
            ADD CONSTRAINT "Employee_salaryGradeId_fkey" 
            FOREIGN KEY ("salaryGradeId") REFERENCES "SalaryGrade"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

-- AddForeignKey (only if SalaryStep table exists and constraint doesn't exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'SalaryStep') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'Employee_salaryStepId_fkey'
        ) THEN
            ALTER TABLE "Employee" 
            ADD CONSTRAINT "Employee_salaryStepId_fkey" 
            FOREIGN KEY ("salaryStepId") REFERENCES "SalaryStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

