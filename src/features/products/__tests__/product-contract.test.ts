import { describe, expect, it } from 'vitest';
import { productCreateSchema, productUpdateSchema, parseProductImages } from '../product-contract';
import { slugifyProductName, deterministicSlugFallback } from '../product-slug';

describe('product contract', () => {
  it('accepts images as a string array and rejects imagesJson', () => {
    const valid = productCreateSchema.safeParse({
      name: 'گوشی سامسونگ', shortDescription: 'توضیح محصول', price: 100, currency: 'AFN', categoryId: 'cat-1', region: 'Kabul', images: ['/api/media/abc12345'], primaryImageIndex: 0,
    });
    expect(valid.success).toBe(true);
    const legacy = productCreateSchema.safeParse({
      name: 'گوشی سامسونگ', shortDescription: 'توضیح محصول', price: 100, currency: 'AFN', categoryId: 'cat-1', region: 'Kabul', imagesJson: ['/api/media/abc12345'],
    });
    expect(legacy.success).toBe(false);
  });

  it('accepts a partial update containing only primary image index', () => {
    expect(productUpdateSchema.safeParse({ primaryImageIndex: 0 }).success).toBe(true);
  });

  it('reads legacy persisted image JSON without exposing imagesJson to callers', () => {
    expect(parseProductImages(JSON.stringify([{ src: '/api/media/a' }, { url: '/api/media/b' }]))).toEqual(['/api/media/a', '/api/media/b']);
  });
});

describe('product slug', () => {
  it.each(['قالی دست‌باف هراتی', 'گوشی سامسونگ', 'لباس زنانه'])('creates a non-empty URL slug for %s', (name) => {
    const slug = slugifyProductName(name);
    expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    expect(slug.length).toBeGreaterThan(0);
  });

  it('is deterministic and adds a stable collision fallback', () => {
    const a = deterministicSlugFallback('گوشی سامسونگ', 'cat-1');
    expect(a).toBe(deterministicSlugFallback('گوشی سامسونگ', 'cat-1'));
    expect(a).not.toBe(deterministicSlugFallback('گوشی سامسونگ', 'cat-2'));
  });
});
