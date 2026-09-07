# Seller E2E result

- Commit: 1e13d9decea2e0fb2da5255663b2a814adee6ef2
- Authenticated UI smoke exit: 1
- Deep seller-center E2E exit: 1
- Store settings E2E exit: 0
- Overall: FAIL

## Authenticated UI smoke
Running 5 tests using 1 worker

[1/5] [seller-setup] › tests/auth.setup.mjs:14:1 › authenticate seller
[2/5] [seller-e2e] › tests/seller-authenticated-e2e.spec.mjs:18:1 › seller can authenticate and open every seller-center route
  1) [seller-e2e] › tests/seller-authenticated-e2e.spec.mjs:18:1 › seller can authenticate and open every seller-center route 

    Error: expect(locator).toBeVisible() failed

    Locator: locator('#main')
    Expected: visible
    Error: strict mode violation: locator('#main') resolved to 2 elements:
        1) <main id="main" class="flex-1 p-4 sm:p-6">…</main> aka getByRole('main')
        2) <main id="main" class="flex-1 p-4 sm:p-6">…</main> aka locator('main').filter({ hasText: 'در حال بارگذاری…' })

    Call log:
      - Expect "toBeVisible" with timeout 10000ms
      - waiting for locator('#main')


      26 |     expect(response, `missing response for ${route}`).not.toBeNull();
      27 |     expect(response.status(), `HTTP failure for ${route}`).toBeLessThan(500);
    > 28 |     await expect(page.locator('#main')).toBeVisible({ timeout: 10000 });
         |                                         ^
      29 |     await expect(page.locator('body')).not.toContainText('Internal Server Error');
      30 |     await expect(page.locator('body')).not.toContainText('Application error');
      31 |     expect(errors, `runtime errors on ${route}`).toEqual([]);
        at /home/runner/work/Empire/Empire/tests/seller-authenticated-e2e.spec.mjs:28:41

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    test-results/seller-authenticated-e2e-s-78102-n-every-seller-center-route-seller-e2e/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: test-results/seller-authenticated-e2e-s-78102-n-every-seller-center-route-seller-e2e/error-context.md

    attachment #3: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/seller-authenticated-e2e-s-78102-n-every-seller-center-route-seller-e2e/trace.zip
    Usage:

        npx playwright show-trace test-results/seller-authenticated-e2e-s-78102-n-every-seller-center-route-seller-e2e/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────


[3/5] [seller-e2e] › tests/seller-authenticated-e2e.spec.mjs:35:1 › removed brand routes are no longer exposed
[4/5] [seller-e2e] › tests/seller-authenticated-e2e.spec.mjs:44:1 › seller product flow is available
[5/5] [seller-e2e] › tests/seller-authenticated-e2e.spec.mjs:68:1 › seller is blocked from admin-only area
  1 failed
    [seller-e2e] › tests/seller-authenticated-e2e.spec.mjs:18:1 › seller can authenticate and open every seller-center route 
  4 passed (9.0s)

## Deep seller-center E2E
Running 7 tests using 1 worker

[1/7] [seller-setup] › tests/auth.setup.mjs:14:1 › authenticate seller
[2/7] [seller-e2e] › tests/seller-center-deep-e2e.spec.mjs:39:3 › Seller Center — deep end-to-end › authentication and every seller route are healthy
  1) [seller-e2e] › tests/seller-center-deep-e2e.spec.mjs:39:3 › Seller Center — deep end-to-end › authentication and every seller route are healthy 

    Error: runtime errors on /fa/seller/orders

    expect(received).toEqual(expected) // deep equality

    - Expected  - 1
    + Received  + 3

    - Array []
    + Array [
    +   "console: Failed to load resource: the server responded with a status of 404 (Not Found)",
    + ]

      47 |       await expect(page.locator('body')).not.toContainText('Internal Server Error');
      48 |       await expect(page.locator('body')).not.toContainText('Application error');
    > 49 |       expect(errors, `runtime errors on ${route}`).toEqual([]);
         |                                                    ^
      50 |     }
      51 |   });
      52 |
        at /home/runner/work/Empire/Empire/tests/seller-center-deep-e2e.spec.mjs:49:52

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    test-results/seller-center-deep-e2e-Sel-0e4c2-ry-seller-route-are-healthy-seller-e2e/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: test-results/seller-center-deep-e2e-Sel-0e4c2-ry-seller-route-are-healthy-seller-e2e/error-context.md

    attachment #3: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/seller-center-deep-e2e-Sel-0e4c2-ry-seller-route-are-healthy-seller-e2e/trace.zip
    Usage:

        npx playwright show-trace test-results/seller-center-deep-e2e-Sel-0e4c2-ry-seller-route-are-healthy-seller-e2e/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────


[3/7] [seller-e2e] › tests/seller-center-deep-e2e.spec.mjs:53:3 › Seller Center — deep end-to-end › all seller APIs are authenticated and return non-5xx responses
[seller-e2e] › tests/seller-center-deep-e2e.spec.mjs:53:3 › Seller Center — deep end-to-end › all seller APIs are authenticated and return non-5xx responses
PASS API 200 /api/auth/me

PASS API 200 /api/seller/dashboard

PASS API 200 /api/seller/products

PASS API 200 /api/seller/inventory

PASS API 200 /api/seller/orders

PASS API 200 /api/seller/customers

PASS API 200 /api/seller/discounts

PASS API 200 /api/seller/reviews

PASS API 200 /api/seller/notifications

PASS API 200 /api/seller/payments

PASS API 200 /api/seller/payouts

PASS API 200 /api/seller/reports

PASS API 200 /api/seller/settings

PASS API 200 /api/seller/profile

[4/7] [seller-e2e] › tests/seller-center-deep-e2e.spec.mjs:65:3 › Seller Center — deep end-to-end › product create, edit, list and delete are seller-scoped
[5/7] [seller-e2e] › tests/seller-center-deep-e2e.spec.mjs:145:3 › Seller Center — deep end-to-end › invalid image upload is rejected and admin APIs are forbidden
[6/7] [seller-e2e] › tests/seller-center-deep-e2e.spec.mjs:159:3 › Seller Center — deep end-to-end › seller storefront route remains accessible
[7/7] [seller-e2e] › tests/seller-center-deep-e2e.spec.mjs:165:3 › Seller Center — deep end-to-end › seller logout invalidates access
  1 failed
    [seller-e2e] › tests/seller-center-deep-e2e.spec.mjs:39:3 › Seller Center — deep end-to-end › authentication and every seller route are healthy 
  6 passed (11.2s)

## Store settings E2E
Running 3 tests using 1 worker

[1/3] [seller-setup] › tests/auth.setup.mjs:14:1 › authenticate seller
[2/3] [seller-e2e] › tests/seller-store-settings-e2e.spec.mjs:15:1 › store settings GET/PATCH and media URL validation are healthy
[3/3] [seller-e2e] › tests/seller-store-settings-e2e.spec.mjs:54:1 › removed seller brand routes are not exposed
  3 passed (5.0s)

## Server log tail
▲ Next.js 16.3.1
- Local:         http://localhost:3000
- Network:       http://0.0.0.0:3000
✓ Ready in 0ms
✓ Running next.config took 4ms
{"ts":"2026-09-07T13:23:25.815Z","level":"info","msg":"seller.product.created","productId":"cmtr9u3u90004jljeg78pee02","sellerId":"cmtr9rruk00002gotv8n8tlkc","slug":"mhswl-tst-frwshndh-e2e-1788787405350","imageCount":0}
{"ts":"2026-09-07T13:23:35.785Z","level":"info","msg":"seller.product.created","productId":"cmtr9ubj8000bjljeawxm3eqf","sellerId":"cmtr9rruk00002gotv8n8tlkc","slug":"e2e-seller-product-1788787415760","imageCount":0}
{"ts":"2026-09-07T13:23:36.436Z","level":"info","msg":"seller.product.deleted","productId":"cmtr9ubj8000bjljeawxm3eqf","sellerId":"cmtr9rruk00002gotv8n8tlkc","mediaCount":3}

