-- Seller reporting indexes: keep status dashboards and per-seller sales aggregation efficient.
CREATE INDEX IF NOT EXISTS "Order_status_createdAt_idx"
  ON "Order"("status", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "OrderItem_productId_orderId_idx"
  ON "OrderItem"("productId", "orderId");
