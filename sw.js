const CACHE='reisekompass-v24';
const ASSETS=['./','./index.html','./styles.css?v=5','./cards.css?v=1','./maps.css?v=1','./app.js?v=16','./hotel-notes.js?v=3','./hotel-notes.css?v=3','./note-timeline-core.js?v=1','./proofreading.js?v=1','./cards.js?v=3','./maps.js?v=1','./core.js?v=4','./data.js?v=6','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)))});
self.addEventListener('activate',event=>event.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('reisekompass-')&&key!==CACHE).map(key=>caches.delete(key))))])));
self.addEventListener('fetch',event=>{if(event.request.method==='GET')event.respondWith(fetch(event.request).then(response=>{const clone=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,clone));return response}).catch(()=>caches.match(event.request)))})
