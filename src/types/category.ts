import type { CategoryKey } from './product';

export interface Category {
  key: CategoryKey;
  /** English label — UI localizes via `home.categories.items.<key>`. */
  name: string;
  slug: string;
  productCount?: number;
  id?: string;
  parentId?: string | null;
  parentKey?: string | null;
  imageUrl?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

export type { CategoryKey };
