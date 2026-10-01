const CACHE='easy-party-v7';
const SHELL=['./','./index.html?v=7','./manifest.json?v=7','./css/theme.css?v=7','./css/components.css?v=7','./css/screens.css?v=7'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('easy-party-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request,{cache:'no-store'}).then(r=>{if(r.ok){const c=r.clone();caches.open(CACHE).then(x=>x.put(event.request,c));}return r}).catch(()=>caches.match(event.request).then(c=>c||caches.match('./index.html?v=7'))));
    return;
  }
  if(url.pathname.endsWith('.js')||url.pathname.endsWith('.css')||url.pathname.endsWith('.json')){
    event.respondWith(fetch(event.request,{cache:'no-store'}).then(r=>{if(r.ok){const c=r.clone();caches.open(CACHE).then(x=>x.put(event.request,c));}return r}).catch(()=>caches.match(event.request)));
    return;
  }
  event.respondWith(caches.match(event.request).then(c=>c||fetch(event.request)));
});
