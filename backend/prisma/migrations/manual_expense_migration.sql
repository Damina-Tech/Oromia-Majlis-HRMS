-- Manual Migration for Expense Module
-- Run this SQL directly in your PostgreSQL database if prisma migrate fails

-- Create Enums
CREATE TYPE "ExpenseType" AS ENUM ('OPERATIONAL', 'TRAVEL', 'REIMBURSEMENT', 'MAINTENANCE', 'RENT', 'UTILITIES', 'OTHER');
CREATE TYPE "ExpenseStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PAID');
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'E_BIRR', 'TELEBIRR', 'OTHER');
CREATE TYPE "ExpenseApprovalAction" AS ENUM ('SUBMITTED', 'APPROVED', 'REJECTED');

-- Create Expense Table
CREATE TABLE IF NOT EXISTS "Expense" (
    "id" TEXT NOT NULL,
    "referenceNo" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ETB',
    "expenseType" "ExpenseType" NOT NULL,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'DRAFT',
    "incurredDate" DATE NOT NULL,
    "submittedBy" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "assetId" TEXT,
    "vendorId" TEXT,
    "paymentMethod" "PaymentMethod",
    "receiptUrl" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "paidBy" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- Create ExpenseApproval Table
CREATE TABLE IF NOT EXISTS "ExpenseApproval" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "action" "ExpenseApprovalAction" NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpenseApproval_pkey" PRIMARY KEY ("id")
);

-- Create ExpensePayment Table
CREATE TABLE IF NOT EXISTS "ExpensePayment" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "paidAmount" DECIMAL(12,2) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "paymentReference" TEXT,
    "paidBy" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "ExpensePayment_pkey" PRIMARY KEY ("id")
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS "Expense_submittedBy_idx" ON "Expense"("submittedBy");
CREATE INDEX IF NOT EXISTS "Expense_departmentId_idx" ON "Expense"("departmentId");
CREATE INDEX IF NOT EXISTS "Expense_status_idx" ON "Expense"("status");
CREATE INDEX IF NOT EXISTS "Expense_expenseType_idx" ON "Expense"("expenseType");
CREATE INDEX IF NOT EXISTS "Expense_incurredDate_idx" ON "Expense"("incurredDate");
CREATE INDEX IF NOT EXISTS "Expense_createdAt_idx" ON "Expense"("createdAt");
CREATE INDEX IF NOT EXISTS "ExpenseApproval_expenseId_idx" ON "ExpenseApproval"("expenseId");
CREATE INDEX IF NOT EXISTS "ExpenseApproval_approverId_idx" ON "ExpenseApproval"("approverId");
CREATE INDEX IF NOT EXISTS "ExpenseApproval_createdAt_idx" ON "ExpenseApproval"("createdAt");
CREATE INDEX IF NOT EXISTS "ExpensePayment_expenseId_idx" ON "ExpensePayment"("expenseId");
CREATE INDEX IF NOT EXISTS "ExpensePayment_paidBy_idx" ON "ExpensePayment"("paidBy");
CREATE INDEX IF NOT EXISTS "ExpensePayment_paidAt_idx" ON "ExpensePayment"("paidAt");

-- Create Unique Constraint
CREATE UNIQUE INDEX IF NOT EXISTS "Expense_referenceNo_key" ON "Expense"("referenceNo");

-- Add Foreign Keys
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "AssetVendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_paidBy_fkey" FOREIGN KEY ("paidBy") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExpenseApproval" ADD CONSTRAINT "ExpenseApproval_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExpenseApproval" ADD CONSTRAINT "ExpenseApproval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExpensePayment" ADD CONSTRAINT "ExpensePayment_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExpensePayment" ADD CONSTRAINT "ExpensePayment_paidBy_fkey" FOREIGN KEY ("paidBy") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

