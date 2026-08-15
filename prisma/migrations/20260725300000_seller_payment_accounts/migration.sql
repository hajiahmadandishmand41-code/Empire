-- Phase: Seller Payment Accounts
-- Adds bank account and ATOMA Pay fields to the User (seller) record
-- so sellers can save their payout destinations once and reuse them.

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "sellerBankAccountNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "sellerBankAccountName"   TEXT,
  ADD COLUMN IF NOT EXISTS "sellerBankName"           TEXT,
  ADD COLUMN IF NOT EXISTS "sellerAtomaPay"           TEXT;
