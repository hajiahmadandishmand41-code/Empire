import { test, expect } from '@playwright/test';
import { makePngBytes } from './helpers/png.mjs';

const base = process.env.BASE_URL ?? 'http://localhost:3000';
const email = process.env.SELLER_E2E_EMAIL;
const password = process.env.SELLER_E2E_PASSWORD;
if (!email || !password) throw new Error('SELLER_E2E_EMAIL and SELLER_E2E_PASSWORD are required');

const routes = ['/fa/seller','/fa/seller/products','/fa/seller/products/new','/fa/seller/inventory','/fa/seller/orders','/fa/seller/customers','/fa/seller/discounts','/fa/seller/reviews','/fa/seller/notifications','/fa/seller/wallet','/fa/seller/reports','/fa/seller/storefront','/fa/seller/settings'];

async function login(page) {
  // The session is restored from the shared storageState (see auth.setup.mjs);
  // entering the Seller Center must not bounce to the login page.
  await page.goto(`${base}/fa/seller`, { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/fa\/seller(?:[/?#]|$)/, { timeout: 20000 });
}

test('seller can authenticate and open every seller-center route', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`); });
  await login(page);
  for (const route of routes) {
    errors.length = 0;
    const response = await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded' });
    expect(response, `missing response for ${route}`).not.toBeNull();
    expect(response.status(), `HTTP failure for ${route}`).toBeLessThan(500);
    await expect(page.locator('#main')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('body')).not.toContainText('Internal Server Error');
    await expect(page.locator('body')).not.toContainText('Application error');
    expect(errors, `runtime errors on ${route}`).toEqual([]);
  }
});

test('removed brand routes are no longer exposed', async ({ page }) => {
  await login(page);
  for (const route of ['/fa/seller/brand','/fa/seller/my-brand']) {
    const response = await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded' });
    expect(response).not.toBeNull();
    expect(response.status()).toBe(404);
  }
});

test('seller product flow is available', async ({ page }) => {
  await login(page);
  await page.goto(`${base}/fa/seller/products/new`, { waitUntil: 'domcontentloaded' });
  const form = page.locator('form').last();
  const productName = `محصول تست فروشنده E2E ${Date.now()}`;
  await form.getByLabel(/نام محصول/).fill(productName);
  await form.getByLabel(/توضیح کوتاه/).fill('توضیح تست واقعی محصول فروشنده');
  await form.getByLabel(/قیمت فعلی/).fill('2500');
  await form.getByLabel(/^موجودی/).fill('12');
  // First option is the empty placeholder — pick the first real category.
  await form.locator('select').first().selectOption({ index: 1 });
  await expect(form.locator('input[type="file"]')).toHaveCount(1);
  // Activation requires 3 images; attach them through the real upload pipeline.
  const png = makePngBytes();
  await form.locator('input[type="file"]').setInputFiles([
    { name: 'e2e-1.png', mimeType: 'image/png', buffer: png },
    { name: 'e2e-2.png', mimeType: 'image/png', buffer: png },
    { name: 'e2e-3.png', mimeType: 'image/png', buffer: png },
  ]);
  await form.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/\/fa\/seller\/products(?:[/?#]|$)/, { timeout: 45000 });
  await expect(page.locator('body')).toContainText(productName, { timeout: 15000 });
});

test('seller is blocked from admin-only area', async ({ page }) => {
  await login(page);
  const response = await page.goto(`${base}/fa/admin`, { waitUntil: 'domcontentloaded' });
  expect(response).not.toBeNull();
  expect(response.status()).toBeLessThan(500);
  await expect(page).toHaveURL(/\/fa\/(?:403|auth\/login)/);
});
