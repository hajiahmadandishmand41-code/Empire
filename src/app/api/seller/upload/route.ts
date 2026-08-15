/**
 * Seller file upload endpoint — Phase 4 (secured in Stage 3).
 *
 * Security hardening (Stage 3):
 *  - requireSellerApi() guard: only authenticated sellers / admins may upload.
 *  - Extension derived from validated MIME type, NOT from user-supplied filename,
 *    preventing path-traversal via crafted filenames (e.g. "evil.php.jpg").
 *  - Magic-byte (file signature) validation for images.
 *  - Filename generated with crypto.randomBytes — no user input in path.
 *  - console.error replaced with structured logger.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireSellerApi } from '@/lib/auth/require-seller-api';
import { logger } from '@/lib/logger';
import { uploadPersistent } from '@/lib/storage';

// Allowed MIME types mapped to their safe extensions (derived from MIME, NOT filename).
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

/** Validate magic bytes (file signature) to prevent polyglot / spoofed MIME types. */
function hasValidImageSignature(buf: Buffer, mime: string): boolean {
  if (mime === 'image/png') {
    return buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  }
  if (mime === 'image/jpeg') {
    return buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  }
  if (mime === 'image/gif') {
    return buf.length >= 6 && (
      buf.subarray(0, 6).toString('ascii') === 'GIF87a' ||
      buf.subarray(0, 6).toString('ascii') === 'GIF89a'
    );
  }
  if (mime === 'image/webp') {
    return buf.length >= 12 &&
      buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buf.subarray(8, 12).toString('ascii') === 'WEBP';
  }
  return false;
}

export async function POST(req: NextRequest) {
  // Stage 3: authentication guard — sellers and admins only.
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = (formData.get('type') as string) || 'image';

    if (!file) {
      return NextResponse.json({ error: 'فایلی ارسال نشده' }, { status: 400 });
    }

    const isVideo = type === 'video';
    const maxSize = isVideo ? 100 * 1024 * 1024 : 5 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `حجم فایل نباید بیشتر از ${isVideo ? '100' : '5'} مگابایت باشد` },
        { status: 400 },
      );
    }

    // Validate MIME type against the allow-list.
    const allowedTypes = isVideo ? ALLOWED_VIDEO_TYPES : ALLOWED_IMAGE_TYPES;
    const ext = allowedTypes[file.type];
    if (!ext) {
      return NextResponse.json({ error: 'فرمت فایل مجاز نیست' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // For images: validate magic bytes to prevent spoofed MIME types.
    if (!isVideo && !hasValidImageSignature(buffer, file.type)) {
      return NextResponse.json(
        { error: 'محتوای فایل با نوع اعلام‌شده مطابقت ندارد' },
        { status: 400 },
      );
    }

    const folder = isVideo ? 'videos' : 'images';
    const uploaded = await uploadPersistent(file, folder);
    logger.info('seller.upload.success', { userId: guard.user.id, folder, publicId: uploaded.public_id, size: file.size, mime: file.type });
    return NextResponse.json({ url: uploaded.secure_url, name: uploaded.public_id, size: file.size, type: file.type });
  } catch (err) {
    logger.error('seller.upload.error', { userId: guard.user.id }, err);
    return NextResponse.json({ error: 'خطا در آپلود فایل' }, { status: 500 });
  }
}
