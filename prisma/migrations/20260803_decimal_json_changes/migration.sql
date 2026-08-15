-- Migration SQL: convert float columns to numeric/decimal and string JSON fields to jsonb
-- Generated migration: convert floats -> numeric(18,2) and strings -> jsonb where appropriate
BEGIN;

-- Products
ALTER TABLE "Product" ALTER COLUMN "price" TYPE numeric(18,2) USING ("price"::numeric(18,2));
ALTER TABLE "Product" ALTER COLUMN "compareAtPrice" TYPE numeric(18,2) USING ("compareAtPrice"::numeric(18,2));
ALTER TABLE "Product" ALTER COLUMN "weightKg" TYPE numeric(10,3) USING ("weightKg"::numeric(10,3));

-- OrderItems
ALTER TABLE "OrderItem" ALTER COLUMN "price" TYPE numeric(18,2) USING ("price"::numeric(18,2));

-- ShippingMethod
ALTER TABLE "ShippingMethod" ALTER COLUMN "cost" TYPE numeric(18,2) USING ("cost"::numeric(18,2));

-- Orders
ALTER TABLE "Order" ALTER COLUMN "subtotal" TYPE numeric(18,2) USING ("subtotal"::numeric(18,2));
ALTER TABLE "Order" ALTER COLUMN "shipping" TYPE numeric(18,2) USING ("shipping"::numeric(18,2));
ALTER TABLE "Order" ALTER COLUMN "total" TYPE numeric(18,2) USING ("total"::numeric(18,2));

-- Transactions
ALTER TABLE "Transaction" ALTER COLUMN "amount" TYPE numeric(18,2) USING ("amount"::numeric(18,2));

-- SellerWallet
ALTER TABLE "SellerWallet" ALTER COLUMN "balance" TYPE numeric(18,2) USING ("balance"::numeric(18,2));
ALTER TABLE "SellerWallet" ALTER COLUMN "totalEarned" TYPE numeric(18,2) USING ("totalEarned"::numeric(18,2));
ALTER TABLE "SellerWallet" ALTER COLUMN "totalPaidOut" TYPE numeric(18,2) USING ("totalPaidOut"::numeric(18,2));

-- WalletTransaction
ALTER TABLE "WalletTransaction" ALTER COLUMN "amount" TYPE numeric(18,2) USING ("amount"::numeric(18,2));

-- Payout
ALTER TABLE "Payout" ALTER COLUMN "amount" TYPE numeric(18,2) USING ("amount"::numeric(18,2));

-- User commissionRate
ALTER TABLE "User" ALTER COLUMN "commissionRate" TYPE numeric(5,2) USING ("commissionRate"::numeric(5,2));

-- Convert String JSON-like fields to jsonb safely (empty string -> null)
ALTER TABLE "Product" ALTER COLUMN "featuresJson" TYPE jsonb USING (CASE WHEN "featuresJson" IS NULL OR trim("featuresJson") = '' THEN NULL ELSE "featuresJson"::jsonb END);
ALTER TABLE "Product" ALTER COLUMN "imagesJson" TYPE jsonb USING (CASE WHEN "imagesJson" IS NULL OR trim("imagesJson") = '' THEN NULL ELSE "imagesJson"::jsonb END);
ALTER TABLE "Product" ALTER COLUMN "dimensionsJson" TYPE jsonb USING (CASE WHEN "dimensionsJson" IS NULL OR trim("dimensionsJson") = '' THEN NULL ELSE "dimensionsJson"::jsonb END);
ALTER TABLE "Product" ALTER COLUMN "tagsJson" TYPE jsonb USING (CASE WHEN "tagsJson" IS NULL OR trim("tagsJson") = '' THEN NULL ELSE "tagsJson"::jsonb END);
ALTER TABLE "Product" ALTER COLUMN "attributesJson" TYPE jsonb USING (CASE WHEN "attributesJson" IS NULL OR trim("attributesJson") = '' THEN NULL ELSE "attributesJson"::jsonb END);

ALTER TABLE "AdminAuditLog" ALTER COLUMN "beforeJson" TYPE jsonb USING (CASE WHEN "beforeJson" IS NULL OR trim("beforeJson") = '' THEN NULL ELSE "beforeJson"::jsonb END);
ALTER TABLE "AdminAuditLog" ALTER COLUMN "afterJson" TYPE jsonb USING (CASE WHEN "afterJson" IS NULL OR trim("afterJson") = '' THEN NULL ELSE "afterJson"::jsonb END);
ALTER TABLE "AdminAuditLog" ALTER COLUMN "metadataJson" TYPE jsonb USING (CASE WHEN "metadataJson" IS NULL OR trim("metadataJson") = '' THEN NULL ELSE "metadataJson"::jsonb END);

ALTER TABLE "Transaction" ALTER COLUMN "providerRaw" TYPE jsonb USING (CASE WHEN "providerRaw" IS NULL OR trim("providerRaw") = '' THEN NULL ELSE "providerRaw"::jsonb END);

COMMIT;
