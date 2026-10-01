const CACHE="easy-party-v4";
const APP_SHELL=["./","./index.html","./manifest.json","./css/theme.css","./css/components.css","./css/screens.css","./js/main.js"];

self.addEventListener("install",event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await Promise.all(APP_SHELL.map(async url=>{try{await cache.add(url)}catch{}}));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

async function networkFirst(request){
  const cache=await caches.open(CACHE);
  try{
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),4000);
    const response=await fetch(request,{signal:controller.signal,cache:"no-store"});
    clearTimeout(timer);
    if(response.ok)await cache.put(request,response.clone());
    return response;
  }catch{
    const cached=await cache.match(request);
    if(cached)return cached;
    throw new Error("Network unavailable");
  }
}

async function cacheFirst(request){
  const cache=await caches.open(CACHE);
  const cached=await cache.match(request);
  if(cached)return cached;
  try{
    const response=await fetch(request);
    if(response.ok)await cache.put(request,response.clone());
    return response;
  }catch{
    return Response.error();
  }
}

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  const pathname=url.pathname.toLowerCase();
  if(event.request.mode==="navigate"||/\.(js|css|json|html)$/.test(pathname)){
    event.respondWith(networkFirst(event.request).catch(()=>caches.match("./index.html")));
  }else{
    event.respondWith(cacheFirst(event.request));
  }
});