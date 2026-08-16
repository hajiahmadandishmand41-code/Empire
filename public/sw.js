/* Empire Shop — Service Worker (Phase 9)
 * Strategies:
 *  - HTML navigations: network-first, fallback to /offline.html
 *  - Private/auth HTML: network-only (never serve stale account/session UI)
 *  - Static /_next/static + /fonts + /icons: cache-first (immutable)
 *  - Images (same-origin + next/image): stale-while-revalidate
 *  - APIs (/api/*): network-only (never cache auth/data)
 *  - Push: shows notification and focuses/opens URL on click
 */
const VERSION = 'v1.2.0';
const PRECACHE = `empire-precache-${VERSION}`;
const RUNTIME_HTML = `empire-html-${VERSION}`;
const RUNTIME_ASSETS = `empire-assets-${VERSION}`;
const RUNTIME_IMAGES = `empire-images-${VERSION}`;

const PRECACHE_URLS = [
  '/offline.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PRECACHE);
      await Promise.all(
        PRECACHE_URLS.map(async (url) => {
          try {
            const res = await fetch(url, { cache: 'no-cache' });
            if (isCacheable(res)) await cache.put(url, res.clone());
          } catch {
            /* best-effort precache */
          }
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith('empire-') && !k.endsWith(VERSION))
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

function isCacheable(res) {
  return Boolean(
    res &&
      res.ok &&
      res.status === 200 &&
      res.type !== 'opaque' &&
      res.type !== 'opaqueredirect' &&
      !res.redirected,
  );
}

function isHTMLRequest(req) {
  return req.mode === 'navigate' || (req.method === 'GET' && req.headers.get('accept')?.includes('text/html'));
}

function isPrivateOrAuthPage(url) {
  const match = url.pathname.match(/^\/(fa|ps|en)(?:\/|$)/);
  if (!match) return false;
  const rest = url.pathname.slice(match[0].length);
  return /^(?:auth|profile|admin|seller)(?:\/|$)/.test(rest);
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/fonts/') ||
    url.pathname.startsWith('/icons/')
  );
}

function isImage(req, url) {
  return (
    req.destination === 'image' ||
    url.pathname.startsWith('/_next/image') ||
    url.pathname.startsWith('/uploads/')
  );
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Never cache APIs, including authentication/session endpoints.
  if (url.pathname.startsWith('/api/')) return;

  // Never cache authenticated or auth-flow HTML. This prevents a logged-out
  // browser from seeing stale account UI and prevents one locale/session state
  // from being reused after authentication changes.
  if (isHTMLRequest(req) && isPrivateOrAuthPage(url)) {
    event.respondWith(fetch(req));
    return;
  }

  if (isHTMLRequest(req)) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          if (isCacheable(fresh)) {
            const cache = await caches.open(RUNTIME_HTML);
            cache.put(req, fresh.clone()).catch(() => {});
          }
          return fresh;
        } catch {
          const cache = await caches.open(RUNTIME_HTML);
          const cached = await cache.match(req);
          if (cached) return cached;
          const offline = await caches.match('/offline.html');
          return offline || new Response('Offline', { status: 503, statusText: 'Offline' });
        }
      })(),
    );
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(RUNTIME_ASSETS).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;
        const fresh = await fetch(req);
        if (isCacheable(fresh)) cache.put(req, fresh.clone()).catch(() => {});
        return fresh;
      }),
    );
    return;
  }

  if (isImage(req, url)) {
    event.respondWith(
      caches.open(RUNTIME_IMAGES).then(async (cache) => {
        const cached = await cache.match(req);
        const network = fetch(req)
          .then((res) => {
            if (isCacheable(res)) cache.put(req, res.clone()).catch(() => {});
            return res;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
  }
});

/* -------- Push notifications -------- */
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'Empire Shop', body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'Empire Shop';
  const options = {
    body: data.body || '',
    icon: data.icon || '/icons/icon-192.png',
    badge: data.badge || '/icons/icon-192.png',
    dir: data.dir || 'rtl',
    lang: data.lang || 'fa-AF',
    tag: data.tag,
    data: { url: data.url || '/' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || '/';
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of all) {
        if ('focus' in client) {
          client.navigate(target).catch(() => {});
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
