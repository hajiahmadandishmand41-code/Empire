export type ImagePurpose = 'product' | 'logo' | 'banner';

const TARGETS: Record<ImagePurpose, { maxDimension: number; quality: number }> = {
  product: { maxDimension: 1600, quality: 0.8 },
  logo: { maxDimension: 800, quality: 0.86 },
  banner: { maxDimension: 2000, quality: 0.8 },
};

const MAX_SOURCE_BYTES = 10 * 1024 * 1024;

export interface OptimizedImage {
  file: File;
  originalBytes: number;
  optimizedBytes: number;
  width: number;
  height: number;
  compressionRatio: number;
}

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

export async function optimizeImage(file: File, purpose: ImagePurpose = 'product'): Promise<OptimizedImage> {
  if (typeof window === 'undefined') return { file, originalBytes: file.size, optimizedBytes: file.size, width: 0, height: 0, compressionRatio: 1 };
  if (file.size <= 0 || file.size > MAX_SOURCE_BYTES) throw new Error('حجم تصویر باید بین ۱ بایت تا ۱۰ مگابایت باشد.');

  const target = TARGETS[purpose];
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return { file, originalBytes: file.size, optimizedBytes: file.size, width: 0, height: 0, compressionRatio: 1 };
  }

  try {
    const source = await loadImage(file);
    const scale = Math.min(1, target.maxDimension / Math.max(source.naturalWidth || source.width, source.naturalHeight || source.height));
    const width = Math.max(1, Math.round((source.naturalWidth || source.width) * scale));
    const height = Math.max(1, Math.round((source.naturalHeight || source.height) * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) throw new Error('مرورگر از پردازش تصویر پشتیبانی نمی‌کند.');
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(source, 0, 0, width, height);
    const blob = await canvasBlob(canvas, target.quality);
    const optimized = new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.webp`, { type: 'image/webp', lastModified: Date.now() });
    return {
      file: optimized,
      originalBytes: file.size,
      optimizedBytes: optimized.size,
      width,
      height,
      compressionRatio: optimized.size / file.size,
    };
  } catch {
    return { file, originalBytes: file.size, optimizedBytes: file.size, width: 0, height: 0, compressionRatio: 1 };
  }
}

export function uploadImageWithProgress(url: string, file: File, onProgress?: (percent: number) => void): Promise<{ url: string; size: number; type: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.withCredentials = true;
    xhr.upload.addEventListener('loadstart', () => onProgress?.(0));
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    });
    xhr.upload.addEventListener('load', () => onProgress?.(100));
    xhr.onerror = () => reject(new Error('اتصال هنگام آپلود تصویر قطع شد.'));
    xhr.onabort = () => reject(new Error('آپلود تصویر لغو شد.'));
    xhr.onload = () => {
      let body: any = null;
      try { body = JSON.parse(xhr.responseText || '{}'); } catch { /* handled below */ }
      if (xhr.status >= 200 && xhr.status < 300 && typeof body?.url === 'string') {
        resolve({ url: body.url, size: Number(body.size ?? file.size), type: String(body.type ?? file.type) });
        return;
      }
      reject(new Error(typeof body?.error === 'string' ? body.error : 'آپلود تصویر ناموفق بود.'));
    };
    const form = new FormData();
    form.append('file', file, file.name);
    xhr.send(form);
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
