/**
 * Seller file upload endpoint — secured seller/admin media upload.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireSellerApi } from '@/lib/auth/require-seller-api';
import { logger } from '@/lib/logger';
import { uploadPersistent } from '@/lib/storage';

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};
const ALLOWED_VIDEO_TYPES: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/ogg': 'ogv',
};

function hasValidImageSignature(buf: Buffer, mime: string): boolean {
  if (mime === 'image/png') return buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mime === 'image/jpeg') return buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (mime === 'image/gif') return buf.length >= 6 && (buf.subarray(0, 6).toString('ascii') === 'GIF87a' || buf.subarray(0, 6).toString('ascii') === 'GIF89a');
  if (mime === 'image/webp') return buf.length >= 12 && buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP';
  return false;
}

function hasValidVideoSignature(buf: Buffer, mime: string): boolean {
  if (mime === 'video/webm') return buf.length >= 4 && buf.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  if (mime === 'video/ogg') return buf.length >= 4 && buf.subarray(0, 4).toString('ascii') === 'OggS';
  if (mime === 'video/mp4') {
    const scan = buf.subarray(0, Math.min(buf.length, 64)).toString('ascii');
    return scan.includes('ftyp');
  }
  return false;
}

export async function POST(req: NextRequest) {
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const type = (formData.get('type') as string) || 'image';
    if (!file) return NextResponse.json({ error: 'فایلی ارسال نشده' }, { status: 400 });

    const isVideo = type === 'video';
    const maxSize = isVideo ? 100 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) return NextResponse.json({ error: `حجم فایل نباید بیشتر از ${isVideo ? '100' : '5'} مگابایت باشد` }, { status: 400 });

    const allowedTypes = isVideo ? ALLOWED_VIDEO_TYPES : ALLOWED_IMAGE_TYPES;
    const ext = allowedTypes[file.type];
    if (!ext) return NextResponse.json({ error: 'فرمت فایل مجاز نیست' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const validSignature = isVideo ? hasValidVideoSignature(buffer, file.type) : hasValidImageSignature(buffer, file.type);
    if (!validSignature) return NextResponse.json({ error: 'محتوای فایل با نوع اعلام‌شده مطابقت ندارد' }, { status: 400 });

    const folder = isVideo ? 'videos' : 'images';
    const uploaded = await uploadPersistent(file, folder);
    logger.info('seller.upload.success', { userId: guard.user.id, folder, publicId: uploaded.public_id, size: file.size, mime: file.type, extension: ext });
    return NextResponse.json({ url: uploaded.secure_url, name: uploaded.public_id, size: file.size, type: file.type });
  } catch (err) {
    logger.error('seller.upload.error', { userId: guard.user.id }, err);
    const code = err instanceof Error ? err.message : '';
    if (code === 'PERSISTENT_VIDEO_STORAGE_NOT_CONFIGURED') {
      return NextResponse.json({ error: 'ذخیره‌سازی ویدیو در محیط فعلی تنظیم نشده است. برای آپلود ویدیو باید Cloudinary فعال باشد.' }, { status: 503 });
    }
    if (code === 'PERSISTENT_STORAGE_NOT_CONFIGURED') {
      return NextResponse.json({ error: 'ذخیره‌سازی رسانه در محیط فعلی تنظیم نشده است.' }, { status: 503 });
    }
    if (code.startsWith('STORAGE_UPLOAD_FAILED:')) {
      return NextResponse.json({ error: 'آپلود رسانه توسط سرویس ذخیره‌سازی ناموفق بود.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'خطا در آپلود فایل' }, { status: 500 });
  }
}
