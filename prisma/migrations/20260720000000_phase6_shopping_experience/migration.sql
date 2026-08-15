-- Empire Shop — Phase 6: Improved shopping experience
-- Adds: product sales counter (for "best-selling" sort),
--       Wishlist (customer favorites),
--       Review (product ratings + comments).
--
-- Design notes
-- ------------
-- * Wishlist rows are (userId, productId) unique. Deleting a user
--   or a product cascades to their wishlist rows.
-- * Review has (userId, productId) unique — one review per customer
--   per product, editable via UPDATE. rating is CHECKed to 1..5.
-- * `isApproved` lets admin moderate reviews later without a
--   dedicated migration; defaults to TRUE so the shopping surface
--   works out of the box.
-- * `salesCount` mirrors delivered order totals; the phase-6 API
--   updates it when an order transitions to `delivered`.

ALTER TABLE "Product" ADD COLUMN "salesCount" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX "Product_salesCount_idx" ON "Product"("salesCount");
CREATE INDEX "Product_price_idx" ON "Product"("price");
CREATE INDEX "Product_inStock_idx" ON "Product"("inStock");

CREATE TABLE "WishlistItem" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WishlistItem_userId_productId_key"
  ON "WishlistItem"("userId", "productId");
CREATE INDEX "WishlistItem_userId_idx" ON "WishlistItem"("userId");
CREATE INDEX "WishlistItem_productId_idx" ON "WishlistItem"("productId");

ALTER TABLE "WishlistItem"
  ADD CONSTRAINT "WishlistItem_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WishlistItem"
  ADD CONSTRAINT "WishlistItem_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Review" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "title" TEXT,
  "comment" TEXT,
  "isApproved" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Review_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Review_rating_range_check" CHECK ("rating" BETWEEN 1 AND 5)
);

CREATE UNIQUE INDEX "Review_userId_productId_key"
  ON "Review"("userId", "productId");
CREATE INDEX "Review_productId_idx" ON "Review"("productId");
CREATE INDEX "Review_userId_idx" ON "Review"("userId");
CREATE INDEX "Review_isApproved_idx" ON "Review"("isApproved");

ALTER TABLE "Review"
  ADD CONSTRAINT "Review_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review"
  ADD CONSTRAINT "Review_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
