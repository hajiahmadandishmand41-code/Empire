-- Seller brand is one persistent public identity per seller.
-- Keep the migration self-contained so fresh databases do not depend on an
-- undocumented table that is absent from older Prisma schemas.
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
  CONSTRAINT "SellerBrand_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SellerBrand_sellerId_key" ON "SellerBrand"("sellerId");
CREATE UNIQUE INDEX IF NOT EXISTS "SellerBrand_slug_key" ON "SellerBrand"("slug");
CREATE INDEX IF NOT EXISTS "SellerBrand_isActive_idx" ON "SellerBrand"("isActive");
CREATE INDEX IF NOT EXISTS "SellerBrand_createdAt_idx" ON "SellerBrand"("createdAt");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SellerBrand_sellerId_fkey') THEN
    ALTER TABLE "SellerBrand"
      ADD CONSTRAINT "SellerBrand_sellerId_fkey"
      FOREIGN KEY ("sellerId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "brandId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Product_brandId_fkey') THEN
    ALTER TABLE "Product"
      ADD CONSTRAINT "Product_brandId_fkey"
      FOREIGN KEY ("brandId") REFERENCES "SellerBrand"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Product_brandId_idx" ON "Product"("brandId");

-- Existing seller products are assigned to their seller's only brand.
UPDATE "Product" p
SET "brandId" = b."id"
FROM "SellerBrand" b
WHERE p."sellerId" = b."sellerId"
  AND p."brandId" IS NULL;
