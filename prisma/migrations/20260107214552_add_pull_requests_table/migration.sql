-- CreateTable
CREATE TABLE "pull_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "feature_id" TEXT NOT NULL,
    "workflow_step_id" TEXT,
    "agent_id" TEXT,
    "pr_url" TEXT NOT NULL,
    "pr_number" INTEGER,
    "pr_title" TEXT NOT NULL,
    "branch_name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "github_pr_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "pull_requests_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "features" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "pull_requests_workflow_step_id_fkey" FOREIGN KEY ("workflow_step_id") REFERENCES "workflow_steps" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "pull_requests_feature_id_idx" ON "pull_requests"("feature_id");

-- CreateIndex
CREATE INDEX "pull_requests_workflow_step_id_idx" ON "pull_requests"("workflow_step_id");

-- CreateIndex
CREATE INDEX "pull_requests_status_idx" ON "pull_requests"("status");

-- CreateIndex
CREATE INDEX "pull_requests_created_at_idx" ON "pull_requests"("created_at");

