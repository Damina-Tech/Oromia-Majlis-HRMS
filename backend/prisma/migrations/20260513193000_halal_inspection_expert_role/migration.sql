-- Expert role per Halal inspection assignment (technical vs sharia)
CREATE TYPE "HalalInspectionExpertRole" AS ENUM ('TECHNICAL_EXPERT', 'SHARIA_EXPERT');

ALTER TABLE "HalalInspection" ADD COLUMN "expertRole" "HalalInspectionExpertRole" NOT NULL DEFAULT 'TECHNICAL_EXPERT';
