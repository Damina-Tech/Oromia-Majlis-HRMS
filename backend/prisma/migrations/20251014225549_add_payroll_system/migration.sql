/*
  Warnings:

  - You are about to drop the column `advanceDeduction` on the `Payroll` table. All the data in the column will be lost.
  - You are about to drop the column `commission` on the `Payroll` table. All the data in the column will be lost.
  - You are about to drop the column `houseAllowance` on the `Payroll` table. All the data in the column will be lost.
  - You are about to drop the column `loanDeduction` on the `Payroll` table. All the data in the column will be lost.
  - You are about to drop the column `mealAllowance` on the `Payroll` table. All the data in the column will be lost.
  - You are about to drop the column `otherEarnings` on the `Payroll` table. All the data in the column will be lost.
  - You are about to drop the column `overtimeHours` on the `Payroll` table. All the data in the column will be lost.
  - You are about to drop the column `overtimePay` on the `Payroll` table. All the data in the column will be lost.
  - You are about to drop the column `pensionEmployee` on the `Payroll` table. All the data in the column will be lost.
  - You are about to drop the column `pensionEmployer` on the `Payroll` table. All the data in the column will be lost.
  - You are about to drop the column `transportAllowance` on the `Payroll` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Payroll" DROP COLUMN "advanceDeduction",
DROP COLUMN "commission",
DROP COLUMN "houseAllowance",
DROP COLUMN "loanDeduction",
DROP COLUMN "mealAllowance",
DROP COLUMN "otherEarnings",
DROP COLUMN "overtimeHours",
DROP COLUMN "overtimePay",
DROP COLUMN "pensionEmployee",
DROP COLUMN "pensionEmployer",
DROP COLUMN "transportAllowance",
ADD COLUMN     "allowances" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "leaveDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "overtime" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "providentFund" DECIMAL(12,2) NOT NULL DEFAULT 0;
