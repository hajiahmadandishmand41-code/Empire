import { describe, expect, it } from 'vitest';
import { hasValidImageSignature, imageUploadError, isSupportedImageType, SUPPORTED_IMAGE_MIME_TYPES } from '../image-upload';

const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const jpeg = Buffer.from([255, 216, 255, 0]);
const gif = Buffer.from('GIF89a', 'ascii');
const webp = Buffer.from('RIFF\0\0\0\0WEBP', 'ascii');
const bmp = Buffer.from([0x42, 0x4d, 0, 0]);
const tiff = Buffer.from([0x49, 0x49, 0x2a, 0x00]);
const ico = Buffer.from([0x00, 0x00, 0x01, 0x00]);
const jxl = Buffer.from([0xff, 0x0a, 0, 0]);
const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
function ftyp(major: string, compatible: string): Buffer {
  const header = Buffer.alloc(16 + compatible.length);
  header.writeUInt32BE(header.length, 0);
  header.write('ftyp', 4, 'ascii');
  header.write(major.padEnd(4, ' ').slice(0, 4), 8, 'ascii');
  header.writeUInt32BE(0, 12);
  header.write(compatible, 16, 'ascii');
  return header;
}

const signatures: Record<string, Buffer> = {
  'image/jpeg': jpeg,
  'image/png': png,
  'image/webp': webp,
  'image/gif': gif,
  'image/avif': ftyp('avif', 'mif1'),
  'image/bmp': bmp,
  'image/tiff': tiff,
  'image/x-icon': ico,
  'image/vnd.microsoft.icon': ico,
  'image/heic': ftyp('heic', 'mif1'),
  'image/heif': ftyp('mif1', 'miaf'),
  'image/jxl': jxl,
  'image/apng': png,
  'image/svg+xml': svg,
};

describe('image upload contract', () => {
  it('defines the complete supported image MIME set and rejects video', () => {
    expect(SUPPORTED_IMAGE_MIME_TYPES).toHaveLength(14);
    expect(SUPPORTED_IMAGE_MIME_TYPES).toEqual(expect.arrayContaining(Object.keys(signatures)));
    expect(isSupportedImageType('video/mp4')).toBe(false);
    expect(isSupportedImageType('application/pdf')).toBe(false);
  });

  it.each(Object.entries(signatures))('accepts a valid %s signature', (mime, bytes) => {
    expect(isSupportedImageType(mime)).toBe(true);
    expect(hasValidImageSignature(bytes, mime)).toBe(true);
    const file = new File([new Uint8Array(bytes)], `محصول-تصویر.${mime === 'image/svg+xml' ? 'svg' : 'bin'}`, { type: mime });
    expect(imageUploadError(file)).toBeNull();
  });

  it('accepts a valid image when the browser sends application/octet-stream', () => {
    expect(isSupportedImageType('application/octet-stream')).toBe(true);
    expect(hasValidImageSignature(png, 'application/octet-stream')).toBe(true);
    const file = new File([new Uint8Array(png)], 'تصویر.داده', { type: 'application/octet-stream' });
    expect(imageUploadError(file)).toBeNull();
  });

  it('rejects a video upload before storage', () => {
    const video = new File([new Uint8Array([0, 0, 0, 24, 102, 116, 121, 112, 105, 115, 111, 109])], 'clip.mp4', { type: 'video/mp4' });
    expect(imageUploadError(video)).toContain('فقط فایل تصویری');
  });

  it('does not confuse an MP4 ISO-BMFF file with HEIC/AVIF', () => {
    const mp4 = ftyp('isom', 'isom');
    expect(hasValidImageSignature(mp4, 'image/heic')).toBe(false);
    expect(hasValidImageSignature(mp4, 'image/heif')).toBe(false);
    expect(hasValidImageSignature(mp4, 'image/avif')).toBe(false);
  });

  it('rejects executable SVG payloads', () => {
    const unsafeScript = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    const unsafeHandler = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"></svg>');
    expect(hasValidImageSignature(unsafeScript, 'image/svg+xml')).toBe(false);
    expect(hasValidImageSignature(unsafeHandler, 'image/svg+xml')).toBe(false);
  });

  it('enforces the 10 MiB image limit', () => {
    const tooLarge = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'huge.png', { type: 'image/png' });
    expect(imageUploadError(tooLarge)).toContain('۱۰ مگابایت');
  });
});
