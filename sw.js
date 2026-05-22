const CACHE='sago-supervision-v1';
const ASSETS=['./','./index.html','./style.css','./app.js','./manifest.webmanifest','./assets/logo.jpeg','./assets/director-blue.jpeg','./assets/director-black.jpeg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('fetch',e=>e.respondWith(fetch(e.request).catch(()=>caches.match(e.request))));
