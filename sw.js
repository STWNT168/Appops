// OPSLOG service worker
// Strategy: stale-while-revalidate for the app shell, so the app works offline
// AND automatically picks up new files the next time you push to the repo.
// Bump CACHE_VERSION whenever you want to force every client to fully refresh.
const CACHE_VERSION = 'opslog-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png'
];

// ---- Install: pre-cache the app shell, activate immediately ----
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// ---- Activate: drop any caches from older versions, take control now ----
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// ---- Fetch: stale-while-revalidate ----
// Serve from cache instantly if we have it, but always fetch in the background
// and update the cache — so the next load (or the reload the page triggers,
// see index.html) reflects whatever is currently live in the repo.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Don't try to cache cross-origin requests (e.g. Google Fonts) with this logic —
  // just pass them through to the network normally.
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE_VERSION).then((cache) =>
      cache.match(event.request).then((cached) => {
        const networkFetch = fetch(event.request)
          .then((response) => {
            if (response && response.status === 200) {
              cache.put(event.request, response.clone());
              // Let the page know a fresh copy of this file landed, so it can
              // offer/trigger a refresh instead of silently going stale.
              self.clients.matchAll().then((clients) => {
                clients.forEach((client) => client.postMessage({ type: 'OPSLOG_UPDATED', url: event.request.url }));
              });
            }
            return response;
          })
          .catch(() => cached); // offline fallback

        return cached || networkFetch;
      })
    )
  );
});

// Allow the page to force this worker to activate right away (used by the
// "update available" prompt in index.html).
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
