import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { requireSellerApi } from '@/lib/auth/require-seller-api';
import { logger } from '@/lib/logger';
import { uploadPersistent, deletePersistent } from '@/lib/storage';
import { parseProductImages, PRODUCT_MAX_IMAGE_BYTES, PRODUCT_MAX_IMAGES } from '@/features/products/product-contract';
import { detectImageMime, hasValidImageSignature, isSupportedImageType } from '@/lib/media/image-upload';

export const dynamic = 'force-dynamic';
const MAX_TRANSACTION_RETRIES = 3;
const EXT: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif', 'image/bmp': 'bmp', 'image/tiff': 'tiff', 'image/x-icon': 'ico', 'image/vnd.microsoft.icon': 'ico', 'image/heic': 'heic', 'image/heif': 'heif', 'image/jxl': 'jxl', 'image/apng': 'png', 'image/svg+xml': 'svg' };
const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;
const postSchema = z.object({ dataUrl: z.string().min(20), alt: z.string().max(200).optional(), fileName: z.string().max(255).optional() });
const deleteSchema = z.object({ url: z.string().min(1).max(1000) });

export async function OPTIONS() { return jsonPreflight(); }

async function loadOwned(id: string, role: string, userId: string) {
  const p = await prisma.product.findUnique({ where: { id }, select: { id: true, sellerId: true, imagesJson: true, primaryImageIndex: true, name: true } });
  if (!p) return { ok: false as const, status: 404 };
  if (role !== 'admin' && p.sellerId !== userId) return { ok: false as const, status: 403 };
  return { ok: true as const, product: p };
}
function isSerializableConflict(err: unknown): boolean { return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2034'; }
async function cleanup(url: string, productId: string, userId: string) { try { await deletePersistent(url); } catch (err) { logger.warn('seller.products.images.cleanup_failed', { productId, userId }, err); } }

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;
  if (!SAFE_ID.test(id)) return jsonError('invalid_id', 'شناسه محصول نامعتبر است.', { status: 400 });
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'پایگاه داده در دسترس نیست.', { status: 503 });
  let body: unknown;
  try { body = await req.json(); } catch { return jsonError('invalid_json', 'اطلاعات ارسال‌شده نامعتبر است.', { status: 400 }); }
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return jsonError('invalid_body', 'اطلاعات تصویر نامعتبر است.', { status: 422, details: { issues: parsed.error.issues } });
  const match = /^data:([^;,]*)(?:;[^,]*)?;base64,([\s\S]+)$/.exec(parsed.data.dataUrl);
  if (!match) return jsonError('invalid_image', 'تصویر پایه۶۴ نامعتبر است.', { status: 400 });
  const suppliedMime = match[1].toLowerCase();
  const buf = Buffer.from(match[2], 'base64');
  if (buf.byteLength <= 0 || buf.byteLength > PRODUCT_MAX_IMAGE_BYTES) return jsonError('too_large', 'حجم تصویر نباید بیشتر از ۱۰ مگابایت باشد.', { status: 413 });
  const detectedMime = detectImageMime(buf);
  if (!detectedMime || !hasValidImageSignature(buf, suppliedMime)) return jsonError('invalid_image', 'محتوای فایل تصویر معتبر نیست.', { status: 400 });
  if (suppliedMime && !isSupportedImageType(suppliedMime) && suppliedMime !== 'application/octet-stream') return jsonError('unsupported_type', 'نوع اعلام‌شده تصویر پشتیبانی نمی‌شود.', { status: 415 });
  const effectiveMime = detectedMime;
  const owned = await loadOwned(id, guard.user.role, guard.user.id);
  if (!owned.ok) return owned.status === 404 ? jsonError('not_found', 'محصول پیدا نشد.', { status: 404 }) : jsonError('forbidden', 'دسترسی به این محصول مجاز نیست.', { status: 403 });

  let publicUrl = '';
  try { const uploaded = await uploadPersistent(new File([buf], `product.${EXT[effectiveMime] ?? 'bin'}`, { type: effectiveMime }), `products/${id}`); publicUrl = uploaded.secure_url ?? ''; if (!publicUrl) throw new Error('storage_no_url'); }
  catch (err) { logger.error('seller.products.images.write_failed', { productId: id, userId: guard.user.id }, err); return jsonError('storage_failed', 'ذخیره تصویر ناموفق بود.', { status: 503 }); }

  let committedImages: string[] | null = null;
  let terminalError: unknown = null;
  for (let attempt = 1; attempt <= MAX_TRANSACTION_RETRIES; attempt += 1) {
    try {
      committedImages = await prisma.$transaction(async (tx) => {
        const current = await tx.product.findUnique({ where: { id }, select: { imagesJson: true } });
        if (!current) throw new Error('PRODUCT_NOT_FOUND');
        const next = parseProductImages(current.imagesJson);
        if (next.length >= PRODUCT_MAX_IMAGES) throw new Error('IMAGE_LIMIT');
        next.push(publicUrl);
        await tx.product.update({ where: { id }, data: { imagesJson: next, primaryImageIndex: next.length === 1 ? 0 : undefined } });
        return next;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      terminalError = null; break;
    } catch (err) {
      terminalError = err;
      if (!isSerializableConflict(err) || attempt === MAX_TRANSACTION_RETRIES) break;
    }
  }
  if (!committedImages) {
    await cleanup(publicUrl, id, guard.user.id);
    if (terminalError instanceof Error && terminalError.message === 'IMAGE_LIMIT') return jsonError('image_limit', `حداکثر ${PRODUCT_MAX_IMAGES} تصویر برای هر محصول مجاز است.`, { status: 422 });
    if (terminalError instanceof Error && terminalError.message === 'PRODUCT_NOT_FOUND') return jsonError('not_found', 'محصول پیدا نشد.', { status: 404 });
    logger.error('seller.products.images.metadata_failed', { productId: id, userId: guard.user.id, retryCount: String(MAX_TRANSACTION_RETRIES) }, terminalError);
    return jsonError('storage_failed', 'ذخیره اطلاعات تصویر ناموفق بود.', { status: 500 });
  }
  return jsonOk({ url: publicUrl, images: committedImages });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;
  if (!SAFE_ID.test(id)) return jsonError('invalid_id', 'شناسه محصول نامعتبر است.', { status: 400 });
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'پایگاه داده در دسترس نیست.', { status: 503 });
  let body: unknown; try { body = await req.json(); } catch { return jsonError('invalid_json', 'اطلاعات ارسال‌شده نامعتبر است.', { status: 400 }); }
  const parsed = deleteSchema.safeParse(body); if (!parsed.success) return jsonError('invalid_body', 'اطلاعات حذف تصویر نامعتبر است.', { status: 422, details: { issues: parsed.error.issues } });
  const owned = await loadOwned(id, guard.user.role, guard.user.id);
  if (!owned.ok) return owned.status === 404 ? jsonError('not_found', 'محصول پیدا نشد.', { status: 404 }) : jsonError('forbidden', 'دسترسی به این محصول مجاز نیست.', { status: 403 });
  const existingImages = parseProductImages(owned.product.imagesJson); const imageIndex = existingImages.indexOf(parsed.data.url);
  if (imageIndex < 0) return jsonError('image_not_found', 'این تصویر متعلق به محصول نیست.', { status: 404 });
  const images = existingImages.filter((url) => url !== parsed.data.url); const currentPrimary = owned.product.primaryImageIndex; const nextPrimary = images.length === 0 ? 0 : imageIndex === currentPrimary ? 0 : imageIndex < currentPrimary ? currentPrimary - 1 : Math.min(currentPrimary, images.length - 1);
  try { await prisma.product.update({ where: { id }, data: { imagesJson: images, primaryImageIndex: nextPrimary } }); } catch (err) { logger.error('seller.products.images.metadata_delete_failed', { productId: id, userId: guard.user.id }, err); return jsonError('update_failed', 'حذف تصویر ناموفق بود.', { status: 500 }); }
  await cleanup(parsed.data.url, id, guard.user.id);
  return jsonOk({ images, primaryImageIndex: nextPrimary });
}
