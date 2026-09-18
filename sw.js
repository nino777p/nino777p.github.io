/* Fony — cache des images, polices et logo. Version : 677a207287a7
   Ne met en cache que /assets/. Les pages et campagne.txt passent toujours par le réseau. */
const V = 'fony-assets-677a207287a7';
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  let u; try { u = new URL(r.url); } catch (_) { return; }
  if (u.origin !== self.location.origin) return;
  if (!u.pathname.includes('/assets/')) return;
  e.respondWith(caches.open(V).then(c => c.match(r).then(hit => hit || fetch(r).then(res => {
    if (res && res.ok && res.type === 'basic') c.put(r, res.clone());
    return res;
  }).catch(() => hit))));
});
