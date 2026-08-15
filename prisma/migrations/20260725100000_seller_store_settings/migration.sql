-- Phase 12+ : Seller store settings (logo, banner, contact, whatsapp).
-- Adds nullable columns to the existing "User" table so no data migration
-- is required. Safe to run on live DBs.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sellerLogoUrl"       TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sellerBannerUrl"     TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sellerWhatsapp"      TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sellerContactEmail"  TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sellerContactPhone"  TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sellerAddress"       TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sellerCity"          TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sellerCountry"       TEXT;
