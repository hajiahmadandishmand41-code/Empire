import type { NextRequest } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk } from '@/lib/api/response';
import { requireAdminApi } from '@/lib/auth/require-admin-api';
import { createMediaAsset, deleteMediaAsset, listMediaAssets } from '@/features/admin/lib/control-store';
import { uploadPersistent, deletePersistent, isPersistentStorageConfigured } from '@/lib/storage';

export const dynamic = 'force-dynamic';

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/ogg']);
const IMAGE_EXTENSIONS: Record<string, string[]> = { 'image/jpeg': ['jpg', 'jpeg'], 'image/png': ['png'], 'image/webp': ['webp'], 'image/gif': ['gif'] };
const VIDEO_EXTENSIONS: Record<string, string[]> = { 'video/mp4': ['mp4', 'm4v'], 'video/webm': ['webm'], 'video/ogg': ['ogg', 'ogv'] };
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

function extensionOf(name: string): string { const i = name.lastIndexOf('.'); return i > -1 ? name.slice(i + 1).toLowerCase() : ''; }
function extensionMatches(mime: string, ext: string): boolean { return (IMAGE_EXTENSIONS[mime] ?? VIDEO_EXTENSIONS[mime] ?? []).includes(ext); }
function hasValidSignature(buffer: Buffer, mime: string): boolean {
  if (mime === 'image/png') return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  if (mime === 'image/jpeg') return buffer.length >= 3 && buffer.subarray(0, 3).equals(Buffer.from([0xff,0xd8,0xff]));
  if (mime === 'image/gif') return buffer.length >= 6 && ['GIF87a','GIF89a'].includes(buffer.subarray(0, 6).toString('ascii'));
  if (mime === 'image/webp') return buffer.length >= 12 && buffer.subarray(0,4).toString('ascii') === 'RIFF' && buffer.subarray(8,12).toString('ascii') === 'WEBP';
  if (mime === 'video/webm') return buffer.length >= 4 && buffer.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3]));
  if (mime === 'video/ogg') return buffer.length >= 4 && buffer.subarray(0,4).toString('ascii') === 'OggS';
  if (mime === 'video/mp4') return buffer.length >= 8 && buffer.subarray(4,8).toString('ascii') === 'ftyp';
  return false;
}

async function mediaUsage(url: string): Promise<string | null> {
  if (!isDatabaseConfigured()) return null;
  const product = await prisma.$queryRaw<Array<{ id: string }>>`SELECT "id" FROM "Product" WHERE CAST("imagesJson" AS text) LIKE ${`%${url}%`} LIMIT 1`;
  if (product[0]) return 'product';
  const category = await prisma.$queryRaw<Array<{ id: string }>>`SELECT "id" FROM "CategoryMeta" WHERE "imageUrl" = ${url} LIMIT 1`;
  if (category[0]) return 'category';
  const banner = await prisma.$queryRaw<Array<{ id: string }>>`SELECT "id" FROM "Banner" WHERE "desktopImageUrl" = ${url} OR "mobileImageUrl" = ${url} LIMIT 1`;
  if (banner[0]) return 'banner';
  const homepage = await prisma.$queryRaw<Array<{ id: string }>>`SELECT "id" FROM "HomepageSection" WHERE CAST("configJson" AS text) LIKE ${`%${url}%`} LIMIT 1`;
  if (homepage[0]) return 'homepage';
  return null;
}

export async function GET(req: NextRequest) {
  const guard = await requireAdminApi('media.manage');
  if (!guard.ok) return guard.response;
  try {
    const page = Math.max(1, Number(req.nextUrl.searchParams.get('page') ?? 1));
    const pageSize = Math.min(100, Math.max(10, Number(req.nextUrl.searchParams.get('pageSize') ?? 30)));
    return jsonOk(await listMediaAssets({ q: req.nextUrl.searchParams.get('q') ?? undefined, kind: req.nextUrl.searchParams.get('kind') ?? undefined, page, pageSize }));
  } catch { return jsonError('db_unavailable', 'Media library is unavailable', { status: 503 }); }
}

export async function POST(req: NextRequest) {
  const guard = await requireAdminApi('media.manage');
  if (!guard.ok) return guard.response;
  let uploadedUrl: string | null = null;
  try {
    const fd = await req.formData();
    const file = fd.get('file');
    if (!(file instanceof File)) return jsonError('missing_file', 'File is required', { status: 400 });
    const isImage = IMAGE_TYPES.has(file.type);
    const isVideo = VIDEO_TYPES.has(file.type);
    if (!isImage && !isVideo) return jsonError('invalid_type', 'Unsupported media type', { status: 400 });
    if (isVideo && !isPersistentStorageConfigured) return jsonError('video_storage_unavailable', 'Video storage is not configured', { status: 503 });
    const max = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (file.size <= 0 || file.size > max) return jsonError('file_too_large', `Maximum size is ${isVideo ? 100 : 10} MB`, { status: 400 });
    const ext = extensionOf(file.name);
    if (!extensionMatches(file.type, ext)) return jsonError('invalid_extension', 'File extension does not match its media type', { status: 400 });
    const header = Buffer.from(await file.slice(0, 64).arrayBuffer());
    if (!hasValidSignature(header, file.type)) return jsonError('invalid_signature', 'File contents do not match the declared media type', { status: 400 });

    const kind = isVideo ? 'video' : 'image';
    const uploaded = await uploadPersistent(file, `admin/${kind}s`);
    uploadedUrl = uploaded.secure_url ?? null;
    if (!uploadedUrl) return jsonError('storage_no_url', 'Storage did not return a media URL', { status: 502 });

    // Database fallback already creates its MediaAsset row; Cloudinary needs the metadata row created here.
    const dbFallback = typeof uploaded.public_id === 'string' && uploaded.public_id.startsWith('db/');
    const id = dbFallback ? uploaded.public_id.slice(3) : await createMediaAsset({ url: uploadedUrl, kind, mimeType: file.type, fileName: file.name, sizeBytes: file.size, folder: `admin/${kind}s`, createdById: guard.user.id });
    if (dbFallback && isDatabaseConfigured()) await prisma.$executeRaw`UPDATE "MediaAsset" SET "createdById" = ${guard.user.id} WHERE "id" = ${id}`;

    return jsonOk({ id, url: uploadedUrl, kind, mimeType: file.type, fileName: file.name, sizeBytes: file.size }, { status: 201 });
  } catch {
    if (uploadedUrl) { try { await deletePersistent(uploadedUrl); } catch { /* best effort */ } }
    return jsonError('upload_failed', 'Media upload failed', { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const guard = await requireAdminApi('media.manage');
  if (!guard.ok) return guard.response;
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return jsonError('invalid_id', 'Media id is required', { status: 400 });
  try {
    const rows = await prisma.$queryRaw<Array<{ id: string; url: string }>>`SELECT "id", "url" FROM "MediaAsset" WHERE "id" = ${id} LIMIT 1`;
    const asset = rows[0];
    if (!asset) return jsonError('not_found', 'Media not found', { status: 404 });
    const usage = await mediaUsage(asset.url);
    if (usage) return jsonError('media_in_use', `Media is still referenced by ${usage}`, { status: 409 });
    await deletePersistent(asset.url);
    await deleteMediaAsset(id);
    return jsonOk({ deleted: true });
  } catch { return jsonError('delete_failed', 'Media deletion failed', { status: 500 }); }
}
