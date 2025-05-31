'use client';

import React, { useEffect, useState } from 'react';

interface ServiceWorkerRegistrationProps {
  workerPath?: string;
  assetsToCache?: string[];
}

const ServiceWorkerRegistration: React.FC<ServiceWorkerRegistrationProps> = ({
  workerPath = '/slideshow-service-worker.js',
  assetsToCache = []
}) => {
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);
  const [status, setStatus] = useState<
    'idle' | 'registering' | 'registered' | 'error'
  >('idle');

  useEffect(() => {
    // Only run in the browser and if service workers are supported
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('Service workers are not supported in this browser');
      return;
    }

    const registerServiceWorker = async () => {
      try {
        setStatus('registering');

        // Register the service worker
        const reg = await navigator.serviceWorker.register(workerPath, {
          scope: '/'
        });

        setRegistration(reg);
        setStatus('registered');

        // Log success
        console.log('Service worker registered successfully:', reg.scope);

        // Handle updates
        if (reg.installing) {
          console.log('Service worker installing');
        } else if (reg.waiting) {
          console.log('Service worker installed and waiting');
        } else if (reg.active) {
          console.log('Service worker active');
        }

        // Send assets to cache if available and there are assets to cache
        if (reg.active && assetsToCache.length > 0) {
          // Give the service worker some time to be ready
          setTimeout(() => {
            console.log(
              'Sending asset list to service worker for caching:',
              assetsToCache.length
            );
            reg.active?.postMessage({
              type: 'CACHE_SLIDESHOW_ASSETS',
              assets: assetsToCache
            });
          }, 1000);
        }
      } catch (error) {
        console.error('Service worker registration failed:', error);
        setStatus('error');
      }
    };

    registerServiceWorker();

    // Cleanup function for component unmount
    return () => {
      // No need to unregister the service worker when component unmounts
      // as it should persist for the entire browser session
    };
  }, [workerPath]); // Only re-run if workerPath changes

  // Send assets to cache when they change
  useEffect(() => {
    if (registration?.active && assetsToCache.length > 0) {
      // Filter out duplicate and empty URLs
      const uniqueAssets = [
        ...new Set(assetsToCache.filter((url) => url && url.length > 0))
      ];

      if (uniqueAssets.length > 0) {
        console.log(
          'Sending updated asset list to service worker for caching:',
          uniqueAssets.length
        );
        registration.active.postMessage({
          type: 'CACHE_SLIDESHOW_ASSETS',
          assets: uniqueAssets
        });
      }
    }
  }, [registration, assetsToCache]);

  // This component doesn't render anything visible
  return null;
};

export default ServiceWorkerRegistration;
