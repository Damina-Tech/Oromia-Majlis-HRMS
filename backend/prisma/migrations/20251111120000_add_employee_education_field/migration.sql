-- Add educationField column to Employee table
ALTER TABLE "Employee"
ADD COLUMN IF NOT EXISTS "educationField" TEXT;

