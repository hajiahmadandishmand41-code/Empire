-- Stage 1 schema reconciliation.
-- These fields/models are present in prisma/schema.prisma and are required by
-- runtime queries, but were missing from the previously recorded migrations.
-- All operations are additive and safe to re-run on an existing database.

ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS "weightKg" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "dimensionsJson" TEXT,
  ADD COLUMN IF NOT EXISTS "tagsJson" TEXT,
  ADD COLUMN IF NOT EXISTS "attributesJson" TEXT,
  ADD COLUMN IF NOT EXISTS "primaryImageIndex" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "sellerInstagram" TEXT,
  ADD COLUMN IF NOT EXISTS "sellerTelegram" TEXT,
  ADD COLUMN IF NOT EXISTS "sellerFacebook" TEXT,
  ADD COLUMN IF NOT EXISTS "sellerLinkedin" TEXT,
  ADD COLUMN IF NOT EXISTS "sellerWebsite" TEXT;

CREATE TABLE IF NOT EXISTS "SellerNotification" (
  "id" TEXT NOT NULL,
  "sellerId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'info',
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "link" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SellerNotification_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SellerNotification_sellerId_fkey"
    FOREIGN KEY ("sellerId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "SellerNotification_sellerId_idx"
  ON "SellerNotification"("sellerId");
CREATE INDEX IF NOT EXISTS "SellerNotification_isRead_idx"
  ON "SellerNotification"("isRead");
CREATE INDEX IF NOT EXISTS "SellerNotification_createdAt_idx"
  ON "SellerNotification"("createdAt");