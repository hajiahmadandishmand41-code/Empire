/* ایشاپ — Service Worker
 * Network-first HTML, cache-first static assets, stale-while-revalidate images.
 * APIs/auth are never cached.
 */
const VERSION = 'v1.4.1';
const PRECACHE = `eshop-precache-${VERSION}`;
const RUNTIME_HTML = `eshop-html-${VERSION}`;
const RUNTIME_ASSETS = `eshop-assets-${VERSION}`;
const RUNTIME_IMAGES = `eshop-images-${VERSION}`;

const PRECACHE_URLS = [
  '/offline.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PRECACHE).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key.startsWith('eshop-') && ![PRECACHE, RUNTIME_HTML, RUNTIME_ASSETS, RUNTIME_IMAGES].includes(key))
        .map((key) => caches.delete(key)),
    )).then(() => self.clients.claim()),
  );
});

function isApi(request) {
  return new URL(request.url).pathname.startsWith('/api/');
}

function isHtml(request) {
  return request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html');
}

function isImage(request) {
  return request.destination === 'image';
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || isApi(request)) return;

  if (isHtml(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME_HTML).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/offline.html'))),
    );
    return;
  }

  if (isImage(request)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(RUNTIME_IMAGES).then((cache) => cache.put(request, copy));
          }
          return response;
        }).catch(() => cached);
        return cached || network;
      }),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(RUNTIME_ASSETS).then((cache) => cache.put(request, copy));
      }
      return response;
    })),
  );
});
