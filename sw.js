const CACHE='vida-nova-shell-v19';
const CORE=[
  '/',
  '/styles.css?v=19',
  '/v3.css?v=19',
  '/experience-v4.css?v=19',
  '/experience-v6.css?v=19',
  '/experience-v8.css?v=19',
  '/experience-v19.css?v=19',
  '/app-v3.js?v=19',
  '/ui-patch.js?v=19',
  '/experience-v5.js?v=19',
  '/experience-v6.js?v=19',
  '/experience-v6-water.js?v=19',
  '/experience-v8.js?v=19',
  '/runtime-v19.js?v=19',
  '/manifest.json?v=19',
  '/icon.svg?v=19'
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
