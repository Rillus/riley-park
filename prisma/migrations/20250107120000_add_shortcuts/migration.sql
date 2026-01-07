-- CreateTable
CREATE TABLE "shortcuts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "prompt_template" TEXT NOT NULL,
    "category" TEXT,
    "is_predefined" INTEGER NOT NULL DEFAULT 0,
    "user_id" TEXT,
    "variables" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "shortcuts_user_id_idx" ON "shortcuts"("user_id");

-- CreateIndex
CREATE INDEX "shortcuts_is_predefined_idx" ON "shortcuts"("is_predefined");

-- CreateIndex
CREATE INDEX "shortcuts_category_idx" ON "shortcuts"("category");

