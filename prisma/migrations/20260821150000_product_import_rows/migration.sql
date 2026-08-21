CREATE TABLE IF NOT EXISTS "ProductImportRow" (
  "id" TEXT PRIMARY KEY,
  "batchId" TEXT NOT NULL,
  "rowIndex" INTEGER NOT NULL,
  "payloadJson" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "error" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "ProductImportRow_batchId_fkey"
    FOREIGN KEY ("batchId") REFERENCES "ProductImportBatch"("id") ON DELETE CASCADE,
  CONSTRAINT "ProductImportRow_batchId_rowIndex_key" UNIQUE ("batchId", "rowIndex")
);

CREATE INDEX IF NOT EXISTS "ProductImportRow_batchId_status_rowIndex_idx"
  ON "ProductImportRow" ("batchId", "status", "rowIndex");

CREATE INDEX IF NOT EXISTS "ProductImportRow_status_updatedAt_idx"
  ON "ProductImportRow" ("status", "updatedAt" DESC);