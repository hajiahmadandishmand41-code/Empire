import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';

const cloud = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

/**
 * Cloudinary remains the preferred persistent media provider. When its
 * credentials are not configured (for example on a fresh Vercel deployment),
 * uploads fall back to the existing MediaAsset table in PostgreSQL so seller
 * profile images and product images do not become unusable.
 */
export const isPersistentStorageConfigured = Boolean(cloud && apiKey && apiSecret);

function sign(params: Record<string,string>, secret: string) {
  const body = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
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
  const id = crypto.randomUUID();
  const url = `/api/media/${id}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const kind = file.type.startsWith('video/') ? 'video' : 'image';

  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO "MediaAsset"
      ("id", "url", "kind", "mimeType", "fileName", "sizeBytes", "folder", "data", "createdAt", "updatedAt")
    VALUES
      (${id}, ${url}, ${kind}, ${file.type}, ${file.name || null}, ${file.size}, ${folder}, ${buffer}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

  return {
    secure_url: url,
    public_id: `db/${id}`,
    resource_type: kind,
  };
}

export async function uploadPersistent(file: File, folder: string) {
  if (!isPersistentStorageConfigured) {
    return uploadToDatabase(file, folder);
  }

  const timestamp = Math.floor(Date.now()/1000).toString();
  // Existing uploads remain valid. New media uses the Eshop namespace unless
  // CLOUDINARY_UPLOAD_FOLDER is explicitly configured for backward compatibility.
  const folderName = `${process.env.CLOUDINARY_UPLOAD_FOLDER ?? 'eshop'}/${folder}`;
  const signature = sign({ folder: folderName, timestamp }, apiSecret!);
  const form = new FormData();
  form.append('file', file);
  form.append('api_key', apiKey!);
  form.append('timestamp', timestamp);
  form.append('folder', folderName);
  form.append('signature', signature);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/auto/upload`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`STORAGE_UPLOAD_FAILED:${res.status}`);
  const data = await res.json() as { secure_url?: string; public_id?: string; resource_type?: string };
  if (!data.secure_url) throw new Error('STORAGE_NO_URL');
  return data;
}

export async function deletePersistent(url: string) {
  if (isDbMediaUrl(url)) {
    const mediaId = mediaIdFromUrl(url);
    if (mediaId) {
      await prisma.$executeRaw(Prisma.sql`DELETE FROM "MediaAsset" WHERE "id" = ${mediaId}`);
    }
    return;
  }

  if (!isPersistentStorageConfigured) return;
  try {
    const u = new URL(url);
    const marker = '/upload/';
    const i = u.pathname.indexOf(marker);
    if (i < 0) return;
    const rest = u.pathname.slice(i + marker.length).replace(/^v\d+\//, '');
    const publicId = rest.replace(/\.[^.\/]+$/, '');
    const resourceType = u.pathname.includes('/video/upload/') ? 'video' : 'image';
    const timestamp = Math.floor(Date.now()/1000).toString();
    const signature = sign({ invalidate: 'true', public_id: publicId, timestamp }, apiSecret!);
    const form = new URLSearchParams({ public_id: publicId, timestamp, invalidate: 'true', api_key: apiKey!, signature });
    await fetch(`https://api.cloudinary.com/v1_1/${cloud}/destroy`, { method: 'POST', headers: {'Content-Type':'application/x-www-form-urlencoded'}, body: form });
  } catch { /* best-effort cleanup */ }
}
