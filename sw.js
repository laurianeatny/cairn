const CACHE = 'cairn-v1';
const ASSETS = [
  '/',
  '/index.html',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install : mise en cache des ressources statiques
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Activate : nettoyage des anciens caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch : cache-first pour les assets, network-first pour les tuiles carte
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Tuiles carte : réseau d'abord, cache en fallback
  if (url.hostname.includes('carto') || url.hostname.includes('opentopomap') || url.hostname.includes('arcgisonline') || url.hostname.includes('openstreetmap')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Tout le reste : cache d'abord
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
