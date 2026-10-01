const CACHE='easy-party-v5';
const SHELL=['./','./index.html','./manifest.json','./css/theme.css','./css/components.css','./css/screens.css'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url); if(url.origin!==self.location.origin)return;
 if(url.pathname.endsWith('.js')||url.pathname.endsWith('.css')||url.pathname.endsWith('.json')){
   event.respondWith(fetch(event.request,{cache:'no-store'}).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));}return r}).catch(()=>caches.match(event.request)));
   return;
 }
 event.respondWith(caches.match(event.request).then(c=>c||fetch(event.request)));
});
