CREATE TABLE IF NOT EXISTS "ProductImportBatch" (
  "id" TEXT PRIMARY KEY,
  "sellerId" TEXT NOT NULL,
  "sourceName" TEXT,
  "sourceHash" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'processing',
  "totalRows" INTEGER NOT NULL DEFAULT 0,
  "processedRows" INTEGER NOT NULL DEFAULT 0,
  "createdRows" INTEGER NOT NULL DEFAULT 0,
  "failedRows" INTEGER NOT NULL DEFAULT 0,
  "errorJson" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "ProductImportBatch_sellerId_fkey"
    FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "ProductImportBatch_sellerId_sourceHash_key" UNIQUE ("sellerId", "sourceHash")
);

ALTER TABLE "ProductImportBatch"
  ADD COLUMN IF NOT EXISTS "processedRows" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "ProductImportBatch_sellerId_createdAt_idx"
  ON "ProductImportBatch" ("sellerId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "ProductImportBatch_status_updatedAt_idx"
  ON "ProductImportBatch" ("status", "updatedAt" DESC);
