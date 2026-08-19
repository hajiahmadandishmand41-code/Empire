'use client';

import * as React from 'react';
import { rememberViewedProduct } from '@/features/home/components/personalized-products-section';

export function RecentlyViewedTracker({ slug, categoryKey }: { slug: string; categoryKey?: string | null }) {
  React.useEffect(() => {
    rememberViewedProduct({ slug, categoryKey, viewedAt: Date.now() });
  }, [slug, categoryKey]);

  return null;
}
