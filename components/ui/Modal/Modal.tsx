import React, { useState, useEffect, useRef } from 'react';
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
  FaEdit,
  FaStar
} from 'react-icons/fa';

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
  onToggleGallery?: () => void;
  isInGallery?: boolean;
  showGalleryButton?: boolean;
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
  // New props for direct slideshow configuration
  slideshowInterval?: number;
  slideshowDirection?: 'forward' | 'backward';
  slideshowInfiniteLoop?: boolean;
  autoStartSlideshow?: boolean;
  // Image editing props
  onToggleImageEditPane?: () => void;
  showImageEditPane?: boolean;
  onToggleGalleryInfoPane?: () => void;
  showGalleryInfoPane?: boolean;
  showReorderMode?: boolean;
  setShowReorderMode?: (show: boolean) => void;
  onSubmitImageEdit?: (prompt: string) => Promise<void>;
  userCredits?: number | null;
  // Asset metadata
  prompt?: string; // Added for filename generation during download
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
  onToggleGallery,
  isInGallery = false,
  showGalleryButton = false,
  currentItemId,
  onShare,
  showShareButton = false,
  onJumpToFirst,
  onJumpToLast,
  currentAssets = [],
  onCreateSlideshow,
  // New props with defaults
  slideshowInterval,
  slideshowDirection,
  slideshowInfiniteLoop,
  autoStartSlideshow = false,
  // Image editing props
  onToggleImageEditPane,
  showImageEditPane = false,
  onToggleGalleryInfoPane,
  showGalleryInfoPane = false,
  showReorderMode = false,
  setShowReorderMode = () => {},
  onSubmitImageEdit,
  userCredits = null,
  // Asset metadata
  prompt = ''
}) => {
  const [isFullScreen, setIsFullScreen] = useState(fullScreen);
  const [isSlideshow, setIsSlideshow] = useState(autoStartSlideshow);
  const [editPrompt, setEditPrompt] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState('');
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

  const [showSettings, setShowSettings] = useState(false);

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

  const handleDownload = async () => {
    try {
      // Show a small loading indicator
      const loadingToast = document.createElement('div');
      loadingToast.textContent = 'Downloading media...';
      loadingToast.style.position = 'fixed';
      loadingToast.style.bottom = '20px';
      loadingToast.style.right = '20px';
      loadingToast.style.padding = '10px 15px';
      loadingToast.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      loadingToast.style.color = 'white';
      loadingToast.style.borderRadius = '4px';
      loadingToast.style.zIndex = '1000';
      document.body.appendChild(loadingToast);

      // Determine file extension based on media type
      const isVideo = mediaUrl.endsWith('.mp4');
      const fileExtension = isVideo ? '.mp4' : '.jpg';
      
      // Generate a filename based on the prompt if available
      let fileName = 'gentube-download';
      if (prompt) {
        // Take first 29 characters, remove invalid filename characters
        const sanitizedPrompt = prompt.substring(0, 29)
          .replace(/[\/?%*:|"<>]/g, '')
          .trim()
          .replace(/\s+/g, '-');
        
        if (sanitizedPrompt) {
          fileName = sanitizedPrompt;
        }
      }
      
      fileName = `${fileName}${fileExtension}`;

      // Use our API endpoint as a proxy to avoid CORS issues
      const proxyUrl = `/api/downloadAsset?url=${encodeURIComponent(mediaUrl)}`;
      console.log('Downloading via proxy:', proxyUrl);
      
      // Fetch the file through our proxy
      const response = await fetch(proxyUrl);
      
      // Remove loading indicator
      document.body.removeChild(loadingToast);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
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
      
      // Show success message
      const successToast = document.createElement('div');
      successToast.textContent = 'Download complete!';
      successToast.style.position = 'fixed';
      successToast.style.bottom = '20px';
      successToast.style.right = '20px';
      successToast.style.padding = '10px 15px';
      successToast.style.backgroundColor = 'rgba(46, 125, 50, 0.9)';
      successToast.style.color = 'white';
      successToast.style.borderRadius = '4px';
      successToast.style.zIndex = '1000';
      successToast.style.opacity = '1';
      successToast.style.transition = 'opacity 0.3s ease-in-out';
      document.body.appendChild(successToast);
      
      // Fade out after 3 seconds
      setTimeout(() => {
        successToast.style.opacity = '0';
        setTimeout(() => {
          if (document.body.contains(successToast)) {
            document.body.removeChild(successToast);
          }
        }, 300);
      }, 3000);
    } catch (error) {
      console.error('Error downloading media:', error);
      alert(`Failed to download the media: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const isVideo = mediaUrl.endsWith('.mp4');

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
              className="bg-gray-800 bg-opacity-70 hover:bg-opacity-90 rounded-full p-2 text-white focus:outline-none transition-all shadow-md"
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

          {/* Gallery Star button - only shown if the feature is enabled */}
          {showGalleryButton && onToggleGallery && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onToggleGallery) onToggleGallery();
              }}
              className={`bg-gray-800 bg-opacity-70 hover:bg-opacity-90 rounded-full p-2 ${isInGallery ? 'text-yellow-500' : 'text-white'} focus:outline-none transition-all shadow-md`}
              title={isInGallery ? 'Remove from Gallery' : 'Add to Gallery'}
            >
              <FaStar />
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

        {/* Image Edit Panel */}
        {showImageEditPane && !isVideo && (
          <div className="absolute top-14 right-2 bg-gray-800 bg-opacity-90 p-4 rounded-lg text-white z-10 shadow-lg transition-all w-80">
            <h3 className="text-lg font-bold mb-3">Edit Image</h3>

            <div className="mb-4">
              <label className="block mb-2 text-sm">Edit Instructions</label>
              <textarea
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                placeholder="Describe how you want to edit this image..."
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                rows={4}
              />
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={() => {
                  if (onToggleImageEditPane) onToggleImageEditPane();
                }}
                className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 rounded text-sm"
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  if (!editPrompt.trim()) {
                    setEditError('Please enter edit instructions');
                    return;
                  }
                  
                  // Check if user has enough credits (10) before submitting
                  console.log('User credits in Modal:', userCredits);
                  if (userCredits !== null && userCredits < 10) {
                    setEditError('limit-exceeded');
                    return;
                  }

                  if (onSubmitImageEdit) {
                    setIsSubmittingEdit(true);
                    setEditError('');
                    try {
                      await onSubmitImageEdit(editPrompt);
                      // Close the panel after submission
                      if (onToggleImageEditPane) onToggleImageEditPane();
                    } catch (error) {
                      console.error('Error submitting image edit:', error);
                      setEditError('Failed to submit edit. Please try again.');
                    } finally {
                      setIsSubmittingEdit(false);
                    }
                  }
                }}
                disabled={isSubmittingEdit || !editPrompt.trim()}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed rounded text-sm flex items-center"
              >
                {isSubmittingEdit ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>Apply Edit</>
                )}
              </button>
            </div>

            {editError && (
              <div className="mt-3 text-xs text-red-400 bg-red-900 bg-opacity-30 p-2 rounded">
                {editError === 'limit-exceeded' ? (
                  <>
                    Limit Exceeded - Please proceed to the{' '}
                    <a href="/pricing" className="text-blue-400 hover:text-blue-300 underline">
                      Pricing page
                    </a>{' '}
                    for more credits.
                  </>
                ) : (
                  editError
                )}
              </div>
            )}

            <div className="mt-4 text-xs text-gray-400 border-t border-gray-700 pt-3">
              <p>
                This will create a new edited version of your image. The
                original image will not be modified.
              </p>
              <p className="mt-1">Image editing costs 10 credits.</p>
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
            {isVideo ? (
              <video
                src={mediaUrl}
                controls
                autoPlay
                className={`${isFullScreen ? 'max-h-screen max-w-screen' : 'max-w-full max-h-[70vh]'} object-contain`}
                style={{ boxShadow: '0 0 8px rgba(0, 0, 0, 0.3)' }}
              />
            ) : (
              <img
                src={mediaUrl}
                alt="Media"
                className={`${isFullScreen ? 'max-h-screen max-w-screen' : 'max-w-full max-h-[70vh]'} object-contain ${mediaUrl.endsWith('.png') ? 'bg-checkerboard' : ''}`}
                style={{ boxShadow: '0 0 8px rgba(0, 0, 0, 0.3)' }}
              />
            )}
          </div>

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
