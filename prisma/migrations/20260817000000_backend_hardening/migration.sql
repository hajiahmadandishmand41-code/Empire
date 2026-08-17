-- Backend hardening: reconcile Product.weightKg with prisma/schema.prisma.
-- Prisma declares Decimal(10,3), while the earlier reconciliation migration
-- created DOUBLE PRECISION. Convert the column to NUMERIC(10,3) without data
-- rewriting beyond PostgreSQL's explicit numeric conversion. If existing data
-- cannot be represented as NUMERIC(10,3), the migration intentionally fails
-- so the data can be reviewed rather than silently truncated.

ALTER TABLE "Product"
  ALTER COLUMN "weightKg" TYPE NUMERIC(10,3)
  USING "weightKg"::NUMERIC(10,3);
