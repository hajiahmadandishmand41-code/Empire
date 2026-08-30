/**
 * Seller image upload endpoint — secured seller/admin media upload.
 * The endpoint is intentionally image-only; video upload is not part of the product.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireSellerApi } from '@/lib/auth/require-seller-api';
import { logger } from '@/lib/logger';
import { uploadPersistent } from '@/lib/storage';

const ALLOWED_IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/bmp': 'bmp',
  'image/tiff': 'tiff',
  'image/x-icon': 'ico',
  'image/vnd.microsoft.icon': 'ico',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/jxl': 'jxl',
  'image/apng': 'apng',
  'image/svg+xml': 'svg',
};

function hasValidImageSignature(buf: Buffer, mime: string): boolean {
  if (mime === 'image/png' || mime === 'image/apng') return buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mime === 'image/jpeg') return buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (mime === 'image/gif') return buf.length >= 6 && (buf.subarray(0, 6).toString('ascii') === 'GIF87a' || buf.subarray(0, 6).toString('ascii') === 'GIF89a');
  if (mime === 'image/webp') return buf.length >= 12 && buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP';
  if (mime === 'image/avif' || mime === 'image/heic' || mime === 'image/heif') return buf.length >= 12 && buf.subarray(4, 8).toString('ascii') === 'ftyp';
  if (mime === 'image/bmp') return buf.length >= 2 && buf.subarray(0, 2).toString('ascii') === 'BM';
  if (mime === 'image/tiff') return buf.length >= 4 && (buf.subarray(0, 4).equals(Buffer.from([0x49, 0x49, 0x2a, 0x00])) || buf.subarray(0, 4).equals(Buffer.from([0x4d, 0x4d, 0x00, 0x2a])));
  if (mime === 'image/x-icon' || mime === 'image/vnd.microsoft.icon') return buf.length >= 4 && (buf.subarray(0, 4).equals(Buffer.from([0x00, 0x00, 0x01, 0x00])) || buf.subarray(0, 4).equals(Buffer.from([0x00, 0x00, 0x02, 0x00])));
  if (mime === 'image/jxl') return buf.length >= 12 && (buf.subarray(0, 2).equals(Buffer.from([0xff, 0x0a])) || buf.subarray(4, 12).toString('ascii') === 'JXL ');
  if (mime === 'image/svg+xml') {
    const text = buf.toString('utf8', 0, Math.min(buf.length, 4096)).replace(/^\uFEFF/, '').trimStart().toLowerCase();
    return text.includes('<svg') && !text.includes('<script') && !text.includes('javascript:');
  }
  return false;
}

export async function POST(req: NextRequest) {
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) return NextResponse.json({ error: 'فایلی ارسال نشده است.' }, { status: 400 });
    if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'فقط فایل‌های تصویری مجاز هستند؛ آپلود ویدیو و فایل‌های دیگر غیرفعال است.' }, { status: 415 });
    if (!(file.type in ALLOWED_IMAGE_EXTENSIONS)) return NextResponse.json({ error: 'این فرمت تصویر پشتیبانی نمی‌شود. لطفاً یک فرمت تصویری معتبر انتخاب کنید.' }, { status: 415 });
    if (file.size <= 0 || file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'حجم تصویر نباید بیشتر از ۱۰ مگابایت باشد.' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!hasValidImageSignature(buffer, file.type)) return NextResponse.json({ error: 'محتوای فایل با نوع تصویر اعلام‌شده مطابقت ندارد.' }, { status: 400 });

    const ext = ALLOWED_IMAGE_EXTENSIONS[file.type];
    const uploaded = await uploadPersistent(file, 'images');
    logger.info('seller.image_upload.success', { userId: guard.user.id, publicId: uploaded.public_id, size: file.size, mime: file.type, extension: ext });
    return NextResponse.json({ url: uploaded.secure_url, name: uploaded.public_id, size: file.size, type: file.type });
  } catch (err) {
    logger.error('seller.image_upload.error', { userId: guard.user.id }, err);
    const code = err instanceof Error ? err.message : '';
    if (code === 'PERSISTENT_STORAGE_NOT_CONFIGURED') return NextResponse.json({ error: 'ذخیره‌سازی تصویر در محیط فعلی تنظیم نشده است.' }, { status: 503 });
    if (code.startsWith('STORAGE_UPLOAD_FAILED:')) return NextResponse.json({ error: 'آپلود تصویر توسط سرویس ذخیره‌سازی ناموفق بود.' }, { status: 503 });
    return NextResponse.json({ error: 'خطا در آپلود تصویر.' }, { status: 500 });
  }
}
