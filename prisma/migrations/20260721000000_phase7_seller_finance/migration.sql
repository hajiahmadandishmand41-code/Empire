-- Empire Shop — Phase 7: Seller finance
--
-- Adds:
--   * User.commissionRate (percentage Empire Shop retains per sale).
--   * SellerWallet (one per seller, balance + totals).
--   * WalletTransaction (immutable signed ledger entries).
--   * Payout (seller-initiated withdrawal request, admin-managed).
--
-- Design notes
-- ------------
-- All financial writes go through prisma.$transaction on the server
-- (`src/lib/finance/wallet.ts`); this schema just guarantees referential
-- integrity + idempotency.
--   * `WalletTransaction.dedupeKey` is UNIQUE so the "credit sellers on
--     delivered" job can safely re-run without double-counting.
--   * `Payout.reference` is UNIQUE (human-readable receipt id).

-- 1. User.commissionRate
ALTER TABLE "User" ADD COLUMN "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 10;

-- 2. Enums
CREATE TYPE "PayoutStatus" AS ENUM ('pending', 'approved', 'paid', 'rejected');
CREATE TYPE "PayoutMethod" AS ENUM ('bank_transfer', 'cash', 'whatsapp');
CREATE TYPE "WalletTxType" AS ENUM ('sale', 'commission', 'payout', 'payout_reversal', 'refund', 'adjustment');

-- 3. SellerWallet
CREATE TABLE "SellerWallet" (
  "id" TEXT NOT NULL,
  "sellerId" TEXT NOT NULL,
  "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalPaidOut" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SellerWallet_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SellerWallet_sellerId_key" ON "SellerWallet"("sellerId");
CREATE INDEX "SellerWallet_sellerId_idx" ON "SellerWallet"("sellerId");
ALTER TABLE "SellerWallet"
  ADD CONSTRAINT "SellerWallet_sellerId_fkey"
  FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. Payout
CREATE TABLE "Payout" (
  "id" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "sellerId" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "method" "PayoutMethod" NOT NULL DEFAULT 'bank_transfer',
  "status" "PayoutStatus" NOT NULL DEFAULT 'pending',
  "accountInfo" TEXT NOT NULL,
  "sellerNote" TEXT,
  "adminNote" TEXT,
  "processedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Payout_reference_key" ON "Payout"("reference");
CREATE INDEX "Payout_sellerId_idx" ON "Payout"("sellerId");
CREATE INDEX "Payout_status_idx" ON "Payout"("status");
ALTER TABLE "Payout"
  ADD CONSTRAINT "Payout_sellerId_fkey"
  FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. WalletTransaction
CREATE TABLE "WalletTransaction" (
  "id" TEXT NOT NULL,
  "walletId" TEXT NOT NULL,
  "sellerId" TEXT NOT NULL,
  "type" "WalletTxType" NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "orderId" TEXT,
  "orderItemId" TEXT,
  "payoutId" TEXT,
  "dedupeKey" TEXT,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "WalletTransaction_dedupeKey_key" ON "WalletTransaction"("dedupeKey");
CREATE INDEX "WalletTransaction_walletId_idx" ON "WalletTransaction"("walletId");
CREATE INDEX "WalletTransaction_sellerId_idx" ON "WalletTransaction"("sellerId");
CREATE INDEX "WalletTransaction_type_idx" ON "WalletTransaction"("type");
CREATE INDEX "WalletTransaction_orderId_idx" ON "WalletTransaction"("orderId");
CREATE INDEX "WalletTransaction_payoutId_idx" ON "WalletTransaction"("payoutId");
ALTER TABLE "WalletTransaction"
  ADD CONSTRAINT "WalletTransaction_walletId_fkey"
  FOREIGN KEY ("walletId") REFERENCES "SellerWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WalletTransaction"
  ADD CONSTRAINT "WalletTransaction_payoutId_fkey"
  FOREIGN KEY ("payoutId") REFERENCES "Payout"("id") ON DELETE SET NULL ON UPDATE CASCADE;
