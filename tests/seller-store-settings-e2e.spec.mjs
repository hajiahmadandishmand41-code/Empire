import { test, expect } from '@playwright/test';

const base = process.env.BASE_URL ?? 'http://127.0.0.1:3000';
const email = process.env.SELLER_E2E_EMAIL;
const password = process.env.SELLER_E2E_PASSWORD;
if (!email || !password) throw new Error('SELLER_E2E_EMAIL and SELLER_E2E_PASSWORD are required');

async function login(page) {
  await page.goto(`${base}/fa/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.locator('input[type="text"], input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('form[aria-label]').getByRole('button', { name: /ورود|login/i }).click();
  await expect(page).toHaveURL(/\/fa\/seller(?:[/?#]|$)/, { timeout: 20000 });
}

test('brand route, store settings GET/PATCH and media URL persistence are healthy', async ({ page }) => {
  await login(page);

  const brandPage = await page.goto(`${base}/fa/seller/brand`, { waitUntil: 'domcontentloaded' });
  expect(brandPage?.status()).toBeLessThan(500);
  await expect(page.locator('#main')).toBeVisible();
  await expect(page.locator('body')).toContainText('برند من');

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
  expect(patchedBody.brandSynced).toBe(true);

  const media = 'https://example.com/e2e-banner.jpg';
  const mediaPatch = await page.request.patch(`${base}/api/seller/settings`, { data: { sellerBannerUrl: media } });
  expect(mediaPatch.status()).toBe(200);
  const mediaBody = await mediaPatch.json();
  expect(mediaBody.ok).toBeTruthy();
  expect(mediaBody.data.sellerBannerUrl).toBe(media);

  const invalidMedia = await page.request.patch(`${base}/api/seller/settings`, { data: { sellerBannerUrl: 'javascript:alert(1)' } });
  expect(invalidMedia.status()).toBe(422);

  const restored = await page.request.patch(`${base}/api/seller/settings`, {
    data: {
      sellerBio: originalBody.data.sellerBio ?? null,
      sellerBannerUrl: originalBody.data.sellerBannerUrl ?? null,
    },
  });
  expect(restored.status()).toBe(200);
});

test('legacy my-brand alias resolves to the canonical brand page', async ({ page }) => {
  await login(page);
  const response = await page.goto(`${base}/fa/seller/my-brand`, { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBeLessThan(400);
  await expect(page).toHaveURL(/\/fa\/seller\/brand$/);
  await expect(page.locator('body')).toContainText('برند من');
});
