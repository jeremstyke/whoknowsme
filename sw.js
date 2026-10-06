// Who Knows Me Best? offline shell: the page is always fetched fresh when online (updates), from cache when offline
const CACHE = 'km-v3';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return; // the game's server and Telegram are never cached
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).then((r) => { const c = r.clone(); caches.open(CACHE).then((cc) => cc.put(e.request, c)); return r; }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((m) => m || caches.match('./index.html'))));
});
// phone notifications: the server sends an empty push, the text is fetched here, then shown
const API = 'https://pote-ia-bot-en-production.up.railway.app';
self.addEventListener('push', (e) => {
  e.waitUntil((async () => {
    let d = {};
    try {
      const sub = await self.registration.pushManager.getSubscription();
      const r = await fetch(API + '/km/push/last', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: sub && sub.endpoint }) });
      d = await r.json();
    } catch (err) {}
    await self.registration.showNotification(d.title || 'Who Knows Me Best? 💛', { body: d.body || '💛', icon: 'icon-192.png', badge: 'icon-192.png', tag: 'km-' + (d.at || Date.now()), data: { url: d.url || './' } });
  })());
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ws) => {
    const to = (e.notification.data && e.notification.data.url) || './';
    for (const w of ws) { w.focus(); return w.navigate ? w.navigate(to) : w; }
    return clients.openWindow(to);
  }));
});
