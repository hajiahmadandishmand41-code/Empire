-- Migration: Add viewCount and whatsappNumber to Product
-- Phase: EmpireShop v3 Upgrade

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "viewCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "whatsappNumber" TEXT;

-- Add index for viewCount for smart sorting
CREATE INDEX IF NOT EXISTS "Product_viewCount_idx" ON "Product"("viewCount");

-- Backfill viewCount = salesCount * 3 (rough proxy for initial data)
UPDATE "Product" SET "viewCount" = "salesCount" * 3 WHERE "viewCount" = 0 AND "salesCount" > 0;
