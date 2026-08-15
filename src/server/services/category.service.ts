/**
 * Category Service — Business Logic Layer
 *
 * Manages category CRUD with validation.
 * Admin-only operations use this service to ensure business rules
 * are enforced consistently (slug uniqueness, non-empty name, etc.)
 */

import type { ICategoryRepository, CreateCategoryInput, UpdateCategoryInput, CategoryRow } from '../repositories/category.repository';
import { ConflictError, NotFoundError } from '../infrastructure/errors';

export class CategoryService {
  constructor(private readonly categories: ICategoryRepository) {}

  async listAll(withCount = true): Promise<CategoryRow[]> {
    return this.categories.findAll(withCount);
  }

  async create(input: CreateCategoryInput): Promise<CategoryRow> {
    // Check for duplicate key or slug
    const existing = await this.categories.findByKey(input.key);
    if (existing) {
      throw new ConflictError(
        `دسته‌بندی با کلید "${input.key}" قبلاً وجود دارد.`,
        'category_key_exists',
      );
    }
    try {
      return await this.categories.create(input);
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e?.code === 'P2002') {
        throw new ConflictError('این دسته‌بندی قبلاً ثبت شده است.', 'category_exists');
      }
      throw err;
    }
  }

  async update(id: string, input: UpdateCategoryInput): Promise<CategoryRow> {
    const existing = await this.categories.findById(id);
    if (!existing) throw new NotFoundError('Category', id);
    return this.categories.update(id, input);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.categories.findById(id);
    if (!existing) throw new NotFoundError('Category', id);
    await this.categories.delete(id);
  }
}
