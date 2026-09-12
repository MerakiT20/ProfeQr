const CACHE_VERSION = 'profeqr-v8-8-stable';
const APP_SHELL = new Request('./index.html');
const CORE = [
  "./",
  "./index.html",
  "./styles.css",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-192-maskable.png",
  "./icons/icon-512-maskable.png",
  "./js/core.js",
  "./js/security.js",
  "./js/documents.js",
  "./vendor/pdfjs/pdf.mjs",
  "./vendor/pdfjs/pdf.worker.mjs",
  "./js/license.js",
  "./js/shell.js",
  "./js/profiles.js",
  "./js/agenda.js",
  "./js/library.js",
  "./js/cte.js",
  "./js/guardias.js",
  "./js/students.js",
  "./js/attendance.js",
  "./js/works.js",
  "./js/cards.js",
  "./js/reports.js",
  "./vendor/html5-qrcode.min.js",
  "./vendor/qrcode.min.js",
  "./vendor/chart.umd.min.js",
  "./vendor/xlsx.bundle.min.js",
  "./vendor/jspdf.umd.min.js",
  "./js/backup.js",
  "./js/settings.js",
  "./js/bitacora-core.js",
  "./js/bitacora-ui.js",
  "./js/bitacora-form.js",
  "./js/bitacora-docs.js",
  "./js/attention.js",
  "./js/bootstrap.js"
];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    await cache.addAll(CORE);
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_VERSION);
        if(fresh.ok) await cache.put(APP_SHELL, fresh.clone());
        return fresh;
      } catch (err) {
        return (await caches.match(APP_SHELL)) || Response.error();
      }
    })());
    return;
  }
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const fresh = await fetch(req);
      if (fresh && fresh.status === 200) {
        const cache = await caches.open(CACHE_VERSION);
        cache.put(req, fresh.clone());
      }
      return fresh;
    } catch (err) {
      return Response.error();
    }
  })());
});
