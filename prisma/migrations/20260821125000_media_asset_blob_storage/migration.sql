-- Persistent media fallback for environments without Cloudinary.
-- Stores small/medium images and videos in the existing MediaAsset table.
-- Non-destructive: only adds a nullable binary column.
ALTER TABLE "MediaAsset"
  ADD COLUMN IF NOT EXISTS "data" BYTEA;
