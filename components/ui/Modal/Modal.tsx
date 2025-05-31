import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  FaEdit
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
  isEditingImage = false
}) => {
  const [isFullScreen, setIsFullScreen] = useState(fullScreen);
  const [isSlideshow, setIsSlideshow] = useState(autoStartSlideshow);
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
  const [slideshowHistory, setSlideshowHistory] = useState<SlideshowHistoryItem[]>([]);
  const [showSlideshowHistory, setShowSlideshowHistory] = useState(false);

  // States for thumbnail strip drag and drop
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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
      const filteredHistory = parsedHistory.filter(item => {
        return (now - item.createdAt) < tenDaysMs;
      });
      
      // Save the filtered history back to localStorage if we removed any items
      if (parsedHistory.length !== filteredHistory.length) {
        localStorage.setItem('slideshowHistory', JSON.stringify(filteredHistory));
        console.log(`Cleaned up ${parsedHistory.length - filteredHistory.length} old slideshow links`);
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
      setIsSlideshow(true);
    }
  }, [autoStartSlideshow]);

  // Slideshow logic
  useEffect(() => {
    if (isSlideshow) {
      // Clear any existing timer
      if (slideshowTimerRef.current) {
        clearInterval(slideshowTimerRef.current);
      }

      // Set new timer
      slideshowTimerRef.current = setInterval(() => {
        // Forward direction logic
        if (slideDirection === 'forward') {
          if (hasNext && onNext) {
            // Normal forward navigation
            onNext();
          } else if (!hasNext) {
            if (infiniteLoop && onJumpToFirst) {
              // We've reached the end, jump directly to first image
              onJumpToFirst();
            } else {
              // Not in infinite loop mode, stop slideshow
              setIsSlideshow(false);
            }
          }
        }
        // Backward direction logic
        else if (slideDirection === 'backward') {
          if (hasPrevious && onPrevious) {
            // Normal backward navigation
            onPrevious();
          } else if (!hasPrevious) {
            if (infiniteLoop && onJumpToLast) {
              // We've reached the beginning, jump directly to last image
              onJumpToLast();
            } else {
              // Not in infinite loop mode, stop slideshow
              setIsSlideshow(false);
            }
          }
        }
      }, slideInterval);
    }

    // Cleanup function
    return () => {
      if (slideshowTimerRef.current) {
        clearInterval(slideshowTimerRef.current);
      }
    };
  }, [
    isSlideshow,
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
  
  // Preload the next image if we're in a slideshow
  useEffect(() => {
    if (!isVideo && currentAssets && currentAssets.length > 1 && hasNext && mediaUrl) {
      // Find the current asset index
      const currentIndex = currentAssets.findIndex(id => id === currentItemId);
      
      // If there's a next asset and we know what it is
      if (currentIndex !== -1 && currentIndex + 1 < currentAssets.length && onNext) {
        // We need to somehow get the URL of the next asset, but we don't have direct access
        // Instead, let's use the service worker to preload the current image
        // which will make navigation faster even if we can't preload the exact next one
        if ('serviceWorker' in navigator && 'caches' in window) {
          caches.open('slideshow-images-v2').then(cache => {
            cache.add(mediaUrl).catch(err => {
              console.warn('Failed to cache current asset:', err);
            });
          });
        }
      }
    }
  }, [mediaUrl, currentAssets, currentItemId, isVideo, hasNext, onNext]);

  const toggleSlideshow = () => {
    setIsSlideshow(!isSlideshow);
  };

  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
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
          localStorage.setItem('slideshowHistory', JSON.stringify(updatedHistory));
          
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
      const updatedHistory = history.filter(item => item.slideshowId !== slideshowId);
      
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
      // Determine file extension based on media type
      const isVideo = mediaUrl.endsWith('.mp4');
      const fileExtension = isVideo ? '.mp4' : '.jpg';
      const fileName = `gentube-download${fileExtension}`;

      // Try to get the file from cache first if service worker is active
      let blob;
      if ('caches' in window) {
        try {
          const cache = await caches.open(isVideo ? 'slideshow-assets-v2' : 'slideshow-images-v2');
          const cachedResponse = await cache.match(mediaUrl);
          
          if (cachedResponse) {
            console.log('Using cached version for download');
            blob = await cachedResponse.blob();
          }
        } catch (cacheError) {
          console.warn('Error accessing cache:', cacheError);
          // Continue with network fetch
        }
      }
      
      // If we couldn't get from cache, fetch from network
      if (!blob) {
        const response = await fetch(mediaUrl);
        blob = await response.blob();
        
        // Add to cache for future use
        if ('caches' in window) {
          try {
            const cache = await caches.open(isVideo ? 'slideshow-assets-v2' : 'slideshow-images-v2');
            const response = new Response(blob);
            await cache.put(mediaUrl, response);
          } catch (cacheError) {
            console.warn('Error adding to cache:', cacheError);
          }
        }
      }

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
    } catch (error) {
      console.error('Error downloading media:', error);
      alert('Failed to download the media');
    }
  };

  // Drag and drop handlers for thumbnail strip
  const handleThumbnailDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', '');
  };

  const handleThumbnailDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
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
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Call the reorder callback if provided
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
                setShowSettings(!showSettings);
              }}
              className={`bg-gray-800 bg-opacity-70 hover:bg-opacity-90 rounded-full p-2 text-white focus:outline-none transition-all shadow-md ${showSettings ? 'bg-blue-600' : ''}`}
              title="Slideshow settings"
            >
              <FaCog />
            </button>
          )}

          {/* Image Edit button - only show for images */}
          {!isVideo && onSubmitImageEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Toggle between edit pane and settings (only one should be open)
                setShowSettings(false);
                // Toggle the edit pane state by calling parent component
                if (onToggleImageEditPane) {
                  onToggleImageEditPane();
                }
              }}
              className={`bg-gray-800 bg-opacity-70 hover:bg-opacity-90 rounded-full p-2 text-white focus:outline-none transition-all shadow-md ${showImageEditPane ? 'bg-blue-600' : ''}`}
              title="Edit image"
            >
              <FaEdit />
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

          {/* Share button - only shown if the feature is enabled */}
          {showShareButton && onShare && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onShare) onShare();
              }}
              className="bg-gray-800 bg-opacity-70 hover:bg-opacity-90 rounded-full p-2 text-white focus:outline-none transition-all shadow-md"
              title="Share"
            >
              <FaShare />
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
          <div className="absolute top-14 right-2 bg-gray-800 bg-opacity-90 p-4 rounded-lg text-white z-10 shadow-lg transition-all w-80">
            <h3 className="text-lg font-bold mb-3">Edit Image</h3>
            
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium">
                Describe how you want to edit this image:
              </label>
              <textarea
                value={editPrompt}
                onChange={(e) => onEditPromptChange && onEditPromptChange(e.target.value)}
                placeholder="e.g., change the background to a sunset, add a vintage filter, make it black and white..."
                className="w-full p-3 rounded bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:border-blue-500 focus:outline-none resize-vertical"
                rows={4}
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (onEditPromptChange) onEditPromptChange('');
                }}
                className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white transition-colors"
              >
                Clear
              </button>
              <button
                onClick={onSubmitImageEdit}
                disabled={!editPrompt.trim() || isEditingImage}
                className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white transition-colors flex items-center justify-center"
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

        {/* Slideshow settings panel */}
        {showSettings && (
          <div className="absolute top-14 right-2 bg-gray-800 bg-opacity-90 p-4 rounded-lg text-white z-10 shadow-lg transition-all w-64">
            <h3 className="text-lg font-bold mb-1">Slideshow Settings</h3>

            <div className="mb-2">
              <label className="block mb-2 text-sm">Interval (seconds)</label>
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
              <div className="flex justify-between text-xs mt-1">
                <span>3s</span>
                <span>{slideInterval / 1000}s</span>
                <span>20s</span>
              </div>
            </div>

            <div className="mb-2">
              <label className="block mb-1 text-sm">Direction</label>
              <div className="flex justify-between">
                <button
                  onClick={() => {
                    setSlideDirection('backward');
                    saveToLocalStorage('slideshowDirection', 'backward');
                  }}
                  className={`px-3 py-1 rounded ${slideDirection === 'backward' ? 'bg-blue-500' : 'bg-gray-600'}`}
                >
                  Backward
                </button>
                <button
                  onClick={() => {
                    setSlideDirection('forward');
                    saveToLocalStorage('slideshowDirection', 'forward');
                  }}
                  className={`px-3 py-1 rounded ${slideDirection === 'forward' ? 'bg-blue-500' : 'bg-gray-600'}`}
                >
                  Forward
                </button>
              </div>
            </div>

            {/* Infinite Loop Toggle */}
            <div className="mb-3">
              <div className="flex items-center justify-start">
                <label className="text-sm pr-2">Infinite Loop</label>
                <div
                  className={`relative inline-block w-12 h-6 transition-colors duration-200 ease-in-out rounded-full cursor-pointer ${infiniteLoop ? 'bg-blue-500' : 'bg-gray-600'}`}
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
              <div className="mt-4 border-t border-gray-600 pt-4">
                <h4 className="text-md font-bold mb-3">Sharing</h4>

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
                    <div className="bg-gray-700 p-2 rounded text-xs mb-2 overflow-hidden text-ellipsis">
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
                  <div className="mt-2 text-red-400 text-xs">
                    {slideshowError}
                  </div>
                )}
                
                {/* Slideshow History Section */}
                <div className="mt-4">
                  <button
                    onClick={() => setShowSlideshowHistory(!showSlideshowHistory)}
                    className="flex items-center justify-between w-full px-2 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white text-left"
                  >
                    <div className="flex items-center">
                      <FaHistory className="mr-2" />
                      <span>Your Slideshow Links</span>
                    </div>
                    {showSlideshowHistory ? <FaChevronUp /> : <FaChevronDown />}
                  </button>
                  
                  {showSlideshowHistory && (
                    <div className="mt-2 bg-gray-800 border border-gray-700 rounded p-2">
                      {slideshowHistory.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-2">No slideshows yet</p>
                      ) : (
                        <ul className="max-h-40 overflow-y-auto">
                          {slideshowHistory.map((item, index) => (
                            <li key={item.slideshowId} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0">
                              <div className="flex-grow overflow-hidden mr-2">
                                <div className="text-sm truncate">
                                  {item.title}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {new Date(item.createdAt).toLocaleDateString()}
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
                                    const tooltip = document.createElement('div');
                                    tooltip.textContent = 'Copied!';
                                    tooltip.style.position = 'absolute';
                                    tooltip.style.backgroundColor = 'rgba(0,0,0,0.7)';
                                    tooltip.style.color = 'white';
                                    tooltip.style.padding = '4px 8px';
                                    tooltip.style.borderRadius = '4px';
                                    tooltip.style.fontSize = '12px';
                                    tooltip.style.zIndex = '1000';
                                    tooltip.style.opacity = '0';
                                    tooltip.style.transition = 'opacity 0.3s';
                                    
                                    // Position near button
                                    const rect = (event.target as HTMLElement).getBoundingClientRect();
                                    tooltip.style.top = `${rect.top - 30}px`;
                                    tooltip.style.left = `${rect.left}px`;
                                    
                                    document.body.appendChild(tooltip);
                                    setTimeout(() => { tooltip.style.opacity = '1'; }, 10);
                                    setTimeout(() => {
                                      tooltip.style.opacity = '0';
                                      setTimeout(() => document.body.removeChild(tooltip), 300);
                                    }, 2000);
                                  }}
                                  className="text-gray-400 hover:text-gray-300"
                                  title="Copy link"
                                >
                                  <FaCopy />
                                </button>
                                <button
                                  onClick={() => deleteSlideshowFromHistory(item.slideshowId)}
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
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gray-800 bg-opacity-70 hover:bg-opacity-90 rounded-full p-3 text-white focus:outline-none transition-all shadow-md z-20"
              title="Previous"
            >
              <FaChevronLeft size={24} />
            </button>
          )}

          {/* Media content */}
          <div className="flex justify-center items-center max-w-full">
            {(() => {
              // Cache in service worker if available
              if ('serviceWorker' in navigator && 'caches' in window) {
                // Cache image or video in the appropriate cache
                const cacheName = isVideo ? 'slideshow-assets-v2' : 'slideshow-images-v2';
                caches.open(cacheName).then(cache => {
                  cache.add(mediaUrl).catch(err => {
                    console.warn('Failed to cache asset in modal:', err);
                  });
                });
              }
              
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
                  <img
                    src={mediaUrl}
                    alt="Media"
                    className={`${isFullScreen ? 'max-h-screen max-w-screen' : 'max-w-full max-h-[70vh]'} object-contain ${mediaUrl.endsWith('.png') ? 'bg-checkerboard' : ''}`}
                    style={{ boxShadow: '0 0 8px rgba(0, 0, 0, 0.3)' }}
                    loading="eager"
                  />
                );
              }
            })()}
          </div>

          {/* Slideshow thumbnail strip */}
          {showSettings && slideshowAssets.length > 0 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 bg-opacity-90 p-3 rounded-lg max-w-4xl overflow-x-auto">
              <div className="flex space-x-2">
                {slideshowAssets.map((asset, index) => (
                  <div
                    key={asset.id}
                    className={`relative flex-shrink-0 cursor-pointer transition-all duration-200 ${
                      index === currentAssetIndex 
                        ? 'ring-2 ring-blue-500 scale-110' 
                        : 'hover:scale-105'
                    } ${
                      draggedIndex === index ? 'opacity-50' : ''
                    } ${
                      dragOverIndex === index ? 'ring-2 ring-yellow-500' : ''
                    }`}
                    draggable={onAssetReorder !== undefined}
                    onDragStart={(e) => handleThumbnailDragStart(e, index)}
                    onDragOver={(e) => handleThumbnailDragOver(e, index)}
                    onDragLeave={handleThumbnailDragLeave}
                    onDrop={(e) => handleThumbnailDrop(e, index)}
                    onDragEnd={handleThumbnailDragEnd}
                    onClick={() => onAssetClick && onAssetClick(index)}
                  >
                    {asset.assetType === 'vid' ? (
                      <div className="relative w-16 h-16 bg-gray-700 rounded overflow-hidden">
                        <video
                          src={asset.url}
                          className="w-full h-full object-cover"
                          muted
                          preload="metadata"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <FaPlay className="text-white text-xs opacity-80" />
                        </div>
                      </div>
                    ) : (
                      <img
                        src={asset.thumbnailUrl || asset.url}
                        alt={`Slideshow item ${index + 1}`}
                        className="w-16 h-16 object-cover rounded"
                        loading="lazy"
                      />
                    )}
                    
                    {/* Index indicator */}
                    <div className="absolute -top-1 -left-1 bg-gray-800 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {index + 1}
                    </div>
                    
                    {/* Drag indicator */}
                    {onAssetReorder && (
                      <div className="absolute top-0 right-0 bg-gray-600 text-white text-xs rounded-bl px-1">
                        ⋮⋮
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {onAssetReorder && (
                <div className="text-center mt-2">
                  <span className="text-xs text-gray-300">
                    Drag thumbnails to reorder slideshow
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Next button */}
          {hasNext && onNext && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNext();
              }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-800 bg-opacity-70 hover:bg-opacity-90 rounded-full p-3 text-white focus:outline-none transition-all shadow-md z-20"
              title="Next"
            >
              <FaChevronRight size={24} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
