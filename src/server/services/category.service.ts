/**
 * Category Service — Business Logic Layer
 *
 * Manages category CRUD with validation while preserving existing
 * Category rows and enforcing safe parent/child relationships.
 */

import type { ICategoryRepository, CreateCategoryInput, UpdateCategoryInput, CategoryRow } from '../repositories/category.repository';
import { ConflictError, NotFoundError } from '../infrastructure/errors';

export class CategoryService {
  constructor(private readonly categories: ICategoryRepository) {}

  async listAll(withCount = true, activeOnly = false): Promise<CategoryRow[]> {
    return this.categories.findAll(withCount, activeOnly);
  }

  private async validateParent(categoryId: string | null | undefined, parentId: string | null | undefined) {
    if (!parentId) return;
    if (categoryId && parentId === categoryId) {
      throw new ConflictError('یک دسته نمی‌تواند زیر‌دسته خودش باشد.', 'category_parent_cycle');
    }
    const parent = await this.categories.findById(parentId);
    if (!parent) throw new NotFoundError('ParentCategory', parentId);
    // Keep the hierarchy intentionally two-level. If an existing child is promoted
    // to a child of another child, reject it rather than silently creating deeper trees.
    if (parent.parentId) {
      throw new ConflictError('ساختار دسته‌بندی فقط دو سطحی است.', 'category_parent_depth');
    }
  }

  async create(input: CreateCategoryInput): Promise<CategoryRow> {
    const existing = await this.categories.findByKey(input.key);
    if (existing) {
      throw new ConflictError(`دسته‌بندی با کلید "${input.key}" قبلاً وجود دارد.`, 'category_key_exists');
    }
    await this.validateParent(null, input.parentId);
    try {
      return await this.categories.create(input);
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e?.code === 'P2002') throw new ConflictError('این دسته‌بندی قبلاً ثبت شده است.', 'category_exists');
      throw err;
    }
  }

  async update(id: string, input: UpdateCategoryInput): Promise<CategoryRow> {
    const existing = await this.categories.findById(id);
    if (!existing) throw new NotFoundError('Category', id);
    await this.validateParent(id, input.parentId === undefined ? existing.parentId : input.parentId);
    try {
      return await this.categories.update(id, input);
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e?.code === 'P2002') throw new ConflictError('این دسته‌بندی قبلاً ثبت شده است.', 'category_exists');
      throw err;
    }
  }

  async delete(id: string): Promise<void> {
    const existing = await this.categories.findById(id);
    if (!existing) throw new NotFoundError('Category', id);
    const children = (await this.categories.findAll(false, false)).filter((category) => category.parentId === id);
    if (children.length > 0) {
      throw new ConflictError('ابتدا زیر‌دسته‌ها را جابه‌جا یا غیرفعال کنید.', 'category_has_children');
    }
    await this.categories.delete(id);
  }
}
