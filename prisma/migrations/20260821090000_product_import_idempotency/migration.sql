CREATE TABLE "ProductImportBatch" (
  "id" TEXT NOT NULL,
  "sellerId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "createdCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductImportBatch_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProductImportBatch_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ProductImportBatch_sellerId_idempotencyKey_key" ON "ProductImportBatch"("sellerId", "idempotencyKey");
CREATE INDEX "ProductImportBatch_sellerId_createdAt_idx" ON "ProductImportBatch"("sellerId", "createdAt");
