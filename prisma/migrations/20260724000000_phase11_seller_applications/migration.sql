-- Phase 11 — Seller Applications
--
-- A customer's application to become a seller. Admins review from the
-- admin panel; approving flips the User to role=seller (sellerStatus=approved)
-- and copies shop info onto the User row. Additive migration — no existing
-- data is touched.

DO $$ BEGIN
  CREATE TYPE "SellerApplicationStatus" AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "SellerApplication" (
  "id"              TEXT PRIMARY KEY,
  "userId"          TEXT NOT NULL,
  "shopName"        TEXT NOT NULL,
  "ownerName"       TEXT NOT NULL,
  "phone"           TEXT NOT NULL,
  "address"         TEXT NOT NULL,
  "description"     TEXT,
  "logoUrl"         TEXT,
  "status"          "SellerApplicationStatus" NOT NULL DEFAULT 'pending',
  "rejectionReason" TEXT,
  "reviewedById"    TEXT,
  "reviewedAt"      TIMESTAMP(3),
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SellerApplication_user_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SellerApplication_reviewer_fkey"
    FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "SellerApplication_userId_idx"    ON "SellerApplication"("userId");
CREATE INDEX IF NOT EXISTS "SellerApplication_status_idx"    ON "SellerApplication"("status");
CREATE INDEX IF NOT EXISTS "SellerApplication_createdAt_idx" ON "SellerApplication"("createdAt");
