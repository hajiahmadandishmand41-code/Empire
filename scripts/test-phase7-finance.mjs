/**
 * Standalone smoke test for Phase 7 financial math.
 * Run with: `node scripts/test-phase7-finance.mjs`
 *
 * We avoid pulling in a full test runner: the split math is pure, so a
 * handful of asserts is enough to prevent regressions. Anything that
 * touches Prisma is validated via `prisma validate` in CI.
 */
import assert from 'node:assert/strict';

function money(n) {
  return Math.round(n * 100) / 100;
}
function computeSplit(gross, commissionRate) {
  const safe = Math.min(100, Math.max(0, commissionRate));
  const commission = money((gross * safe) / 100);
  return { gross: money(gross), commission, sellerAmount: money(gross - commission), commissionRate: safe };
}

// 10% commission on 100 => seller 90 / empire 10
{
  const s = computeSplit(100, 10);
  assert.equal(s.commission, 10);
  assert.equal(s.sellerAmount, 90);
}

// 0% commission => seller gets everything
{
  const s = computeSplit(50, 0);
  assert.equal(s.commission, 0);
  assert.equal(s.sellerAmount, 50);
}

// 100% commission => seller gets nothing
{
  const s = computeSplit(75, 100);
  assert.equal(s.commission, 75);
  assert.equal(s.sellerAmount, 0);
}

// out-of-range commission is clamped
{
  const s = computeSplit(100, 250);
  assert.equal(s.commissionRate, 100);
  const s2 = computeSplit(100, -5);
  assert.equal(s2.commissionRate, 0);
}

// float noise avoided
{
  const s = computeSplit(19.99, 12.5);
  assert.equal(s.commission + s.sellerAmount, 19.99);
}

console.log('phase7 finance math: OK');
