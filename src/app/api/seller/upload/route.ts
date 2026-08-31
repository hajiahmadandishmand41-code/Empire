/** Seller image upload endpoint — content-validated, filename-independent media upload. */
import { NextRequest, NextResponse } from 'next/server';
import { requireSellerApi } from '@/lib/auth/require-seller-api';
import { logger } from '@/lib/logger';
import { uploadPersistent } from '@/lib/storage';
import { detectImageMime, imageUploadError, IMAGE_MIME_TO_EXTENSION } from '@/lib/media/image-upload';

export async function POST(req: NextRequest) {
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) return NextResponse.json({ error: 'فایلی ارسال نشده است.' }, { status: 400 });
    const validationError = imageUploadError(file);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 413 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const detectedMime = detectImageMime(buffer);
    if (!detectedMime || !(detectedMime in IMAGE_MIME_TO_EXTENSION)) {
      return NextResponse.json({ error: 'محتوای فایل یک تصویر معتبر پشتیبانی‌شده نیست.' }, { status: 415 });
    }

    const extension = IMAGE_MIME_TO_EXTENSION[detectedMime] ?? 'bin';
    const normalizedFile = new File([buffer], `upload.${extension}`, { type: detectedMime });
    const uploaded = await uploadPersistent(normalizedFile, 'images');
    logger.info('seller.image_upload.success', {
      userId: guard.user.id,
      publicId: uploaded.public_id,
      size: buffer.byteLength,
      mime: detectedMime,
    });
    return NextResponse.json({ url: uploaded.secure_url, name: uploaded.public_id, size: buffer.byteLength, type: detectedMime });
  } catch (err) {
    logger.error('seller.image_upload.error', { userId: guard.user.id }, err);
    const code = err instanceof Error ? err.message : '';
    if (code === 'PERSISTENT_STORAGE_NOT_CONFIGURED') return NextResponse.json({ error: 'ذخیره‌سازی تصویر در محیط فعلی تنظیم نشده است.' }, { status: 503 });
    if (code.startsWith('STORAGE_UPLOAD_FAILED:')) return NextResponse.json({ error: 'آپلود تصویر توسط سرویس ذخیره‌سازی ناموفق بود.' }, { status: 503 });
    return NextResponse.json({ error: 'خطا در آپلود تصویر.' }, { status: 500 });
  }
}
