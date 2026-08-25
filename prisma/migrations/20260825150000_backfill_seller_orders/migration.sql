-- Backfill seller-scoped order rows for orders created before the Marketplace Order Engine.
-- This is idempotent and does not mutate parent Order totals or wallet balances.
WITH grouped AS (
  SELECT
    oi."orderId",
    p."sellerId",
    u."commissionRate",
    SUM(oi."price" * oi."quantity")::numeric(18,2) AS subtotal,
    SUM(oi."quantity")::int AS item_count
  FROM "OrderItem" oi
  JOIN "Product" p ON p."id" = oi."productId"
  JOIN "User" u ON u."id" = p."sellerId"
  WHERE p."sellerId" IS NOT NULL
  GROUP BY oi."orderId", p."sellerId", u."commissionRate"
), totals AS (
  SELECT
    g.*,
    o."shipping" AS order_shipping,
    o."currency",
    SUM(g.subtotal) OVER (PARTITION BY g."orderId")::numeric(18,2) AS order_subtotal,
    ROW_NUMBER() OVER (PARTITION BY g."orderId" ORDER BY g."sellerId") AS rn,
    COUNT(*) OVER (PARTITION BY g."orderId") AS seller_count
  FROM grouped g
  JOIN "Order" o ON o."id" = g."orderId"
), allocated AS (
  SELECT
    t.*,
    CASE
      WHEN t.rn = t.seller_count THEN
        (t.order_shipping - COALESCE(SUM(ROUND((t.order_shipping * t.subtotal / NULLIF(t.order_subtotal,0))::numeric, 2)) OVER (
          PARTITION BY t."orderId" ORDER BY t.rn ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
        ), 0))::numeric(18,2)
      ELSE ROUND((t.order_shipping * t.subtotal / NULLIF(t.order_subtotal,0))::numeric, 2)
    END AS seller_shipping
  FROM totals t
)
INSERT INTO "SellerOrder" (
  "id", "orderId", "sellerId", "status", "subtotal", "shipping", "commission", "total", "currency", "itemCount"
)
SELECT
  'so-backfill-' || a."orderId" || '-' || a."sellerId",
  a."orderId",
  a."sellerId",
  CASE
    WHEN a."status" IN ('pending','confirmed','processing','shipped','delivered','cancelled') THEN a."status"
    ELSE 'pending'
  END,
  a.subtotal,
  COALESCE(a.seller_shipping, 0),
  ROUND((a.subtotal * COALESCE(a."commissionRate", 10) / 100)::numeric, 2),
  a.subtotal + COALESCE(a.seller_shipping, 0),
  a."currency",
  a.item_count
FROM (
  SELECT allocated.*, o."status"
  FROM allocated
  JOIN "Order" o ON o."id" = allocated."orderId"
) a
ON CONFLICT ("orderId", "sellerId") DO NOTHING;

-- Safety normalization for backfilled rows.
UPDATE "SellerOrder"
SET "updatedAt" = CURRENT_TIMESTAMP
WHERE "updatedAt" IS NULL;
