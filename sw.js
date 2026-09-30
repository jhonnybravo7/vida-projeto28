const CACHE='vida-nova-v8-20260929';
const ASSETS=['/','/index.html','/styles.css?v=8','/v3.css?v=8','/experience-v4.css?v=8','/app-v3.js?v=8','/content-v3.js?v=8','/guides-full.js?v=8','/ui-patch.js?v=8','/experience-v4.js?v=8','/meta.js?v=8','/week1.js?v=8','/week2.js?v=8','/week3.js?v=8','/week4.js?v=8','/manifest.json?v=8','/icon.svg?v=8'];
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).catch(()=>{}))});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim();const cs=await self.clients.matchAll({type:'window',includeUncontrolled:true});await Promise.all(cs.map(c=>c.navigate(c.url).catch(()=>null)));})())});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{
    if(response.ok){const copy=response.clone();caches.open(CACHE).then(c=>c.put(event.request,copy)).catch(()=>{})}
    return response;
  }).catch(async()=>{
    const cached=await caches.match(event.request);
    if(cached)return cached;
    if(event.request.mode==='navigate')return caches.match('/index.html');
    return Response.error();
  }));
});
