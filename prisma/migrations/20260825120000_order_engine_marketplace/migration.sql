-- Order Engine / Marketplace split
-- Adds seller-scoped fulfillment and time-bounded stock reservations without
-- changing existing Prisma models, so the generated client remains compatible.

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
  "itemCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SellerOrder_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SellerOrder_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SellerOrder_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SellerOrder_status_check" CHECK ("status" IN ('pending','confirmed','processing','shipped','delivered','cancelled','refunded'))
);

CREATE UNIQUE INDEX IF NOT EXISTS "SellerOrder_orderId_sellerId_key" ON "SellerOrder"("orderId", "sellerId");
CREATE INDEX IF NOT EXISTS "SellerOrder_sellerId_status_createdAt_idx" ON "SellerOrder"("sellerId", "status", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "SellerOrder_orderId_status_idx" ON "SellerOrder"("orderId", "status");

-- Backfill seller splits for historical orders. Shipping/commission for legacy
-- rows remain zero because those orders were created before seller-scoped
-- accounting existed; new orders always receive exact allocations.
INSERT INTO "SellerOrder" ("id", "orderId", "sellerId", "status", "subtotal", "shipping", "commission", "total", "currency", "itemCount")
SELECT
  'legacy-so-' || md5(oi."orderId" || ':' || p."sellerId"),
  oi."orderId",
  p."sellerId",
  CASE o."status"
    WHEN 'confirmed' THEN 'confirmed'
    WHEN 'processing' THEN 'processing'
    WHEN 'shipped' THEN 'shipped'
    WHEN 'delivered' THEN 'delivered'
    WHEN 'cancelled' THEN 'cancelled'
    ELSE 'pending'
  END,
  SUM(oi."price" * oi."quantity"),
  0,
  0,
  SUM(oi."price" * oi."quantity"),
  o."currency",
  SUM(oi."quantity")::int
FROM "OrderItem" oi
JOIN "Product" p ON p."id" = oi."productId"
JOIN "Order" o ON o."id" = oi."orderId"
WHERE p."sellerId" IS NOT NULL
GROUP BY oi."orderId", p."sellerId", o."status", o."currency"
ON CONFLICT ("orderId", "sellerId") DO NOTHING;

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
  CONSTRAINT "StockReservation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "StockReservation_status_check" CHECK ("status" IN ('reserved','consumed','released','expired')),
  CONSTRAINT "StockReservation_quantity_check" CHECK ("quantity" > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS "StockReservation_orderItemId_key" ON "StockReservation"("orderItemId");
CREATE INDEX IF NOT EXISTS "StockReservation_status_expiresAt_idx" ON "StockReservation"("status", "expiresAt");
CREATE INDEX IF NOT EXISTS "StockReservation_orderId_status_idx" ON "StockReservation"("orderId", "status");
CREATE INDEX IF NOT EXISTS "StockReservation_productId_status_idx" ON "StockReservation"("productId", "status");

-- Helps the common seller-order query without requiring Prisma model changes.
CREATE INDEX IF NOT EXISTS "OrderItem_orderId_productId_idx" ON "OrderItem"("orderId", "productId");
