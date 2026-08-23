const CACHE_NAME = 'digital-kaam-v4-master';
const SHELL_FILES = [
  '/',
  '/css/style.css',
  '/js/common.js',
  '/js/otp-modal.js',
  '/icon.svg',
  '/manifest.json',
  '/workers.html',
  '/customer.html',
  '/index.html',
  '/my-bookings.html',
  '/booking-status.html',
  '/verify-worker.html',
  '/seeker.html',
  '/admin.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(SHELL_FILES);
    }).catch((err) => console.log('SW cache error:', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => 
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Network-First for dynamic API calls & Worker uploads; Cache-First for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET or cross-origin calls (like Razorpay, Leaflet tiles, CDN)
  if (event.request.method !== 'GET' || url.origin !== location.origin) return;

  // Don't cache dynamic API routes
  if (url.pathname.startsWith('/api/') || 
      url.pathname.startsWith('/workers') || 
      url.pathname.startsWith('/my-') || 
      url.pathname.startsWith('/admin/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        // Return cached and update in background (Stale While Revalidate)
        fetch(event.request).then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            caches.open(CACHE_NAME).then((c) => c.put(event.request, networkRes));
          }
        }).catch(() => {});
        return cached;
      }
      return fetch(event.request).catch(() => {
        // Fallback for HTML navigation
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/workers.html');
        }
      });
    })
  );
});

