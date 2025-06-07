import React, { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import {
  FaExpand,
  FaCompress,
  FaDownload,
  FaChevronLeft,
  FaChevronRight,
  FaHeart,
  FaShare,
  FaPlay,
  FaPause,
  FaCog,
  FaCopy,
  FaHistory,
  FaChevronDown,
  FaChevronUp,
  FaTrash,
  FaExternalLinkAlt,
  FaEdit,
  FaSort,
  FaInfoCircle
} from 'react-icons/fa';

interface SlideshowHistoryItem {
  url: string;
  title: string;
  createdAt: number; // timestamp
  slideshowId: string;
}

interface ModalProps {
  mediaUrl: string;
  onClose: () => void;
  fullScreen?: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
  onLike?: () => void;
  isLiked?: boolean;
  likesCount?: number;
  showLikeButton?: boolean;
  currentItemId?: string;
  onShare?: () => void;
  showShareButton?: boolean;
  onJumpToFirst?: () => void;
  onJumpToLast?: () => void;
  currentAssets?: string[];
  onRemoveFromGroup?: (assetId: string) => void;
  onCreateSlideshow?: (settings: {
    interval: number;
    direction: 'forward' | 'backward';
    infiniteLoop: boolean;
  }) => Promise<{ success: boolean; shareUrl?: string; error?: string }>;
  // Slideshow preview props
  slideshowAssets?: Array<{
    id: string;
    url: string;
    thumbnailUrl?: string;
    assetType: string;
  }>;
  currentAssetIndex?: number;
  onAssetClick?: (index: number) => void;
  onAssetReorder?: (fromIndex: number, toIndex: number) => void;
  onSaveAssetOrder?: (orderedAssets: Array<{id: string; url: string; thumbnailUrl?: string; assetType: string}>) => Promise<void> | void;
  groupId?: string; // Optional group ID for group-specific ordering
  // New props for direct slideshow configuration
  slideshowInterval?: number;
  slideshowDirection?: 'forward' | 'backward';
  slideshowInfiniteLoop?: boolean;
  autoStartSlideshow?: boolean;
  showSlideshowSettings?: boolean;
  // Image edit props
  showImageEditPane?: boolean;
  editPrompt?: string;
  onEditPromptChange?: (value: string) => void;
  onSubmitImageEdit?: () => void;
  onToggleImageEditPane?: () => void;
  isEditingImage?: boolean;
  // Gallery info props
  showGalleryInfoPane?: boolean;
  onToggleGalleryInfoPane?: () => void;
  currentAssetInfo?: {
    id?: string;
    prompt?: string;
    creatorName?: string;
    userId?: string;
    assetType?: string;
  };
  onModifyImage?: (prompt: string) => void;
  onCreateVideo?: () => void;
  onStartFresh?: () => void;
  onSubmitModifyFromGallery?: (prompt: string) => void;
}

const Modal: React.FC<ModalProps> = ({
  mediaUrl,
  onClose,
  fullScreen = false,
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false,
  onLike,
  isLiked = false,
  likesCount = 0,
  showLikeButton = false,
  currentItemId,
  onShare,
  showShareButton = false,
  onJumpToFirst,
  onJumpToLast,
  currentAssets = [],
  onCreateSlideshow,
  // Slideshow preview props with defaults
  slideshowAssets = [],
  currentAssetIndex = 0,
  onAssetClick,
  onAssetReorder,
  onSaveAssetOrder,
  // New props with defaults
  slideshowInterval,
  slideshowDirection,
  slideshowInfiniteLoop,
  autoStartSlideshow = false,
  showSlideshowSettings = false,
  // Image edit props with defaults
  showImageEditPane = false,
  editPrompt = '',
  onEditPromptChange,
  onSubmitImageEdit,
  onToggleImageEditPane,
  isEditingImage = false,
  // Gallery info props with defaults
  showGalleryInfoPane = false,
  onToggleGalleryInfoPane,
  currentAssetInfo,
  onModifyImage,
  onCreateVideo,
  onStartFresh,
  onSubmitModifyFromGallery,
  // Group management props
  groupId,
  onRemoveFromGroup
}) => {
  const [isFullScreen, setIsFullScreen] = useState(fullScreen);
  const [isSlideshow, setIsSlideshow] = useState(false);
  const [slideshowStartTime, setSlideshowStartTime] = useState<number | null>(null);
  const firstSlideShownRef = useRef(false);
  const initialRenderRef = useRef(true); // Track initial render
  // Safe localStorage accessor functions
  const getFromLocalStorage = (key: string, defaultValue: string): string => {
    if (typeof window !== 'undefined') {
      try {
        const item = localStorage.getItem(key);
        return item !== null ? item : defaultValue;
      } catch (error) {
        console.error('Error accessing localStorage:', error);
        return defaultValue;
      }
    }
    return defaultValue;
  };

  const saveToLocalStorage = (key: string, value: string): void => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    }
  };

  // Initialize with props if provided, otherwise use localStorage or defaults
  const [slideInterval, setSlideInterval] = useState(() => {
    // Priority: 1. Props, 2. LocalStorage, 3. Default 5 seconds
    if (slideshowInterval !== undefined) return slideshowInterval;
    const savedInterval = getFromLocalStorage('slideshowInterval', '5000');
    return parseInt(savedInterval, 10);
  });

  const [slideDirection, setSlideDirection] = useState<'forward' | 'backward'>(
    () => {
      // Priority: 1. Props, 2. LocalStorage, 3. Default 'forward'
      if (slideshowDirection !== undefined) return slideshowDirection;
      return getFromLocalStorage('slideshowDirection', 'forward') === 'backward'
        ? 'backward'
        : 'forward';
    }
  );

  const [showSettings, setShowSettings] = useState(showSlideshowSettings);
  const [showReorderMode, setShowReorderMode] = useState(false);

  const [infiniteLoop, setInfiniteLoop] = useState(() => {
    // Priority: 1. Props, 2. LocalStorage, 3. Default false
    if (slideshowInfiniteLoop !== undefined) return slideshowInfiniteLoop;
    return getFromLocalStorage('slideshowInfiniteLoop', 'false') === 'true';
  });

  // States for slideshow sharing
  const [isCreatingSlideshow, setIsCreatingSlideshow] = useState(false);
  const [slideshowUrl, setSlideshowUrl] = useState('');
  const [slideshowError, setSlideshowError] = useState('');
  const slideshowTimerRef = useRef<NodeJS.Timeout | null>(null);

  // States for slideshow history
  const [slideshowHistory, setSlideshowHistory] = useState<
    SlideshowHistoryItem[]
  >([]);
  const [showSlideshowHistory, setShowSlideshowHistory] = useState(false);

  // States for thumbnail strip drag and drop
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  
  // Local state for immediate visual feedback during reordering
  const [localSlideshowAssets, setLocalSlideshowAssets] = useState(slideshowAssets);
  const [localCurrentAssetIndex, setLocalCurrentAssetIndex] = useState(currentAssetIndex);
  
  // Gallery info pane state
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  const [isModifyMode, setIsModifyMode] = useState(false);
  const [modifyPrompt, setModifyPrompt] = useState('');
  const [isSubmittingModify, setIsSubmittingModify] = useState(false);
  
  // Update local slideshow assets when props change
  useEffect(() => {
    // Only update if slideshowAssets is provided and has length
    if (slideshowAssets && slideshowAssets.length > 0) {
      console.log('===== SLIDESHOW ASSETS UPDATED =====');
      console.log('slideshowAssets length:', slideshowAssets.length);
      console.log('currentAssetIndex:', currentAssetIndex);
      console.log('First asset URL:', slideshowAssets[0]?.url);
      console.log('Current asset URL:', slideshowAssets[currentAssetIndex]?.url);
      console.log('===================================');
      setLocalSlideshowAssets(slideshowAssets);
      setLocalCurrentAssetIndex(currentAssetIndex);
    }
  }, [slideshowAssets, currentAssetIndex]);

  // Reset gallery info state when pane closes or asset changes
  useEffect(() => {
    if (!showGalleryInfoPane) {
      setIsPromptExpanded(false);
      setIsModifyMode(false);
      setModifyPrompt('');
      setIsSubmittingModify(false);
    }
  }, [showGalleryInfoPane]);

  // Update modify prompt when currentAssetInfo changes
  useEffect(() => {
    if (currentAssetInfo?.prompt) {
      setModifyPrompt(currentAssetInfo.prompt);
    }
  }, [currentAssetInfo]);

  // Load slideshow history from localStorage and clean up old entries
  const loadAndCleanSlideshowHistory = () => {
    try {
      const history = localStorage.getItem('slideshowHistory');
      if (!history) {
        return [];
      }

      const parsedHistory = JSON.parse(history) as SlideshowHistoryItem[];
      const now = Date.now();
      const tenDaysMs = 10 * 24 * 60 * 60 * 1000; // 10 days in milliseconds

      // Filter out slideshows older than 10 days
      const filteredHistory = parsedHistory.filter((item) => {
        return now - item.createdAt < tenDaysMs;
      });

      // Save the filtered history back to localStorage if we removed any items
      if (parsedHistory.length !== filteredHistory.length) {
        localStorage.setItem(
          'slideshowHistory',
          JSON.stringify(filteredHistory)
        );
        console.log(
          `Cleaned up ${parsedHistory.length - filteredHistory.length} old slideshow links`
        );
      }

      return filteredHistory;
    } catch (error) {
      console.error('Error loading slideshow history:', error);
      return [];
    }
  };

  // Load slideshow history when showing the history panel
  useEffect(() => {
    if (showSlideshowHistory) {
      const history = loadAndCleanSlideshowHistory();
      setSlideshowHistory(history);
    }
  }, [showSlideshowHistory]);

  // Start slideshow with effect dependency on autoStartSlideshow
  useEffect(() => {
    // Start slideshow automatically if specified
    if (autoStartSlideshow) {
      console.log('===== SLIDESHOW AUTO-START =====');
      console.log('autoStartSlideshow set to true');
      console.log('currentAssetIndex:', currentAssetIndex);
      console.log('slideshowAssets length:', slideshowAssets?.length || 0);
      console.log('================================');
      
      // Record the start time when slideshow is activated
      // This helps us ensure the first slide gets its full viewing time
      if (!isSlideshow) {
        console.log('Starting new slideshow and recording start time');
        setSlideshowStartTime(Date.now());
        firstSlideShownRef.current = false;
      }
      
      // Actually start the slideshow
      setIsSlideshow(true);
    } else {
      console.log('autoStartSlideshow is false - not starting slideshow');
      setIsSlideshow(false);
      setSlideshowStartTime(null);
      firstSlideShownRef.current = false;
    }
  }, [autoStartSlideshow, isSlideshow]);

  // Initialize modal with delay when first opened
  useEffect(() => {
    // Reset the initial render flag when mediaUrl changes
    initialRenderRef.current = true;
    
    // Log when media URL changes
    console.log('Media URL changed to:', mediaUrl);
    
    // Reset slideshow state when mediaUrl changes
    // This ensures we properly show the first image
    if (autoStartSlideshow) {
      // This was directly triggered with autoStartSlideshow=true
      // We need to ensure we see the first image, so we'll temporarily disable autostart
      setIsSlideshow(false);
      setSlideshowStartTime(Date.now());
      firstSlideShownRef.current = false;
      
      // Set a delay before enabling slideshow
      setTimeout(() => {
        console.log('Starting slideshow after initial delay');
        setIsSlideshow(true);
      }, 2000); // 2-second delay to ensure first image is visible
    }
  }, [mediaUrl, autoStartSlideshow]);
  
  // Completely rewritten slideshow logic with simpler approach
  useEffect(() => {
    // Only run this effect when slideshow is active
    if (!isSlideshow) return;

    console.log('===== SLIDESHOW STATUS =====');
    console.log('Slideshow is active');
    console.log('Current asset index:', currentAssetIndex);
    console.log('Slideshow start time:', slideshowStartTime);
    console.log('First slide shown:', firstSlideShownRef.current);
    console.log('============================');
    
    // Clear any existing timer to prevent issues
    if (slideshowTimerRef.current) {
      clearTimeout(slideshowTimerRef.current);
      clearInterval(slideshowTimerRef.current);
      slideshowTimerRef.current = null;
    }

    // Special handling for the first slide when slideshow starts
    if (slideshowStartTime && !firstSlideShownRef.current) {
      console.log('First slide being shown - will display for full duration');
      firstSlideShownRef.current = true;
      
      // Create a timeout for the first slide to ensure it's shown for the full duration
      slideshowTimerRef.current = setTimeout(() => {
        console.log(`First slide shown for full ${slideInterval}ms, advancing to next slide`);
        advanceSlideshow();
        
        // After the first slide has been shown, set up the regular interval for subsequent slides
        slideshowTimerRef.current = setInterval(() => {
          console.log('Regular interval triggered, advancing to next slide');
          advanceSlideshow();
        }, slideInterval);
      }, slideInterval);
    } else {
      // Normal operation for subsequent slides
      console.log('Setting up regular slideshow interval');
      slideshowTimerRef.current = setInterval(() => {
        console.log('Regular interval triggered, advancing to next slide');
        advanceSlideshow();
      }, slideInterval);
    }

    // Helper function to advance the slideshow based on direction
    function advanceSlideshow() {
      if (slideDirection === 'forward') {
        if (hasNext && onNext) {
          onNext();
        } else if (!hasNext) {
          if (infiniteLoop && onJumpToFirst) {
            onJumpToFirst();
          } else {
            // Not in infinite loop mode, stop slideshow
            setIsSlideshow(false);
          }
        }
      } else if (slideDirection === 'backward') {
        if (hasPrevious && onPrevious) {
          onPrevious();
        } else if (!hasPrevious) {
          if (infiniteLoop && onJumpToLast) {
            onJumpToLast();
          } else {
            // Not in infinite loop mode, stop slideshow
            setIsSlideshow(false);
          }
        }
      }
    }

    // Cleanup function
    return () => {
      if (slideshowTimerRef.current) {
        clearTimeout(slideshowTimerRef.current);
        clearInterval(slideshowTimerRef.current);
        slideshowTimerRef.current = null;
      }
    };
  }, [
    isSlideshow,
    slideshowStartTime,
    currentAssetIndex,
    slideInterval,
    slideDirection,
    hasNext,
    hasPrevious,
    onNext,
    onPrevious,
    infiniteLoop,
    onJumpToFirst,
    onJumpToLast
  ]);

  // Stop slideshow when modal is closed
  useEffect(() => {
    return () => {
      if (slideshowTimerRef.current) {
        clearInterval(slideshowTimerRef.current);
      }
    };
  }, []);

  const isVideo = mediaUrl.endsWith('.mp4');

  // Helper function to clean up old cache entries
  const cleanupCache = React.useCallback(async (isVideo: boolean) => {
    try {
      const cacheName = isVideo ? 'slideshow-assets-v2' : 'slideshow-images-v2';
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      
      // Remove oldest entries (remove first 25% of cached items)
      const itemsToRemove = Math.ceil(requests.length * 0.25);
      const toRemove = requests.slice(0, itemsToRemove);
      
      await Promise.all(toRemove.map(request => cache.delete(request)));
      console.log(`Cleaned up ${itemsToRemove} cached items`);
    } catch (error) {
      console.warn('Error during cache cleanup:', error);
    }
  }, []);

  // Helper function to safely add to cache with quota management
  const safeCacheAdd = React.useCallback(async (url: string, isVideo: boolean) => {
    if (!('caches' in window)) return;
    
    try {
      const cacheName = isVideo ? 'slideshow-assets-v2' : 'slideshow-images-v2';
      const cache = await caches.open(cacheName);
      
      // Check if already cached to avoid duplicate storage
      const cached = await cache.match(url);
      if (cached) return;
      
      await cache.add(url);
    } catch (error: any) {
      if (error?.name === 'QuotaExceededError') {
        console.warn('Cache quota exceeded, attempting cleanup...');
        await cleanupCache(isVideo);
        // Try once more after cleanup
        try {
          const cacheName = isVideo ? 'slideshow-assets-v2' : 'slideshow-images-v2';
          const cache = await caches.open(cacheName);
          await cache.add(url);
        } catch (retryError) {
          console.warn('Failed to cache after cleanup:', retryError);
        }
      } else {
        console.warn('Failed to cache asset:', error);
      }
    }
  }, [cleanupCache]);

  // Preload the next image if we're in a slideshow
  useEffect(() => {
    if (
      !isVideo &&
      currentAssets &&
      currentAssets.length > 1 &&
      hasNext &&
      mediaUrl
    ) {
      // Find the current asset index
      const currentIndex = currentAssets.findIndex(
        (id) => id === currentItemId
      );

      // If there's a next asset and we know what it is
      if (
        currentIndex !== -1 &&
        currentIndex + 1 < currentAssets.length &&
        onNext
      ) {
        // Use safe caching to preload current image
        safeCacheAdd(mediaUrl, false);
      }
    }
  }, [mediaUrl, currentAssets, currentItemId, isVideo, hasNext, onNext, safeCacheAdd]);

  const toggleSlideshow = () => {
    const newValue = !isSlideshow;
    console.log(`Toggling slideshow to: ${newValue ? 'ON' : 'OFF'}`);
    
    if (newValue) {
      // When turning on slideshow manually, record start time
      console.log('Setting slideshow start time on manual toggle');
      setSlideshowStartTime(Date.now());
      firstSlideShownRef.current = false;
    } else {
      // When turning off, reset the start time
      setSlideshowStartTime(null);
    }
    
    setIsSlideshow(newValue);
  };

  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Helper function to close all panes
  const closeAllPanes = () => {
    setShowSettings(false);
    setShowReorderMode(false);
    if (onToggleImageEditPane && showImageEditPane) {
      onToggleImageEditPane();
    }
    if (onToggleGalleryInfoPane && showGalleryInfoPane) {
      onToggleGalleryInfoPane();
    }
  };

  // Handle clicks on the modal content area (but not on panes themselves)
  const handleModalContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Close all panes when clicking on the modal content area
    // But don't close if clicking on buttons or pane content
    const target = e.target as HTMLElement;
    
    // Don't close if clicking on buttons or interactive elements (but allow image/video clicks to close)
    if (target.closest('button') || 
        target.closest('.modal-pane') || 
        target.closest('input') || 
        target.closest('textarea') ||
        target.closest('select')) {
      return;
    }
    
    // Close all panes when clicking elsewhere in the modal (including on images/videos)
    closeAllPanes();
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  // Handle creating and sharing slideshow
  const handleCreateSlideshow = async () => {
    if (!onCreateSlideshow || currentAssets.length === 0) {
      setSlideshowError('Cannot create slideshow with no assets');
      return;
    }

    try {
      setIsCreatingSlideshow(true);
      setSlideshowError('');

      const result = await onCreateSlideshow({
        interval: slideInterval,
        direction: slideDirection,
        infiniteLoop
      });

      if (result.success && result.shareUrl) {
        setSlideshowUrl(result.shareUrl);

        // Save to slideshow history
        try {
          // Extract slideshowId from URL (format: /slideshow/[id])
          const urlParts = result.shareUrl.split('/');
          const slideshowId = urlParts[urlParts.length - 1];

          // Create new history item
          const newHistoryItem: SlideshowHistoryItem = {
            url: result.shareUrl,
            title: `Slideshow ${new Date().toLocaleString()}`,
            createdAt: Date.now(),
            slideshowId
          };

          // Load existing history
          const existingHistory = loadAndCleanSlideshowHistory();

          // Add new item to the beginning of the array
          const updatedHistory = [newHistoryItem, ...existingHistory];

          // Save updated history
          localStorage.setItem(
            'slideshowHistory',
            JSON.stringify(updatedHistory)
          );

          // Update state if history panel is open
          if (showSlideshowHistory) {
            setSlideshowHistory(updatedHistory);
          }
        } catch (historyError) {
          console.error('Error saving to slideshow history:', historyError);
          // Non-critical error, don't show to user
        }
      } else {
        setSlideshowError(result.error || 'Failed to create slideshow');
      }
    } catch (error) {
      console.error('Error creating slideshow:', error);
      setSlideshowError('An error occurred while creating the slideshow');
    } finally {
      setIsCreatingSlideshow(false);
    }
  };

  // Handle copying slideshow URL to clipboard
  const copyToClipboard = () => {
    if (slideshowUrl) {
      navigator.clipboard
        .writeText(slideshowUrl)
        .then(() => {
          // Show temporary success message
          const originalUrl = slideshowUrl;
          setSlideshowUrl('Copied to clipboard!');

          setTimeout(() => {
            setSlideshowUrl(originalUrl);
          }, 2000);
        })
        .catch((err) => {
          console.error('Failed to copy URL:', err);
          setSlideshowError('Failed to copy URL to clipboard');
        });
    }
  };

  // Handle deleting a slideshow from history
  const deleteSlideshowFromHistory = (slideshowId: string) => {
    try {
      // Load current history
      const history = loadAndCleanSlideshowHistory();

      // Filter out the slideshow to delete
      const updatedHistory = history.filter(
        (item) => item.slideshowId !== slideshowId
      );

      // Save updated history
      localStorage.setItem('slideshowHistory', JSON.stringify(updatedHistory));

      // Update state
      setSlideshowHistory(updatedHistory);
    } catch (error) {
      console.error('Error deleting slideshow from history:', error);
    }
  };

  const handleDownload = async () => {
    try {
      // Generate filename based on URL and current asset info
      const generateFileName = (mediaUrl: string, currentAssetIndex?: number, slideshowAssets?: Array<{assetType: string}>): string => {
        // Extract file extension from the original URL
        let fileExtension = '.jpg'; // Default fallback
        
        // Check if it's a video first
        if (mediaUrl.endsWith('.mp4')) {
          fileExtension = '.mp4';
        } else {
          // Extract extension from URL for images/uploads
          try {
            const urlPath = new URL(mediaUrl).pathname;
            const match = urlPath.match(/\.[a-zA-Z0-9]+$/);
            if (match) {
              fileExtension = match[0].toLowerCase();
            }
          } catch (error) {
            console.log('Could not extract file extension from URL, using default .jpg');
          }
        }
        
        // Determine asset type - check if it's an uploaded asset
        const isUploadedAsset = mediaUrl.includes('gentube-upload-image-storage') || 
                               (slideshowAssets && currentAssetIndex !== undefined && 
                                slideshowAssets[currentAssetIndex]?.assetType === 'upl');
        
        if (isUploadedAsset) {
          return `downloaded-gentube-asset${fileExtension}`;
        } else {
          return `downloaded-gentube-asset${fileExtension}`;
        }
      };

      const fileName = generateFileName(mediaUrl, currentAssetIndex, slideshowAssets);

      // Check if this is an uploaded asset (likely to have CORS issues)
      const isUploadedAsset = mediaUrl.includes('gentube-upload-image-storage') || 
                             (slideshowAssets && currentAssetIndex !== undefined && 
                              slideshowAssets[currentAssetIndex]?.assetType === 'upl');

      // For uploaded assets, use proxy API to avoid CORS issues
      if (isUploadedAsset) {
        console.log('Using API proxy for uploaded asset to avoid CORS issues');
        try {
          // Use a Next.js API route to proxy the download and avoid CORS
          const proxyUrl = `/api/download-proxy?url=${encodeURIComponent(mediaUrl)}&filename=${encodeURIComponent(fileName)}`;
          
          const response = await fetch(proxyUrl);
          if (!response.ok) {
            throw new Error(`Proxy download failed: ${response.status}`);
          }
          
          const blob = await response.blob();
          
          // Create download link from blob
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = fileName;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
          return;
        } catch (error) {
          console.log('Proxy download failed, trying direct approach:', error);
          // If proxy fails, try direct download with Content-Disposition
          const link = document.createElement('a');
          link.href = mediaUrl;
          link.download = fileName;
          // Add additional attributes to force download
          link.setAttribute('type', 'application/octet-stream');
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          return;
        }
      }

      // Standard fetch approach for generated assets (external URLs typically have CORS configured)
      try {
        const response = await fetch(mediaUrl, {
          mode: 'cors',
          credentials: 'omit'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const blob = await response.blob();

        // Create an object URL for the blob
        const blobUrl = window.URL.createObjectURL(blob);

        // Create a temporary anchor element
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;

        // Append to the document, click, and remove
        document.body.appendChild(link);
        link.click();

        // Clean up
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      } catch (corsError) {
        console.log('CORS error with generated asset, falling back to direct download:', corsError);
        // Fallback to direct download if CORS fails
        const link = document.createElement('a');
        link.href = mediaUrl;
        link.download = fileName;
        link.setAttribute('crossorigin', 'anonymous');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error downloading asset:', error);
      alert('Failed to download the asset. The file may not be accessible or may have been moved.');
    }
  };

  // Drag and drop handlers for thumbnail strip
  const handleThumbnailDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    // Prevent any image drag behavior
    e.stopPropagation();
  };

  const handleThumbnailDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleThumbnailDragLeave = (e: React.DragEvent) => {
    // Only clear drag over if we're actually leaving the container
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverIndex(null);
    }
  };

  const handleThumbnailDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Immediately update local state for visual feedback (using display indices)
    const newLocalAssets = [...localSlideshowAssets];
    const [movedItem] = newLocalAssets.splice(draggedIndex, 1);
    newLocalAssets.splice(dropIndex, 0, movedItem);
    setLocalSlideshowAssets(newLocalAssets);
    
    // Update local current asset index to follow the moved item
    let newLocalCurrentIndex = localCurrentAssetIndex;
    if (localCurrentAssetIndex === draggedIndex) {
      // The current asset was moved
      newLocalCurrentIndex = dropIndex;
    } else if (localCurrentAssetIndex > draggedIndex && localCurrentAssetIndex <= dropIndex) {
      // Current asset shifts down
      newLocalCurrentIndex = localCurrentAssetIndex - 1;
    } else if (localCurrentAssetIndex < draggedIndex && localCurrentAssetIndex >= dropIndex) {
      // Current asset shifts up
      newLocalCurrentIndex = localCurrentAssetIndex + 1;
    }
    setLocalCurrentAssetIndex(newLocalCurrentIndex);

    // Call the reorder callback if provided - pass display indices directly
    // The parent component (MyAssets) will handle the conversion to data indices
    if (onAssetReorder) {
      onAssetReorder(draggedIndex, dropIndex);
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleThumbnailDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-90 z-50"
      onClick={handleBackgroundClick}
    >
      <div
        className={`${
          isFullScreen
            ? 'fixed inset-0 m-0 p-0 bg-black'
            : 'bg-white p-4 rounded shadow-lg max-w-5xl w-11/12 relative'
        }`}
        onClick={handleModalContentClick}
      >
        <div className="absolute top-2 right-2 flex space-x-2 z-10">
          {/* Slideshow button */}
          {(hasNext || hasPrevious) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSlideshow();
              }}
              className="bg-gray-800 bg-opacity-70 hover:bg-opacity-90 rounded-full p-2 text-white focus:outline-none transition-all shadow-md"
              title={isSlideshow ? 'Pause slideshow' : 'Play slideshow'}
            >
              {isSlideshow ? <FaPause /> : <FaPlay />}
            </button>
          )}

          {/* Slideshow settings button */}
          {(hasNext || hasPrevious) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Close all other panes first
                if (onToggleImageEditPane && showImageEditPane) {
                  onToggleImageEditPane();
                }
                if (onToggleGalleryInfoPane && showGalleryInfoPane) {
                  onToggleGalleryInfoPane();
                }
                setShowReorderMode(false);
                // Then toggle settings
                setShowSettings(!showSettings);
              }}
              className={`${showSettings ? 'bg-blue-600' : 'bg-gray-800 bg-opacity-70'} hover:bg-opacity-90 rounded-full p-2 text-white focus:outline-none transition-all shadow-md`}
              title="Slideshow settings"
            >
              <FaCog />
            </button>
          )}

          {/* Reorder button - only show if there are assets to reorder */}
          {localSlideshowAssets.length > 1 && onAssetReorder && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Close all other panes first
                if (onToggleImageEditPane && showImageEditPane) {
                  onToggleImageEditPane();
                }
                if (onToggleGalleryInfoPane && showGalleryInfoPane) {
                  onToggleGalleryInfoPane();
                }
                setShowSettings(false);
                // Exit full-screen mode if enabled so user can see reorder interface
                if (isFullScreen) {
                  setIsFullScreen(false);
                }
                // Then toggle reorder mode
                setShowReorderMode(!showReorderMode);
              }}
              className={`${showReorderMode ? 'bg-blue-600' : 'bg-gray-800 bg-opacity-70'} hover:bg-opacity-90 rounded-full p-2 text-white focus:outline-none transition-all shadow-md`}
              title="Reorder slideshow"
            >
              <FaSort />
            </button>
          )}

          {/* Image Edit button - only show for images */}
          {!isVideo && onSubmitImageEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Close all other panes first
                if (onToggleGalleryInfoPane && showGalleryInfoPane) {
                  onToggleGalleryInfoPane();
                }
                setShowSettings(false);
                setShowReorderMode(false);
                // Then toggle the edit pane state by calling parent component
                if (onToggleImageEditPane) {
                  onToggleImageEditPane();
                }
              }}
              className={`${showImageEditPane ? 'bg-blue-600' : 'bg-gray-800 bg-opacity-70'} hover:bg-opacity-90 rounded-full p-2 text-white focus:outline-none transition-all shadow-md`}
              title="Edit image"
            >
              <FaEdit />
            </button>
          )}

          {/* Gallery Info button */}
          {onToggleGalleryInfoPane && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Close all other panes first
                if (onToggleImageEditPane && showImageEditPane) {
                  onToggleImageEditPane();
                }
                setShowSettings(false);
                setShowReorderMode(false);
                // Then toggle the gallery info pane state by calling parent component
                if (onToggleGalleryInfoPane) {
                  onToggleGalleryInfoPane();
                }
              }}
              className={`${showGalleryInfoPane ? 'bg-blue-600' : 'bg-gray-800 bg-opacity-70'} hover:bg-opacity-90 rounded-full p-2 text-white focus:outline-none transition-all shadow-md`}
              title="Gallery info"
            >
              <FaInfoCircle />
            </button>
          )}
          {/* Download button */}
          <button
            onClick={handleDownload}
            className="bg-gray-800 bg-opacity-70 hover:bg-opacity-90 rounded-full p-2 text-white focus:outline-none transition-all shadow-md"
            title="Download media"
          >
            <FaDownload />
          </button>

          {/* Like/Heart button - only shown if the feature is enabled */}
          {showLikeButton && onLike && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onLike) onLike();
              }}
              className={`bg-gray-800 bg-opacity-70 hover:bg-opacity-90 rounded-full p-2 ${isLiked ? 'text-red-500' : 'text-white'} focus:outline-none transition-all shadow-md flex items-center`}
              title={isLiked ? 'Unlike' : 'Like'}
            >
              {likesCount > 0 && (
                <span className="mr-1 text-xs font-medium">{likesCount}</span>
              )}
              <FaHeart />
            </button>
          )}

          {/* Fullscreen toggle button */}
          <button
            onClick={toggleFullScreen}
            className="bg-gray-800 bg-opacity-70 hover:bg-opacity-90 rounded-full p-2 text-white focus:outline-none transition-all shadow-md"
            title={isFullScreen ? 'Exit full screen' : 'Full screen'}
          >
            {isFullScreen ? <FaCompress /> : <FaExpand />}
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            className="bg-gray-800 bg-opacity-70 hover:bg-opacity-90 hover:bg-red-700 rounded-full p-2 text-white focus:outline-none transition-all shadow-md text-2xl font-bold"
            title="Close"
          >
            ×
          </button>
        </div>

        {/* Image Edit panel */}
        {showImageEditPane && (
          <div className="modal-pane absolute top-14 right-2 bg-white dark:bg-gray-800 bg-opacity-95 dark:bg-opacity-90 p-4 rounded-lg text-gray-900 dark:text-white z-30 shadow-lg transition-all w-80 border border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-bold mb-3 text-gray-900 dark:text-white">
              Edit Image
            </h3>

            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Describe how you want to edit this image:
              </label>
              <textarea
                value={editPrompt}
                onChange={(e) =>
                  onEditPromptChange && onEditPromptChange(e.target.value)
                }
                placeholder="e.g., change the background to a sunset, add a vintage filter, make it black and white..."
                className="w-full p-3 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:outline-none resize-vertical"
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (onEditPromptChange) onEditPromptChange('');
                }}
                className="flex-1 px-3 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-700 rounded text-gray-800 dark:text-white transition-colors"
              >
                Clear
              </button>
              <button
                onClick={onSubmitImageEdit}
                disabled={!editPrompt.trim() || isEditingImage}
                className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white transition-colors flex items-center justify-center"
              >
                {isEditingImage ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Editing...
                  </>
                ) : (
                  'Edit Image'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Gallery Info panel */}
        {showGalleryInfoPane && (
          <div className="modal-pane absolute top-14 right-2 bg-white dark:bg-gray-800 bg-opacity-95 dark:bg-opacity-90 p-4 rounded-lg text-gray-900 dark:text-white z-30 shadow-lg transition-all w-[600px] max-w-[90vw] border border-gray-200 dark:border-gray-600 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-3 text-gray-900 dark:text-white">
              Gallery Information
            </h3>

            {currentAssetInfo ? (
              <>
                {/* Asset ID */}
                {currentAssetInfo.id && (
                  <div className="mb-4">
                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Asset ID:
                    </label>
                    <p className="text-xs font-mono bg-gray-100 dark:bg-gray-700 p-2 rounded border break-all">
                      {currentAssetInfo.id}
                    </p>
                  </div>
                )}

                {/* Prompt */}
                {currentAssetInfo.prompt && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Prompt:
                      </label>
                      {!isModifyMode && currentAssetInfo.prompt.length > 150 && (
                        <button
                          onClick={() => setIsPromptExpanded(!isPromptExpanded)}
                          className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {isPromptExpanded ? 'Show less' : 'Show more'}
                        </button>
                      )}
                    </div>
                    {isModifyMode ? (
                      <div className="space-y-3">
                        <textarea
                          value={modifyPrompt}
                          onChange={(e) => setModifyPrompt(e.target.value)}
                          className="w-full h-32 text-sm bg-gray-50 dark:bg-gray-700 p-3 rounded border resize-vertical focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Modify your prompt here..."
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setIsModifyMode(false);
                              setModifyPrompt(currentAssetInfo.prompt || '');
                            }}
                            className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-700 rounded text-gray-800 dark:text-white transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              if (onSubmitModifyFromGallery && modifyPrompt.trim()) {
                                setIsSubmittingModify(true);
                                try {
                                  onSubmitModifyFromGallery(modifyPrompt.trim());
                                  setIsModifyMode(false);
                                } catch (error) {
                                  console.error('Error submitting modify:', error);
                                } finally {
                                  setIsSubmittingModify(false);
                                }
                              }
                            }}
                            disabled={!modifyPrompt.trim() || isSubmittingModify}
                            className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white transition-colors flex items-center gap-1"
                          >
                            {isSubmittingModify ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                Submitting...
                              </>
                            ) : (
                              'Submit Modify'
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm bg-gray-50 dark:bg-gray-700 p-3 rounded border">
                        <p className={isPromptExpanded ? '' : 'line-clamp-3'}>
                          {currentAssetInfo.prompt}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Creator */}
                <div className="mb-6">
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Created by:
                  </label>
                  <p className="text-sm">
                    {currentAssetInfo.creatorName ? (
                      currentAssetInfo.creatorName
                    ) : (
                      <span className="text-gray-500">Anonymous</span>
                    )}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {/* Modify Image Button */}
                  {currentAssetInfo.assetType !== 'vid' && currentAssetInfo.prompt && (
                    <button
                      onClick={() => {
                        if (isModifyMode) {
                          // If already in modify mode, submit the modification
                          if (onSubmitModifyFromGallery && modifyPrompt.trim()) {
                            setIsSubmittingModify(true);
                            try {
                              onSubmitModifyFromGallery(modifyPrompt.trim());
                              setIsModifyMode(false);
                            } catch (error) {
                              console.error('Error submitting modify:', error);
                            } finally {
                              setIsSubmittingModify(false);
                            }
                          }
                        } else {
                          // Enter modify mode
                          setIsModifyMode(true);
                          setIsPromptExpanded(true);
                          setModifyPrompt(currentAssetInfo.prompt || '');
                        }
                      }}
                      disabled={isModifyMode && (!modifyPrompt.trim() || isSubmittingModify)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                    >
                      <FaEdit />
                      {isModifyMode ? (isSubmittingModify ? 'Submitting...' : 'Submit Modify') : 'Modify Image'}
                    </button>
                  )}

                  {/* Create Video Button */}
                  {onCreateVideo && (
                    <button
                      onClick={onCreateVideo}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                    >
                      <FaPlay />
                      Create Video
                    </button>
                  )}

                  {/* Start Fresh Button */}
                  {onStartFresh && (
                    <button
                      onClick={onStartFresh}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                    >
                      <FaExternalLinkAlt />
                      Start Fresh
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-4 text-gray-500">
                No gallery information available
              </div>
            )}
          </div>
        )}

        {/* Slideshow settings panel */}
        {showSettings && (
          <div className="modal-pane absolute top-14 right-2 bg-white dark:bg-gray-800 bg-opacity-95 dark:bg-opacity-90 p-4 rounded-lg text-gray-900 dark:text-white z-30 shadow-lg transition-all w-64 border border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-bold mb-1 text-gray-900 dark:text-white">
              Slideshow Settings
            </h3>

            <div className="mb-2">
              <label className="block mb-2 text-sm text-gray-700 dark:text-gray-300">
                Interval (seconds)
              </label>
              <input
                type="range"
                min="3"
                max="20"
                step="1.0"
                value={slideInterval / 1000}
                onChange={(e) => {
                  const newValue = Number(e.target.value) * 1000;
                  setSlideInterval(newValue);
                  // Save to localStorage
                  saveToLocalStorage('slideshowInterval', newValue.toString());
                }}
                className="w-full"
              />
              <div className="flex justify-between text-xs mt-1 text-gray-600 dark:text-gray-400">
                <span>3s</span>
                <span>{slideInterval / 1000}s</span>
                <span>20s</span>
              </div>
            </div>

            <div className="mb-2">
              <label className="block mb-1 text-sm text-gray-700 dark:text-gray-300">
                Direction
              </label>
              <div className="flex justify-between">
                <button
                  onClick={() => {
                    setSlideDirection('backward');
                    saveToLocalStorage('slideshowDirection', 'backward');
                  }}
                  className={`px-3 py-1 rounded text-white ${slideDirection === 'backward' ? 'bg-blue-500' : 'bg-gray-500 dark:bg-gray-600'}`}
                >
                  Backward
                </button>
                <button
                  onClick={() => {
                    setSlideDirection('forward');
                    saveToLocalStorage('slideshowDirection', 'forward');
                  }}
                  className={`px-3 py-1 rounded text-white ${slideDirection === 'forward' ? 'bg-blue-500' : 'bg-gray-500 dark:bg-gray-600'}`}
                >
                  Forward
                </button>
              </div>
            </div>

            {/* Infinite Loop Toggle */}
            <div className="mb-3">
              <div className="flex items-center justify-start">
                <label className="text-sm pr-2 text-gray-700 dark:text-gray-300">
                  Infinite Loop
                </label>
                <div
                  className={`relative inline-block w-12 h-6 transition-colors duration-200 ease-in-out rounded-full cursor-pointer ${infiniteLoop ? 'bg-blue-500' : 'bg-gray-400 dark:bg-gray-600'}`}
                  onClick={() => {
                    const newValue = !infiniteLoop;
                    setInfiniteLoop(newValue);
                    saveToLocalStorage(
                      'slideshowInfiniteLoop',
                      newValue.toString()
                    );
                  }}
                >
                  <span
                    className={`absolute left-1 top-1 w-4 h-4 transition-transform duration-200 ease-in-out bg-white rounded-full transform ${
                      infiniteLoop ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  ></span>
                </div>
              </div>
            </div>

            {/* Share Slideshow */}
            {onCreateSlideshow && (
              <div className="mt-4 border-t border-gray-300 dark:border-gray-600 pt-4">
                <h4 className="text-md font-bold mb-3 text-gray-900 dark:text-white">
                  Sharing
                </h4>

                {!slideshowUrl ? (
                  <button
                    onClick={handleCreateSlideshow}
                    disabled={isCreatingSlideshow}
                    className="flex items-center justify-center w-full px-3 py-2 bg-blue-500 hover:bg-blue-600 rounded text-white transition-colors"
                  >
                    {isCreatingSlideshow ? (
                      <span>Creating...</span>
                    ) : (
                      <>
                        <FaShare className="mr-2" />
                        <span>Create Shareable Slideshow</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="flex flex-col">
                    <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-xs mb-2 overflow-hidden text-ellipsis text-gray-800 dark:text-gray-200">
                      {slideshowUrl}
                    </div>
                    <button
                      onClick={copyToClipboard}
                      className="flex items-center justify-center w-full px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-white transition-colors"
                    >
                      <FaCopy className="mr-2" />
                      <span>Copy Link</span>
                    </button>
                  </div>
                )}

                {slideshowError && (
                  <div className="mt-2 text-red-500 dark:text-red-400 text-xs">
                    {slideshowError}
                  </div>
                )}

                {/* Slideshow History Section */}
                <div className="mt-4">
                  <button
                    onClick={() =>
                      setShowSlideshowHistory(!showSlideshowHistory)
                    }
                    className="flex items-center justify-between w-full px-2 py-2 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-left"
                  >
                    <div className="flex items-center">
                      <FaHistory className="mr-2" />
                      <span>Your Slideshow Links</span>
                    </div>
                    {showSlideshowHistory ? <FaChevronUp /> : <FaChevronDown />}
                  </button>

                  {showSlideshowHistory && (
                    <div className="mt-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded p-2">
                      {slideshowHistory.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-2">
                          No slideshows yet
                        </p>
                      ) : (
                        <ul className="max-h-40 overflow-y-auto">
                          {slideshowHistory.map((item, index) => (
                            <li
                              key={item.slideshowId}
                              className="flex items-center justify-between py-2 border-b border-gray-300 dark:border-gray-700 last:border-b-0"
                            >
                              <div className="flex-grow overflow-hidden mr-2">
                                <div className="text-sm truncate text-gray-800 dark:text-gray-200">
                                  {item.title}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(
                                    item.createdAt
                                  ).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300"
                                  title="Open slideshow"
                                >
                                  <FaExternalLinkAlt />
                                </a>
                                <button
                                  onClick={(event) => {
                                    navigator.clipboard.writeText(item.url);

                                    // Show temporary tooltip
                                    const tooltip =
                                      document.createElement('div');
                                    tooltip.textContent = 'Copied!';
                                    tooltip.style.position = 'absolute';
                                    tooltip.style.backgroundColor =
                                      'rgba(0,0,0,0.7)';
                                    tooltip.style.color = 'white';
                                    tooltip.style.padding = '4px 8px';
                                    tooltip.style.borderRadius = '4px';
                                    tooltip.style.fontSize = '12px';
                                    tooltip.style.zIndex = '1000';
                                    tooltip.style.opacity = '0';
                                    tooltip.style.transition = 'opacity 0.3s';

                                    // Position near button
                                    const rect = (
                                      event.target as HTMLElement
                                    ).getBoundingClientRect();
                                    tooltip.style.top = `${rect.top - 30}px`;
                                    tooltip.style.left = `${rect.left}px`;

                                    document.body.appendChild(tooltip);
                                    setTimeout(() => {
                                      tooltip.style.opacity = '1';
                                    }, 10);
                                    setTimeout(() => {
                                      tooltip.style.opacity = '0';
                                      setTimeout(
                                        () =>
                                          document.body.removeChild(tooltip),
                                        300
                                      );
                                    }, 2000);
                                  }}
                                  className="text-gray-400 hover:text-gray-300"
                                  title="Copy link"
                                >
                                  <FaCopy />
                                </button>
                                <button
                                  onClick={() =>
                                    deleteSlideshowFromHistory(item.slideshowId)
                                  }
                                  className="text-red-500 hover:text-red-400"
                                  title="Delete from history"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div
          className={`flex justify-center items-center ${isFullScreen ? 'h-screen' : ''} relative w-full`}
        >
          {/* Previous button */}
          {hasPrevious && onPrevious && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPrevious();
              }}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gray-800 bg-opacity-70 hover:bg-opacity-90 rounded-full p-3 text-white focus:outline-none transition-all shadow-md z-10"
              title="Previous"
            >
              <FaChevronLeft size={24} />
            </button>
          )}

          {/* Media content */}
          <div className="flex justify-center items-center max-w-full">
            {(() => {
              // Use safe caching for the current media
              safeCacheAdd(mediaUrl, isVideo);

              if (isVideo) {
                return (
                  <video
                    src={mediaUrl}
                    controls
                    autoPlay
                    className={`${isFullScreen ? 'max-h-screen max-w-screen' : 'max-w-full max-h-[70vh]'} object-contain`}
                    style={{ boxShadow: '0 0 8px rgba(0, 0, 0, 0.3)' }}
                  />
                );
              } else {
                return (
                  <Image
                    src={mediaUrl}
                    alt="Media"
                    width={800}
                    height={600}
                    unoptimized
                    className={`${isFullScreen ? 'max-h-screen max-w-screen' : 'max-w-full max-h-[70vh]'} object-contain ${mediaUrl.endsWith('.png') ? 'bg-checkerboard' : ''}`}
                    style={{
                      boxShadow: '0 0 8px rgba(0, 0, 0, 0.3)',
                      objectFit: 'contain',
                      width: 'auto',
                      height: 'auto'
                    }}
                    priority
                    onLoad={() => {
                      console.log('Image loaded:', mediaUrl);
                      // Mark when first image is fully loaded
                      if (initialRenderRef.current) {
                        console.log('INITIAL IMAGE FULLY LOADED');
                        initialRenderRef.current = false;
                      }
                    }}
                  />
                );
              }
            })()}
          </div>


          {/* Next button */}
          {hasNext && onNext && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNext();
              }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-800 bg-opacity-70 hover:bg-opacity-90 rounded-full p-3 text-white focus:outline-none transition-all shadow-md z-10"
              title="Next"
            >
              <FaChevronRight size={24} />
            </button>
          )}
        </div>

        {/* Slideshow thumbnail strip - positioned below the image */}
        {showReorderMode && localSlideshowAssets.length > 0 && (
          <div className="modal-pane mt-4 bg-gray-800 bg-opacity-90 p-2 md:p-3 rounded-lg w-full">
            {/* Instructions */}
            <div className="text-center mb-3">
              <p className="text-xs md:text-sm text-gray-300 mb-1">
                <span className="hidden md:inline">Drag thumbnails to reorder slideshow • </span>
                <span className="md:hidden">Drag to reorder • </span>
                Scroll horizontally to see all images
              </p>
              <div className="text-xs text-gray-400">
                Total images: {localSlideshowAssets.length}
              </div>
            </div>
            {/* Horizontal scroll container with visible scrollbar */}
            <div 
              className="overflow-x-auto overflow-y-hidden pb-2 scrollbar-thin scrollbar-track-gray-700 scrollbar-thumb-gray-500 hover:scrollbar-thumb-gray-400"
              style={{ 
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'thin',
                scrollbarColor: '#6B7280 #374151'
              }}
            >
              <div className="flex space-x-1 md:space-x-2 justify-start pb-1 min-w-max">
              {localSlideshowAssets.map((asset, index) => (
                <div
                  key={asset.id}
                  className={`relative flex-shrink-0 cursor-pointer transition-all duration-200 ${
                    index === localCurrentAssetIndex
                      ? 'ring-2 ring-blue-500 scale-110'
                      : 'hover:scale-105'
                  } ${draggedIndex === index ? 'opacity-50' : ''} ${
                    dragOverIndex === index ? 'ring-2 ring-yellow-500' : ''
                  }`}
                  draggable={true}
                  onDragStart={(e) => handleThumbnailDragStart(e, index)}
                  onDragOver={(e) => handleThumbnailDragOver(e, index)}
                  onDragLeave={handleThumbnailDragLeave}
                  onDrop={(e) => handleThumbnailDrop(e, index)}
                  onDragEnd={handleThumbnailDragEnd}
                  onClick={(e) => {
                    // Only handle click if we're not dragging
                    if (draggedIndex === null && onAssetClick) {
                      onAssetClick(index);
                    }
                  }}
                >
                  {asset.assetType === 'vid' ? (
                    <div className="relative w-12 h-12 md:w-16 md:h-16 bg-gray-700 rounded overflow-hidden">
                      <video
                        src={asset.url}
                        className="w-full h-full object-cover pointer-events-none"
                        muted
                        preload="metadata"
                        draggable={false}
                        onDragStart={(e) => e.preventDefault()}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <FaPlay className="text-white text-xs opacity-80" />
                      </div>
                    </div>
                  ) : (
                    <Image
                      src={asset.thumbnailUrl || asset.url}
                      alt={`Slideshow item ${index + 1}`}
                      width={64}
                      height={64}
                      unoptimized
                      draggable={false}
                      className="w-12 h-12 md:w-16 md:h-16 object-cover rounded pointer-events-none"
                      style={{ objectFit: 'cover' }}
                      onDragStart={(e) => e.preventDefault()}
                    />
                  )}

                  {/* Index indicator */}
                  <div className="absolute -top-1 -left-1 bg-gray-800 text-white text-xs rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center">
                    <span className="text-xs md:text-xs">{index + 1}</span>
                  </div>

                  {/* Drag indicator */}
                  <div className="absolute top-0 right-0 bg-gray-600 text-white text-xs rounded-bl px-0.5 md:px-1">
                    <span className="text-xs">⋮⋮</span>
                  </div>
                  
                  {/* Trash icon - only show when viewing a group */}
                  {groupId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Remove this item from the group?`)) {
                          // Call a callback to remove the asset
                          if (onRemoveFromGroup) {
                            onRemoveFromGroup(asset.id);
                          }
                        }
                      }}
                      className="absolute bottom-0 right-0 bg-red-600 bg-opacity-70 hover:bg-opacity-100 rounded-tl-md text-white p-1 focus:outline-none transition-all shadow-md z-10"
                      title="Remove from group"
                    >
                      <FaTrash className="text-xs" />
                    </button>
                  )}
                </div>
              ))}
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 mt-2">
              {/* Save Order Button */}
              <button
                onClick={async () => {
                  if (onSaveAssetOrder && !isSavingOrder) {
                    try {
                      setIsSavingOrder(true);
                      // Pass the current reordered assets from local state
                      await onSaveAssetOrder(localSlideshowAssets);
                      // Success feedback is handled by parent component or can be added here
                    } catch (error) {
                      console.error('Error saving asset order:', error);
                      // Could add error notification here
                    } finally {
                      setIsSavingOrder(false);
                    }
                  }
                }}
                disabled={!onSaveAssetOrder || isSavingOrder}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white text-xs md:text-sm px-2 md:px-3 py-1 rounded transition-colors flex items-center"
                title="Save the current order to database"
              >
                {isSavingOrder ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                    Saving...
                  </>
                ) : (
                  'Save Order'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
