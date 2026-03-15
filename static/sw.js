/* ============================================================
   WFH Planner – Service Worker  (offline shell cache)
   ============================================================ */
const CACHE  = 'wfh-AUTO';   // replaced at serve-time by Flask (_assets_version)
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './favicon.svg',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window' })
        .then(clients => clients.forEach(c => c.postMessage({ type: 'SW_UPDATED' })))
      )
  );
});

self.addEventListener('fetch', e => {
  // Never intercept API calls – always go to the network
  if (e.request.url.includes('/api/')) return;
  // Never intercept cross-origin requests (CDN, fonts, etc.)
  if (!e.request.url.startsWith(self.location.origin)) return;

  if (e.request.mode === 'navigate') {
    // Network-first for page navigations
    e.respondWith(
      fetch(e.request).catch(() => caches.match('./index.html'))
    );
  } else {
    // Cache-first for static assets
    e.respondWith(
      caches.match(e.request).then(cached => cached ?? fetch(e.request))
    );
  }
});
