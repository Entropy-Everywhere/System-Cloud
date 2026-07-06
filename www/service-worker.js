const CACHE_NAME = 'system-cloud-cache-v3';
const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './icons/SystemCloudLogo.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './pages/login.html',
  './pages/signup.html',
  './pages/homepage.html',
  './pages/alters.html',
  './pages/fronters.html',
  './pages/settings.html',
  './pages/AccountView.html',
  './pages/alter-profile.html',
  './pages/firebase-config.js',
  './pages/database.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // For navigation requests (HTML pages), try network first, fall back to cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html')))
    );
    return;
  }

  // For static assets (CSS, JS, images), serve from cache first, update in background
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
