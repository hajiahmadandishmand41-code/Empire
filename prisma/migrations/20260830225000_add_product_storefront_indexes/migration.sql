-- Optimize the most frequent storefront queries without changing application data.
CREATE INDEX "Product_sellerId_isActive_salesCount_createdAt_idx"
ON "Product" ("sellerId", "isActive", "salesCount", "createdAt");

CREATE INDEX "Product_isActive_createdAt_idx"
ON "Product" ("isActive", "createdAt");
