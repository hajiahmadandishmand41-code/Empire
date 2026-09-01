#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const read = (file) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

for (const file of [
  'src/app/api/seller/upload/route.ts',
  'src/app/api/seller/products/[id]/images/route.ts',
  'src/app/api/admin/media/route.ts',
]) {
  const source = read(file);
  assert(!/video\//i.test(source), `${file}: video MIME handling must not exist`);
  assert(!/videoUrl/i.test(source), `${file}: videoUrl must not exist`);
  assert(/hasValidImageSignature|imageUploadError/.test(source), `${file}: shared image validation required`);
}

for (const file of [
  'src/types/product.ts',
  'src/lib/db-mappers.ts',
  'src/server/services/product.service.ts',
  'src/features/seller/lib/products.ts',
  'src/features/seller/components/product-form.tsx',
  'src/features/seller/components/product-images-editor.tsx',
]) {
  assert(!/videoUrl/i.test(read(file)), `${file}: legacy video field leaked`);
}

const sellerProductsApi = read('src/app/api/seller/products/route.ts');
assert(/sellerId:\s*guard\.user\.id/.test(sellerProductsApi), 'sellerId must come from session');
assert(!/body[^\n]*sellerId/.test(sellerProductsApi), 'sellerId must not come from body');
assert(/brandId, sellerId: guard\.user\.id/.test(sellerProductsApi), 'brand linkage must reach service');
assert(/seller_context_required/.test(sellerProductsApi), 'admin seller context forbidden');

const sellerProductItemApi = read('src/app/api/seller/products/[id]/route.ts');
assert(/updateProduct\(id,\{\.\.\.changes,brandId\}\)/.test(sellerProductItemApi), 'seller updates must persist brandId transactionally');
assert(/deletePersistent/.test(sellerProductItemApi), 'seller product delete must clean media');

const productRepo = read('src/server/repositories/product.repository.ts');
assert(/\$transaction\(async \(tx\)/.test(productRepo), 'product writes must use transaction');
assert(/brandId !== undefined/.test(productRepo), 'brand changes must be explicit');

const brandApi = read('src/app/api/seller/brand/route.ts');
assert(/SELECT \* FROM \\"SellerBrand\\"/.test(brandApi), 'seller brand reads must use SellerBrand');
assert(/sellerId/.test(brandApi) && /LIMIT 1/.test(brandApi), 'seller brand reads must be scoped and bounded');
assert(/UPDATE \\"SellerBrand\\"/.test(brandApi) && /isActive/.test(brandApi), 'brand lifecycle update missing');
assert(/isActive === false/.test(brandApi), 'inactive brand state must be preserved on read');

const migration = read('prisma/migrations/20260829193000_seller_store_brand/migration.sql');
assert(/SellerBrand_sellerId_key/.test(migration) && /SellerBrand_sellerId_fkey/.test(migration), 'SellerBrand ownership constraints missing');

const brandProductMigration = read('prisma/migrations/20260831170000_seller_product_brand/migration.sql');
assert(/brandId/.test(brandProductMigration) && /Product_brandId_fkey/.test(brandProductMigration) && /ON DELETE SET NULL/.test(brandProductMigration), 'optional product brand FK missing');

const brandPage = read('src/app/[locale]/brands/[slug]/page.tsx');
assert(/SellerBrand/.test(brandPage) && /sellerId/.test(brandPage), 'independent brand page missing');

const productMapper = read('src/lib/db-mappers.ts');
assert(/sellerName:\s*p\.seller\?\.fullName/.test(productMapper) && /sellerShopName:\s*p\.seller\?\.sellerShopName/.test(productMapper), 'seller/store context missing');

if (failures.length) {
  console.error('P0 commerce contract failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log('P0 commerce contract passed.');
