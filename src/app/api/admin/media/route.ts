import type { NextRequest } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk } from '@/lib/api/response';
import { requireAdminApi } from '@/lib/auth/require-admin-api';
import { createMediaAsset, deleteMediaAsset, listMediaAssets } from '@/features/admin/lib/control-store';
import { isInternalMediaUrl } from '@/features/admin/lib/media-url';
import { uploadPersistent, deletePersistent } from '@/lib/storage';

export const dynamic = 'force-dynamic';
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

function hasValidImageSignature(buffer: Buffer, mime: string): boolean {
  if (mime === 'image/png') return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mime === 'image/jpeg') return buffer.length >= 3 && buffer.subarray(0, 3).equals(Buffer.from([255, 216, 255]));
  if (mime === 'image/gif') return buffer.length >= 6 && ['GIF87a', 'GIF89a'].includes(buffer.subarray(0, 6).toString('ascii'));
  if (mime === 'image/webp') return buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  if (mime === 'image/avif') return buffer.length >= 12 && buffer.subarray(4, 8).toString('ascii') === 'ftyp';
  if (mime === 'image/apng') return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  // SVG is valid image data but is active XML. Keep it out of the DB fallback;
  // Cloudinary can safely normalize it when explicitly configured.
  if (mime === 'image/svg+xml') return buffer.length > 0 && buffer.toString('utf8', 0, Math.min(buffer.length, 4096)).includes('<svg');
  return mime.startsWith('image/');
}

async function mediaUsage(url: string) {
  if (!isDatabaseConfigured()) return null;
  const p = await prisma.$queryRaw<Array<{ id: string }>>`SELECT "id" FROM "Product" WHERE CAST("imagesJson" AS text) LIKE ${`%${url}%`} LIMIT 1`;
  if (p[0]) return 'product';
  const c = await prisma.$queryRaw<Array<{ id: string }>>`SELECT "id" FROM "CategoryMeta" WHERE "imageUrl"=${url} LIMIT 1`;
  if (c[0]) return 'category';
  const b = await prisma.$queryRaw<Array<{ id: string }>>`SELECT "id" FROM "Banner" WHERE "desktopImageUrl"=${url} OR "mobileImageUrl"=${url} LIMIT 1`;
  if (b[0]) return 'banner';
  const h = await prisma.$queryRaw<Array<{ id: string }>>`SELECT "id" FROM "HomepageSection" WHERE CAST("configJson" AS text) LIKE ${`%${url}%`} LIMIT 1`;
  if (h[0]) return 'homepage';
  return null;
}

function positiveInt(value: string | null, fallback: number, max?: number) {
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return max === undefined ? parsed : Math.min(max, parsed);
}

export async function GET(req: NextRequest) {
  const g = await requireAdminApi('media.manage');
  if (!g.ok) return g.response;
  try {
    const page = positiveInt(req.nextUrl.searchParams.get('page'), 1);
    const pageSize = Math.max(10, positiveInt(req.nextUrl.searchParams.get('pageSize'), 30, 100));
    return jsonOk(await listMediaAssets({ q: req.nextUrl.searchParams.get('q') ?? undefined, kind: 'image', page, pageSize }));
  } catch {
    return jsonError('db_unavailable', 'کتابخانهٔ تصاویر فعلاً در دسترس نیست.', { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const g = await requireAdminApi('media.manage');
  if (!g.ok) return g.response;
  let uploadedUrl: string | null = null;
  try {
    const fd = await req.formData();
    const file = fd.get('file');
    if (!(file instanceof File)) return jsonError('missing_file', 'تصویر انتخاب نشده است.', { status: 400 });
    if (!file.type.startsWith('image/')) return jsonError('invalid_type', 'فقط فایل تصویر مجاز است.', { status: 400 });
    if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) return jsonError('file_too_large', 'حداکثر حجم تصویر ۲۰ مگابایت است.', { status: 400 });
    const header = Buffer.from(await file.slice(0, 4096).arrayBuffer());
    if (!hasValidImageSignature(header, file.type)) return jsonError('invalid_signature', 'محتوای فایل با نوع تصویر مطابقت ندارد.', { status: 400 });

    const uploaded = await uploadPersistent(file, 'admin/images');
    const secureUrl = uploaded.secure_url ?? null;
    if (!secureUrl) return jsonError('storage_no_url', 'ذخیره‌سازی تصویر نشانی تصویر برنگرداند.', { status: 502 });
    uploadedUrl = secureUrl;
    const publicId = uploaded.public_id ?? null;
    const dbFallback = publicId?.startsWith('db/') === true;
    const id = dbFallback && publicId
      ? publicId.slice(3)
      : await createMediaAsset({ url: secureUrl, kind: 'image', mimeType: file.type, fileName: file.name, sizeBytes: file.size, folder: 'admin/images', createdById: g.user.id });
    if (dbFallback && isDatabaseConfigured()) await prisma.$executeRaw`UPDATE "MediaAsset" SET "createdById"=${g.user.id} WHERE "id"=${id}`;
    return jsonOk({ id, url: secureUrl, kind: 'image', mimeType: file.type, fileName: file.name, sizeBytes: file.size }, { status: 201 });
  } catch (err) {
    if (uploadedUrl) { try { await deletePersistent(uploadedUrl); } catch { /* cleanup is attempted, original error remains */ } }
    const message = err instanceof Error ? err.message : '';
    if (message === 'ONLY_IMAGE_UPLOADS_ALLOWED') return jsonError('invalid_type', 'فقط فایل تصویر مجاز است.', { status: 400 });
    if (message.startsWith('STORAGE_UPLOAD_FAILED:')) return jsonError('upload_failed', 'آپلود تصویر توسط سرویس ذخیره‌سازی ناموفق بود.', { status: 503 });
    return jsonError('upload_failed', 'آپلود تصویر ناموفق بود. لطفاً دوباره تلاش کنید.', { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const g = await requireAdminApi('media.manage');
  if (!g.ok) return g.response;
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return jsonError('invalid_id', 'شناسهٔ تصویر لازم است.', { status: 400 });
  try {
    const rows = await prisma.$queryRaw<Array<{ id: string; url: string }>>`SELECT "id","url" FROM "MediaAsset" WHERE "id"=${id} LIMIT 1`;
    const asset = rows[0];
    if (!asset) return jsonError('not_found', 'تصویر پیدا نشد.', { status: 404 });
    const usage = await mediaUsage(asset.url);
    if (usage) return jsonError('media_in_use', 'این تصویر هنوز در یک بخش از فروشگاه استفاده می‌شود.', { status: 409 });
    await deletePersistent(asset.url);
    if (!isInternalMediaUrl(asset.url)) await deleteMediaAsset(id);
    return jsonOk({ deleted: true });
  } catch {
    return jsonError('delete_failed', 'حذف تصویر ناموفق بود.', { status: 500 });
  }
}
