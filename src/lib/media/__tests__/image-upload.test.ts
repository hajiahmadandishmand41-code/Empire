import { describe, expect, it } from 'vitest';
import { hasValidImageSignature, imageUploadError, isSupportedImageType } from '../image-upload';

describe('image upload contract', () => {
  it('accepts supported image MIME types and rejects video', () => {
    expect(isSupportedImageType('image/avif')).toBe(true);
    expect(isSupportedImageType('image/heic')).toBe(true);
    expect(isSupportedImageType('image/tiff')).toBe(true);
    expect(isSupportedImageType('video/mp4')).toBe(false);
  });

  it('rejects non-image uploads before storage', () => {
    const video = new File([new Uint8Array([0, 1, 2])], 'clip.mp4', { type: 'video/mp4' });
    expect(imageUploadError(video)).toContain('فقط فایل تصویری');
  });

  it('validates common image signatures', () => {
    const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    const jpeg = Buffer.from([255, 216, 255, 0]);
    expect(hasValidImageSignature(png, 'image/png')).toBe(true);
    expect(hasValidImageSignature(jpeg, 'image/jpeg')).toBe(true);
  });

  it('rejects executable SVG payloads', () => {
    const unsafe = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    expect(hasValidImageSignature(unsafe, 'image/svg+xml')).toBe(false);
  });
});
