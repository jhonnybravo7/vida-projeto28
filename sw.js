const CACHE='vida-nova-v7-20260929';
const ASSETS=['/','/index.html','/styles.css','/v3.css','/experience-v4.css','/app-v3.js','/content-v3.js','/guides-full.js','/ui-patch.js','/experience-v4.js','/meta.js','/week1.js','/week2.js','/week3.js','/week4.js','/manifest.json','/icon.svg'];
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  event.respondWith(
    fetch(event.request).then(response=>{
      if(response.ok){const copy=response.clone();caches.open(CACHE).then(c=>c.put(event.request,copy)).catch(()=>{})}
      return response;
    }).catch(async()=>{
      const cached=await caches.match(event.request);
      if(cached)return cached;
      if(event.request.mode==='navigate')return caches.match('/index.html');
      return Response.error();
    })
  );
});
