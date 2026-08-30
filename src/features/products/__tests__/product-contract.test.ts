import { describe, expect, it } from 'vitest';
import { productCreateSchema, productUpdateSchema, parseProductImages, normalizePersianDigits, productValidationMessage } from '../product-contract';
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

  it('accepts Persian/Arabic digit strings for numeric fields', () => {
    const parsed = productCreateSchema.safeParse({
      name: 'گوشی سامسونگ', shortDescription: 'توضیح فارسی محصول', price: '۱٬۲۵۰', stockQuantity: '۱۰', compareAtPrice: '۱٬۵۰۰', currency: 'afn', categoryId: 'cat-1', region: 'افغانستان', images: [],
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.price).toBe(1250);
      expect(parsed.data.stockQuantity).toBe(10);
      expect(parsed.data.compareAtPrice).toBe(1500);
      expect(parsed.data.currency).toBe('AFN');
    }
  });

  it('normalizes localized digits directly', () => {
    expect(normalizePersianDigits('۱۲۳٬۴۵۶٫۷۸')).toBe('123,456.78');
    expect(normalizePersianDigits('١٢٣٬٤٥٦٫٧٨')).toBe('123,456.78');
  });

  it('rejects an old price that is not greater than the current price', () => {
    const result = productCreateSchema.safeParse({ name: 'محصول نمونه', shortDescription: 'توضیح نمونه', price: '۱۰۰۰', compareAtPrice: '۹۰۰', currency: 'AFN', categoryId: 'cat-1', region: 'افغانستان' });
    expect(result.success).toBe(false);
    if (!result.success) expect(productValidationMessage(result.error.issues)).toContain('قیمت قبلی');
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
