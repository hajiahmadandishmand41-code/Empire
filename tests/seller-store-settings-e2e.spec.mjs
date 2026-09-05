import { test, expect } from '@playwright/test';

const base = process.env.BASE_URL ?? 'http://localhost:3000';
const email = process.env.SELLER_E2E_EMAIL;
const password = process.env.SELLER_E2E_PASSWORD;
if (!email || !password) throw new Error('SELLER_E2E_EMAIL and SELLER_E2E_PASSWORD are required');

async function login(page) {
  // The session is restored from the shared storageState (see auth.setup.mjs);
  // entering the Seller Center must not bounce to the login page.
  await page.goto(`${base}/fa/seller`, { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/fa\/seller(?:[/?#]|$)/, { timeout: 20000 });
}

test('store settings GET/PATCH and media URL validation are healthy', async ({ page }) => {
  await login(page);
  const settingsPage = await page.goto(`${base}/fa/seller/settings`, { waitUntil: 'domcontentloaded' });
  expect(settingsPage?.status()).toBeLessThan(500);
  await expect(page.locator('#main')).toBeVisible();
  await expect(page.getByRole('button', { name: /ذخیره تنظیمات فروشگاه/ })).toBeVisible();

  const original = await page.request.get(`${base}/api/seller/settings`);
  expect(original.status()).toBe(200);
  const originalBody = await original.json();
  expect(originalBody.ok).toBeTruthy();

  const marker = `E2E-${Date.now()}`;
  const patch = await page.request.patch(`${base}/api/seller/settings`, { data: { sellerBio: marker } });
  expect(patch.status()).toBe(200);
  const patchedBody = await patch.json();
  expect(patchedBody.ok).toBeTruthy();
  expect(patchedBody.data.sellerBio).toBe(marker);
  expect(patchedBody.data.brandSynced).toBeUndefined();

  const media = 'https://example.com/e2e-banner.jpg';
  const mediaPatch = await page.request.patch(`${base}/api/seller/settings`, { data: { sellerBannerUrl: media } });
  expect(mediaPatch.status()).toBe(200);
  const mediaBody = await mediaPatch.json();
  expect(mediaBody.ok).toBeTruthy();
  expect(mediaBody.data.sellerBannerUrl).toBe(media);

  const invalidMedia = await page.request.patch(`${base}/api/seller/settings`, { data: { sellerBannerUrl: 'ftp://example.com/banner.jpg' } });
  expect(invalidMedia.status()).toBe(422);

  const restored = await page.request.patch(`${base}/api/seller/settings`, {
    data: {
      sellerBio: originalBody.data.sellerBio ?? null,
      sellerBannerUrl: originalBody.data.sellerBannerUrl ?? null,
    },
  });
  expect(restored.status()).toBe(200);
});

test('removed seller brand routes are not exposed', async ({ page }) => {
  await login(page);
  for (const route of ['/fa/seller/brand', '/fa/seller/my-brand']) {
    const response = await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(404);
  }
});
