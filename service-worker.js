const CACHE='sakoh-supervision-v1';
const ASSETS=['./','index.html','app.js','manifest.json','assets/logo.jpeg','assets/profile-1.jpeg','assets/profile-2.jpeg','assets/dashboard-preview.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
