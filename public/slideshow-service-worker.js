// Slideshow Service Worker for image caching

const CACHE_NAME = 'slideshow-cache-v1';

// Install event - precache essential resources
self.addEventListener('install', (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(['/', '/slideshow']);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return (
              cacheName.startsWith('slideshow-cache-') &&
              cacheName !== CACHE_NAME
            );
          })
          .map((cacheName) => {
            return caches.delete(cacheName);
          })
      );
    })
  );

  // Claim any clients immediately
  return self.clients.claim();
});

// Fetch event - handle image caching
self.addEventListener('fetch', (event) => {
  // Only cache image requests
  if (event.request.url.match(/\.(jpeg|jpg|png|gif|webp)$/) !== null) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        // Return cached response if available
        if (response) {
          return response;
        }

        // Otherwise fetch from network and cache
        return fetch(event.request).then((networkResponse) => {
          // Don't cache non-successful responses
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type !== 'basic'
          ) {
            return networkResponse;
          }

          // Clone the response since it's a stream and can only be consumed once
          const responseToCache = networkResponse.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        });
      })
    );
  } else {
    // For non-image requests, just fetch from network
    event.respondWith(fetch(event.request));
  }
});
