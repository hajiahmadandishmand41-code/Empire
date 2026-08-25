-- Marketplace Order Engine: seller-scoped fulfillment + stock reservations.
-- Uses plain text status values intentionally so this migration is compatible
-- with the existing Prisma OrderStatus enum without a destructive enum change.

CREATE TABLE IF NOT EXISTS "SellerOrder" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "sellerId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "subtotal" DECIMAL(18,2) NOT NULL,
  "shipping" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "commission" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "total" DECIMAL(18,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "itemCount" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SellerOrder_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SellerOrder_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SellerOrder_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SellerOrder_status_check" CHECK ("status" IN ('pending','confirmed','processing','shipped','delivered','cancelled','refunded')),
  CONSTRAINT "SellerOrder_money_check" CHECK ("subtotal" >= 0 AND "shipping" >= 0 AND "commission" >= 0 AND "total" >= 0),
  CONSTRAINT "SellerOrder_itemCount_check" CHECK ("itemCount" > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS "SellerOrder_orderId_sellerId_key" ON "SellerOrder"("orderId", "sellerId");
CREATE INDEX IF NOT EXISTS "SellerOrder_sellerId_status_createdAt_idx" ON "SellerOrder"("sellerId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "SellerOrder_orderId_status_idx" ON "SellerOrder"("orderId", "status");

CREATE TABLE IF NOT EXISTS "StockReservation" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "orderItemId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'reserved',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "releasedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StockReservation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StockReservation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "StockReservation_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "StockReservation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "StockReservation_status_check" CHECK ("status" IN ('reserved','consumed','released','expired')),
  CONSTRAINT "StockReservation_quantity_check" CHECK ("quantity" > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS "StockReservation_orderItemId_key" ON "StockReservation"("orderItemId");
CREATE INDEX IF NOT EXISTS "StockReservation_status_expiresAt_idx" ON "StockReservation"("status", "expiresAt");
CREATE INDEX IF NOT EXISTS "StockReservation_orderId_status_idx" ON "StockReservation"("orderId", "status");
CREATE INDEX IF NOT EXISTS "StockReservation_productId_status_idx" ON "StockReservation"("productId", "status");
