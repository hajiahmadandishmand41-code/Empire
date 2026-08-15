-- Phase 10.1 — Security hardening
-- Prevent duplicate ingestion of the same provider payment.
CREATE UNIQUE INDEX IF NOT EXISTS "Transaction_provider_providerTxnId_key"
  ON "Transaction" ("provider", "providerTxnId");
