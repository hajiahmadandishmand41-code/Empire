import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';

export type CatalogLocale = 'fa' | 'en' | 'ps';

export function normalizeCatalogLocale(value: string | null | undefined): CatalogLocale {
  if (value === 'en') return 'en';
  if (value === 'ps') return 'ps';
  return 'fa';
}

export interface ProductLocalizedText {
  name: string;
  shortDescription: string;
  description: string | null;
  locale: CatalogLocale;
}

export interface CategoryLocalizedText {
  name: string;
  locale: CatalogLocale;
}

export async function getProductLocalizedText(
  productId: string,
  locale: CatalogLocale,
): Promise<ProductLocalizedText | null> {
  try {
    const rows = await prisma.$queryRaw<ProductLocalizedText[]>(Prisma.sql`
      SELECT "name", "shortDescription", "description", "locale"
      FROM "ProductTranslation"
      WHERE "productId" = ${productId}
        AND "locale" IN (${locale}, 'fa')
      ORDER BY CASE WHEN "locale" = ${locale} THEN 0 ELSE 1 END
      LIMIT 1
    `);
    return rows[0] ?? null;
  } catch (error) {
    console.warn('[localization] product translations unavailable; using base product text', { productId, locale, error });
    return null;
  }
}

export async function getProductLocalizedTexts(
  productIds: string[],
  locale: CatalogLocale,
): Promise<Map<string, ProductLocalizedText>> {
  if (productIds.length === 0) return new Map();
  try {
    const rows = await prisma.$queryRaw<Array<ProductLocalizedText & { productId: string }>>(Prisma.sql`
      SELECT "productId", "name", "shortDescription", "description", "locale"
      FROM "ProductTranslation"
      WHERE "productId" IN (${Prisma.join(productIds)})
        AND "locale" IN (${locale}, 'fa')
      ORDER BY "productId", CASE WHEN "locale" = ${locale} THEN 0 ELSE 1 END
    `);
    const result = new Map<string, ProductLocalizedText>();
    for (const row of rows) {
      if (!result.has(row.productId)) {
        result.set(row.productId, {
          name: row.name,
          shortDescription: row.shortDescription,
          description: row.description,
          locale: normalizeCatalogLocale(row.locale),
        });
      }
    }
    return result;
  } catch (error) {
    console.warn('[localization] product translations unavailable; using base product text', { locale, productCount: productIds.length, error });
    return new Map();
  }
}

export async function getCategoryLocalizedText(
  categoryId: string,
  locale: CatalogLocale,
): Promise<CategoryLocalizedText | null> {
  try {
    const rows = await prisma.$queryRaw<CategoryLocalizedText[]>(Prisma.sql`
      SELECT "name", "locale"
      FROM "CategoryTranslation"
      WHERE "categoryId" = ${categoryId}
        AND "locale" IN (${locale}, 'fa')
      ORDER BY CASE WHEN "locale" = ${locale} THEN 0 ELSE 1 END
      LIMIT 1
    `);
    return rows[0] ?? null;
  } catch (error) {
    console.warn('[localization] category translations unavailable; using base category text', { categoryId, locale, error });
    return null;
  }
}

export async function upsertProductLocalizedText(input: {
  productId: string;
  locale: CatalogLocale;
  name: string;
  shortDescription: string;
  description?: string | null;
}) {
  const id = `pt_${input.locale}_${crypto.randomUUID()}`;
  return prisma.$executeRaw(Prisma.sql`
    INSERT INTO "ProductTranslation"
      ("id", "productId", "locale", "name", "shortDescription", "description")
    VALUES
      (${id}, ${input.productId}, ${input.locale}, ${input.name}, ${input.shortDescription}, ${input.description ?? null})
    ON CONFLICT ("productId", "locale") DO UPDATE SET
      "name" = EXCLUDED."name",
      "shortDescription" = EXCLUDED."shortDescription",
      "description" = EXCLUDED."description",
      "updatedAt" = CURRENT_TIMESTAMP
  `);
}

export async function upsertCategoryLocalizedText(input: {
  categoryId: string;
  locale: CatalogLocale;
  name: string;
}) {
  const id = `ct_${input.locale}_${crypto.randomUUID()}`;
  return prisma.$executeRaw(Prisma.sql`
    INSERT INTO "CategoryTranslation"
      ("id", "categoryId", "locale", "name")
    VALUES
      (${id}, ${input.categoryId}, ${input.locale}, ${input.name})
    ON CONFLICT ("categoryId", "locale") DO UPDATE SET
      "name" = EXCLUDED."name",
      "updatedAt" = CURRENT_TIMESTAMP
  `);
}
