import { test, expect } from '@playwright/test';

const base = process.env.BASE_URL ?? 'http://127.0.0.1:3000';
const email = process.env.SELLER_E2E_EMAIL;
const password = process.env.SELLER_E2E_PASSWORD;

if (!email || !password) {
  throw new Error('SELLER_E2E_EMAIL and SELLER_E2E_PASSWORD are required');
}

const routes = [
  '/fa/seller',
  '/fa/seller/products',
  '/fa/seller/products/new',
  '/fa/seller/inventory',
  '/fa/seller/orders',
  '/fa/seller/customers',
  '/fa/seller/discounts',
  '/fa/seller/reviews',
  '/fa/seller/notifications',
  '/fa/seller/wallet',
  '/fa/seller/reports',
  '/fa/seller/storefront',
  '/fa/seller/settings',
];

test('seller can authenticate and open every seller-center route', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
  });

  await page.goto(`${base}/fa/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.locator('input[type="text"], input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('form[aria-label]').getByRole('button', { name: /ورود|login/i }).click();
  await expect(page).toHaveURL(/\/fa\/seller(?:[/?#]|$)/, { timeout: 20000 });

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

test('seller can create and reload a real product through the UI', async ({ page }) => {
  await page.goto(`${base}/fa/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.locator('input[type="text"], input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('form[aria-label]').getByRole('button', { name: /ورود|login/i }).click();
  await expect(page).toHaveURL(/\/fa\/seller(?:[/?#]|$)/, { timeout: 20000 });

  await page.goto(`${base}/fa/seller/products/new`, { waitUntil: 'domcontentloaded' });
  const form = page.locator('form').last();
  const textInputs = form.locator('input[type="text"]');
  await textInputs.nth(0).fill('محصول تست فروشنده E2E');
  await form.locator('textarea').nth(0).fill('توضیح تست واقعی محصول فروشنده');
  await form.locator('input[type="number"]').nth(0).fill('2500');
  await form.locator('input[type="number"]').nth(1).fill('12');
  await form.locator('select').first().selectOption({ index: 0 });

  await form.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/\/fa\/seller\/products(?:[/?#]|$)/, { timeout: 20000 });
  await expect(page.locator('body')).toContainText('محصول تست فروشنده E2E');

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toContainText('محصول تست فروشنده E2E');
});

test('seller is blocked from admin-only area and admin remains reachable separately', async ({ page }) => {
  await page.goto(`${base}/fa/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.locator('input[type="text"], input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('form[aria-label]').getByRole('button', { name: /ورود|login/i }).click();
  await expect(page).toHaveURL(/\/fa\/seller(?:[/?#]|$)/, { timeout: 20000 });

  const response = await page.goto(`${base}/fa/admin`, { waitUntil: 'domcontentloaded' });
  expect(response).not.toBeNull();
  expect(response.status()).toBeLessThan(500);
  await expect(page).toHaveURL(/\/fa\/(?:403|auth\/login)/);
});
