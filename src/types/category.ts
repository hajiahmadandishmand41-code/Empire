import type { CategoryKey } from './product';

export interface Category {
  key: CategoryKey;
  /** English label — UI localizes via `home.categories.items.<key>`. */
  name: string;
  slug: string;
  productCount?: number;
}

export type { CategoryKey };
