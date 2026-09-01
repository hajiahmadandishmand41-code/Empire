import type { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { requireSellerApi } from '@/lib/auth/require-seller-api';

export const dynamic = 'force-dynamic';

const INTERNAL_MEDIA_PATH = /^\/api\/media\/[A-Za-z0-9_-]{8,120}$/;
const optionalText = (max: number) => z.string().trim().max(max).optional().nullable();
const optionalHttpUrl = (max: number) => optionalText(max).refine((value) => {
  if (value == null || value === '') return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}, 'Invalid URL');
const optionalMediaUrl = (max: number) => optionalText(max).refine((value) => {
  if (value == null || value === '' || INTERNAL_MEDIA_PATH.test(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}, 'Invalid media URL');
const optionalJson = optionalText(4000).refine((value) => {
  if (value == null || value === '') return true;
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}, 'attributesJson must contain valid JSON');

const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  description: optionalText(1500),
  logoUrl: optionalMediaUrl(500),
  bannerUrl: optionalMediaUrl(500),
  website: optionalHttpUrl(300),
  country: optionalText(120),
  contactEmail: z.string().trim().email().max(200).optional().nullable(),
  contactPhone: optionalText(40),
  instagram: optionalHttpUrl(300),
  facebook: optionalHttpUrl(300),
  telegram: optionalHttpUrl(300),
  linkedin: optionalHttpUrl(300),
  attributesJson: optionalJson,
  isActive: z.boolean().optional(),
}).strict();

const patchSchema = createSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: 'At least one field is required',
});

type BrandInput = z.infer<typeof createSchema>;
type BrandPatch = z.infer<typeof patchSchema>;

const slugify = (value: string) => {
  const slug = value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);
  return slug || 'brand';
};

type BrandColumn = Exclude<keyof BrandInput, 'isActive'> | 'isActive';

const BRAND_COLUMNS: Record<BrandColumn, string> = {
  name: 'name',
  slug: 'slug',
  description: 'description',
  logoUrl: 'logoUrl',
  bannerUrl: 'bannerUrl',
  website: 'website',
  country: 'country',
  contactEmail: 'contactEmail',
  contactPhone: 'contactPhone',
  instagram: 'instagram',
  facebook: 'facebook',
  telegram: 'telegram',
  linkedin: 'linkedin',
  attributesJson: 'attributesJson',
  isActive: 'isActive',
};

const brandFieldSql = (column: BrandColumn, value: unknown): Prisma.Sql => {
  const sqlColumn = BRAND_COLUMNS[column];
  const safeValue = value === undefined
    ? null
    : value;
  if (column === 'attributesJson' && typeof safeValue === 'string' && safeValue.trim() !== '') {
    return Prisma.sql`${Prisma.raw(`\"${sqlColumn}\"`)} = ${safeValue}::jsonb`;
  }
  return Prisma.sql`${Prisma.raw(`\"${sqlColumn}\"`)} = ${safeValue}`;
};

async function auth() {
  const guard = await requireSellerApi();
  if (!guard.ok) return { response: guard.response } as const;
  if (guard.user.role === 'admin') {
    return { response: jsonError('forbidden', 'Seller access required', { status: 403 }) } as const;
  }
  if (!isDatabaseConfigured()) {
    return { response: jsonError('db_unavailable', 'Database is not configured', { status: 503 }) } as const;
  }
  return { user: guard.user } as const;
}

async function getBrand(sellerId: string) {
  const rows = await prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
    SELECT * FROM \"SellerBrand\"
    WHERE \"sellerId\" = ${sellerId}
    LIMIT 1
  `);
  return rows[0] ?? null;
}

export async function OPTIONS() {
  return jsonPreflight();
}

export async function GET() {
  const guard = await auth();
  if ('response' in guard) return guard.response;
  try {
    return jsonOk(await getBrand(guard.user.id));
  } catch (error) {
    console.error('[seller/brand.GET]', error);
    return jsonError('query_failed', 'Unable to load brand', { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const guard = await auth();
  if ('response' in guard) return guard.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError('invalid_json', 'Invalid JSON', { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('invalid_body', 'Invalid brand payload', {
      status: 422,
      details: { issues: parsed.error.issues },
    });
  }

  const existing = await getBrand(guard.user.id);
  if (existing) {
    if (existing.isActive === false) {
      try {
        const rows = await prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
          UPDATE \"SellerBrand\"
          SET \"isActive\" = true, \"updatedAt\" = CURRENT_TIMESTAMP
          WHERE \"sellerId\" = ${guard.user.id}
          RETURNING *
        `);
        return jsonOk(rows[0] ?? existing);
      } catch (error) {
        console.error('[seller/brand.POST.reactivate]', error);
        return jsonError('reactivate_failed', 'Brand could not be reactivated', { status: 500 });
      }
    }
    return jsonError('already_exists', 'برای این فروشنده یک برند از قبل ساخته شده است.', { status: 409 });
  }

  const data: BrandInput = {
    ...parsed.data,
    slug: parsed.data.slug ?? `${slugify(parsed.data.name)}-${guard.user.id.slice(0, 8)}`,
  };
  const fields = (Object.keys(data) as BrandColumn[]).filter((key) => data[key] !== undefined);
  const columns = ['sellerId', ...fields].map((column) => {
    if (column === 'sellerId') return Prisma.raw('\"sellerId\"');
    return Prisma.raw(`\"${BRAND_COLUMNS[column]}\"`);
  });
  const values = [
    Prisma.sql`${guard.user.id}`,
    ...fields.map((field) => {
      const value = data[field];
      if (field === 'attributesJson' && typeof value === 'string' && value.trim() !== '') {
        return Prisma.sql`${value}::jsonb`;
      }
      return Prisma.sql`${value}`;
    }),
  ];

  try {
    const rows = await prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
      INSERT INTO \"SellerBrand\" (${Prisma.join(columns, ',')}, \"createdAt\", \"updatedAt\")
      VALUES (${Prisma.join(values, ',')}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `);
    return jsonOk(rows[0], { status: 201 });
  } catch (error: unknown) {
    const code = typeof error === 'object' && error && 'code' in error
      ? String((error as { code?: unknown }).code ?? '')
      : '';
    if (code === '23505' || code === 'P2002') {
      return jsonError('duplicate', 'A brand with this identifier already exists.', { status: 409 });
    }
    console.error('[seller/brand.POST]', error);
    return jsonError('create_failed', 'برند ساخته نشد.', { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const guard = await auth();
  if ('response' in guard) return guard.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError('invalid_json', 'Invalid JSON', { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('invalid_body', 'Invalid brand payload', {
      status: 422,
      details: { issues: parsed.error.issues },
    });
  }

  try {
    if (!(await getBrand(guard.user.id))) {
      return jsonError('not_found', 'برای این فروشنده هنوز برندی ساخته نشده است. ابتدا برند را ایجاد کنید.', { status: 404 });
    }

    const parts: Prisma.Sql[] = [Prisma.sql`\"updatedAt\" = CURRENT_TIMESTAMP`];
    for (const field of Object.keys(parsed.data) as BrandColumn[]) {
      const value = parsed.data[field];
      if (value !== undefined) parts.push(brandFieldSql(field, value));
    }

    const rows = await prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
      UPDATE \"SellerBrand\"
      SET ${Prisma.join(parts, ', ')}
      WHERE \"sellerId\" = ${guard.user.id}
      RETURNING *
    `);
    return rows[0]
      ? jsonOk(rows[0])
      : jsonError('update_failed', 'Brand update failed', { status: 500 });
  } catch (error: unknown) {
    const code = typeof error === 'object' && error && 'code' in error
      ? String((error as { code?: unknown }).code ?? '')
      : '';
    if (code === '23505' || code === 'P2002') {
      return jsonError('duplicate_slug', 'A brand with this slug already exists.', { status: 409 });
    }
    console.error('[seller/brand.PATCH]', error);
    return jsonError('update_failed', 'Brand update failed', { status: 500 });
  }
}

export async function DELETE() {
  const guard = await auth();
  if ('response' in guard) return guard.response;

  try {
    const brand = await getBrand(guard.user.id);
    if (!brand) return jsonError('not_found', 'Brand not found', { status: 404 });

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw(Prisma.sql`
        UPDATE \"Product\"
        SET \"brandId\" = NULL
        WHERE \"brandId\" = ${String(brand.id)}
      `);
      await tx.$executeRaw(Prisma.sql`
        UPDATE \"SellerBrand\"
        SET \"isActive\" = false, \"updatedAt\" = CURRENT_TIMESTAMP
        WHERE \"id\" = ${String(brand.id)}
      `);
    });

    return jsonOk({ id: brand.id, isActive: false });
  } catch (error) {
    console.error('[seller/brand.DELETE]', error);
    return jsonError('delete_failed', 'Brand could not be deactivated', { status: 500 });
  }
}
