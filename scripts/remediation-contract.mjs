#!/usr/bin/env node

/**
 * Empire production-remediation contract.
 * Read-only structural checks for the six-stage hardening pass.
 * It intentionally validates existing production paths instead of changing runtime behavior.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const has = (file, pattern) => pattern.test(read(file));

// Stage 2 — media/storage boundary
if (!has('src/app/api/admin/media/route.ts', /hasValidSignature/)) failures.push('Stage 2: admin media signature validation is missing.');
if (!has('src/app/api/admin/media/route.ts', /MAX_IMAGE_BYTES/)) failures.push('Stage 2: image size limit contract is missing.');
if (!has('src/app/api/admin/media/route.ts', /deletePersistent\(uploadedUrl\)/)) failures.push('Stage 2: orphan cleanup contract is missing.');

// Stage 3 — order/data integrity
if (!has('src/app/api/orders/route.ts', /idempotentReference/)) failures.push('Stage 3: deterministic idempotency reference is missing.');
if (!has('src/app/api/orders/route.ts', /const createdBase = await prisma\.\$transaction/)) failures.push('Stage 3: order creation is not transaction-protected.');
if (!has('src/app/api/orders/route.ts', /p\.price\.mul\(item\.quantity\)/)) failures.push('Stage 3: server-side product pricing contract is missing.');

// Stage 4 — seller ownership isolation
if (!has('src/lib/orders/order-engine.ts', /sellerOrderBelongsToSeller/)) failures.push('Stage 4: seller-order ownership helper is missing.');
if (!has('src/lib/orders/order-engine.ts', /WHERE "orderId" = \$\{orderId\} AND "sellerId" = \$\{sellerId\}/)) failures.push('Stage 4: seller order query is not seller-scoped.');

// Stage 5 — admin authorization + auditability
if (!has('src/app/api/admin/media/route.ts', /requireAdminApi\('media\.manage'\)/)) failures.push('Stage 5: admin media authorization contract is missing.');
if (!has('src/lib/db.ts', /isDatabaseConfigured/)) failures.push('Stage 5: database readiness boundary is missing.');

// Stage 6 — UI/data resilience
if (!has('src/features/home/lib/homepage-data.ts', /if \(!isDatabaseConfigured\(\)\) return EMPTY_HOME_DATA/)) failures.push('Stage 6: homepage DB fail-closed guard is missing.');
if (!has('src/features/home/components/categories-section.tsx', /if \(!isDatabaseConfigured\(\)\) return null/)) failures.push('Stage 6: category section fail-closed guard is missing.');

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  stages: [2, 3, 4, 5, 6],
  checks: 12,
  message: 'Six-stage remediation contract passed structural verification.'
}, null, 2));
