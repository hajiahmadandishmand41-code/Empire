-- Add isTraditional flag to Product table
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isTraditional" BOOLEAN NOT NULL DEFAULT false;

-- Index for filtering traditional products
CREATE INDEX IF NOT EXISTS "Product_isTraditional_idx" ON "Product"("isTraditional");

-- Add traditional product categories (safe to run repeatedly)
INSERT INTO "Category" ("id", "key", "name", "slug")
VALUES
  ('trad-category-traditional',      'traditional',     'محصولات سنتی افغانستان', 'traditional'),
  ('trad-category-carpet',           'carpet',          'قالین',                   'carpet'),
  ('trad-category-saffron',          'saffron',         'زعفران',                  'saffron'),
  ('trad-category-dried-fruits',     'driedFruits',     'میوه خشک',               'dried-fruits'),
  ('trad-category-handicrafts',      'handicrafts',     'صنایع دستی',             'handicrafts'),
  ('trad-category-local-clothing',   'localClothing',   'لباس محلی',              'local-clothing'),
  ('trad-category-honey',            'honey',           'عسل',                     'honey'),
  ('trad-category-nuts',             'nuts',            'خشکبار',                  'nuts'),
  ('trad-category-gemstones',        'gemstones',       'سنگ قیمتی',              'gemstones')
ON CONFLICT ("key") DO UPDATE
SET "name" = EXCLUDED."name",
    "slug" = EXCLUDED."slug";
