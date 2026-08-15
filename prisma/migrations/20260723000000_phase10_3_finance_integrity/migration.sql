-- Phase 10.3 — Financial integrity & audit
--
-- Goals:
--   * Enforce non-negative money at the database level so a bug in any
--     future endpoint cannot persist a negative price / total / balance.
--   * Enforce Review.rating in 1..5 (previously only in application code).
--   * Enforce User.commissionRate in 0..100.
--   * Enforce WalletTransaction.amount != 0 (a zero-amount ledger row is
--     always a mistake and would poison sum-based audits).
--   * Enforce SellerWallet.totalEarned and totalPaidOut are non-negative.
--   * Add missing indexes on high-traffic query paths (order status,
--     ledger timelines, payout timelines) so admin/report pages stay fast
--     as data grows.
--   * Introduce AdminAuditLog for a tamper-evident trail of sensitive
--     admin actions (order status changes, payout decisions, user role /
--     seller-status changes).
--
-- All statements are additive (CHECK, CREATE INDEX IF NOT EXISTS,
-- CREATE TABLE IF NOT EXISTS). No column type migrations, no data
-- rewrites — existing financial rows are preserved as-is.

-- ---------------------------------------------------------------------------
-- CHECK constraints (idempotent via DO blocks)
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  -- Product money & stock
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Product_price_nonneg') THEN
    ALTER TABLE "Product" ADD CONSTRAINT "Product_price_nonneg" CHECK ("price" >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Product_compareAtPrice_nonneg') THEN
    ALTER TABLE "Product" ADD CONSTRAINT "Product_compareAtPrice_nonneg"
      CHECK ("compareAtPrice" IS NULL OR "compareAtPrice" >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Product_stockQuantity_nonneg') THEN
    ALTER TABLE "Product" ADD CONSTRAINT "Product_stockQuantity_nonneg" CHECK ("stockQuantity" >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Product_salesCount_nonneg') THEN
    ALTER TABLE "Product" ADD CONSTRAINT "Product_salesCount_nonneg" CHECK ("salesCount" >= 0);
  END IF;

  -- Order money & counts
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Order_subtotal_nonneg') THEN
    ALTER TABLE "Order" ADD CONSTRAINT "Order_subtotal_nonneg" CHECK ("subtotal" >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Order_shipping_nonneg') THEN
    ALTER TABLE "Order" ADD CONSTRAINT "Order_shipping_nonneg" CHECK ("shipping" >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Order_total_nonneg') THEN
    ALTER TABLE "Order" ADD CONSTRAINT "Order_total_nonneg" CHECK ("total" >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Order_itemCount_positive') THEN
    ALTER TABLE "Order" ADD CONSTRAINT "Order_itemCount_positive" CHECK ("itemCount" >= 0);
  END IF;

  -- OrderItem
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OrderItem_price_nonneg') THEN
    ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_price_nonneg" CHECK ("price" >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OrderItem_quantity_positive') THEN
    ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_quantity_positive" CHECK ("quantity" > 0);
  END IF;

  -- CartItem
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CartItem_quantity_positive') THEN
    ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_quantity_positive" CHECK ("quantity" > 0);
  END IF;

  -- ShippingMethod
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ShippingMethod_cost_nonneg') THEN
    ALTER TABLE "ShippingMethod" ADD CONSTRAINT "ShippingMethod_cost_nonneg" CHECK ("cost" >= 0);
  END IF;

  -- Transaction (payment)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Transaction_amount_nonneg') THEN
    ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_amount_nonneg" CHECK ("amount" >= 0);
  END IF;

  -- SellerWallet
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SellerWallet_totalEarned_nonneg') THEN
    ALTER TABLE "SellerWallet" ADD CONSTRAINT "SellerWallet_totalEarned_nonneg" CHECK ("totalEarned" >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SellerWallet_totalPaidOut_nonneg') THEN
    ALTER TABLE "SellerWallet" ADD CONSTRAINT "SellerWallet_totalPaidOut_nonneg" CHECK ("totalPaidOut" >= 0);
  END IF;
  -- NOTE: balance itself is intentionally NOT constrained >= 0 at the DB
  -- level — a refund or admin adjustment can legitimately drive a wallet
  -- negative. The application enforces the "no overdraw on payout" rule
  -- via the conditional updateMany in requestPayout().

  -- WalletTransaction — a zero-amount ledger row is always a bug.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WalletTransaction_amount_nonzero') THEN
    ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_amount_nonzero" CHECK ("amount" <> 0);
  END IF;

  -- Payout — amount must be strictly positive.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Payout_amount_positive') THEN
    ALTER TABLE "Payout" ADD CONSTRAINT "Payout_amount_positive" CHECK ("amount" > 0);
  END IF;

  -- User.commissionRate range
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'User_commissionRate_range') THEN
    ALTER TABLE "User" ADD CONSTRAINT "User_commissionRate_range"
      CHECK ("commissionRate" >= 0 AND "commissionRate" <= 100);
  END IF;

  -- Review.rating range (schema doc-comment said this existed; make it real)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Review_rating_range') THEN
    ALTER TABLE "Review" ADD CONSTRAINT "Review_rating_range" CHECK ("rating" >= 1 AND "rating" <= 5);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Missing indexes on high-traffic query paths
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS "Order_status_idx"        ON "Order" ("status");
CREATE INDEX IF NOT EXISTS "Order_createdAt_idx"     ON "Order" ("createdAt");
CREATE INDEX IF NOT EXISTS "Transaction_createdAt_idx"       ON "Transaction" ("createdAt");
CREATE INDEX IF NOT EXISTS "WalletTransaction_createdAt_idx" ON "WalletTransaction" ("createdAt");
CREATE INDEX IF NOT EXISTS "Payout_createdAt_idx"    ON "Payout" ("createdAt");
CREATE INDEX IF NOT EXISTS "Product_isActive_idx"    ON "Product" ("isActive");

-- ---------------------------------------------------------------------------
-- AdminAuditLog — append-only trail of sensitive admin actions.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "AdminAuditLog" (
  "id"           TEXT PRIMARY KEY,
  "actorId"      TEXT NOT NULL,
  "actorRole"    TEXT NOT NULL,
  "action"       TEXT NOT NULL,
  "entityType"   TEXT NOT NULL,
  "entityId"     TEXT NOT NULL,
  "beforeJson"   TEXT,
  "afterJson"    TEXT,
  "metadataJson" TEXT,
  "ip"           TEXT,
  "userAgent"    TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "AdminAuditLog_actorId_idx"    ON "AdminAuditLog" ("actorId");
CREATE INDEX IF NOT EXISTS "AdminAuditLog_action_idx"     ON "AdminAuditLog" ("action");
CREATE INDEX IF NOT EXISTS "AdminAuditLog_entity_idx"     ON "AdminAuditLog" ("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "AdminAuditLog_createdAt_idx"  ON "AdminAuditLog" ("createdAt");
