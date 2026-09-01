const CACHE_VERSION = 'profeqr-v9-etapa3-comunicacion';
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
  "./js/attendance-direction.js",
  "./js/attendance-reminders.js",
  "./js/school-communication.js",
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
const CDN_LIBS = [
  'https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
  'https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.bundle.min.js',
  'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',
  'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap'
];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    await cache.addAll(CORE);
    await Promise.allSettled(CDN_LIBS.map(url => cache.add(url)));
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
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_VERSION);
        cache.put(APP_SHELL, fresh.clone());
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
self.addEventListener('push', event => {
  const data = (() => { try { return event.data ? event.data.json() : {}; } catch (e) { return { title:'ProfeQR', body:event.data ? event.data.text() : 'Nuevo aviso escolar' }; } })();
  event.waitUntil(self.registration.showNotification(data.title || 'ProfeQR', {
    body: data.body || 'Nuevo aviso escolar', icon: './icons/icon-192.png', badge: './icons/icon-192.png', data: { url: data.url || './' }
  }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.matchAll({ type:'window', includeUncontrolled:true }).then(list => {
    const existing = list.find(c => 'focus' in c);
    return existing ? existing.focus() : clients.openWindow(event.notification.data?.url || './');
  }));
});
