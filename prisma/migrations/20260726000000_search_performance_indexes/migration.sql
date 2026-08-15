-- Migration: Search Performance Indexes
-- Phase: Backend Architecture Upgrade
-- Date: 2026-07-26
--
-- Adds database-level indexes to support the professional search engine
-- and product ranking algorithm. These indexes dramatically reduce query
-- time for the most common access patterns.
--
-- Each index is annotated with the query it supports.

-- ── Product search indexes ─────────────────────────────────────────────────────

-- Full product list / homepage: ORDER BY inStock DESC, salesCount DESC, createdAt DESC
CREATE INDEX IF NOT EXISTS "Product_stock_sales_created_idx"
  ON "Product" ("inStock" DESC, "salesCount" DESC, "createdAt" DESC);

-- Best-selling sort: ORDER BY salesCount DESC
CREATE INDEX IF NOT EXISTS "Product_salesCount_idx"
  ON "Product" ("salesCount" DESC);

-- Most-viewed sort: ORDER BY viewCount DESC
CREATE INDEX IF NOT EXISTS "Product_viewCount_idx"
  ON "Product" ("viewCount" DESC);

-- Active products only (most queries filter isActive=true)
CREATE INDEX IF NOT EXISTS "Product_isActive_idx"
  ON "Product" ("isActive");

-- Category + active products listing
CREATE INDEX IF NOT EXISTS "Product_categoryId_isActive_idx"
  ON "Product" ("categoryId", "isActive");

-- Seller product management listing
CREATE INDEX IF NOT EXISTS "Product_sellerId_isActive_idx"
  ON "Product" ("sellerId", "isActive");

-- Featured products (compareAtPrice IS NOT NULL)
CREATE INDEX IF NOT EXISTS "Product_compareAtPrice_idx"
  ON "Product" ("compareAtPrice");

-- Price range filtering: WHERE price BETWEEN ? AND ?
CREATE INDEX IF NOT EXISTS "Product_price_idx"
  ON "Product" ("price");

-- Combined active + price filter (common in shop listing)
CREATE INDEX IF NOT EXISTS "Product_isActive_price_idx"
  ON "Product" ("isActive", "price");

-- ── Review indexes for batch rating computation ────────────────────────────────

-- Batch rating fetch: WHERE productId IN (...) AND isApproved = true
CREATE INDEX IF NOT EXISTS "Review_productId_isApproved_idx"
  ON "Review" ("productId", "isApproved");

-- ── Wishlist popularity signal ─────────────────────────────────────────────────

-- Popular sort: COUNT(WishlistItem) per product
CREATE INDEX IF NOT EXISTS "WishlistItem_productId_idx"
  ON "WishlistItem" ("productId");

-- ── Order item indexes for salesCount accuracy ────────────────────────────────

-- salesCount maintenance: when computing seller analytics
CREATE INDEX IF NOT EXISTS "OrderItem_productId_idx"
  ON "OrderItem" ("productId");

-- Verified-purchase check for reviews
CREATE INDEX IF NOT EXISTS "OrderItem_productId_orderId_idx"
  ON "OrderItem" ("productId", "orderId");

-- ── VerificationToken cleanup index ───────────────────────────────────────────

-- Cleanup of expired tokens: WHERE expiresAt < NOW()
CREATE INDEX IF NOT EXISTS "VerificationToken_expiresAt_usedAt_idx"
  ON "VerificationToken" ("expiresAt", "usedAt");
