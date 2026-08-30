import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';

const cloud = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

export const isPersistentStorageConfigured = Boolean(cloud && apiKey && apiSecret);

function sign(params: Record<string, string>, secret: string) {
  const body = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join('&');
  return crypto.createHash('sha1').update(body + secret).digest('hex');
}

function isDbMediaUrl(url: string): boolean {
  try {
    const path = new URL(url, 'http://local').pathname;
    return /^\/api\/media\/[A-Za-z0-9_-]{8,80}$/.test(path);
  } catch {
    return false;
  }
}

function mediaIdFromUrl(url: string): string | null {
  try {
    const path = new URL(url, 'http://local').pathname;
    const match = /^\/api\/media\/([A-Za-z0-9_-]{8,80})$/.exec(path);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

async function uploadToDatabase(file: File, folder: string) {
  if (!file.type.startsWith('image/')) throw new Error('ONLY_IMAGE_UPLOADS_ALLOWED');
  const id = crypto.randomUUID();
  const url = `/api/media/${id}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO "MediaAsset"
      ("id", "url", "kind", "mimeType", "fileName", "sizeBytes", "folder", "data", "createdAt", "updatedAt")
    VALUES
      (${id}, ${url}, 'image', ${file.type}, ${file.name || null}, ${file.size}, ${folder}, ${buffer}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);
  return { secure_url: url, public_id: `db/${id}`, resource_type: 'image' as const };
}

export async function checkPersistentStorage(): Promise<boolean> {
  if (!isPersistentStorageConfigured) {
    try {
      await prisma.$queryRaw`SELECT 1 FROM "MediaAsset" LIMIT 1`;
      return true;
    } catch {
      return false;
    }
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const auth = Buffer.from(`${apiKey!}:${apiSecret!}`).toString('base64');
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/resources/image/upload?max_results=1`, {
      method: 'GET',
      headers: { Authorization: `Basic ${auth}` },
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timer);
    return response.ok;
  } catch {
    return false;
  }
}

/** Image-only persistent upload. Cloudinary auto-detects supported image input formats. */
export async function uploadPersistent(file: File, folder: string) {
  if (!file.type.startsWith('image/')) throw new Error('ONLY_IMAGE_UPLOADS_ALLOWED');
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
  if (!data.secure_url) throw new Error('STORAGE_NO_URL');
  return data;
}

export async function deletePersistent(url: string) {
  if (isDbMediaUrl(url)) {
    const mediaId = mediaIdFromUrl(url);
    if (mediaId) await prisma.$executeRaw(Prisma.sql`DELETE FROM "MediaAsset" WHERE "id" = ${mediaId}`);
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
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/destroy`, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form,
  });
  if (!response.ok) throw new Error(`STORAGE_DELETE_FAILED:${response.status}`);
}
