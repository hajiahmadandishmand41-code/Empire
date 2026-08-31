#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const failures = [];
function assert(condition, message) {
  if (!condition) failures.push(message);
}

const imageRoutes = [
  'src/app/api/seller/upload/route.ts',
  'src/app/api/seller/products/[id]/images/route.ts',
  'src/app/api/admin/media/route.ts',
];
for (const file of imageRoutes) {
  const source = read(file);
  assert(!/video\//i.test(source), `${file}: video MIME handling must not exist`);
  assert(!/videoUrl/i.test(source), `${file}: videoUrl must not exist in upload/media endpoint`);
  assert(/hasValidImageSignature|imageUploadError/.test(source), `${file}: shared image validation is required`);
}

for (const file of [
  'src/types/product.ts',
  'src/lib/db-mappers.ts',
  'src/server/services/product.service.ts',
  'src/features/seller/lib/products.ts',
  'src/features/seller/components/product-form.tsx',
  'src/features/seller/components/product-images-editor.tsx',
]) {
  assert(!/videoUrl/i.test(read(file)), `${file}: legacy video field must not leak into application/domain/UI`);
}

const sellerProductsApi = read('src/app/api/seller/products/route.ts');
assert(/sellerId:\s*guard\.user\.id/.test(sellerProductsApi), 'seller product creation must derive sellerId from the authenticated session');
assert(!/body[^\n]*sellerId/.test(sellerProductsApi), 'sellerId must not be accepted from request body');

const brandApi = read('src/app/api/seller/brand/route.ts');
assert(/g\.user\.id/.test(brandApi), 'seller brand API must scope reads/writes to session user');
assert(/ON CONFLICT \("sellerId"\)/.test(brandApi), 'seller brand upsert must use sellerId conflict protection');

const migration = read('prisma/migrations/20260829193000_seller_store_brand/migration.sql');
assert(/CREATE UNIQUE INDEX IF NOT EXISTS "SellerBrand_sellerId_key"/.test(migration), 'DB must enforce one SellerBrand per seller');
assert(/CONSTRAINT "SellerBrand_sellerId_fkey"/.test(migration), 'SellerBrand must be FK-linked to User');

const brandPage = read('src/app/[locale]/brands/[slug]/page.tsx');
assert(/SellerBrand/.test(brandPage) && /sellerId/.test(brandPage), 'independent brand page must resolve a real SellerBrand and seller');

const productMapper = read('src/lib/db-mappers.ts');
assert(/sellerName:\s*p\.seller\?\.fullName/.test(productMapper), 'product mapper must expose seller name');
assert(/sellerShopName:\s*p\.seller\?\.sellerShopName/.test(productMapper), 'product mapper must expose store name');

if (failures.length) {
  console.error('P0 commerce contract failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('P0 commerce contract passed.');
