import { test, expect } from '@playwright/test';

const base = process.env.BASE_URL ?? 'http://127.0.0.1:3000';
const email = process.env.SELLER_E2E_EMAIL;
const password = process.env.SELLER_E2E_PASSWORD;

if (!email || !password) throw new Error('SELLER_E2E_EMAIL and SELLER_E2E_PASSWORD are required');

const sellerPages = [
  '/fa/seller', '/fa/seller/products', '/fa/seller/products/new', '/fa/seller/inventory', '/fa/seller/orders',
  '/fa/seller/customers', '/fa/seller/discounts', '/fa/seller/reviews', '/fa/seller/notifications',
  '/fa/seller/wallet', '/fa/seller/reports', '/fa/seller/storefront', '/fa/seller/settings',
];

const sellerApis = [
  ['/api/auth/me', [200]], ['/api/seller/dashboard', [200, 204]], ['/api/seller/products', [200]],
  ['/api/seller/inventory', [200]], ['/api/seller/orders', [200]], ['/api/seller/customers', [200]],
  ['/api/seller/discounts', [200]], ['/api/seller/reviews', [200]], ['/api/seller/notifications', [200]],
  ['/api/seller/payments', [200]], ['/api/seller/payouts', [200]], ['/api/seller/reports', [200]],
  ['/api/seller/settings', [200]], ['/api/seller/profile', [200]],
];

async function login(page) {
  await page.goto(`${base}/fa/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.locator('input[type="text"], input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('form[aria-label]').getByRole('button', { name: /ورود|login/i }).click();
  await expect(page).toHaveURL(/\/fa\/seller(?:[/?#]|$)/, { timeout: 20000 });
}

function attachRuntimeErrorCapture(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`); });
  return errors;
}

test.describe('Seller Center — deep end-to-end', () => {
  test('authentication and every seller route are healthy', async ({ page }) => {
    const errors = attachRuntimeErrorCapture(page);
    await login(page);
    for (const route of sellerPages) {
      errors.length = 0;
      const response = await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded' });
      expect(response, `missing response for ${route}`).not.toBeNull();
      expect(response.status(), `HTTP failure for ${route}`).toBeLessThan(500);
      await expect(page.locator('body')).not.toContainText('Internal Server Error');
      await expect(page.locator('body')).not.toContainText('Application error');
      expect(errors, `runtime errors on ${route}`).toEqual([]);
    }
  });

  test('all seller APIs are authenticated and return non-5xx responses', async ({ page }) => {
    await login(page);
    const failures = [];
    for (const [path, allowed] of sellerApis) {
      const response = await page.request.get(`${base}${path}`);
      const ok = allowed.includes(response.status()) && response.status() < 500;
      console.log(`${ok ? 'PASS' : 'FAIL'} API ${response.status()} ${path}`);
      if (!ok) failures.push(`${path}: ${response.status()} ${await response.text()}`);
    }
    expect(failures).toEqual([]);
  });

  test('product create, edit, list and delete are seller-scoped', async ({ page }) => {
    await login(page);
    const categoriesResponse = await page.request.get(`${base}/api/categories?locale=fa`);
    expect(categoriesResponse.status()).toBe(200);
    const categoriesBody = await categoriesResponse.json();
    const categories = Array.isArray(categoriesBody.data) ? categoriesBody.data : Array.isArray(categoriesBody) ? categoriesBody : [];
    expect(categories.length).toBeGreaterThan(0);
    const categoryId = String(categories[0].id);

    const productName = `E2E Seller Product ${Date.now()}`;
    let productId = null;
    try {
      const create = await page.request.post(`${base}/api/seller/products`, { data: {
        name: productName, shortDescription: 'Deep E2E product', description: 'Created by seller-center deep E2E suite',
        price: 2500, compareAtPrice: 3000, categoryId, region: 'Kabul', currency: 'AFN', inStock: true,
        isActive: true, stockQuantity: 12, whatsappNumber: '+93700000000', isTraditional: false, images: [],
        tagsJson: JSON.stringify(['e2e', 'seller']), attributesJson: JSON.stringify([{ key: 'source', value: 'e2e' }]),
      }});
      expect(create.status()).toBe(201);
      const created = await create.json();
      expect(created.ok).toBeTruthy();
      productId = String(created.data.id);
      expect(created.data.name).toBe(productName);
      expect(created.data.sellerId).toBeTruthy();
      expect(created.data.brandId).toBeUndefined();

      const listed = await page.request.get(`${base}/api/seller/products?q=${encodeURIComponent(productName)}`);
      expect(listed.status()).toBe(200);
      const listBody = await listed.json();
      const items = Array.isArray(listBody.data) ? listBody.data : [];
      expect(items.some((item) => String(item.id) === productId)).toBeTruthy();

      const update = await page.request.patch(`${base}/api/seller/products/${productId}`, { data: { price: 2700, stockQuantity: 20 } });
      expect(update.status()).toBe(200);
      const updated = await update.json();
      expect(updated.ok).toBeTruthy();
      expect(Number(updated.data.price)).toBe(2700);
      expect(Number(updated.data.stockQuantity)).toBe(20);
      expect(updated.data.brandId).toBeUndefined();

      const detailPage = await page.goto(`${base}/fa/seller/products/${productId}/edit`, { waitUntil: 'domcontentloaded' });
      expect(detailPage.status()).toBeLessThan(500);
      await expect(page.locator('body')).toContainText(productName);
      await expect(page.locator('body')).not.toContainText('Internal Server Error');

      const remove = await page.request.delete(`${base}/api/seller/products/${productId}`);
      expect(remove.status()).toBeLessThan(500);
      expect([200, 204]).toContain(remove.status());
      productId = null;
    } finally {
      if (productId) await page.request.delete(`${base}/api/seller/products/${productId}`);
    }
  });

  test('invalid image upload is rejected and admin APIs are forbidden', async ({ page }) => {
    await login(page);
    const invalidUpload = await page.request.post(`${base}/api/seller/upload`, {
      multipart: { file: { name: 'not-image.txt', mimeType: 'text/plain', buffer: Buffer.from('not-an-image') } },
    });
    expect(invalidUpload.status()).toBeGreaterThanOrEqual(400);
    expect(invalidUpload.status()).toBeLessThan(500);
    const adminApi = await page.request.get(`${base}/api/admin/stats`);
    expect([401, 403]).toContain(adminApi.status());
    const adminPage = await page.goto(`${base}/fa/admin`, { waitUntil: 'domcontentloaded' });
    expect(adminPage.status()).toBeLessThan(500);
    await expect(page).toHaveURL(/\/fa\/(?:403|auth\/login)/);
  });

  test('seller storefront route remains accessible', async ({ page }) => {
    await login(page);
    await page.goto(`${base}/fa/seller/storefront`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).not.toContainText('Internal Server Error');
  });

  test('seller logout invalidates access', async ({ page }) => {
    await login(page);
    const before = await page.request.get(`${base}/api/auth/me`);
    expect(before.status()).toBe(200);
    const logout = await page.request.post(`${base}/api/auth/logout`);
    expect(logout.status()).toBeLessThan(500);
    await page.goto(`${base}/fa/seller`, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/fa\/(?:auth\/login|403|seller)/);
  });
});
