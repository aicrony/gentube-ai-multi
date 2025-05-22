'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaPlay,
  FaPause,
  FaCog,
  FaChevronLeft,
  FaChevronRight,
  FaExpand,
  FaCompress,
  FaMagic,
  FaSun,
  FaMoon
} from 'react-icons/fa';
import Button from '@/components/ui/Button';
import { useTheme } from '@/context/ThemeContext';

interface SlideshowSettings {
  interval: number;
  direction: 'forward' | 'backward';
  infiniteLoop: boolean;
}

interface SlideshowData {
  id: string;
  slideshowId: string;
  userId: string;
  assetIds: string[];
  title: string;
  creationDate: string;
  settings: SlideshowSettings;
}

interface Asset {
  id: string;
  CreatedAssetUrl: string;
  Prompt: string;
  AssetType: string;
}

export default function SlideshowPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  const { theme, toggleTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slideshow, setSlideshow] = useState<SlideshowData | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<SlideshowSettings>({
    interval: 5000,
    direction: 'forward',
    infiniteLoop: false
  });

  // For storing the original settings from datastore
  const [originalSettings, setOriginalSettings] =
    useState<SlideshowSettings | null>(null);

  // For showing the info banner
  const [showInfoBanner, setShowInfoBanner] = useState(() => {
    // Check localStorage to see if the user has dismissed the banner
    if (typeof window !== 'undefined') {
      return localStorage.getItem('slideshow_banner_dismissed') !== 'true';
    }
    return true;
  });

  // Refs for slideshow control
  const slideshowRef = useRef<HTMLDivElement>(null);
  const slideshowTimerRef = useRef<NodeJS.Timeout | null>(null);
  const imageCache = useRef<{ [key: string]: HTMLImageElement }>({});

  // Register service worker for caching
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/slideshow-service-worker.js')
        .then((registration) => {
          console.log(
            'ServiceWorker registration successful with scope:',
            registration.scope
          );
        })
        .catch((error) => {
          console.error('ServiceWorker registration failed:', error);
        });
    }
  }, []);

  // Try to get cached data from localStorage
  const getLocalStorageSlideshow = (slideshowId: string) => {
    if (typeof window === 'undefined') return null;

    try {
      const cachedData = localStorage.getItem(`slideshow_${slideshowId}`);
      if (!cachedData) return null;

      const parsed = JSON.parse(cachedData);
      // Check if the data is not too old (e.g., less than 24 hours)
      const now = Date.now();
      const expiryTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

      if (parsed.timestamp && now - parsed.timestamp < expiryTime) {
        console.log('Using cached slideshow data from localStorage');
        return parsed;
      }

      // Data is too old, remove it
      localStorage.removeItem(`slideshow_${slideshowId}`);
      return null;
    } catch (err) {
      console.error('Error retrieving slideshow from localStorage:', err);
      return null;
    }
  };

  // Load slideshow data
  useEffect(() => {
    const fetchSlideshow = async () => {
      try {
        setLoading(true);

        // Try to get cached data first
        const cachedData = getLocalStorageSlideshow(id);
        let cachedAssets: Asset[] | null = null;

        if (cachedData && cachedData.assets && cachedData.assets.length > 0) {
          // Convert cached assets to the format we need
          cachedAssets = cachedData.assets.map((asset: any) => ({
            id: asset.id,
            CreatedAssetUrl: asset.createdAssetUrl,
            Prompt: asset.prompt || '',
            AssetType: asset.assetType
          }));
        }

        // Fetch slideshow data from API
        const response = await fetch(`/api/slideshow?id=${id}`);
        if (!response.ok) {
          throw new Error('Slideshow not found');
        }

        const data = await response.json();
        if (!data.success || !data.slideshow) {
          throw new Error(data.error || 'Failed to load slideshow');
        }

        setSlideshow(data.slideshow);

        // Store original settings from datastore and use them for the current settings
        if (data.slideshow.settings) {
          setOriginalSettings(data.slideshow.settings);
          setSettings(data.slideshow.settings);
        }

        // If we have assets in the cache, use those
        if (cachedAssets && cachedAssets.length > 0) {
          console.log('Using cached assets:', cachedAssets.length);
          setAssets(cachedAssets);
          // Start preloading images
          preloadImages(cachedAssets);
          setLoading(false);
          return; // Skip the rest of the function
        }

        // If we have assets in the slideshow data, convert and use those
        if (data.slideshow.assets && data.slideshow.assets.length > 0) {
          const slideshowAssets: Asset[] = data.slideshow.assets.map(
            (asset: any) => ({
              id: asset.id,
              CreatedAssetUrl: asset.createdAssetUrl,
              Prompt: asset.prompt || '',
              AssetType: asset.assetType
            })
          );

          // Save to localStorage for future use
          if (slideshowAssets.length > 0) {
            try {
              localStorage.setItem(
                `slideshow_${id}`,
                JSON.stringify({
                  assets: data.slideshow.assets,
                  timestamp: Date.now()
                })
              );
              console.log('Saved slideshow data to localStorage');
            } catch (err) {
              console.error('Error saving to localStorage:', err);
            }
          }

          setAssets(slideshowAssets);
          // Start preloading images
          preloadImages(slideshowAssets);
          setLoading(false);
          return; // Skip the rest of the function
        }

        // Fallback: Fetch asset details for each asset ID
        const assetIds = data.slideshow.assetIds;
        if (!assetIds || assetIds.length === 0) {
          throw new Error('No assets in slideshow');
        }

        // Create a dummy structure in case we can't load the actual assets
        // This ensures the slideshow will at least work with placeholder data
        const fetchedAssets: Asset[] = [];

        // Use a direct data endpoint that doesn't require authentication
        // For demonstration, we'll make a single request to get public assets
        try {
          const assetsResponse = await fetch(`/api/getPublicAssets?limit=50`);
          const assetsData = await assetsResponse.json();

          if (assetsData.assets && assetsData.assets.length > 0) {
            // Filter to only include assets that are in our slideshow
            const relevantAssets = assetsData.assets.filter((asset: any) =>
              assetIds.includes(asset.id)
            );

            fetchedAssets.push(...relevantAssets);
          }

          // If we still don't have any assets, create placeholders
          if (fetchedAssets.length === 0) {
            assetIds.forEach((id, index) => {
              fetchedAssets.push({
                id,
                CreatedAssetUrl:
                  'https://via.placeholder.com/600x400?text=Image+' +
                  (index + 1),
                Prompt: `Slideshow image ${index + 1}`,
                AssetType: 'img'
              });
            });
          }
        } catch (err) {
          console.error('Error fetching assets:', err);

          // Create placeholder assets as fallback
          assetIds.forEach((id, index) => {
            fetchedAssets.push({
              id,
              CreatedAssetUrl:
                'https://via.placeholder.com/600x400?text=Image+' + (index + 1),
              Prompt: `Slideshow image ${index + 1}`,
              AssetType: 'img'
            });
          });
        }

        setAssets(fetchedAssets);

        // Start preloading images
        preloadImages(fetchedAssets);
      } catch (err) {
        console.error('Error loading slideshow:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to load slideshow'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSlideshow();
  }, [id]);

  // Preload images for smoother slideshow
  const preloadImages = (assets: Asset[]) => {
    // Preload all images immediately, but load them in stages to prevent network congestion
    const batchSize = 3; // Number of images to load concurrently
    const batches = Math.ceil(assets.length / batchSize);

    // Function to load a batch of images
    const loadBatch = (batchIndex: number) => {
      const startIndex = batchIndex * batchSize;
      const endIndex = Math.min(startIndex + batchSize, assets.length);

      for (let i = startIndex; i < endIndex; i++) {
        const asset = assets[i];

        // Skip videos and already cached images
        if (
          asset.CreatedAssetUrl &&
          !asset.CreatedAssetUrl.endsWith('.mp4') &&
          !imageCache.current[asset.id]
        ) {
          console.log(
            `Preloading image ${i + 1}/${assets.length}: ${asset.id}`
          );

          // Create and load the image
          const img = new Image();

          // Add event listeners for better tracking
          img.onload = () => {
            console.log(`Image loaded: ${asset.id}`);
          };

          img.onerror = () => {
            console.error(`Failed to load image: ${asset.id}`);
          };

          // Set source to start loading
          img.src = asset.CreatedAssetUrl;

          // Store in our local cache
          imageCache.current[asset.id] = img;

          // Add to browser cache with a service worker or cache API
          if ('caches' in window) {
            caches.open('slideshow-cache').then((cache) => {
              cache.add(asset.CreatedAssetUrl).catch((err) => {
                console.error('Failed to cache asset:', err);
              });
            });
          }
        }
      }

      // Load the next batch if there are more images
      if (batchIndex + 1 < batches) {
        setTimeout(() => {
          loadBatch(batchIndex + 1);
        }, 200); // Small delay between batches
      }
    };

    // Start loading the first batch
    loadBatch(0);
  };

  // Slideshow controls
  useEffect(() => {
    if (isPlaying && assets.length > 0) {
      // Clear any existing timer
      if (slideshowTimerRef.current) {
        clearTimeout(slideshowTimerRef.current);
      }

      // Set up a new timer
      slideshowTimerRef.current = setTimeout(() => {
        if (settings.direction === 'forward') {
          if (currentIndex < assets.length - 1) {
            setCurrentIndex(currentIndex + 1);
          } else if (settings.infiniteLoop) {
            setCurrentIndex(0);
          } else {
            setIsPlaying(false);
          }
        } else {
          if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
          } else if (settings.infiniteLoop) {
            setCurrentIndex(assets.length - 1);
          } else {
            setIsPlaying(false);
          }
        }
      }, settings.interval);
    }

    return () => {
      if (slideshowTimerRef.current) {
        clearTimeout(slideshowTimerRef.current);
      }
    };
  }, [isPlaying, currentIndex, assets.length, settings]);

  // Handle fullscreen toggle
  const toggleFullScreen = () => {
    if (!isFullScreen) {
      if (slideshowRef.current?.requestFullscreen) {
        slideshowRef.current.requestFullscreen();
      }
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullScreen(false);
    }
  };

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Navigate to next/previous slide
  const nextSlide = () => {
    if (currentIndex < assets.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (settings.infiniteLoop) {
      setCurrentIndex(0);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (settings.infiniteLoop) {
      setCurrentIndex(assets.length - 1);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === ' ') {
        setIsPlaying(!isPlaying);
        e.preventDefault();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullScreen();
      } else if (e.key === 's' || e.key === 'S') {
        setShowSettings(!showSettings);
      } else if (e.key === 'Escape') {
        if (showSettings) {
          setShowSettings(false);
        } else if (isFullScreen) {
          toggleFullScreen();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlaying, currentIndex, settings, assets.length, showSettings, isFullScreen]);

  // Render loading state
  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className={`text-xl ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Loading slideshow...</div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className="text-red-500 text-xl mb-4">Error: {error}</div>
        <button
          onClick={() => router.push('/')}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Return Home
        </button>
      </div>
    );
  }

  // Get current asset
  const currentAsset = assets[currentIndex];
  const isVideo = currentAsset?.CreatedAssetUrl?.endsWith('.mp4');

  return (
    <div
      ref={slideshowRef}
      className={`flex flex-col ${isFullScreen ? 'fixed inset-0 z-50' : 'min-h-screen'} ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'
      }`}
    >
      {/* Title bar */}
      <div className={`flex justify-between items-center p-4 ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
      }`}>
        <h1 className={`text-xl font-bold ${
          theme === 'dark' ? 'text-white' : 'text-gray-800'
        }`}>
          {slideshow?.title || 'Slideshow'}
        </h1>

        <div className="flex space-x-3">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className={`bg-opacity-70 hover:bg-opacity-90 rounded-full p-2 ${
              theme === 'dark' 
                ? 'bg-gray-700 text-yellow-300' 
                : 'bg-gray-300 text-blue-800'
            }`}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <FaSun /> : <FaMoon />}
          </button>

          {/* Play/Pause button */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`bg-opacity-70 hover:bg-opacity-90 rounded-full p-2 ${
              theme === 'dark' 
                ? 'bg-gray-700 text-white' 
                : 'bg-gray-300 text-gray-800'
            }`}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <FaPause /> : <FaPlay />}
          </button>

          {/* Settings button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`bg-opacity-70 hover:bg-opacity-90 rounded-full p-2 ${
              theme === 'dark' 
                ? 'bg-gray-700 text-white' 
                : 'bg-gray-300 text-gray-800'
            }`}
            title="Settings"
          >
            <FaCog />
          </button>

          {/* Fullscreen button */}
          <button
            onClick={toggleFullScreen}
            className={`bg-opacity-70 hover:bg-opacity-90 rounded-full p-2 ${
              theme === 'dark' 
                ? 'bg-gray-700 text-white' 
                : 'bg-gray-300 text-gray-800'
            }`}
            title={isFullScreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullScreen ? <FaCompress /> : <FaExpand />}
          </button>
        </div>
      </div>

      {/* Settings panel - made more accessible, visible on both desktop and mobile */}
      {showSettings && (
        <div className={`absolute top-16 right-4 p-4 rounded-lg z-10 shadow-lg transition-all w-64 sm:w-80 ${
          theme === 'dark' 
            ? 'bg-gray-800 bg-opacity-95 text-white' 
            : 'bg-white bg-opacity-95 text-gray-800 border border-gray-300'
        }`}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold">Slideshow Settings</h3>
            <button 
              onClick={() => setShowSettings(false)}
              className={`rounded-full p-1 ${
                theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
              }`}
            >
              ✕
            </button>
          </div>

          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium">Interval (seconds)</label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="1"
                max="20"
                step="1"
                value={settings.interval / 1000}
                onChange={(e) => {
                  setSettings({
                    ...settings,
                    interval: Number(e.target.value) * 1000
                  });
                }}
                className="w-full"
              />
              <span className="text-sm font-medium w-8 text-center">{settings.interval / 1000}s</span>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span>1s</span>
              <span>20s</span>
            </div>
          </div>

          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium">Direction</label>
            <div className="flex justify-between gap-2">
              <button
                onClick={() =>
                  setSettings({
                    ...settings,
                    direction: 'backward'
                  })
                }
                className={`flex-1 px-3 py-2 rounded-md ${
                  settings.direction === 'backward' 
                    ? 'bg-blue-500 text-white' 
                    : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                }`}
              >
                ← Backward
              </button>
              <button
                onClick={() =>
                  setSettings({
                    ...settings,
                    direction: 'forward'
                  })
                }
                className={`flex-1 px-3 py-2 rounded-md ${
                  settings.direction === 'forward' 
                    ? 'bg-blue-500 text-white' 
                    : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                }`}
              >
                Forward →
              </button>
            </div>
          </div>

          {/* Infinite Loop Toggle */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Infinite Loop</label>
              <div
                className={`relative inline-block w-14 h-7 transition-colors duration-200 ease-in-out rounded-full cursor-pointer ${
                  settings.infiniteLoop 
                    ? 'bg-blue-500' 
                    : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                }`}
                onClick={() => {
                  setSettings({
                    ...settings,
                    infiniteLoop: !settings.infiniteLoop
                  });
                }}
              >
                <span
                  className={`absolute left-1 top-1 w-5 h-5 transition-transform duration-200 ease-in-out bg-white rounded-full transform ${
                    settings.infiniteLoop ? 'translate-x-7' : 'translate-x-0'
                  }`}
                ></span>
              </div>
            </div>
            <p className="text-xs mt-1 opacity-70">
              {settings.infiniteLoop 
                ? 'The slideshow will loop continuously' 
                : 'The slideshow will stop at the end'}
            </p>
          </div>
          
          {/* Apply button */}
          <button
            onClick={() => {
              // If original settings exist, store them (useful for reset)
              if (!originalSettings) {
                setOriginalSettings({...settings});
              }
              setShowSettings(false);
            }}
            className="w-full py-2 rounded-md bg-blue-500 hover:bg-blue-600 text-white font-medium"
          >
            Apply Settings
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 relative flex items-center justify-center">
        {/* Previous button */}
        {currentIndex > 0 || settings.infiniteLoop ? (
          <button
            onClick={prevSlide}
            className={`absolute left-4 top-1/2 transform -translate-y-1/2 bg-opacity-70 hover:bg-opacity-90 rounded-full p-3 z-10 ${
              theme === 'dark'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-200 text-gray-800'
            }`}
            title="Previous"
          >
            <FaChevronLeft size={24} />
          </button>
        ) : null}

        {/* Media content */}
        <div className={`flex justify-center items-center max-w-full max-h-full p-4 ${
          theme === 'dark' ? '' : 'bg-gray-100'
        }`}>
          {currentAsset ? (
            isVideo ? (
              <video
                src={currentAsset.CreatedAssetUrl}
                controls
                autoPlay
                className="max-w-full max-h-[70vh] object-contain"
                style={{ 
                  boxShadow: theme === 'dark' 
                    ? '0 0 12px rgba(0, 0, 0, 0.5)' 
                    : '0 0 12px rgba(0, 0, 0, 0.2)'
                }}
              />
            ) : (
              <img
                src={currentAsset.CreatedAssetUrl}
                alt={currentAsset.Prompt || 'Slideshow image'}
                className="max-w-full max-h-[70vh] object-contain"
                style={{ 
                  boxShadow: theme === 'dark' 
                    ? '0 0 16px rgba(0, 0, 0, 0.6)' 
                    : '0 0 16px rgba(0, 0, 0, 0.2)',
                  background: theme === 'dark' 
                    ? 'linear-gradient(45deg, #222 25%, transparent 25%, transparent 75%, #222 75%, #222), linear-gradient(45deg, #222 25%, transparent 25%, transparent 75%, #222 75%, #222)' 
                    : 'linear-gradient(45deg, #eee 25%, transparent 25%, transparent 75%, #eee 75%, #eee), linear-gradient(45deg, #eee 25%, transparent 25%, transparent 75%, #eee 75%, #eee)',
                  backgroundSize: '16px 16px',
                  backgroundPosition: '0 0, 8px 8px'
                }}
                // This caching strategy ensures the browser caches the image for future use
                fetchPriority="high"
                loading="eager"
                decoding="sync"
              />
            )
          ) : (
            <div className={theme === 'dark' ? 'text-white' : 'text-gray-800'}>
              No media available
            </div>
          )}
        </div>

        {/* Next button */}
        {currentIndex < assets.length - 1 || settings.infiniteLoop ? (
          <button
            onClick={nextSlide}
            className={`absolute right-4 top-1/2 transform -translate-y-1/2 bg-opacity-70 hover:bg-opacity-90 rounded-full p-3 z-10 ${
              theme === 'dark'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-200 text-gray-800'
            }`}
            title="Next"
          >
            <FaChevronRight size={24} />
          </button>
        ) : null}
      </div>

      {/* Caption/prompt */}
      {currentAsset?.Prompt && (
        <div className={`p-4 max-w-full overflow-hidden ${
          theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-800'
        }`}>
          <div className="text-sm">{currentAsset.Prompt}</div>
          <div className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Image {currentIndex + 1} of {assets.length}
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className={theme === 'dark' ? 'bg-gray-800' : 'bg-gray-300'}>
        <div
          className="bg-blue-500 h-1 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / assets.length) * 100}%` }}
        ></div>
      </div>

      {/* Info banner */}
      {showInfoBanner && (
        <div className={`p-3 text-center relative ${
          theme === 'dark' 
            ? 'bg-blue-900 bg-opacity-80 text-white' 
            : 'bg-blue-100 text-blue-800'
        }`}>
          <button
            className={`absolute right-2 top-2 ${
              theme === 'dark' 
                ? 'text-white hover:text-gray-300' 
                : 'text-blue-800 hover:text-blue-600'
            }`}
            onClick={() => {
              setShowInfoBanner(false);
              // Save dismissal state to localStorage
              if (typeof window !== 'undefined') {
                localStorage.setItem('slideshow_banner_dismissed', 'true');
              }
            }}
          >
            ✕
          </button>
          <p className="text-sm mb-1">
            Use the Play button to start the slideshow with original settings or
            customize your viewing experience with the settings gear icon.
          </p>
          <p className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            Keyboard shortcuts: <span className="font-mono">Space</span> (play/pause), 
            <span className="font-mono">←→</span> (navigation), 
            <span className="font-mono">F</span> (fullscreen), 
            <span className="font-mono">S</span> (settings)
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className={`p-4 flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4 ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
      }`}>
        <Button
          onClick={() => {
            // If pausing, just pause
            if (isPlaying) {
              setIsPlaying(false);
              return;
            }
            
            // Enter fullscreen when playing
            if (!isFullScreen) {
              toggleFullScreen();
            }

            // If playing and original settings exist, restore them first
            if (originalSettings) {
              setSettings(originalSettings);
            }
            setIsPlaying(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
        >
          {isPlaying ? (
            <>
              <FaPause className="mr-2" />
              <span className="hidden sm:inline">Pause Slideshow</span>
              <span className="sm:hidden">Pause</span>
            </>
          ) : (
            <>
              <FaPlay className="mr-2" />
              <span className="hidden sm:inline">Play Slideshow</span>
              <span className="sm:hidden">Play</span>
            </>
          )}
        </Button>

        <Button
          onClick={() => setShowSettings(!showSettings)}
          className={`${
            theme === 'dark' 
              ? 'bg-gray-700 hover:bg-gray-600' 
              : 'bg-gray-300 hover:bg-gray-400'
          } text-${theme === 'dark' ? 'white' : 'gray-800'} w-full sm:w-auto`}
        >
          <FaCog className="mr-2" />
          <span className="hidden sm:inline">Slideshow Settings</span>
          <span className="sm:hidden">Settings</span>
        </Button>

        <Button
          onClick={() => router.push('/')}
          className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
        >
          <FaMagic className="mr-2" />
          <span className="hidden sm:inline">Try Generating Now</span>
          <span className="sm:hidden">Generate</span>
        </Button>
      </div>
    </div>
  );
}
