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
assert(/createProduct\(\{\s*\.\.\.productInput, brandId, sellerId: guard\.user\.id\s*\}\)/.test(sellerProductsApi), 'seller product creation must pass brand linkage into the transactional service');
assert(/guard\.user\.role === 'admin'.*seller_context_required/.test(sellerProductsApi), 'seller product creation must not create products owned by the admin account');

const sellerProductItemApi = read('src/app/api/seller/products/[id]/route.ts');
assert(/updateProduct\(id,\{\.\.\.changes,brandId\}\)/.test(sellerProductItemApi), 'seller product updates must persist brand linkage through the service transaction');
assert(!/UPDATE \\"Product\\" SET \\"brandId\\"=.*guard\.user\.id/.test(sellerProductItemApi), 'seller product update must not use a second non-transactional brand write');
assert(/deletePersistent/.test(sellerProductItemApi), 'seller product hard delete must attempt media cleanup');

const productRepo = read('src/server/repositories/product.repository.ts');
assert(/this\.prisma\.\$transaction\(async \(tx\) =>/.test(productRepo), 'product create/update must use DB transactions');
assert(/if \(brandId !== undefined\)/.test(productRepo), 'product repository must persist explicit brand changes atomically');

const brandApi = read('src/app/api/seller/brand/route.ts');
assert(/if \(existing\[0\]\) return existing\[0\]/.test(brandApi), 'seller brand reads must preserve an existing inactive brand');
assert(!/existing\[0]\.isActive === false.*isActive.*true/.test(brandApi), 'seller brand reads must not silently reactivate deactivated brands');
assert(/UPDATE \"SellerBrand\" SET \"isActive\"=true/.test(brandApi), 'brand reactivation must be an explicit POST action');

const migration = read('prisma/migrations/20260829193000_seller_store_brand/migration.sql');
assert(/CREATE UNIQUE INDEX IF NOT EXISTS "SellerBrand_sellerId_key"/.test(migration), 'DB must enforce one SellerBrand per seller');
assert(/CONSTRAINT "SellerBrand_sellerId_fkey"/.test(migration), 'SellerBrand must be FK-linked to User');

const brandProductMigration = read('prisma/migrations/20260831170000_seller_product_brand/migration.sql');
assert(/ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "brandId" TEXT/.test(brandProductMigration), 'Product must persist optional brandId');
assert(/Product_brandId_fkey/.test(brandProductMigration), 'Product.brandId must be FK-linked to SellerBrand');
assert(/ON DELETE SET NULL/.test(brandProductMigration), 'deleting a brand must not orphan product foreign keys');

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
