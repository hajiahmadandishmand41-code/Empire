-- Empire Shop — Phase 3 migration
-- Adds address enhancements (label, city, isDefault, timestamps),
-- introduces ShippingMethod and links Order → ShippingMethod.

-- Extend Address
ALTER TABLE "Address" ADD COLUMN "label"     TEXT;
ALTER TABLE "Address" ADD COLUMN "city"      TEXT;
ALTER TABLE "Address" ADD COLUMN "isDefault" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Address" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Address" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "Address_userId_idx" ON "Address"("userId");

-- ShippingKind enum
CREATE TYPE "ShippingKind" AS ENUM ('standard', 'express', 'cod');

-- ShippingMethod
CREATE TABLE "ShippingMethod" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "key"         TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "description" TEXT,
  "kind"        "ShippingKind" NOT NULL DEFAULT 'standard',
  "cost"        DOUBLE PRECISION NOT NULL DEFAULT 0,
  "currency"    TEXT NOT NULL DEFAULT 'USD',
  "etaDays"     INTEGER,
  "isActive"    BOOLEAN NOT NULL DEFAULT true,
  "sortOrder"   INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "ShippingMethod_key_key" ON "ShippingMethod"("key");

-- Link Order → ShippingMethod
ALTER TABLE "Order" ADD COLUMN "shippingMethodId" TEXT;
ALTER TABLE "Order"
  ADD CONSTRAINT "Order_shippingMethodId_fkey"
  FOREIGN KEY ("shippingMethodId") REFERENCES "ShippingMethod"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Order_shippingMethodId_idx" ON "Order"("shippingMethodId");

-- Seed default shipping methods
INSERT INTO "ShippingMethod" ("id", "key", "name", "description", "kind", "cost", "currency", "etaDays", "isActive", "sortOrder", "updatedAt")
VALUES
  ('sm_standard', 'standard', 'ارسال عادی',   'ارسال معمولی در سراسر افغانستان',       'standard', 10, 'USD', 5, true, 10, CURRENT_TIMESTAMP),
  ('sm_express',  'express',  'ارسال سریع',   'ارسال اکسپرس ۱ تا ۲ روز کاری',           'express',  20, 'USD', 2, true, 20, CURRENT_TIMESTAMP),
  ('sm_cod',      'cod',      'پرداخت هنگام تحویل', 'پرداخت وجه به پیک هنگام تحویل کالا', 'cod',      15, 'USD', 5, true, 30, CURRENT_TIMESTAMP);
