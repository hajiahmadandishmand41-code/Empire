-- Idempotency for seller payout creation. Nullable so existing payouts remain valid.
ALTER TABLE "Payout"
  ADD COLUMN IF NOT EXISTS "requestKey" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Payout_requestKey_key"
  ON "Payout"("requestKey");
