-- CreateEnum: PayrollStatus (update if exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PayrollStatus') THEN
        CREATE TYPE "PayrollStatus" AS ENUM ('DRAFT', 'REVIEW', 'APPROVED', 'PROCESSED', 'PAID', 'CANCELLED');
    END IF;
END $$;

-- CreateEnum: PayrollPeriodType (update if exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PayrollPeriodType') THEN
        CREATE TYPE "PayrollPeriodType" AS ENUM ('MONTHLY', 'BIWEEKLY', 'WEEKLY');
    END IF;
END $$;

-- CreateEnum: AllowanceType
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AllowanceType') THEN
        CREATE TYPE "AllowanceType" AS ENUM ('TRANSPORT', 'HOUSING', 'MEAL', 'COMMUNICATION', 'MEDICAL', 'OTHER');
    END IF;
END $$;

-- CreateEnum: DeductionType
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DeductionType') THEN
        CREATE TYPE "DeductionType" AS ENUM ('TAX', 'PENSION', 'INSURANCE', 'LOAN', 'ADVANCE', 'OTHER');
    END IF;
END $$;

-- CreateEnum: LoanStatus
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LoanStatus') THEN
        CREATE TYPE "LoanStatus" AS ENUM ('PENDING', 'APPROVED', 'ACTIVE', 'COMPLETED', 'CANCELLED');
    END IF;
END $$;

-- CreateEnum: AdvanceStatus
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AdvanceStatus') THEN
        CREATE TYPE "AdvanceStatus" AS ENUM ('PENDING', 'APPROVED', 'REPAID', 'CANCELLED');
    END IF;
END $$;

-- CreateEnum: AuditAction
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AuditAction') THEN
        CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'PROCESS', 'PAY');
    END IF;
END $$;

-- CreateTable: SalaryGrade
CREATE TABLE IF NOT EXISTS "SalaryGrade" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "minSalary" DECIMAL(12,2) NOT NULL,
    "maxSalary" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SalaryGrade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: SalaryGrade name
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'SalaryGrade_name_key' AND schemaname = 'public') THEN
        CREATE UNIQUE INDEX "SalaryGrade_name_key" ON "SalaryGrade"("name");
    END IF;
END $$;

-- CreateIndex: SalaryGrade code
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'SalaryGrade_code_key' AND schemaname = 'public') THEN
        CREATE UNIQUE INDEX "SalaryGrade_code_key" ON "SalaryGrade"("code");
    END IF;
END $$;

-- CreateTable: SalaryStep
CREATE TABLE IF NOT EXISTS "SalaryStep" (
    "id" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "step" INTEGER NOT NULL,
    "salary" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SalaryStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: SalaryStep unique
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'SalaryStep_gradeId_step_key' AND schemaname = 'public') THEN
        CREATE UNIQUE INDEX "SalaryStep_gradeId_step_key" ON "SalaryStep"("gradeId", "step");
    END IF;
END $$;

-- CreateIndex: SalaryStep gradeId
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'SalaryStep_gradeId_idx' AND schemaname = 'public') THEN
        CREATE INDEX "SalaryStep_gradeId_idx" ON "SalaryStep"("gradeId");
    END IF;
END $$;

-- AddForeignKey: SalaryStep -> SalaryGrade
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SalaryStep_gradeId_fkey') THEN
        ALTER TABLE "SalaryStep" ADD CONSTRAINT "SalaryStep_gradeId_fkey" 
        FOREIGN KEY ("gradeId") REFERENCES "SalaryGrade"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- CreateTable: PayrollRun
CREATE TABLE IF NOT EXISTS "PayrollRun" (
    "id" TEXT NOT NULL,
    "periodType" "PayrollPeriodType" NOT NULL DEFAULT 'MONTHLY',
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "paymentDate" DATE,
    "status" "PayrollStatus" NOT NULL DEFAULT 'DRAFT',
    "totalGross" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalDeductions" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalNet" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "employeeCount" INTEGER NOT NULL DEFAULT 0,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "processedBy" TEXT,
    "processedAt" TIMESTAMP(3),
    "comments" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PayrollRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: PayrollRun unique
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PayrollRun_periodType_periodStart_periodEnd_key' AND schemaname = 'public') THEN
        CREATE UNIQUE INDEX "PayrollRun_periodType_periodStart_periodEnd_key" 
        ON "PayrollRun"("periodType", "periodStart", "periodEnd");
    END IF;
END $$;

-- CreateIndex: PayrollRun indexes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PayrollRun_periodStart_periodEnd_idx' AND schemaname = 'public') THEN
        CREATE INDEX "PayrollRun_periodStart_periodEnd_idx" ON "PayrollRun"("periodStart", "periodEnd");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PayrollRun_status_idx' AND schemaname = 'public') THEN
        CREATE INDEX "PayrollRun_status_idx" ON "PayrollRun"("status");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PayrollRun_paymentDate_idx' AND schemaname = 'public') THEN
        CREATE INDEX "PayrollRun_paymentDate_idx" ON "PayrollRun"("paymentDate");
    END IF;
END $$;

-- CreateTable: PayrollItem
CREATE TABLE IF NOT EXISTS "PayrollItem" (
    "id" TEXT NOT NULL,
    "payrollRunId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "basicSalary" DECIMAL(12,2) NOT NULL,
    "allowances" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "overtime" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "bonus" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "grossSalary" DECIMAL(12,2) NOT NULL,
    "incomeTax" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "pension" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "healthInsurance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "providentFund" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "loanDeductions" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "advanceDeductions" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "absenceDeductions" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "otherDeductions" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalDeductions" DECIMAL(12,2) NOT NULL,
    "netSalary" DECIMAL(12,2) NOT NULL,
    "workingDays" INTEGER NOT NULL DEFAULT 0,
    "presentDays" INTEGER NOT NULL DEFAULT 0,
    "absentDays" INTEGER NOT NULL DEFAULT 0,
    "leaveDays" INTEGER NOT NULL DEFAULT 0,
    "payslipGenerated" BOOLEAN NOT NULL DEFAULT false,
    "payslipUrl" TEXT,
    "generatedAt" TIMESTAMP(3),
    "bankAccountNumber" TEXT,
    "bankName" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PayrollItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: PayrollItem indexes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PayrollItem_payrollRunId_employeeId_key' AND schemaname = 'public') THEN
        CREATE UNIQUE INDEX "PayrollItem_payrollRunId_employeeId_key" 
        ON "PayrollItem"("payrollRunId", "employeeId");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PayrollItem_payrollRunId_idx' AND schemaname = 'public') THEN
        CREATE INDEX "PayrollItem_payrollRunId_idx" ON "PayrollItem"("payrollRunId");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PayrollItem_employeeId_idx' AND schemaname = 'public') THEN
        CREATE INDEX "PayrollItem_employeeId_idx" ON "PayrollItem"("employeeId");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PayrollItem_grossSalary_idx' AND schemaname = 'public') THEN
        CREATE INDEX "PayrollItem_grossSalary_idx" ON "PayrollItem"("grossSalary");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PayrollItem_netSalary_idx' AND schemaname = 'public') THEN
        CREATE INDEX "PayrollItem_netSalary_idx" ON "PayrollItem"("netSalary");
    END IF;
END $$;

-- AddForeignKey: PayrollItem -> PayrollRun
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PayrollItem_payrollRunId_fkey') THEN
        ALTER TABLE "PayrollItem" ADD CONSTRAINT "PayrollItem_payrollRunId_fkey" 
        FOREIGN KEY ("payrollRunId") REFERENCES "PayrollRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey: PayrollItem -> Employee
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PayrollItem_employeeId_fkey') THEN
        ALTER TABLE "PayrollItem" ADD CONSTRAINT "PayrollItem_employeeId_fkey" 
        FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- CreateTable: Allowance
CREATE TABLE IF NOT EXISTS "Allowance" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AllowanceType" NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "isPercentage" BOOLEAN NOT NULL DEFAULT false,
    "percentage" DECIMAL(5,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Allowance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Allowance indexes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Allowance_name_key' AND schemaname = 'public') THEN
        CREATE UNIQUE INDEX "Allowance_name_key" ON "Allowance"("name");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Allowance_type_idx' AND schemaname = 'public') THEN
        CREATE INDEX "Allowance_type_idx" ON "Allowance"("type");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Allowance_isActive_idx' AND schemaname = 'public') THEN
        CREATE INDEX "Allowance_isActive_idx" ON "Allowance"("isActive");
    END IF;
END $$;

-- CreateTable: EmployeeAllowance
CREATE TABLE IF NOT EXISTS "EmployeeAllowance" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "allowanceId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EmployeeAllowance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: EmployeeAllowance indexes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'EmployeeAllowance_employeeId_allowanceId_month_key' AND schemaname = 'public') THEN
        CREATE UNIQUE INDEX "EmployeeAllowance_employeeId_allowanceId_month_key" 
        ON "EmployeeAllowance"("employeeId", "allowanceId", "month");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'EmployeeAllowance_employeeId_idx' AND schemaname = 'public') THEN
        CREATE INDEX "EmployeeAllowance_employeeId_idx" ON "EmployeeAllowance"("employeeId");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'EmployeeAllowance_month_idx' AND schemaname = 'public') THEN
        CREATE INDEX "EmployeeAllowance_month_idx" ON "EmployeeAllowance"("month");
    END IF;
END $$;

-- AddForeignKey: EmployeeAllowance -> Employee
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'EmployeeAllowance_employeeId_fkey') THEN
        ALTER TABLE "EmployeeAllowance" ADD CONSTRAINT "EmployeeAllowance_employeeId_fkey" 
        FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey: EmployeeAllowance -> Allowance
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'EmployeeAllowance_allowanceId_fkey') THEN
        ALTER TABLE "EmployeeAllowance" ADD CONSTRAINT "EmployeeAllowance_allowanceId_fkey" 
        FOREIGN KEY ("allowanceId") REFERENCES "Allowance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- CreateTable: Deduction
CREATE TABLE IF NOT EXISTS "Deduction" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DeductionType" NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(12,2),
    "isPercentage" BOOLEAN NOT NULL DEFAULT false,
    "percentage" DECIMAL(5,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Deduction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Deduction indexes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Deduction_name_key' AND schemaname = 'public') THEN
        CREATE UNIQUE INDEX "Deduction_name_key" ON "Deduction"("name");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Deduction_type_idx' AND schemaname = 'public') THEN
        CREATE INDEX "Deduction_type_idx" ON "Deduction"("type");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Deduction_isActive_idx' AND schemaname = 'public') THEN
        CREATE INDEX "Deduction_isActive_idx" ON "Deduction"("isActive");
    END IF;
END $$;

-- CreateTable: Loan
CREATE TABLE IF NOT EXISTS "Loan" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "loanAmount" DECIMAL(12,2) NOT NULL,
    "interestRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "remainingAmount" DECIMAL(12,2) NOT NULL,
    "monthlyPayment" DECIMAL(12,2) NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "status" "LoanStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Loan indexes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Loan_employeeId_idx' AND schemaname = 'public') THEN
        CREATE INDEX "Loan_employeeId_idx" ON "Loan"("employeeId");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Loan_status_idx' AND schemaname = 'public') THEN
        CREATE INDEX "Loan_status_idx" ON "Loan"("status");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Loan_startDate_idx' AND schemaname = 'public') THEN
        CREATE INDEX "Loan_startDate_idx" ON "Loan"("startDate");
    END IF;
END $$;

-- AddForeignKey: Loan -> Employee
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Loan_employeeId_fkey') THEN
        ALTER TABLE "Loan" ADD CONSTRAINT "Loan_employeeId_fkey" 
        FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- CreateTable: LoanRepayment
CREATE TABLE IF NOT EXISTS "LoanRepayment" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentDate" DATE NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LoanRepayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: LoanRepayment indexes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'LoanRepayment_loanId_idx' AND schemaname = 'public') THEN
        CREATE INDEX "LoanRepayment_loanId_idx" ON "LoanRepayment"("loanId");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'LoanRepayment_paymentDate_idx' AND schemaname = 'public') THEN
        CREATE INDEX "LoanRepayment_paymentDate_idx" ON "LoanRepayment"("paymentDate");
    END IF;
END $$;

-- AddForeignKey: LoanRepayment -> Loan
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LoanRepayment_loanId_fkey') THEN
        ALTER TABLE "LoanRepayment" ADD CONSTRAINT "LoanRepayment_loanId_fkey" 
        FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- CreateTable: Advance
CREATE TABLE IF NOT EXISTS "Advance" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "requestedAmount" DECIMAL(12,2) NOT NULL,
    "approvedAmount" DECIMAL(12,2) NOT NULL,
    "remainingAmount" DECIMAL(12,2) NOT NULL,
    "monthlyDeduction" DECIMAL(12,2) NOT NULL,
    "requestDate" DATE NOT NULL,
    "status" "AdvanceStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Advance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Advance indexes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Advance_employeeId_idx' AND schemaname = 'public') THEN
        CREATE INDEX "Advance_employeeId_idx" ON "Advance"("employeeId");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Advance_status_idx' AND schemaname = 'public') THEN
        CREATE INDEX "Advance_status_idx" ON "Advance"("status");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Advance_requestDate_idx' AND schemaname = 'public') THEN
        CREATE INDEX "Advance_requestDate_idx" ON "Advance"("requestDate");
    END IF;
END $$;

-- AddForeignKey: Advance -> Employee
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Advance_employeeId_fkey') THEN
        ALTER TABLE "Advance" ADD CONSTRAINT "Advance_employeeId_fkey" 
        FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- CreateTable: AdvanceRepayment
CREATE TABLE IF NOT EXISTS "AdvanceRepayment" (
    "id" TEXT NOT NULL,
    "advanceId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentDate" DATE NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdvanceRepayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: AdvanceRepayment indexes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'AdvanceRepayment_advanceId_idx' AND schemaname = 'public') THEN
        CREATE INDEX "AdvanceRepayment_advanceId_idx" ON "AdvanceRepayment"("advanceId");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'AdvanceRepayment_paymentDate_idx' AND schemaname = 'public') THEN
        CREATE INDEX "AdvanceRepayment_paymentDate_idx" ON "AdvanceRepayment"("paymentDate");
    END IF;
END $$;

-- AddForeignKey: AdvanceRepayment -> Advance
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AdvanceRepayment_advanceId_fkey') THEN
        ALTER TABLE "AdvanceRepayment" ADD CONSTRAINT "AdvanceRepayment_advanceId_fkey" 
        FOREIGN KEY ("advanceId") REFERENCES "Advance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- CreateTable: TaxRate
CREATE TABLE IF NOT EXISTS "TaxRate" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "minIncome" DECIMAL(12,2) NOT NULL,
    "maxIncome" DECIMAL(12,2),
    "rate" DECIMAL(5,2) NOT NULL,
    "fixedAmount" DECIMAL(12,2),
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TaxRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: TaxRate indexes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'TaxRate_year_minIncome_key' AND schemaname = 'public') THEN
        CREATE UNIQUE INDEX "TaxRate_year_minIncome_key" ON "TaxRate"("year", "minIncome");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'TaxRate_year_idx' AND schemaname = 'public') THEN
        CREATE INDEX "TaxRate_year_idx" ON "TaxRate"("year");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'TaxRate_isActive_idx' AND schemaname = 'public') THEN
        CREATE INDEX "TaxRate_isActive_idx" ON "TaxRate"("isActive");
    END IF;
END $$;

-- CreateTable: PensionRate
CREATE TABLE IF NOT EXISTS "PensionRate" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "employeeRate" DECIMAL(5,2) NOT NULL,
    "employerRate" DECIMAL(5,2) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PensionRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: PensionRate indexes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PensionRate_year_key' AND schemaname = 'public') THEN
        CREATE UNIQUE INDEX "PensionRate_year_key" ON "PensionRate"("year");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PensionRate_isActive_idx' AND schemaname = 'public') THEN
        CREATE INDEX "PensionRate_isActive_idx" ON "PensionRate"("isActive");
    END IF;
END $$;

-- CreateTable: SalaryIncrement
CREATE TABLE IF NOT EXISTS "SalaryIncrement" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "previousSalary" DECIMAL(12,2) NOT NULL,
    "newSalary" DECIMAL(12,2) NOT NULL,
    "incrementAmount" DECIMAL(12,2) NOT NULL,
    "incrementPercentage" DECIMAL(5,2) NOT NULL,
    "effectiveDate" DATE NOT NULL,
    "reason" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SalaryIncrement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: SalaryIncrement indexes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'SalaryIncrement_employeeId_idx' AND schemaname = 'public') THEN
        CREATE INDEX "SalaryIncrement_employeeId_idx" ON "SalaryIncrement"("employeeId");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'SalaryIncrement_effectiveDate_idx' AND schemaname = 'public') THEN
        CREATE INDEX "SalaryIncrement_effectiveDate_idx" ON "SalaryIncrement"("effectiveDate");
    END IF;
END $$;

-- AddForeignKey: SalaryIncrement -> Employee
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SalaryIncrement_employeeId_fkey') THEN
        ALTER TABLE "SalaryIncrement" ADD CONSTRAINT "SalaryIncrement_employeeId_fkey" 
        FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- CreateTable: PayrollAuditLog
CREATE TABLE IF NOT EXISTS "PayrollAuditLog" (
    "id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "payrollRunId" TEXT,
    "performedBy" TEXT NOT NULL,
    "userEmail" TEXT,
    "userName" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PayrollAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: PayrollAuditLog indexes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PayrollAuditLog_action_idx' AND schemaname = 'public') THEN
        CREATE INDEX "PayrollAuditLog_action_idx" ON "PayrollAuditLog"("action");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PayrollAuditLog_entityType_idx' AND schemaname = 'public') THEN
        CREATE INDEX "PayrollAuditLog_entityType_idx" ON "PayrollAuditLog"("entityType");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PayrollAuditLog_payrollRunId_idx' AND schemaname = 'public') THEN
        CREATE INDEX "PayrollAuditLog_payrollRunId_idx" ON "PayrollAuditLog"("payrollRunId");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PayrollAuditLog_performedBy_idx' AND schemaname = 'public') THEN
        CREATE INDEX "PayrollAuditLog_performedBy_idx" ON "PayrollAuditLog"("performedBy");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PayrollAuditLog_createdAt_idx' AND schemaname = 'public') THEN
        CREATE INDEX "PayrollAuditLog_createdAt_idx" ON "PayrollAuditLog"("createdAt");
    END IF;
END $$;

-- AddForeignKey: PayrollAuditLog -> PayrollRun
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PayrollAuditLog_payrollRunId_fkey') THEN
        ALTER TABLE "PayrollAuditLog" ADD CONSTRAINT "PayrollAuditLog_payrollRunId_fkey" 
        FOREIGN KEY ("payrollRunId") REFERENCES "PayrollRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

