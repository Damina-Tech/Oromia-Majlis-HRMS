-- Add avatarUrl columns to User and Employee tables
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;

ALTER TABLE "Employee"
ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;

