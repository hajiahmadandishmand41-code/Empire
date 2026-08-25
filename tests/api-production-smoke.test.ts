import { describe, expect, it } from 'vitest';

const base = (process.env.E2E_BASE_URL || process.env.PRODUCTION_URL || '').replace(/\/$/, '');
const shouldRun = Boolean(base);

async function expectStatus(path: string, status: number) {
  const response = await fetch(`${base}${path}`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  });
  expect(response.status, `${path} returned ${response.status}`).toBe(status);
  return response;
}

describe.skipIf(!shouldRun)('API production smoke contract', () => {
  it('serves liveness and readiness endpoints', async () => {
    await expectStatus('/api/health', 200);
    await expectStatus('/api/healthz', 200);
  });

  it('serves a product listing with the stable API envelope', async () => {
    const response = await expectStatus('/api/products?limit=1', 200);
    const payload = await response.json() as { data?: unknown };
    expect(payload).toHaveProperty('data');
  });
});
