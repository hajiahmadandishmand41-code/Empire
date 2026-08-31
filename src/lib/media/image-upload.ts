export const IMAGE_MIME_TO_EXTENSION: Readonly<Record<string, string>> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif', 'image/bmp': 'bmp', 'image/tiff': 'tiff', 'image/x-icon': 'ico', 'image/vnd.microsoft.icon': 'ico', 'image/heic': 'heic', 'image/heif': 'heif', 'image/jxl': 'jxl', 'image/apng': 'apng', 'image/svg+xml': 'svg',
};
export const SUPPORTED_IMAGE_MIME_TYPES = Object.freeze(Object.keys(IMAGE_MIME_TO_EXTENSION));
export const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024;
export function extensionOf(name: string): string { const index = name.lastIndexOf('.'); return index > -1 ? name.slice(index + 1).toLowerCase() : ''; }
export function isSupportedImageType(mime: string): boolean { return mime === '' || mime === 'application/octet-stream' || (mime.startsWith('image/') && mime in IMAGE_MIME_TO_EXTENSION); }
function startsWith(buffer: Buffer, bytes: number[]): boolean { return buffer.length >= bytes.length && Buffer.from(bytes).equals(buffer.subarray(0, bytes.length)); }
function isoBmffBrands(buffer: Buffer): string[] { if (buffer.length < 16 || buffer.subarray(4, 8).toString('ascii') !== 'ftyp') return []; const brands = [buffer.subarray(8, 12).toString('ascii')]; for (let offset = 16; offset + 4 <= buffer.length && offset < 256; offset += 4) brands.push(buffer.subarray(offset, offset + 4).toString('ascii')); return brands; }
function hasIsoBmffImageBrand(buffer: Buffer, kind: 'avif' | 'heif'): boolean { const brands = isoBmffBrands(buffer); if (!brands.length) return false; const avif = new Set(['avif', 'avis']); const heif = new Set(['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevs']); return brands.some((brand) => kind === 'avif' ? avif.has(brand) : heif.has(brand)); }
export function detectImageMime(buffer: Buffer): string | null {
  const text = buffer.toString('utf8', 0, Math.min(buffer.length, 64 * 1024)).replace(/^\uFEFF/, '').trimStart();
  if (/^<svg[\s>]/i.test(text) && !/<script\b/i.test(text) && !/javascript:/i.test(text) && !/\son[a-z]+\s*=\s*/i.test(text)) return 'image/svg+xml';
  if (startsWith(buffer, [137,80,78,71,13,10,26,10])) return 'image/png';
  if (startsWith(buffer, [255,216,255])) return 'image/jpeg';
  if (buffer.length >= 6 && ['GIF87a','GIF89a'].includes(buffer.subarray(0,6).toString('ascii'))) return 'image/gif';
  if (buffer.length >= 12 && buffer.subarray(0,4).toString('ascii') === 'RIFF' && buffer.subarray(8,12).toString('ascii') === 'WEBP') return 'image/webp';
  if (hasIsoBmffImageBrand(buffer, 'avif')) return 'image/avif';
  if (hasIsoBmffImageBrand(buffer, 'heif')) return 'image/heif';
  if (startsWith(buffer, [0x42,0x4d])) return 'image/bmp';
  if (startsWith(buffer, [0x49,0x49,0x2a,0x00]) || startsWith(buffer, [0x4d,0x4d,0x00,0x2a])) return 'image/tiff';
  if (startsWith(buffer, [0x00,0x00,0x01,0x00]) || startsWith(buffer, [0x00,0x00,0x02,0x00])) return 'image/x-icon';
  if (startsWith(buffer, [0xff,0x0a]) || (buffer.length >= 12 && buffer.subarray(4,8).toString('ascii') === 'JXL ')) return 'image/jxl';
  return null;
}
export function hasValidImageSignature(buffer: Buffer, _mime = ''): boolean { const detected = detectImageMime(buffer); return detected !== null && detected in IMAGE_MIME_TO_EXTENSION; }
export function imageUploadError(file: File): string | null { if (file.size <= 0) return 'فایل تصویر خالی است.'; if (file.size > MAX_IMAGE_UPLOAD_BYTES) return 'حجم تصویر نباید بیشتر از ۱۰ مگابایت باشد.'; return null; }
