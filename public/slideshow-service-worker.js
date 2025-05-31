// Slideshow Service Worker for efficient asset caching
const CACHE_NAME = 'slideshow-cache-v2';
const IMAGE_CACHE_NAME = 'slideshow-images-v2';
const ASSET_CACHE_NAME = 'slideshow-assets-v2';

// Assets to precache
const PRECACHE_ASSETS = [
  '/',
  '/slideshow'
  // Add any important CSS or JS files needed for the slideshow
];

// Install event - precache essential resources
self.addEventListener('install', (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service worker installing and caching initial assets');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Delete old versions of our caches
              return (
                (cacheName.startsWith('slideshow-cache-') &&
                  cacheName !== CACHE_NAME) ||
                (cacheName.startsWith('slideshow-images-') &&
                  cacheName !== IMAGE_CACHE_NAME) ||
                (cacheName.startsWith('slideshow-assets-') &&
                  cacheName !== ASSET_CACHE_NAME)
              );
            })
            .map((cacheName) => {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('Service worker activated and controlling the page');
        // Claim any clients immediately
        return self.clients.claim();
      })
  );
});

// Helper function to determine if a request is for an image
function isImageRequest(url) {
  return url.match(/\.(jpeg|jpg|png|gif|webp|svg)(\?.*)?$/) !== null;
}

// Helper function to determine if a request is for a video
function isVideoRequest(url) {
  return url.match(/\.(mp4|webm|ogg)(\?.*)?$/) !== null;
}

// Helper function to determine if a request is for the slideshow page
function isSlideshowPage(url) {
  const urlObj = new URL(url);
  return urlObj.pathname.startsWith('/slideshow/');
}

// Fetch event - handle caching with different strategies
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // For navigation requests to slideshow pages, use network first then cache
  if (event.request.mode === 'navigate' && isSlideshowPage(url)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response to store in cache
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // If network fails, try to return from cache
          return caches.match(event.request);
        })
    );
    return;
  }

  // For image requests, use cache first then network
  if (isImageRequest(url)) {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          // Return cached response if available
          if (cachedResponse) {
            // Refresh cache in the background
            fetch(event.request)
              .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                  cache.put(event.request, networkResponse.clone());
                }
              })
              .catch(() => {
                // Ignore fetch errors when refreshing cache
              });

            return cachedResponse;
          }

          // Otherwise fetch from network and cache
          return fetch(event.request)
            .then((networkResponse) => {
              // Don't cache non-successful responses
              if (!networkResponse || networkResponse.status !== 200) {
                return networkResponse;
              }

              // Clone the response since it's a stream and can only be consumed once
              const responseToCache = networkResponse.clone();
              cache.put(event.request, responseToCache);

              return networkResponse;
            })
            .catch((error) => {
              console.error('Error fetching image:', error);
              throw error;
            });
        });
      })
    );
    return;
  }

  // For video requests, use cache first then network
  if (isVideoRequest(url)) {
    event.respondWith(
      caches.open(ASSET_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          // Return cached response if available
          if (cachedResponse) {
            return cachedResponse;
          }

          // Otherwise fetch from network and cache
          return fetch(event.request).then((networkResponse) => {
            // Don't cache non-successful responses
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }

            // Clone the response since it's a stream and can only be consumed once
            const responseToCache = networkResponse.clone();
            cache.put(event.request, responseToCache);

            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // For API requests or other non-cacheable content, use network only
  if (url.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Default behavior: try cache first, then network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});

// Listen for messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_SLIDESHOW_ASSETS') {
    // Cache specific slideshow assets in the background
    const assetsToCache = event.data.assets || [];
    if (assetsToCache.length > 0) {
      caches.open(IMAGE_CACHE_NAME).then((cache) => {
        console.log('Received message to cache assets:', assetsToCache.length);

        // Cache in batches to avoid overwhelming the network
        const batchSize = 3;
        const batches = Math.ceil(assetsToCache.length / batchSize);

        const cacheNextBatch = (batchIndex) => {
          if (batchIndex >= batches) {
            console.log('All assets cached successfully');
            return;
          }

          const startIndex = batchIndex * batchSize;
          const endIndex = Math.min(
            startIndex + batchSize,
            assetsToCache.length
          );
          const batchPromises = [];

          for (let i = startIndex; i < endIndex; i++) {
            const assetUrl = assetsToCache[i];
            if (
              assetUrl &&
              (isImageRequest(assetUrl) || isVideoRequest(assetUrl))
            ) {
              console.log(
                `Caching asset ${i + 1}/${assetsToCache.length}: ${assetUrl}`
              );

              // Add to cache - we use fetch then put to ensure proper handling
              const promise = fetch(assetUrl, { mode: 'no-cors' })
                .then((response) => {
                  if (
                    response &&
                    (response.status === 200 || response.type === 'opaque')
                  ) {
                    return cache.put(assetUrl, response);
                  }
                })
                .catch((error) => {
                  console.error(`Failed to cache asset ${assetUrl}:`, error);
                });

              batchPromises.push(promise);
            }
          }

          // After current batch is done, move to next batch
          Promise.all(batchPromises).then(() => {
            setTimeout(() => {
              cacheNextBatch(batchIndex + 1);
            }, 300); // Small delay between batches
          });
        };

        // Start caching with the first batch
        cacheNextBatch(0);
      });
    }
  }
});
