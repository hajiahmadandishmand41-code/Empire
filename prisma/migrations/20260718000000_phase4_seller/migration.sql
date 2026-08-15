-- Empire Shop — Phase 4: Seller Marketplace
-- Adds product-level fields required by the seller panel:
--   isActive       — publish / unpublish switch (independent of stock)
--   stockQuantity  — numeric inventory
--   compareAtPrice — original price for discount presentation

ALTER TABLE "Product" ADD COLUMN "isActive"       BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Product" ADD COLUMN "stockQuantity"  INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN "compareAtPrice" DOUBLE PRECISION;

CREATE INDEX "Product_isActive_idx" ON "Product"("isActive");
