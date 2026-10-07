const CACHE='vida-nova-shell-v28';
const CORE=[
  '/',
  '/vida-v21.css?v=26',\n  '/admin-v22.css?v=22',\n  '/vida-v21.js?v=26',\n  '/admin-v22.js?v=23',\n  '/launch-stability-v26.js?v=26',
  '/manifest.json?v=22',
  '/icon.svg?v=22'
];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith('vida-nova-')&&k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return;

  if(req.mode==='navigate'){
    event.respondWith((async()=>{
      try{
        const fresh=await fetch(req);
        const cache=await caches.open(CACHE);
        cache.put('/',fresh.clone());
        return fresh;
      }catch{
        return (await caches.match('/')) || Response.error();
      }
    })());
    return;
  }

  if(/\.(?:js|css|svg|json)$/.test(url.pathname)){
    event.respondWith((async()=>{
      const cached=await caches.match(req);
      if(cached)return cached;
      const fresh=await fetch(req);
      if(fresh.ok){
        const cache=await caches.open(CACHE);
        cache.put(req,fresh.clone());
      }
      return fresh;
    })());
  }
});
