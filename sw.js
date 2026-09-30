const CACHE_PREFIX='vida-nova-';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith(CACHE_PREFIX)).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});
// Launch-stability mode: keep the service worker registered for the PWA,
// but do not intercept network requests. This prevents stale application
// shells or JavaScript bundles from masking a fresh production deploy.
