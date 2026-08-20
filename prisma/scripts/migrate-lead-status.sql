-- Idempotent migration: old LeadStatus values -> new PT enum + loss fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LeadLossReason') THEN
    CREATE TYPE "LeadLossReason" AS ENUM (
      'sem_contato',
      'sem_interesse',
      'duplicado',
      'fora_perfil',
      'outro'
    );
  END IF;
END $$;

ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "lossReason" "LeadLossReason";
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "lossNote" TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'LeadStatus' AND e.enumlabel = 'new'
  ) THEN
    CREATE TYPE "LeadStatus_new" AS ENUM ('colhido', 'usado', 'perdido', 'convertido');

    ALTER TABLE "Lead" ALTER COLUMN "status" DROP DEFAULT;

    ALTER TABLE "Lead"
      ALTER COLUMN "status" TYPE "LeadStatus_new"
      USING (
        CASE "status"::text
          WHEN 'new' THEN 'colhido'
          WHEN 'contacted' THEN 'usado'
          WHEN 'discarded' THEN 'perdido'
          WHEN 'converted' THEN 'convertido'
          ELSE 'colhido'
        END::"LeadStatus_new"
      );

    DROP TYPE "LeadStatus";
    ALTER TYPE "LeadStatus_new" RENAME TO "LeadStatus";
    ALTER TABLE "Lead" ALTER COLUMN "status" SET DEFAULT 'colhido';
  END IF;
END $$;
