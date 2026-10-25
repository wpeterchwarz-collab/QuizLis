/* QuizLis Service Worker – macht die App offline-fähig.
   VERSION muss mit APP_VERSION in js/core.js übereinstimmen (wird per Test geprüft).
   Jede neue Version lädt alle Dateien frisch und aktualisiert die App beim Nutzer. */
const VERSION = '1.3.0';
const CACHE = `quizlis-v${VERSION}`;
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './js/core.js',
  './js/library.js',
  './js/main.js',
  './js/ocr.js',
  './js/store.js',
  './js/ui.js',
  './js/util.js',
  './js/views/cards.js',
  './js/views/common.js',
  './js/views/edit.js',
  './js/views/games.js',
  './js/views/home.js',
  './js/views/learn.js',
  './js/views/library.js',
  './js/views/match.js',
  './js/views/set.js',
  './js/views/settings.js',
  './js/views/test.js',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
/* Erst aus dem Cache liefern (schnell & offline), im Hintergrund aktualisieren */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(req, { ignoreSearch: true });
    const network = fetch(req).then(res => { if (res && res.ok) cache.put(req, res.clone()); return res; }).catch(() => null);
    if (cached) { e.waitUntil(network); return cached; }
    return (await network) || (req.mode === 'navigate' ? cache.match('./index.html') : Response.error());
  }));
});
