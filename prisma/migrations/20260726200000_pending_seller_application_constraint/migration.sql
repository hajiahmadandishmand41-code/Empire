-- Prevent concurrent duplicate pending seller applications for one user.
-- Rejected applications remain available for audit/history and re-application.
CREATE UNIQUE INDEX IF NOT EXISTS "SellerApplication_one_pending_per_user_key"
  ON "SellerApplication" ("userId")
  WHERE "status" = 'pending';