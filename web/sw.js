/* Service worker do NEXUS: guarda o app para abrir offline; dados sempre tentam a rede primeiro. */
const VERSION = 'nexus-v3';
const SHELL = ['./', 'index.html', 'styles.css', 'content.js', 'app.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  const isData = url.pathname.includes('/data/');
  const isShell = SHELL.some(p => url.pathname.endsWith(p.replace('./', '/')));
  if (isData || isShell) {
    // rede primeiro, revalidando com o servidor (ignora a cópia de 10 min do cache HTTP); cache como reserva offline
    e.respondWith(fetch(e.request.url, {cache: 'no-cache', credentials: 'same-origin'}).then(r => {
      const copy = r.clone();
      if (r.ok) caches.open(VERSION).then(c => c.put(e.request, copy));
      return r;
    }).catch(() => caches.match(e.request)));
  }
});
