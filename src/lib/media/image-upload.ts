export const IMAGE_MIME_TO_EXTENSION: Readonly<Record<string, string>> = {
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

export const SUPPORTED_IMAGE_MIME_TYPES = Object.freeze(Object.keys(IMAGE_MIME_TO_EXTENSION));
export const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024;

export function extensionOf(name: string): string {
  const index = name.lastIndexOf('.');
  return index > -1 ? name.slice(index + 1).toLowerCase() : '';
}

export function extensionMatches(mime: string, extension: string): boolean {
  const aliases: Record<string, string[]> = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/apng': ['apng', 'png'],
    'image/tiff': ['tif', 'tiff'],
    'image/x-icon': ['ico'],
    'image/vnd.microsoft.icon': ['ico'],
  };
  return (aliases[mime] ?? [IMAGE_MIME_TO_EXTENSION[mime] ?? '']).includes(extension);
}

export function isSupportedImageType(mime: string): boolean {
  return mime.startsWith('image/') && mime in IMAGE_MIME_TO_EXTENSION;
}

function startsWith(buffer: Buffer, bytes: number[]): boolean {
  return buffer.length >= bytes.length && Buffer.from(bytes).equals(buffer.subarray(0, bytes.length));
}

export function hasValidImageSignature(buffer: Buffer, mime: string): boolean {
  if (mime === 'image/png' || mime === 'image/apng') return startsWith(buffer, [137, 80, 78, 71, 13, 10, 26, 10]);
  if (mime === 'image/jpeg') return startsWith(buffer, [255, 216, 255]);
  if (mime === 'image/gif') return buffer.length >= 6 && ['GIF87a', 'GIF89a'].includes(buffer.subarray(0, 6).toString('ascii'));
  if (mime === 'image/webp') return buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  if (mime === 'image/avif' || mime === 'image/heic' || mime === 'image/heif') return buffer.length >= 12 && buffer.subarray(4, 8).toString('ascii') === 'ftyp';
  if (mime === 'image/bmp') return startsWith(buffer, [0x42, 0x4d]);
  if (mime === 'image/tiff') return startsWith(buffer, [0x49, 0x49, 0x2a, 0x00]) || startsWith(buffer, [0x4d, 0x4d, 0x00, 0x2a]);
  if (mime === 'image/x-icon' || mime === 'image/vnd.microsoft.icon') return startsWith(buffer, [0x00, 0x00, 0x01, 0x00]) || startsWith(buffer, [0x00, 0x00, 0x02, 0x00]);
  if (mime === 'image/jxl') return startsWith(buffer, [0xff, 0x0a]) || (buffer.length >= 12 && buffer.subarray(4, 8).toString('ascii') === 'JXL ');
  if (mime === 'image/svg+xml') {
    const text = buffer.toString('utf8', 0, Math.min(buffer.length, 64 * 1024)).replace(/^\uFEFF/, '').trimStart().toLowerCase();
    return text.includes('<svg')
      && !/<script\b/i.test(text)
      && !/javascript:/i.test(text)
      && !/\son[a-z]+\s*=/i.test(text);
  }
  return false;
}

export function imageUploadError(file: File): string | null {
  if (!isSupportedImageType(file.type)) return 'فقط فایل تصویری معتبر مجاز است؛ ویدیو و فایل‌های غیرتصویری غیرفعال است.';
  if (file.size <= 0) return 'فایل تصویر خالی است.';
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) return 'حجم تصویر نباید بیشتر از ۱۰ مگابایت باشد.';
  if (!extensionMatches(file.type, extensionOf(file.name))) return 'پسوند فایل با نوع تصویر مطابقت ندارد.';
  return null;
}
