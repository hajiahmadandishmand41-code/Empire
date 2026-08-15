-- Add optional videoUrl column to the Product table.
-- Supports YouTube, Vimeo, or direct video file URLs.
ALTER TABLE "Product" ADD COLUMN "videoUrl" TEXT;
