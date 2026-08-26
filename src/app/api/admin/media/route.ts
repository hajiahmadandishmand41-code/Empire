import { NextRequest } from 'next/server';
import { jsonError, jsonOk } from '@/lib/api/response';
import { requireAdminApi } from '@/lib/auth/require-admin-api';
import { createMediaAsset, deleteMediaAsset, listMediaAssets } from '@/features/admin/lib/control-store';
import { uploadPersistent, deletePersistent } from '@/lib/storage';

export const dynamic = 'force-dynamic';

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/ogg']);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

function hasValidSignature(buffer: Buffer, mime: string): boolean {
  if (mime === 'image/png') return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mime === 'image/jpeg') return buffer.length >= 3 && buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  if (mime === 'image/gif') return buffer.length >= 6 && ['GIF87a', 'GIF89a'].includes(buffer.subarray(0, 6).toString('ascii'));
  if (mime === 'image/webp') return buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  if (mime === 'video/webm') return buffer.length >= 4 && buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  if (mime === 'video/ogg') return buffer.length >= 4 && buffer.subarray(0, 4).toString('ascii') === 'OggS';
  if (mime === 'video/mp4') return buffer.subarray(0, Math.min(buffer.length, 64)).toString('ascii').includes('ftyp');
  return false;
}

export async function GET(req: NextRequest) {
  const guard = await requireAdminApi('media.manage');
  if (!guard.ok) return guard.response;
  try {
    return jsonOk(await listMediaAssets({
      q: req.nextUrl.searchParams.get('q') ?? undefined,
      kind: req.nextUrl.searchParams.get('kind') ?? undefined,
      page: Number(req.nextUrl.searchParams.get('page') ?? 1),
      pageSize: Number(req.nextUrl.searchParams.get('pageSize') ?? 30),
    }));
  } catch {
    return jsonError('db_unavailable', 'Media library is unavailable', { status: 503 });
  }
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

    const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (file.size <= 0 || file.size > maxBytes) {
      return jsonError('file_too_large', `Maximum size is ${isVideo ? '100' : '10'} MB`, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!hasValidSignature(buffer, file.type)) {
      return jsonError('invalid_file', 'File contents do not match the declared media type', { status: 400 });
    }

    const kind = isVideo ? 'video' : 'image';
    const uploaded = await uploadPersistent(file, `admin/${kind}s`);
    uploadedUrl = uploaded.secure_url ?? null;
    if (!uploadedUrl) return jsonError('storage_no_url', 'Storage did not return a media URL', { status: 502 });

    const id = await createMediaAsset({
      url: uploadedUrl,
      kind,
      mimeType: file.type,
      fileName: file.name,
      sizeBytes: file.size,
      folder: `admin/${kind}s`,
      createdById: guard.user.id,
    });

    return jsonOk({ id, url: uploadedUrl, kind, mimeType: file.type, fileName: file.name, sizeBytes: file.size }, { status: 201 });
  } catch {
    if (uploadedUrl) {
      try { await deletePersistent(uploadedUrl); } catch { /* best-effort orphan cleanup */ }
    }
    return jsonError('upload_failed', 'Media upload failed', { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const guard = await requireAdminApi('media.manage');
  if (!guard.ok) return guard.response;
  const id = req.nextUrl.searchParams.get('id');
  const url = req.nextUrl.searchParams.get('url');
  if (!id) return jsonError('invalid_id', 'Media id is required', { status: 400 });

  try {
    // Remove the metadata first so the library never references an asset that was already deleted.
    await deleteMediaAsset(id);
    if (url) {
      try { await deletePersistent(url); } catch { /* orphan cleanup can be retried separately */ }
    }
    return jsonOk({ deleted: true });
  } catch {
    return jsonError('delete_failed', 'Media deletion failed', { status: 500 });
  }
}
