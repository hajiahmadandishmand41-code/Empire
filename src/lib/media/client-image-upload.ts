'use client';

export type ImagePurpose = 'product' | 'logo' | 'banner';

type ImageTarget = { maxDimension: number; initialQuality: number; minQuality: number; targetBytes: number };
const TARGETS: Record<ImagePurpose, ImageTarget> = {
  product: { maxDimension: 1600, initialQuality: 0.82, minQuality: 0.52, targetBytes: 650 * 1024 },
  logo: { maxDimension: 800, initialQuality: 0.86, minQuality: 0.58, targetBytes: 220 * 1024 },
  banner: { maxDimension: 1800, initialQuality: 0.80, minQuality: 0.50, targetBytes: 500 * 1024 },
};
const MAX_SOURCE_BYTES = 10 * 1024 * 1024;
const MAX_ATTEMPTS = 8;

type UploadResponse = { url?: unknown; size?: unknown; type?: unknown; error?: unknown };
export interface OptimizedImage { file: File; originalBytes: number; optimizedBytes: number; width: number; height: number; compressionRatio: number }

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('تصویر قابل خواندن نیست.')); };
    image.decoding = 'async';
    image.src = url;
  });
}

function canvasBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('تبدیل تصویر ناموفق بود.')), 'image/webp', quality);
  });
}

function nextQuality(current: number, min: number): number {
  return Math.max(min, Number((current - 0.08).toFixed(2)));
}

export async function optimizeImage(file: File, purpose: ImagePurpose = 'product'): Promise<OptimizedImage> {
  if (typeof window === 'undefined') return { file, originalBytes: file.size, optimizedBytes: file.size, width: 0, height: 0, compressionRatio: 1 };
  if (file.size <= 0 || file.size > MAX_SOURCE_BYTES) throw new Error('حجم تصویر باید بین ۱ بایت تا ۱۰ مگابایت باشد.');
  const target = TARGETS[purpose];
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') return { file, originalBytes: file.size, optimizedBytes: file.size, width: 0, height: 0, compressionRatio: 1 };

  const source = await loadImage(file);
  const sourceWidth = source.naturalWidth || source.width;
  const sourceHeight = source.naturalHeight || source.height;
  const sourceMax = Math.max(sourceWidth, sourceHeight);
  let scale = Math.min(1, target.maxDimension / sourceMax);
  let width = Math.max(1, Math.round(sourceWidth * scale));
  let height = Math.max(1, Math.round(sourceHeight * scale));
  let quality = target.initialQuality;
  let best: Blob | null = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) throw new Error('مرورگر از پردازش تصویر پشتیبانی نمی‌کند.');
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(source, 0, 0, width, height);
    const blob = await canvasBlob(canvas, quality);
    best = !best || blob.size < best.size ? blob : best;
    if (blob.size <= target.targetBytes) {
      best = blob;
      break;
    }
    if (quality > target.minQuality + 0.001) {
      quality = nextQuality(quality, target.minQuality);
    } else {
      scale *= 0.82;
      width = Math.max(480, Math.round(sourceWidth * Math.min(1, scale)));
      height = Math.max(480, Math.round(sourceHeight * Math.min(1, scale)));
      quality = target.initialQuality;
    }
  }

  if (!best) throw new Error('بهینه‌سازی تصویر ناموفق بود.');
  const optimized = new File([best], `${file.name.replace(/\.[^.]+$/, '') || 'image'}.webp`, { type: 'image/webp', lastModified: Date.now() });
  return { file: optimized, originalBytes: file.size, optimizedBytes: optimized.size, width, height, compressionRatio: optimized.size / file.size };
}

export function uploadImageWithProgress(url: string, file: File, onProgress?: (percent: number) => void): Promise<{ url: string; size: number; type: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest(); xhr.open('POST', url, true); xhr.withCredentials = true;
    xhr.upload.addEventListener('loadstart', () => onProgress?.(0));
    xhr.upload.addEventListener('progress', (event) => { if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100)); });
    xhr.upload.addEventListener('load', () => onProgress?.(100));
    xhr.onerror = () => reject(new Error('اتصال هنگام آپلود تصویر قطع شد.'));
    xhr.onabort = () => reject(new Error('آپلود تصویر لغو شد.'));
    xhr.onload = () => {
      let body: UploadResponse = {}; try { body = JSON.parse(xhr.responseText || '{}') as UploadResponse; } catch { /* handled below */ }
      if (xhr.status >= 200 && xhr.status < 300 && typeof body.url === 'string') { resolve({ url: body.url, size: typeof body.size === 'number' ? body.size : file.size, type: typeof body.type === 'string' ? body.type : file.type }); return; }
      reject(new Error(typeof body.error === 'string' ? body.error : 'آپلود تصویر ناموفق بود.'));
    };
    const form = new FormData(); form.append('file', file, file.name); xhr.send(form);
  });
}

export function formatBytes(bytes: number): string { if (bytes < 1024) return `${bytes} B`; if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`; return `${(bytes / (1024 * 1024)).toFixed(1)} MB`; }
