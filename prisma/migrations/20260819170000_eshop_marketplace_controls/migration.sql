-- Eshop Marketplace Controls
-- Non-destructive: adds nullable/defaulted control fields and new admin-managed tables.
ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "showOnHome" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "Category"
  ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "Banner" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "placement" TEXT NOT NULL DEFAULT 'hero',
  "title" TEXT,
  "subtitle" TEXT,
  "ctaLabel" TEXT,
  "href" TEXT,
  "desktopImageUrl" TEXT NOT NULL,
  "mobileImageUrl" TEXT,
  "startAt" TIMESTAMP(3),
  "endAt" TIMESTAMP(3),
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "autoSlide" BOOLEAN NOT NULL DEFAULT true,
  "durationMs" INTEGER NOT NULL DEFAULT 5000,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Banner_key_key" ON "Banner"("key");
CREATE INDEX IF NOT EXISTS "Banner_placement_isActive_sortOrder_idx" ON "Banner"("placement", "isActive", "sortOrder");
CREATE INDEX IF NOT EXISTS "Banner_startAt_endAt_idx" ON "Banner"("startAt", "endAt");

CREATE TABLE IF NOT EXISTS "RecommendationConfig" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "weightsJson" JSONB NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RecommendationConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "RecommendationConfig_key_key" ON "RecommendationConfig"("key");
