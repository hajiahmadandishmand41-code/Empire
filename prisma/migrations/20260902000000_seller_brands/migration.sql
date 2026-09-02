-- Seller Brands: isolated seller-owned brand directory + product linkage.
CREATE TABLE IF NOT EXISTS "SellerBrand" (
  "id" TEXT NOT NULL,
  "sellerId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "logoUrl" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SellerBrand_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SellerBrand_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "SellerBrand_sellerId_slug_key" ON "SellerBrand"("sellerId","slug");
CREATE INDEX IF NOT EXISTS "SellerBrand_sellerId_idx" ON "SellerBrand"("sellerId");
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "brandId" TEXT;
CREATE INDEX IF NOT EXISTS "Product_brandId_idx" ON "Product"("brandId");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Product_brandId_fkey') THEN
    ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "SellerBrand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
