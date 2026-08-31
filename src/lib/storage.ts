import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { hasValidImageSignature, imageUploadError } from '@/lib/media/image-upload';

const cloud = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

export const isPersistentStorageConfigured = Boolean(cloud && apiKey && apiSecret);

function sign(params: Record<string, string>, secret: string) {
  const body = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join('&');
  return crypto.createHash('sha1').update(body + secret).digest('hex');
}

function isDbMediaUrl(url: string): boolean {
  try { return /^\/api\/media\/[A-Za-z0-9_-]{8,80}$/.test(new URL(url, 'http://local').pathname); } catch { return false; }
}

function mediaIdFromUrl(url: string): string | null {
  try { return /^\/api\/media\/([A-Za-z0-9_-]{8,80})$/.exec(new URL(url, 'http://local').pathname)?.[1] ?? null; } catch { return null; }
}

async function assertImageFile(file: File): Promise<void> {
  const metadataError = imageUploadError(file);
  if (metadataError) throw new Error(metadataError);
  const header = Buffer.from(await file.slice(0, 65536).arrayBuffer());
  const mime = file.type || '';
  if (!hasValidImageSignature(header, mime)) throw new Error('تصویر قابل شناسایی نیست یا محتوای فایل با تصویر مطابقت ندارد.');
}

async function uploadToDatabase(file: File, folder: string) {
  await assertImageFile(file);
  const id = crypto.randomUUID();
  const url = `/api/media/${id}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO "MediaAsset" ("id","url","kind","mimeType","fileName","sizeBytes","folder","data","createdAt","updatedAt")
    VALUES (${id},${url},'image',${file.type || 'application/octet-stream'},${file.name || null},${file.size},${folder},${buffer},CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
  `);
  return { secure_url: url, public_id: `db/${id}`, resource_type: 'image' };
}

export async function checkPersistentStorage(): Promise<boolean> {
  if (!isPersistentStorageConfigured) {
    try { await prisma.$queryRaw`SELECT 1 FROM "MediaAsset" LIMIT 1`; return true; } catch { return false; }
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const auth = Buffer.from(`${apiKey!}:${apiSecret!}`).toString('base64');
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/resources/image/upload?max_results=1`, { method: 'GET', headers: { Authorization: `Basic ${auth}` }, signal: controller.signal, cache: 'no-store' });
    return response.ok;
  } catch { return false; } finally { clearTimeout(timer); }
}

export async function uploadPersistent(file: File, folder: string) {
  await assertImageFile(file);
  if (!isPersistentStorageConfigured) return uploadToDatabase(file, folder);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folderName = `${process.env.CLOUDINARY_UPLOAD_FOLDER ?? 'eshop'}/${folder}`;
  const signature = sign({ folder: folderName, timestamp }, apiSecret!);
  const form = new FormData();
  form.append('file', file);
  form.append('api_key', apiKey!);
  form.append('timestamp', timestamp);
  form.append('folder', folderName);
  form.append('signature', signature);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`STORAGE_UPLOAD_FAILED:${res.status}`);
  const data = await res.json() as { secure_url?: string; public_id?: string; resource_type?: string };
  if (!data.secure_url || data.resource_type === 'video' || data.resource_type === 'raw') throw new Error('فضای ذخیره‌سازی فقط تصویر را می‌پذیرد.');
  return { ...data, resource_type: 'image' as const };
}

export async function deletePersistent(url: string) {
  if (isDbMediaUrl(url)) {
    const mediaId = mediaIdFromUrl(url);
    if (mediaId) await prisma.$executeRaw(Prisma.sql`DELETE FROM "MediaAsset" WHERE "id"=${mediaId}`);
    return;
  }
  if (!isPersistentStorageConfigured) return;
  const u = new URL(url);
  const marker = '/upload/';
  const i = u.pathname.indexOf(marker);
  if (i < 0) return;
  const rest = u.pathname.slice(i + marker.length).replace(/^v\d+\//, '');
  const publicId = rest.replace(/\.[^.\/]+$/, '');
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = sign({ invalidate: 'true', public_id: publicId, timestamp }, apiSecret!);
  const form = new URLSearchParams({ public_id: publicId, timestamp, invalidate: 'true', api_key: apiKey!, signature });
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/destroy`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form });
  if (!response.ok) throw new Error(`STORAGE_DELETE_FAILED:${response.status}`);
}
