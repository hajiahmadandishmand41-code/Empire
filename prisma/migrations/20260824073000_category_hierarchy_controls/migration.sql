-- Backward-compatible category metadata layer.
-- Existing Category/Product rows remain untouched; metadata is populated for every
-- existing category so no category or product is lost.
CREATE TABLE IF NOT EXISTS "CategoryMeta" (
  "categoryId" TEXT NOT NULL,
  "parentId" TEXT,
  "imageUrl" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CategoryMeta_pkey" PRIMARY KEY ("categoryId"),
  CONSTRAINT "CategoryMeta_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CategoryMeta_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "CategoryMeta_parentId_idx" ON "CategoryMeta"("parentId");
CREATE INDEX IF NOT EXISTS "CategoryMeta_isActive_idx" ON "CategoryMeta"("isActive");
CREATE INDEX IF NOT EXISTS "CategoryMeta_sortOrder_idx" ON "CategoryMeta"("sortOrder");

INSERT INTO "CategoryMeta" ("categoryId")
SELECT c."id"
FROM "Category" c
LEFT JOIN "CategoryMeta" m ON m."categoryId" = c."id"
WHERE m."categoryId" IS NULL;
