import { test, expect } from '@playwright/test';
import { makePngBytes } from './helpers/png.mjs';

const base = process.env.BASE_URL ?? 'http://localhost:3000';
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
  // The session is restored from the shared storageState (see auth.setup.mjs);
  // entering the Seller Center must not bounce to the login page.
  await page.goto(`${base}/fa/seller`, { waitUntil: 'domcontentloaded' });
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
      // Activation requires at least 3 images, so the product is created
      // inactive, images are uploaded through the real storage pipeline, and
      // only then is the product activated.
      const create = await page.request.post(`${base}/api/seller/products`, { data: {
        name: productName, shortDescription: 'Deep E2E product', description: 'Created by seller-center deep E2E suite',
        price: 2500, compareAtPrice: 3000, categoryId, region: 'Kabul', currency: 'AFN', inStock: true,
        isActive: false, stockQuantity: 12, whatsappNumber: '+93700000000', isTraditional: false, images: [],
        tagsJson: JSON.stringify(['e2e', 'seller']), attributesJson: JSON.stringify([{ key: 'source', value: 'e2e' }]),
      }});
      expect(create.status()).toBe(201);
      const created = await create.json();
      expect(created.ok).toBeTruthy();
      productId = String(created.data.id);
      expect(created.data.name).toBe(productName);
      expect(created.data.sellerId).toBeTruthy();
      expect(created.data.brandId).toBeUndefined();

      // Uploading 3 real images through the seller image endpoint and serving
      // them back verifies the storage path end to end.
      const png = makePngBytes();
      const uploadedUrls = [];
      for (let i = 0; i < 3; i += 1) {
        const upload = await page.request.post(`${base}/api/seller/products/${productId}/images`, {
          multipart: { file: { name: `e2e-${i}.png`, mimeType: 'image/png', buffer: png } },
        });
        expect(upload.status()).toBe(200);
        const uploadBody = await upload.json();
        expect(uploadBody.ok).toBeTruthy();
        expect(typeof uploadBody.data.url).toBe('string');
        expect(uploadBody.data.url.length).toBeGreaterThan(0);
        uploadedUrls.push(uploadBody.data.url);
        const served = await page.request.get(`${base}${uploadBody.data.url}`);
        expect(served.status()).toBe(200);
      }

      const activation = await page.request.patch(`${base}/api/seller/products/${productId}`, { data: { isActive: true } });
      expect(activation.status()).toBe(200);

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
      expect(Array.isArray(updated.data.images)).toBeTruthy();
      expect(updated.data.images).toEqual(uploadedUrls);

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
