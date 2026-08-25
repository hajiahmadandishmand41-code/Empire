CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram indexes accelerate case-insensitive contains/fuzzy candidate retrieval.
CREATE INDEX "Product_name_trgm_idx" ON "Product" USING GIN (lower("name") gin_trgm_ops);
CREATE INDEX "Product_shortDescription_trgm_idx" ON "Product" USING GIN (lower("shortDescription") gin_trgm_ops);
CREATE INDEX "Product_description_trgm_idx" ON "Product" USING GIN (lower("description") gin_trgm_ops);
CREATE INDEX "Product_region_trgm_idx" ON "Product" USING GIN (lower("region") gin_trgm_ops);
CREATE INDEX "Category_name_trgm_idx" ON "Category" USING GIN (lower("name") gin_trgm_ops);
CREATE INDEX "User_sellerShopName_trgm_idx" ON "User" USING GIN (lower("sellerShopName") gin_trgm_ops);

-- Common active-catalog ranking paths. The existing single-column indexes remain
-- useful for simple filters; these partial composites reduce work for homepage feeds.
CREATE INDEX "Product_active_sales_created_idx"
  ON "Product" ("salesCount" DESC, "createdAt" DESC, "id" ASC)
  WHERE "isActive" = true;

CREATE INDEX "Product_active_views_created_idx"
  ON "Product" ("viewCount" DESC, "createdAt" DESC, "id" ASC)
  WHERE "isActive" = true;

CREATE INDEX "Product_active_category_sales_idx"
  ON "Product" ("categoryId", "salesCount" DESC, "createdAt" DESC, "id" ASC)
  WHERE "isActive" = true;

CREATE INDEX "Product_active_seller_sales_idx"
  ON "Product" ("sellerId", "salesCount" DESC, "createdAt" DESC, "id" ASC)
  WHERE "isActive" = true;
