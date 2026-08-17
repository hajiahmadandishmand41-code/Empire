-- Additive localization tables. Existing base fields remain unchanged.
-- Existing product/category content is copied to the Persian locale so the
-- current catalog keeps identical behavior after migration.

CREATE TABLE IF NOT EXISTS "ProductTranslation" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "locale" VARCHAR(5) NOT NULL,
  "name" TEXT NOT NULL,
  "shortDescription" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductTranslation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProductTranslation_product_locale_key" UNIQUE ("productId", "locale"),
  CONSTRAINT "ProductTranslation_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ProductTranslation_locale_idx"
  ON "ProductTranslation" ("locale");
CREATE INDEX IF NOT EXISTS "ProductTranslation_productId_locale_idx"
  ON "ProductTranslation" ("productId", "locale");

CREATE TABLE IF NOT EXISTS "CategoryTranslation" (
  "id" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "locale" VARCHAR(5) NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CategoryTranslation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CategoryTranslation_category_locale_key" UNIQUE ("categoryId", "locale"),
  CONSTRAINT "CategoryTranslation_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "Category"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "CategoryTranslation_locale_idx"
  ON "CategoryTranslation" ("locale");
CREATE INDEX IF NOT EXISTS "CategoryTranslation_categoryId_locale_idx"
  ON "CategoryTranslation" ("categoryId", "locale");

INSERT INTO "ProductTranslation" ("id", "productId", "locale", "name", "shortDescription", "description")
SELECT
  'pt_fa_' || md5(p."id"), p."id", 'fa', p."name", p."shortDescription", p."description"
FROM "Product" p
WHERE NOT EXISTS (
  SELECT 1 FROM "ProductTranslation" pt
  WHERE pt."productId" = p."id" AND pt."locale" = 'fa'
);

INSERT INTO "CategoryTranslation" ("id", "categoryId", "locale", "name")
SELECT
  'ct_fa_' || md5(c."id"), c."id", 'fa', c."name"
FROM "Category" c
WHERE NOT EXISTS (
  SELECT 1 FROM "CategoryTranslation" ct
  WHERE ct."categoryId" = c."id" AND ct."locale" = 'fa'
);
