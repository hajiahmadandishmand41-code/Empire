-- One brand per seller/store.
-- The existing User row remains the store identity; this table adds a dedicated
-- brand identity without creating a second shop model or duplicating sellers.
CREATE TABLE IF NOT EXISTS "SellerBrand" (
  "id" TEXT NOT NULL,
  "sellerId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "logoUrl" TEXT,
  "bannerUrl" TEXT,
  "website" TEXT,
  "country" TEXT,
  "contactEmail" TEXT,
  "contactPhone" TEXT,
  "instagram" TEXT,
  "facebook" TEXT,
  "telegram" TEXT,
  "linkedin" TEXT,
  "attributesJson" JSONB,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SellerBrand_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SellerBrand_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "SellerBrand_sellerId_key" ON "SellerBrand"("sellerId");
CREATE UNIQUE INDEX IF NOT EXISTS "SellerBrand_slug_key" ON "SellerBrand"("slug");
CREATE INDEX IF NOT EXISTS "SellerBrand_name_idx" ON "SellerBrand"("name");
CREATE INDEX IF NOT EXISTS "SellerBrand_isActive_idx" ON "SellerBrand"("isActive");

-- Backfill one brand for existing sellers from their current shop identity.
INSERT INTO "SellerBrand" (
  "id", "sellerId", "name", "slug", "description", "logoUrl", "bannerUrl",
  "website", "country", "contactEmail", "contactPhone", "instagram", "facebook",
  "telegram", "linkedin", "isActive", "createdAt", "updatedAt"
)
SELECT
  'brand_' || u."id",
  u."id",
  COALESCE(NULLIF(TRIM(u."sellerShopName"), ''), u."fullName"),
  LEFT(
    regexp_replace(
      lower(COALESCE(NULLIF(TRIM(u."sellerShopName"), ''), u."fullName")),
      '[^a-z0-9]+', '-', 'g'
    ),
    80
  ) || '-' || LEFT(u."id", 8),
  u."sellerBio",
  u."sellerLogoUrl",
  u."sellerBannerUrl",
  u."sellerWebsite",
  u."sellerCountry",
  u."sellerContactEmail",
  u."sellerContactPhone",
  u."sellerInstagram",
  u."sellerFacebook",
  u."sellerTelegram",
  u."sellerLinkedin",
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "User" u
WHERE u."role" = 'seller'
  AND NOT EXISTS (SELECT 1 FROM "SellerBrand" b WHERE b."sellerId" = u."id");
