-- Every seller has exactly one SellerBrand. Products can explicitly belong to that brand.
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "brandId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Product_brandId_fkey'
  ) THEN
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
