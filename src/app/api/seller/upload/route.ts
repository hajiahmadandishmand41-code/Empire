/** Seller image upload endpoint — secured seller media upload. */
import { NextRequest, NextResponse } from 'next/server';
import { requireSellerApi } from '@/lib/auth/require-seller-api';
import { logger } from '@/lib/logger';
import { uploadPersistent } from '@/lib/storage';

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

function hasValidImageSignature(buf: Buffer, mime: string): boolean {
  if (mime === 'image/png' || mime === 'image/apng') return buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mime === 'image/jpeg') return buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (mime === 'image/gif') return buf.length >= 6 && (buf.subarray(0, 6).toString('ascii') === 'GIF87a' || buf.subarray(0, 6).toString('ascii') === 'GIF89a');
  if (mime === 'image/webp') return buf.length >= 12 && buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP';
  if (mime === 'image/avif') return buf.length >= 12 && buf.subarray(4, 8).toString('ascii') === 'ftyp';
  if (mime === 'image/svg+xml') return buf.length > 0 && buf.toString('utf8', 0, Math.min(buf.length, 4096)).includes('<svg');
  return mime.startsWith('image/');
}

export async function POST(req: NextRequest) {
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) return NextResponse.json({ error: 'تصویری انتخاب نشده است' }, { status: 400 });
    if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'فقط فایل تصویر مجاز است' }, { status: 400 });
    if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) return NextResponse.json({ error: 'حجم تصویر نباید بیشتر از ۲۰ مگابایت باشد' }, { status: 400 });

    const header = Buffer.from(await file.slice(0, 4096).arrayBuffer());
    if (!hasValidImageSignature(header, file.type)) return NextResponse.json({ error: 'محتوای فایل با نوع تصویر مطابقت ندارد' }, { status: 400 });

    const uploaded = await uploadPersistent(file, 'seller/images');
    logger.info('seller.upload.success', { userId: guard.user.id, folder: 'seller/images', publicId: uploaded.public_id, size: file.size, mime: file.type });
    return NextResponse.json({ url: uploaded.secure_url, name: uploaded.public_id, size: file.size, type: file.type });
  } catch (err) {
    logger.error('seller.upload.error', { userId: guard.user.id }, err);
    const code = err instanceof Error ? err.message : '';
    if (code === 'ONLY_IMAGE_UPLOADS_ALLOWED') return NextResponse.json({ error: 'فقط فایل تصویر مجاز است' }, { status: 400 });
    if (code.startsWith('STORAGE_UPLOAD_FAILED:')) return NextResponse.json({ error: 'آپلود تصویر توسط سرویس ذخیره‌سازی ناموفق بود' }, { status: 503 });
    return NextResponse.json({ error: 'خطا در آپلود تصویر' }, { status: 500 });
  }
}
