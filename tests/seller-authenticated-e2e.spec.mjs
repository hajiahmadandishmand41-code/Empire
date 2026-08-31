import { test, expect } from '@playwright/test';

const base = process.env.BASE_URL ?? 'http://127.0.0.1:3000';
const email = process.env.SELLER_E2E_EMAIL;
const password = process.env.SELLER_E2E_PASSWORD;

if (!email || !password) throw new Error('SELLER_E2E_EMAIL and SELLER_E2E_PASSWORD are required');

const routes = ['/fa/seller','/fa/seller/products','/fa/seller/products/new','/fa/seller/inventory','/fa/seller/orders','/fa/seller/customers','/fa/seller/discounts','/fa/seller/reviews','/fa/seller/notifications','/fa/seller/wallet','/fa/seller/reports','/fa/seller/brand','/fa/seller/storefront','/fa/seller/settings'];

async function login(page) {
  await page.goto(`${base}/fa/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.locator('input[type="text"], input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('form[aria-label]').getByRole('button', { name: /ورود|login/i }).click();
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

test('seller brand page exposes the simple brand profile and product assignment flow', async ({ page }) => {
  await login(page);
  await page.goto(`${base}/fa/seller/brand`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toContainText('برند من');
  await expect(page.locator('body')).toContainText('محصولات برند');
  await expect(page.locator('input[type="file"]').first()).toHaveAttribute('accept', /image/);
  await expect(page.locator('input[disabled]').first()).toBeVisible();
  const response = await page.request.get(`${base}/api/seller/brand`);
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.ok).toBeTruthy();
  expect(body.data.id).toBeTruthy();
  expect(body.data.name).toBeTruthy();
  expect(body.data.sellerId).toBeTruthy();
});

test('seller product flow keeps brand linkage and image workflow available', async ({ page }) => {
  await login(page);
  await page.goto(`${base}/fa/seller/products/new`, { waitUntil: 'domcontentloaded' });
  const form = page.locator('form').last();
  const textInputs = form.locator('input[type="text"]');
  const numericInputs = form.locator('input[type="number"]');
  await textInputs.nth(0).fill('محصول تست فروشنده E2E');
  await form.locator('textarea').nth(0).fill('توضیح تست واقعی محصول فروشنده');
  await numericInputs.nth(0).fill('2500');
  await numericInputs.nth(2).fill('12');
  await form.locator('select').first().selectOption({ index: 0 });
  await expect(page.locator('body')).toContainText(/برند فروشگاه|برند من/);
  await expect(form.locator('input[type="file"]')).toHaveCount(1);
  await form.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/\/fa\/seller\/products(?:[/?#]|$)/, { timeout: 20000 });
  await expect(page.locator('body')).toContainText('محصول تست فروشنده E2E');
});

test('seller is blocked from admin-only area', async ({ page }) => {
  await login(page);
  const response = await page.goto(`${base}/fa/admin`, { waitUntil: 'domcontentloaded' });
  expect(response).not.toBeNull();
  expect(response.status()).toBeLessThan(500);
  await expect(page).toHaveURL(/\/fa\/(?:403|auth\/login)/);
});
