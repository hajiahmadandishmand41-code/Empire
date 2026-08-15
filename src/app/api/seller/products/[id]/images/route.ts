/**
 * Seller product image endpoint — Phase 4.
 *
 * POST { dataUrl }          → decode a base64 image, persist to
 *                             `public/uploads/products/<id>/<uuid>.<ext>`,
 *                             append URL to Product.imagesJson.
 * DELETE { url }            → remove an image URL from Product.imagesJson
 *                             (and best-effort unlink the file).
 *
 * Accepts image/{png,jpeg,jpg,webp,gif} up to 3 MB. Sellers may only
 * touch products they own; admins bypass ownership.
 *
 * Stage 3: replaced console.error with structured logger.
 */
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { requireSellerApi } from '@/lib/auth/require-seller-api';
import { logger } from '@/lib/logger';
import { uploadPersistent, deletePersistent } from '@/lib/storage';

export const dynamic = 'force-dynamic';

const MAX_BYTES = 3 * 1024 * 1024;
const MAX_IMAGES = 10;
const EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;

const postSchema = z.object({
  dataUrl: z.string().min(30),
  alt: z.string().max(200).optional(),
});
const deleteSchema = z.object({ url: z.string().min(1) });

export async function OPTIONS() {
  return jsonPreflight();
}

async function loadOwned(id: string, role: string, userId: string) {
  const p = await prisma.product.findUnique({
    where: { id },
    select: { id: true, sellerId: true, imagesJson: true, name: true },
  });
  if (!p) return { ok: false as const, status: 404 };
  if (role !== 'admin' && p.sellerId !== userId) return { ok: false as const, status: 403 };
  return { ok: true as const, product: p };
}

function readImages(raw: unknown): Array<{ src: string; alt?: string }> {
  if (!raw) return [];
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((v: unknown) => {
        if (typeof v === 'string') return { src: v };
        if (v && typeof v === 'object' && 'src' in v) {
          const src = String((v as { src: unknown }).src ?? '');
          const alt = (v as { alt?: unknown }).alt;
          return src ? { src, alt: typeof alt === 'string' ? alt : undefined } : null;
        }
        return null;
      })
      .filter(Boolean) as Array<{ src: string; alt?: string }>;
  } catch {
    return [];
  }
}

function hasValidImageSignature(buf: Buffer, mime: string): boolean {
  if (mime === 'image/png') {
    return buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  }
  if (mime === 'image/jpeg' || mime === 'image/jpg') {
    return buf.length >= 3 && buf.subarray(0, 3).equals(Buffer.from([255, 216, 255]));
  }
  if (mime === 'image/gif') {
    return buf.length >= 6 && (buf.subarray(0, 6).toString() === 'GIF87a' || buf.subarray(0, 6).toString() === 'GIF89a');
  }
  if (mime === 'image/webp') {
    return buf.length >= 12 && buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP';
  }
  return false;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;
  if (!SAFE_ID.test(id))
    return jsonError('invalid_id', 'Invalid product id', { status: 400 });
  if (!isDatabaseConfigured())
    return jsonError('db_unavailable', 'Database is not configured', { status: 503 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError('invalid_json', 'Invalid JSON', { status: 400 });
  }
  const parsed = postSchema.safeParse(body);
  if (!parsed.success)
    return jsonError('invalid_body', 'Invalid image payload', {
      status: 422,
      details: { issues: parsed.error.issues },
    });

  const match = /^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/.exec(parsed.data.dataUrl);
  if (!match || !match[1] || !match[2])
    return jsonError('invalid_image', 'dataUrl must be a base64 image', { status: 400 });
  const mime = match[1].toLowerCase();
  const ext = EXT[mime];
  if (!ext) return jsonError('unsupported_type', `Unsupported image type: ${mime}`, { status: 415 });

  const buf = Buffer.from(match[2], 'base64');

  if (buf.byteLength > MAX_BYTES)
    return jsonError('too_large', 'Image exceeds 3MB', { status: 413 });
  if (!hasValidImageSignature(buf, mime))
    return jsonError('invalid_image', 'Image contents do not match its declared type', { status: 400 });

  const owned = await loadOwned(id, guard.user.role, guard.user.id);
  if (!owned.ok) {
    return owned.status === 404
      ? jsonError('not_found', 'Product not found', { status: 404 })
      : jsonError('forbidden', 'You do not own this product', { status: 403 });
  }

  let publicUrl: string;
  try {
    const uploaded = await uploadPersistent(new File([buf], `product.${ext}`, { type: mime }), `products/${id}`);
    publicUrl = uploaded.secure_url!;
  } catch (err) {
    logger.error('seller.products.images.write_failed', { productId: id, userId: guard.user.id }, err);
    return jsonError('storage_failed', 'Failed to persist image', { status: 503 });
  }

  let images: Array<{ src: string; alt?: string }> = [];
  try {
    images = await prisma.$transaction(
      async (tx) => {
        const current = await tx.product.findUnique({
          where: { id },
          select: { imagesJson: true, name: true },
        });
        if (!current) throw new Error('PRODUCT_NOT_FOUND');
        const next = readImages(current.imagesJson);
        if (next.length >= MAX_IMAGES) throw new Error('IMAGE_LIMIT');
        next.push({ src: publicUrl, alt: parsed.data.alt ?? current.name });
        await tx.product.update({
          where: { id },
          data: { imagesJson: next },
        });
        return next;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (err) {
    if (err instanceof Error && err.message === 'IMAGE_LIMIT') {
      return jsonError('image_limit', `A product can have at most ${MAX_IMAGES} images`, { status: 422 });
    }
    if (err instanceof Error && err.message === 'PRODUCT_NOT_FOUND') {
      return jsonError('not_found', 'Product not found', { status: 404 });
    }
    return jsonError('storage_failed', 'Failed to persist image metadata', { status: 500 });
  }
  return jsonOk({ url: publicUrl, images }, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;
  if (!SAFE_ID.test(id))
    return jsonError('invalid_id', 'Invalid product id', { status: 400 });
  if (!isDatabaseConfigured())
    return jsonError('db_unavailable', 'Database is not configured', { status: 503 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError('invalid_json', 'Invalid JSON', { status: 400 });
  }
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success)
    return jsonError('invalid_body', 'Invalid delete payload', { status: 422 });

  const owned = await loadOwned(id, guard.user.role, guard.user.id);
  if (!owned.ok) {
    return owned.status === 404
      ? jsonError('not_found', 'Product not found', { status: 404 })
      : jsonError('forbidden', 'You do not own this product', { status: 403 });
  }

  const images = readImages(owned.product.imagesJson).filter((i) => i.src !== parsed.data.url);
  await prisma.product.update({
    where: { id },
    data: { imagesJson: images },
  });
  await deletePersistent(parsed.data.url);

  return jsonOk({ images });
}
