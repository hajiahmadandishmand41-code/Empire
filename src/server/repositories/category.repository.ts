/**
 * Category Repository
 *
 * Abstracts all database access for Category entities and the
 * backward-compatible CategoryMeta hierarchy/visibility layer.
 */

import { Prisma, type PrismaClient } from '@prisma/client';

export interface CategoryRow {
  id: string;
  key: string;
  name: string;
  slug: string;
  productCount?: number;
  parentId?: string | null;
  parentKey?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface CreateCategoryInput { key: string; name: string; slug: string; parentId?: string | null; imageUrl?: string | null; isActive?: boolean; sortOrder?: number; }
export interface UpdateCategoryInput { name?: string; slug?: string; parentId?: string | null; imageUrl?: string | null; isActive?: boolean; sortOrder?: number; }
export interface ICategoryRepository {
  findAll(withCount?: boolean, activeOnly?: boolean): Promise<CategoryRow[]>;
  findByKey(key: string): Promise<CategoryRow | null>;
  findById(id: string): Promise<CategoryRow | null>;
  findBySlug(slug: string): Promise<CategoryRow | null>;
  create(input: CreateCategoryInput): Promise<CategoryRow>;
  update(id: string, input: UpdateCategoryInput): Promise<CategoryRow>;
  delete(id: string): Promise<void>;
}

type RawCategory = { id: string; key: string; name: string; slug: string; productCount: number | string | null; parentId: string | null; parentKey: string | null; imageUrl: string | null; isActive: boolean | null; sortOrder: number | null; };
type RawCategoryMeta = Pick<RawCategory, 'parentId' | 'imageUrl' | 'isActive' | 'sortOrder'>;

function mapRow(row: RawCategory, withCount = true): CategoryRow {
  return { id: row.id, key: row.key, name: row.name, slug: row.slug, productCount: withCount ? Number(row.productCount ?? 0) : undefined, parentId: row.parentId, parentKey: row.parentKey, imageUrl: row.imageUrl, isActive: row.isActive !== false, sortOrder: Number(row.sortOrder ?? 0) };
}

export class PrismaCategoryRepository implements ICategoryRepository {
  constructor(private readonly prisma: PrismaClient) {}
  private async queryOne(where: Prisma.Sql, withCount = true): Promise<CategoryRow | null> {
    const rows = await this.prisma.$queryRaw<RawCategory[]>(Prisma.sql`
      SELECT c."id", c."key", c."name", c."slug", m."parentId", p."key" AS "parentKey", m."imageUrl",
        COALESCE(m."isActive", true) AS "isActive", COALESCE(m."sortOrder", 0) AS "sortOrder",
        ${withCount ? Prisma.sql`(SELECT COUNT(*)::int FROM "Product" pr WHERE pr."categoryId" = c."id" AND pr."isActive" = true)` : Prisma.sql`0`} AS "productCount"
      FROM "Category" c LEFT JOIN "CategoryMeta" m ON m."categoryId" = c."id" LEFT JOIN "Category" p ON p."id" = m."parentId"
      WHERE ${where} LIMIT 1
    `);
    return rows[0] ? mapRow(rows[0], withCount) : null;
  }
  async findAll(withCount = true, activeOnly = false): Promise<CategoryRow[]> {
    const rows = await this.prisma.$queryRaw<RawCategory[]>(Prisma.sql`
      SELECT c."id", c."key", c."name", c."slug", m."parentId", p."key" AS "parentKey", m."imageUrl",
        COALESCE(m."isActive", true) AS "isActive", COALESCE(m."sortOrder", 0) AS "sortOrder",
        ${withCount ? Prisma.sql`(SELECT COUNT(*)::int FROM "Product" pr WHERE pr."categoryId" = c."id" AND pr."isActive" = true)` : Prisma.sql`0`} AS "productCount"
      FROM "Category" c LEFT JOIN "CategoryMeta" m ON m."categoryId" = c."id" LEFT JOIN "Category" p ON p."id" = m."parentId"
      ${activeOnly ? Prisma.sql`WHERE COALESCE(m."isActive", true) = true` : Prisma.empty}
      ORDER BY COALESCE(m."sortOrder", 0) ASC, c."name" ASC
    `);
    return rows.map((row) => mapRow(row, withCount));
  }
  async findByKey(key: string): Promise<CategoryRow | null> { return this.queryOne(Prisma.sql`c."key" = ${key}`); }
  async findById(id: string): Promise<CategoryRow | null> { return this.queryOne(Prisma.sql`c."id" = ${id}`); }
  async findBySlug(slug: string): Promise<CategoryRow | null> { return this.queryOne(Prisma.sql`c."slug" = ${slug}`); }
  async create(input: CreateCategoryInput): Promise<CategoryRow> {
    const row = await this.prisma.$transaction(async (tx) => {
      const created = await tx.category.create({ data: { key: input.key, name: input.name, slug: input.slug } });
      await tx.$executeRaw(Prisma.sql`INSERT INTO "CategoryMeta" ("categoryId", "parentId", "imageUrl", "isActive", "sortOrder") VALUES (${created.id}, ${input.parentId ?? null}, ${input.imageUrl ?? null}, ${input.isActive ?? true}, ${input.sortOrder ?? 0}) ON CONFLICT ("categoryId") DO UPDATE SET "parentId" = EXCLUDED."parentId", "imageUrl" = EXCLUDED."imageUrl", "isActive" = EXCLUDED."isActive", "sortOrder" = EXCLUDED."sortOrder", "updatedAt" = CURRENT_TIMESTAMP`);
      return created;
    });
    const found = await this.findById(row.id); if (!found) throw new Error('Created category could not be reloaded'); return found;
  }
  async update(id: string, input: UpdateCategoryInput): Promise<CategoryRow> {
    await this.prisma.$transaction(async (tx) => {
      const categoryData: Prisma.CategoryUpdateInput = {};
      if (input.name !== undefined) categoryData.name = input.name;
      if (input.slug !== undefined) categoryData.slug = input.slug;
      if (Object.keys(categoryData).length > 0) await tx.category.update({ where: { id }, data: categoryData });
      const current = await tx.$queryRaw<RawCategoryMeta[]>(Prisma.sql`SELECT "parentId", "imageUrl", "isActive", "sortOrder" FROM "CategoryMeta" WHERE "categoryId" = ${id} LIMIT 1`);
      const existing = current[0] ?? { parentId: null, imageUrl: null, isActive: true, sortOrder: 0 };
      const parentId = input.parentId !== undefined ? input.parentId : existing.parentId;
      const imageUrl = input.imageUrl !== undefined ? input.imageUrl : existing.imageUrl;
      const isActive = input.isActive !== undefined ? input.isActive : existing.isActive !== false;
      const sortOrder = input.sortOrder !== undefined ? input.sortOrder : Number(existing.sortOrder ?? 0);
      await tx.$executeRaw(Prisma.sql`INSERT INTO "CategoryMeta" ("categoryId", "parentId", "imageUrl", "isActive", "sortOrder") VALUES (${id}, ${parentId}, ${imageUrl}, ${isActive}, ${sortOrder}) ON CONFLICT ("categoryId") DO UPDATE SET "parentId" = EXCLUDED."parentId", "imageUrl" = EXCLUDED."imageUrl", "isActive" = EXCLUDED."isActive", "sortOrder" = EXCLUDED."sortOrder", "updatedAt" = CURRENT_TIMESTAMP`);
    });
    const found = await this.findById(id); if (!found) throw new Error('Updated category could not be reloaded'); return found;
  }
  async delete(id: string): Promise<void> { await this.prisma.category.delete({ where: { id } }); }
}
