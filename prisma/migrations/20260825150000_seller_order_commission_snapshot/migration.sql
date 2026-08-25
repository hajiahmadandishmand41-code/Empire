-- Freeze the commission rate at checkout so later seller-setting changes
-- never alter historical order accounting.
ALTER TABLE "SellerOrder"
  ADD COLUMN IF NOT EXISTS "commissionRate" DECIMAL(5,2) NOT NULL DEFAULT 10;

-- Backfill existing seller orders from the commission already stored on the order.
UPDATE "SellerOrder"
SET "commissionRate" = CASE
  WHEN "subtotal" > 0 THEN ROUND(("commission" * 100 / "subtotal")::numeric, 2)
  ELSE 10
END
WHERE "commissionRate" = 10;

ALTER TABLE "SellerOrder"
  ADD CONSTRAINT "SellerOrder_commissionRate_check"
  CHECK ("commissionRate" >= 0 AND "commissionRate" <= 100);

CREATE INDEX IF NOT EXISTS "SellerOrder_sellerId_createdAt_idx"
  ON "SellerOrder"("sellerId", "createdAt");
