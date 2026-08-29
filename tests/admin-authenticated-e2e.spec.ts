import { expect, test } from '@playwright/test';

const base = 'http://127.0.0.1:3000';
const routes = [
  '/fa/admin',
  '/fa/admin/products',
  '/fa/admin/categories',
  '/fa/admin/orders',
  '/fa/admin/sellers',
  '/fa/admin/users',
  '/fa/admin/shipping-methods',
  '/fa/admin/payments',
  '/fa/admin/payouts',
  '/fa/admin/reports',
  '/fa/admin/reviews',
  '/fa/admin/media',
  '/fa/admin/banners',
  '/fa/admin/marketplace',
  '/fa/admin/analytics',
  '/fa/admin/audit',
  '/fa/admin/notifications',
  '/fa/admin/roles',
  '/fa/admin/search',
];

test('admin can authenticate and browse every admin section', async ({ page }) => {
  await page.goto(`${base}/fa/auth/login`, { waitUntil: 'networkidle' });
  await expect(page.locator('form[aria-label]').first()).toBeVisible();

  await page.locator('input[autocomplete="username"]').fill(process.env.ADMIN_SEED_EMAIL ?? 'admin2@empire.shop');
  await page.locator('input[autocomplete="current-password"]').fill(process.env.ADMIN_SEED_PASSWORD ?? '');
  await page.getByRole('button', { name: /ورود|login/i }).click();
  await page.waitForURL('**/fa/admin**', { timeout: 15000 });
  await expect(page).toHaveURL(/\/fa\/admin/);

  for (const route of routes) {
    await page.goto(`${base}${route}`, { waitUntil: 'networkidle' });
    expect(page.url()).not.toContain('/auth/login');
    expect(await page.locator('body').innerText()).not.toMatch(/Application error|Internal Server Error|NEXT_HTTP_ERROR_FALLBACK/i);
  }

  await page.goto(`${base}/fa/admin/categories`, { waitUntil: 'networkidle' });
  await expect(page.getByText('دسته‌بندی فروشگاه')).toBeVisible();
  const categoryImages = page.locator('img[src]');
  await expect(categoryImages).toHaveCount(10, { timeout: 10000 });
});

test('admin shell remains usable on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/fa/auth/login`, { waitUntil: 'networkidle' });
  await page.locator('input[autocomplete="username"]').fill(process.env.ADMIN_SEED_EMAIL ?? 'admin2@empire.shop');
  await page.locator('input[autocomplete="current-password"]').fill(process.env.ADMIN_SEED_PASSWORD ?? '');
  await page.getByRole('button', { name: /ورود|login/i }).click();
  await page.waitForURL('**/fa/admin**', { timeout: 15000 });
  await expect(page.getByRole('button', { name: /منوی مدیریت|menu/i })).toBeVisible();
  await page.getByRole('button', { name: /منوی مدیریت|menu/i }).click();
  await expect(page.getByRole('dialog', { name: 'منوی مدیریت' })).toBeVisible();
});
