-- CreateTable
CREATE TABLE "features" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'planned',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "features_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "workflow_steps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "feature_id" TEXT NOT NULL,
    "step_type" TEXT NOT NULL,
    "step_order" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "agent_id" TEXT,
    "output" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "workflow_steps_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "features" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "feature_id" TEXT,
    "step_id" TEXT,
    "agent_id" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "action_url" TEXT,
    "action_label" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "workflow_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "auto_transition" BOOLEAN NOT NULL DEFAULT false,
    "polling_interval" INTEGER NOT NULL DEFAULT 5000,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
