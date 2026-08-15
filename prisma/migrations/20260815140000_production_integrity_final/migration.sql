-- Final production integrity constraints. Forward-only and non-destructive.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "Order"
    WHERE "total" <> ("subtotal" + "shipping")
  ) THEN
    RAISE EXCEPTION 'Order total invariant violated; reconcile rows before applying this migration';
  END IF;
END $$;

ALTER TABLE "Order"
  DROP CONSTRAINT IF EXISTS "Order_total_matches_parts";
ALTER TABLE "Order"
  ADD CONSTRAINT "Order_total_matches_parts"
  CHECK ("total" = ("subtotal" + "shipping"));

ALTER TABLE "Order"
  DROP CONSTRAINT IF EXISTS "Order_currency_supported";
ALTER TABLE "Order"
  ADD CONSTRAINT "Order_currency_supported"
  CHECK ("currency" IN ('AFN', 'USD', 'EUR'));

ALTER TABLE "Product"
  DROP CONSTRAINT IF EXISTS "Product_currency_supported";
ALTER TABLE "Product"
  ADD CONSTRAINT "Product_currency_supported"
  CHECK ("currency" IN ('AFN', 'USD', 'EUR'));

ALTER TABLE "ShippingMethod"
  DROP CONSTRAINT IF EXISTS "ShippingMethod_currency_supported";
ALTER TABLE "ShippingMethod"
  ADD CONSTRAINT "ShippingMethod_currency_supported"
  CHECK ("currency" IN ('AFN', 'USD', 'EUR'));

ALTER TABLE "Transaction"
  DROP CONSTRAINT IF EXISTS "Transaction_currency_supported";
ALTER TABLE "Transaction"
  ADD CONSTRAINT "Transaction_currency_supported"
  CHECK ("currency" IN ('AFN', 'USD', 'EUR'));

ALTER TABLE "SellerWallet"
  DROP CONSTRAINT IF EXISTS "SellerWallet_currency_supported";
ALTER TABLE "SellerWallet"
  ADD CONSTRAINT "SellerWallet_currency_supported"
  CHECK ("currency" IN ('AFN', 'USD', 'EUR'));

ALTER TABLE "WalletTransaction"
  DROP CONSTRAINT IF EXISTS "WalletTransaction_currency_supported";
ALTER TABLE "WalletTransaction"
  ADD CONSTRAINT "WalletTransaction_currency_supported"
  CHECK ("currency" IN ('AFN', 'USD', 'EUR'));

ALTER TABLE "Payout"
  DROP CONSTRAINT IF EXISTS "Payout_currency_supported";
ALTER TABLE "Payout"
  ADD CONSTRAINT "Payout_currency_supported"
  CHECK ("currency" IN ('AFN', 'USD', 'EUR'));

CREATE UNIQUE INDEX IF NOT EXISTS "Transaction_order_method_status_unique"
  ON "Transaction" ("orderId", "method", "status");
