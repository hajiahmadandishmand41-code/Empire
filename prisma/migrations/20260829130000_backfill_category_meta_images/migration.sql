-- Backfill category artwork from the legacy Category.imageUrl column into
-- the active CategoryMeta metadata layer used by the admin and storefront.
-- The legacy column is intentionally preserved for backward compatibility.

UPDATE "CategoryMeta" AS m
SET "imageUrl" = c."imageUrl",
    "updatedAt" = CURRENT_TIMESTAMP
FROM "Category" AS c
WHERE m."categoryId" = c."id"
  AND c."imageUrl" IS NOT NULL
  AND NULLIF(TRIM(m."imageUrl"), '') IS NULL;

-- Keep every category visually usable when it has no dedicated image but one
-- of its active products already has an image. The repository also has a
-- runtime fallback, so this only persists data when it is directly available.
UPDATE "CategoryMeta" AS m
SET "imageUrl" = (
  SELECT CASE
    WHEN jsonb_typeof(p."imagesJson") = 'array'
      THEN COALESCE(p."imagesJson"->0->>'src', p."imagesJson"->>0)
    ELSE NULL
  END
  FROM "Product" AS p
  WHERE p."categoryId" = m."categoryId"
    AND p."isActive" = true
    AND p."imagesJson" IS NOT NULL
  ORDER BY p."salesCount" DESC, p."createdAt" DESC
  LIMIT 1
),
"updatedAt" = CURRENT_TIMESTAMP
WHERE NULLIF(TRIM(m."imageUrl"), '') IS NULL
  AND EXISTS (
    SELECT 1
    FROM "Product" AS p2
    WHERE p2."categoryId" = m."categoryId"
      AND p2."isActive" = true
      AND p2."imagesJson" IS NOT NULL
  );
