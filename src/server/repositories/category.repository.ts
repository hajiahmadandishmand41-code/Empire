/**
 * Category Repository
 *
 * Abstracts all database access for Category entities.
 * Includes product count aggregation for category listing pages.
 */

import type { PrismaClient } from '@prisma/client';
import type { CategoryKey } from '@/types';

export interface CategoryRow {
  id: string;
  key: string;
  name: string;
  slug: string;
  productCount?: number;
}

export interface CreateCategoryInput {
  key: string;
  name: string;
  slug: string;
}

export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
}

export interface ICategoryRepository {
  findAll(withCount?: boolean): Promise<CategoryRow[]>;
  findByKey(key: string): Promise<CategoryRow | null>;
  findById(id: string): Promise<CategoryRow | null>;
  findBySlug(slug: string): Promise<CategoryRow | null>;
  create(input: CreateCategoryInput): Promise<CategoryRow>;
  update(id: string, input: UpdateCategoryInput): Promise<CategoryRow>;
  delete(id: string): Promise<void>;
}

export class PrismaCategoryRepository implements ICategoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(withCount = true): Promise<CategoryRow[]> {
    const rows = await this.prisma.category.findMany({
      include: withCount ? { _count: { select: { products: true } } } : undefined,
      orderBy: { name: 'asc' },
    });

    return rows.map((r) => ({
      id: r.id,
      key: r.key,
      name: r.name,
      slug: r.slug,
      productCount: withCount
        ? (r as typeof r & { _count?: { products: number } })._count?.products
        : undefined,
    }));
  }

  async findByKey(key: string): Promise<CategoryRow | null> {
    const row = await this.prisma.category.findUnique({
      where: { key },
      include: { _count: { select: { products: true } } },
    });
    if (!row) return null;
    return {
      id: row.id,
      key: row.key,
      name: row.name,
      slug: row.slug,
      productCount: (row as typeof row & { _count?: { products: number } })._count?.products,
    };
  }

  async findById(id: string): Promise<CategoryRow | null> {
    const row = await this.prisma.category.findUnique({ where: { id } });
    if (!row) return null;
    return { id: row.id, key: row.key as CategoryKey, name: row.name, slug: row.slug };
  }

  async findBySlug(slug: string): Promise<CategoryRow | null> {
    const row = await this.prisma.category.findUnique({ where: { slug } });
    if (!row) return null;
    return { id: row.id, key: row.key as CategoryKey, name: row.name, slug: row.slug };
  }

  async create(input: CreateCategoryInput): Promise<CategoryRow> {
    const row = await this.prisma.category.create({ data: input });
    return { id: row.id, key: row.key, name: row.name, slug: row.slug };
  }

  async update(id: string, input: UpdateCategoryInput): Promise<CategoryRow> {
    const row = await this.prisma.category.update({ where: { id }, data: input });
    return { id: row.id, key: row.key, name: row.name, slug: row.slug };
  }

  async delete(id: string): Promise<void> {
    await this.prisma.category.delete({ where: { id } });
  }
}
