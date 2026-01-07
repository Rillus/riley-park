-- Add sync-related fields to Project
ALTER TABLE "projects" ADD COLUMN "last_synced_at" DATETIME;
ALTER TABLE "projects" ADD COLUMN "last_sync_status" TEXT;
ALTER TABLE "projects" ADD COLUMN "last_sync_error" TEXT;

-- Add external_id field to Feature for repository sync
ALTER TABLE "features" ADD COLUMN "external_id" TEXT;

-- Create unique index for project + external_id combination
CREATE UNIQUE INDEX "features_project_id_external_id_key" ON "features"("project_id", "external_id");
