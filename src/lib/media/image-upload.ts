export const IMAGE_MIME_TO_EXTENSION: Readonly<Record<string, string>> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
  'image/avif': 'avif', 'image/bmp': 'bmp', 'image/tiff': 'tiff', 'image/x-icon': 'ico',
  'image/vnd.microsoft.icon': 'ico', 'image/heic': 'heic', 'image/heif': 'heif',
  'image/jxl': 'jxl', 'image/apng': 'apng', 'image/svg+xml': 'svg',
};

export const SUPPORTED_IMAGE_MIME_TYPES = Object.freeze(Object.keys(IMAGE_MIME_TO_EXTENSION));
export const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024;

export function extensionOf(name: string): string {
  const index = name.lastIndexOf('.');
  return index > -1 ? name.slice(index + 1).toLowerCase() : '';
}

export function isSupportedImageType(mime: string): boolean {
  return mime === '' || mime === 'application/octet-stream' || (mime.startsWith('image/') && mime in IMAGE_MIME_TO_EXTENSION);
}

function startsWith(buffer: Buffer, bytes: number[]): boolean {
  return buffer.length >= bytes.length && Buffer.from(bytes).equals(buffer.subarray(0, bytes.length));
}

function isoBmffMajorBrand(buffer: Buffer): string {
  return buffer.length >= 12 && buffer.subarray(4, 8).toString('ascii') === 'ftyp' ? buffer.subarray(8, 12).toString('ascii') : '';
}

function hasIsoBmffImageBrand(buffer: Buffer, kind: 'avif' | 'heif'): boolean {
  if (buffer.length < 16 || buffer.subarray(4, 8).toString('ascii') !== 'ftyp') return false;
  const major = isoBmffMajorBrand(buffer);
  const brands = [major];
  for (let offset = 16; offset + 4 <= buffer.length && offset < 256; offset += 4) brands.push(buffer.subarray(offset, offset + 4).toString('ascii'));
  const avifBrands = new Set(['avif', 'avis', 'mif1', 'miaf', 'MA1A', 'MA1B']);
  const heifBrands = new Set(['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevs', 'mif1', 'msf1', 'miaf']);
  const accepted = kind === 'avif' ? avifBrands : heifBrands;
  return brands.some((brand) => accepted.has(brand));
}

export function hasValidImageSignature(buffer: Buffer, mime = ''): boolean {
  const text = buffer.toString('utf8', 0, Math.min(buffer.length, 64 * 1024)).replace(/^\uFEFF/, '').trimStart();
  if (mime === 'image/svg+xml' || ((mime === '' || mime === 'application/octet-stream') && /^<svg[\s>]/i.test(text))) {
    return /^<svg[\s>]/i.test(text) && !/<script\b/i.test(text) && !/javascript:/i.test(text) && !/\son[a-z]+\s*=/i.test(text);
  }
  if ((mime === '' || mime === 'application/octet-stream' || mime === 'image/png' || mime === 'image/apng') && startsWith(buffer, [137, 80, 78, 71, 13, 10, 26, 10])) return true;
  if ((mime === '' || mime === 'application/octet-stream' || mime === 'image/jpeg') && startsWith(buffer, [255, 216, 255])) return true;
  if ((mime === '' || mime === 'application/octet-stream' || mime === 'image/gif') && buffer.length >= 6 && ['GIF87a', 'GIF89a'].includes(buffer.subarray(0, 6).toString('ascii'))) return true;
  if ((mime === '' || mime === 'application/octet-stream' || mime === 'image/webp') && buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return true;
  if ((mime === '' || mime === 'application/octet-stream' || mime === 'image/avif') && hasIsoBmffImageBrand(buffer, 'avif')) return true;
  if ((mime === '' || mime === 'application/octet-stream' || mime === 'image/heic' || mime === 'image/heif') && hasIsoBmffImageBrand(buffer, 'heif')) return true;
  if ((mime === '' || mime === 'application/octet-stream' || mime === 'image/bmp') && startsWith(buffer, [0x42, 0x4d])) return true;
  if ((mime === '' || mime === 'application/octet-stream' || mime === 'image/tiff') && (startsWith(buffer, [0x49, 0x49, 0x2a, 0x00]) || startsWith(buffer, [0x4d, 0x4d, 0x00, 0x2a]))) return true;
  if ((mime === '' || mime === 'application/octet-stream' || mime === 'image/x-icon' || mime === 'image/vnd.microsoft.icon') && (startsWith(buffer, [0x00, 0x00, 0x01, 0x00]) || startsWith(buffer, [0x00, 0x00, 0x02, 0x00]))) return true;
  if ((mime === '' || mime === 'application/octet-stream' || mime === 'image/jxl') && (startsWith(buffer, [0xff, 0x0a]) || (buffer.length >= 12 && buffer.subarray(4, 8).toString('ascii') === 'JXL '))) return true;
  return false;
}

export function imageUploadError(file: File): string | null {
  if (!isSupportedImageType(file.type)) return 'فقط فایل تصویری معتبر مجاز است؛ ویدیو و فایل‌های غیرتصویری غیرفعال است.';
  if (file.size <= 0) return 'فایل تصویر خالی است.';
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) return 'حجم تصویر نباید بیشتر از ۱۰ مگابایت باشد.';
  return null;
}
