BEGIN;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shippingFullName" text;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shippingPhone" text;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shippingProvince" text;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shippingDistrict" text;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shippingCity" text;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shippingAddressLine" text;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shippingPostalCode" text;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shippingNotes" text;

UPDATE "Order" o
SET
  "shippingFullName" = a."fullName",
  "shippingPhone" = a."phone",
  "shippingProvince" = a."province",
  "shippingDistrict" = a."district",
  "shippingCity" = a."city",
  "shippingAddressLine" = a."addressLine",
  "shippingPostalCode" = a."postalCode",
  "shippingNotes" = a."notes"
FROM "Address" a
WHERE o."addressId" = a."id"
  AND o."shippingFullName" IS NULL;
COMMIT;
