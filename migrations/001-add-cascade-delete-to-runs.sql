-- Migration: Add CASCADE delete to request_runs foreign key
-- This allows deleting requests even if they have associated runs

-- Drop existing foreign key constraint
ALTER TABLE "request_runs"
DROP CONSTRAINT IF EXISTS "FK_ea24c14cf7c104113114fc49c0a";

-- Add new foreign key constraint with CASCADE delete
ALTER TABLE "request_runs"
ADD CONSTRAINT "FK_ea24c14cf7c104113114fc49c0a"
FOREIGN KEY ("requestId")
REFERENCES "requests"("id")
ON DELETE CASCADE;

-- Also update environment foreign key to SET NULL on delete
ALTER TABLE "request_runs"
DROP CONSTRAINT IF EXISTS "FK_request_runs_environment";

ALTER TABLE "request_runs"
ADD CONSTRAINT "FK_request_runs_environment"
FOREIGN KEY ("environmentId")
REFERENCES "environments"("id")
ON DELETE SET NULL;
