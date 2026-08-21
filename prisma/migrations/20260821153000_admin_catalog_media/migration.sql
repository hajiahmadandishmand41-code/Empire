-- Admin catalog media
-- Adds an optional image to categories without changing existing product data.
ALTER TABLE "Category"
  ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;

CREATE INDEX IF NOT EXISTS "Category_imageUrl_idx" ON "Category"("imageUrl");
