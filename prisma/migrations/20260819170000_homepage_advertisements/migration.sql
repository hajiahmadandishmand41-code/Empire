CREATE TABLE IF NOT EXISTS "HomepageAdvertisement" (
  "id" TEXT PRIMARY KEY,
  "titleFa" TEXT NOT NULL,
  "titlePs" TEXT NOT NULL,
  "titleEn" TEXT NOT NULL,
  "subtitleFa" TEXT,
  "subtitlePs" TEXT,
  "subtitleEn" TEXT,
  "imageUrl" TEXT,
  "href" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "startsAt" TIMESTAMPTZ,
  "endsAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "HomepageAdvertisement_active_order_idx"
  ON "HomepageAdvertisement" ("isActive", "sortOrder");

INSERT INTO "HomepageAdvertisement" ("id","titleFa","titlePs","titleEn","subtitleFa","subtitlePs","subtitleEn","imageUrl","href","isActive","sortOrder")
SELECT 'homepage-default-001',
       'پیشنهاد ویژه امروز',
       'د نن ورځې ځانګړی وړاندیز',
       'Today’s special offer',
       'تخفیف ویژه روی محصولات منتخب EmpireShop',
       'په غوره محصولاتو ځانګړی تخفیف',
       'Special discount on selected EmpireShop products',
       'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1600&q=85',
       '/shop?sort=popular', true, 1
WHERE NOT EXISTS (SELECT 1 FROM "HomepageAdvertisement");
