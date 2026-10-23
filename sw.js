const CACHE='reisekompass-v18';
const ASSETS=['./','./index.html','./styles.css?v=5','./cards.css?v=1','./app.js?v=13','./cards.js?v=2','./core.js?v=4','./data.js?v=6','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))));
self.addEventListener('fetch',event=>{if(event.request.method==='GET')event.respondWith(fetch(event.request).then(response=>{const clone=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,clone));return response}).catch(()=>caches.match(event.request)))})
