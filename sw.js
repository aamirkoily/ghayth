// Offline support: the app shell and 2025 weather are cached, so the page works with no signal.
const CACHE = 'ghayth-v6';
const SHELL = ['./', 'index.html', 'css/style.css', 'js/engine.js', 'js/messages.js', 'js/app.js', 'js/extras.js', 'js/business.js', 'js/tour.js', 'js/i18n.js', 'vendor/qrcode.min.js', 'data/weather2025.js',
  'vendor/chart.umd.min.js', 'assets/icon.svg', 'manifest.webmanifest'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.hostname.endsWith('open-meteo.com')) return; // the app handles forecast caching itself
  // Network first for our files (fresh when online), cache fallback when offline. Fonts are cached as they load.
  e.respondWith(
    fetch(e.request).then((res) => {
      if (res.ok && (url.origin === location.origin || url.hostname.includes('fonts.g'))) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match(e.request).then((r) => r || caches.match('index.html')))
  );
});
