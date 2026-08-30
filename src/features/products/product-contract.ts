import { z } from 'zod';
import { isAllowedAdminMediaUrl } from '@/features/admin/lib/media-url';

export const PRODUCT_MAX_IMAGES = 12;
export const PRODUCT_MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const PRODUCT_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;

const mediaUrlSchema = z.string().trim().min(1).max(1000).refine(isAllowedAdminMediaUrl, 'Invalid media URL');
const currencySchema = z.string().trim().regex(/^[A-Z]{3}$/, 'Currency must be a 3-letter ISO code');

export const productImagesSchema = z.array(mediaUrlSchema).max(PRODUCT_MAX_IMAGES);

const productWriteShape = {
  slug: z.string().trim().min(1).max(120).nullable().optional(),
  name: z.string().trim().min(2).max(120),
  shortDescription: z.string().trim().min(2).max(300),
  description: z.string().trim().max(10000).nullable().optional(),
  price: z.number().finite().positive(),
  currency: currencySchema.default('AFN'),
  categoryId: z.string().trim().min(1, 'انتخاب دسته‌بندی الزامی است'),
  region: z.string().trim().min(1).max(120).default('AF'),
  badge: z.string().trim().max(40).nullable().optional(),
  inStock: z.boolean().default(true),
  stockQuantity: z.number().int().min(0).default(0),
  images: productImagesSchema.default([]),
  primaryImageIndex: z.number().int().min(0).default(0),
  compareAtPrice: z.number().finite().positive().nullable().optional(),
  isActive: z.boolean().default(true),
  whatsappNumber: z.string().trim().max(40).nullable().optional(),
  videoUrl: z.string().trim().max(500).nullable().optional(),
  isTraditional: z.boolean().default(false),
  weightKg: z.number().finite().min(0).nullable().optional(),
  dimensionsJson: z.string().max(200).nullable().optional(),
  tagsJson: z.string().max(500).nullable().optional(),
  attributesJson: z.string().max(2000).nullable().optional(),
} satisfies z.ZodRawShape;

const productWriteSchema = z.object(productWriteShape);

export const productCreateSchema = productWriteSchema.superRefine((value, ctx) => {
  if (value.images.length === 0 && value.primaryImageIndex !== 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['primaryImageIndex'], message: 'Primary image index must be 0 when there are no images' });
  }
  if (value.images.length > 0 && value.primaryImageIndex >= value.images.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['primaryImageIndex'], message: 'Primary image index is out of range' });
  }
});

export const productUpdateSchema = productWriteSchema.partial().strict().superRefine((value: z.infer<typeof productWriteSchema>, ctx: z.RefinementCtx) => {
  if (value.images === undefined || value.primaryImageIndex === undefined) return;
  if (value.images.length === 0 && value.primaryImageIndex !== 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['primaryImageIndex'], message: 'Primary image index must be 0 when there are no images' });
  }
  if (value.images.length > 0 && value.primaryImageIndex >= value.images.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['primaryImageIndex'], message: 'Primary image index is out of range' });
  }
});

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

export function parseProductImages(raw: unknown): string[] {
  if (raw == null) return [];
  let value: unknown = raw;
  if (typeof raw === 'string') {
    try { value = JSON.parse(raw) as unknown; } catch { return []; }
  }
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object' && 'src' in item) {
        const src = (item as { src?: unknown }).src;
        return typeof src === 'string' ? src : '';
      }
      if (item && typeof item === 'object' && 'url' in item) {
        const url = (item as { url?: unknown }).url;
        return typeof url === 'string' ? url : '';
      }
      return '';
    })
    .filter((url): url is string => url.trim().length > 0)
    .slice(0, PRODUCT_MAX_IMAGES);
}
