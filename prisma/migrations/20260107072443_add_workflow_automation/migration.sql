-- AlterTable: Add new columns to existing notifications table
ALTER TABLE "notifications" ADD COLUMN "feature_id" TEXT;
ALTER TABLE "notifications" ADD COLUMN "step_id" TEXT;
ALTER TABLE "notifications" ADD COLUMN "agent_id" TEXT;
ALTER TABLE "notifications" ADD COLUMN "action_label" TEXT;

-- CreateTable
CREATE TABLE "workflow_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "auto_transition" BOOLEAN NOT NULL DEFAULT false,
    "polling_interval" INTEGER NOT NULL DEFAULT 5000,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_workflow_steps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "feature_id" TEXT NOT NULL,
    "step_type" TEXT NOT NULL,
    "step_order" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "agent_id" TEXT,
    "output" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "workflow_steps_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "features" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_workflow_steps" ("agent_id", "created_at", "feature_id", "id", "output", "status", "step_type", "updated_at") SELECT "agent_id", "created_at", "feature_id", "id", "output", "status", "step_type", "updated_at" FROM "workflow_steps";
DROP TABLE "workflow_steps";
ALTER TABLE "new_workflow_steps" RENAME TO "workflow_steps";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
