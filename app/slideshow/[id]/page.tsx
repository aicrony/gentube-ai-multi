'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { FaMagic } from 'react-icons/fa';

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
  const { theme } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slideshow, setSlideshow] = useState<SlideshowData | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(true); // Auto-open modal immediately
  const [isFullScreen, setIsFullScreen] = useState(true);
  
  // Reference to store the original settings from datastore
  const originalSettings = useRef<SlideshowSettings | null>(null);
  
  // Ref for image caching
  const imageCache = useRef<{[key: string]: HTMLImageElement}>({});

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
      
      if (parsed.timestamp && (now - parsed.timestamp < expiryTime)) {
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
        
        // Store original settings from datastore
        if (data.slideshow.settings) {
          originalSettings.current = data.slideshow.settings;
        }
        
        // If we have assets in the cache, use those
        if (cachedAssets && cachedAssets.length > 0) {
          console.log('Using cached assets:', cachedAssets.length);
          setAssets(cachedAssets);
          // Start preloading images
          preloadImages(cachedAssets);
          setIsModalOpen(true);
          setLoading(false);
          return; // Skip the rest of the function
        }
        
        // If we have assets in the slideshow data, convert and use those
        if (data.slideshow.assets && data.slideshow.assets.length > 0) {
          const slideshowAssets: Asset[] = data.slideshow.assets.map((asset: any) => ({
            id: asset.id,
            CreatedAssetUrl: asset.createdAssetUrl,
            Prompt: asset.prompt || '',
            AssetType: asset.assetType
          }));
          
          // Save to localStorage for future use
          if (slideshowAssets.length > 0) {
            try {
              localStorage.setItem(`slideshow_${id}`, JSON.stringify({
                assets: data.slideshow.assets,
                timestamp: Date.now()
              }));
              console.log('Saved slideshow data to localStorage');
            } catch (err) {
              console.error('Error saving to localStorage:', err);
            }
          }
          
          setAssets(slideshowAssets);
          // Start preloading images
          preloadImages(slideshowAssets);
          setIsModalOpen(true);
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
                CreatedAssetUrl: 'https://via.placeholder.com/600x400?text=Image+' + (index + 1),
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
              CreatedAssetUrl: 'https://via.placeholder.com/600x400?text=Image+' + (index + 1),
              Prompt: `Slideshow image ${index + 1}`,
              AssetType: 'img'
            });
          });
        }
        
        setAssets(fetchedAssets);
        // Start preloading images
        preloadImages(fetchedAssets);
        setIsModalOpen(true);
      } catch (err) {
        console.error('Error loading slideshow:', err);
        setError(err instanceof Error ? err.message : 'Failed to load slideshow');
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
        if (asset.CreatedAssetUrl && 
            !asset.CreatedAssetUrl.endsWith('.mp4') && 
            !imageCache.current[asset.id]) {
          
          console.log(`Preloading image ${i + 1}/${assets.length}: ${asset.id}`);
          
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
          
          // Add to browser cache with cache API
          if ('caches' in window) {
            caches.open('slideshow-cache').then(cache => {
              cache.add(asset.CreatedAssetUrl).catch(err => {
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

  // Handle modal navigation
  const handleNext = () => {
    if (currentIndex < assets.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (originalSettings.current?.infiniteLoop) {
      // Jump to first image if infinite loop is enabled
      setCurrentIndex(0);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (originalSettings.current?.infiniteLoop) {
      // Jump to last image if infinite loop is enabled
      setCurrentIndex(assets.length - 1);
    }
  };

  // For infinite looping in slideshow mode
  const jumpToFirst = () => {
    setCurrentIndex(0);
  };

  const jumpToLast = () => {
    setCurrentIndex(assets.length - 1);
  };

  // Close modal and redirect to home
  const handleClose = () => {
    setIsModalOpen(false);
    router.push('/');
  };

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
        <Button
          onClick={() => router.push('/')}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          Return Home
        </Button>
      </div>
    );
  }

  // Get current asset
  const currentAsset = assets[currentIndex];
  
  return (
    <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className="flex-grow flex items-center justify-center p-4">
        {/* Only show this if the modal is closed */}
        {!isModalOpen && (
          <div className="text-center max-w-lg">
            <h1 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
              {slideshow?.title || 'Slideshow'}
            </h1>
            <p className={`mb-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Slideshow closed. Click the button below to view it again.
            </p>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Reopen Slideshow
            </Button>
            <Button
              onClick={() => router.push('/')}
              className="bg-green-600 hover:bg-green-700 text-white ml-4"
            >
              <FaMagic className="mr-2" />
              Generate Now
            </Button>
          </div>
        )}
      </div>

      {/* Modal for slideshow viewing */}
      {isModalOpen && assets.length > 0 && currentAsset && (
        <Modal
          mediaUrl={currentAsset.CreatedAssetUrl}
          onClose={handleClose}
          fullScreen={isFullScreen}
          onNext={handleNext}
          onPrevious={handlePrevious}
          hasNext={currentIndex < assets.length - 1 || (originalSettings.current?.infiniteLoop || false)}
          hasPrevious={currentIndex > 0 || (originalSettings.current?.infiniteLoop || false)}
          onJumpToFirst={jumpToFirst}
          onJumpToLast={jumpToLast}
          currentAssets={assets.map(a => a.id)}
          // Initialize slideshow parameters from the stored settings
          slideshowInterval={originalSettings.current?.interval || 5000}
          slideshowDirection={originalSettings.current?.direction || 'forward'}
          slideshowInfiniteLoop={originalSettings.current?.infiniteLoop || false}
          // Optional: start slideshow automatically
          autoStartSlideshow={true}
        />
      )}
    </div>
  );
}