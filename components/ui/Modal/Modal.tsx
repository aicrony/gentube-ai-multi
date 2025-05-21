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
  FaCog
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
  currentItemId?: string;
  onShare?: () => void;
  showShareButton?: boolean;
  onJumpToFirst?: () => void;
  onJumpToLast?: () => void;
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
  onJumpToLast
}) => {
  const [isFullScreen, setIsFullScreen] = useState(fullScreen);
  const [isSlideshow, setIsSlideshow] = useState(false);
  const [slideInterval, setSlideInterval] = useState(3000); // Default: 3 seconds
  const [slideDirection, setSlideDirection] = useState<'forward' | 'backward'>(
    'forward'
  );
  const [showSettings, setShowSettings] = useState(false);
  const [infiniteLoop, setInfiniteLoop] = useState(false); // Add state for infinite loop
  const slideshowTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Start slideshow
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

  const handleDownload = async () => {
    try {
      // Determine file extension based on media type
      const isVideo = mediaUrl.endsWith('.mp4');
      const fileExtension = isVideo ? '.mp4' : '.jpg';
      const fileName = `gentube-download${fileExtension}`;

      // Fetch the file as a blob
      const response = await fetch(mediaUrl);
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
    } catch (error) {
      console.error('Error downloading media:', error);
      alert('Failed to download the media');
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
                onChange={(e) =>
                  setSlideInterval(Number(e.target.value) * 1000)
                }
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
                  onClick={() => setSlideDirection('backward')}
                  className={`px-3 py-1 rounded ${slideDirection === 'backward' ? 'bg-blue-500' : 'bg-gray-600'}`}
                >
                  Backward
                </button>
                <button
                  onClick={() => setSlideDirection('forward')}
                  className={`px-3 py-1 rounded ${slideDirection === 'forward' ? 'bg-blue-500' : 'bg-gray-600'}`}
                >
                  Forward
                </button>
              </div>
            </div>

            {/* Infinite Loop Toggle */}
            <div className="mb-1">
              <div className="flex items-center justify-start">
                <label className="text-sm pr-2">Infinite Loop</label>
                <div
                  className={`relative inline-block w-12 h-6 transition-colors duration-200 ease-in-out rounded-full cursor-pointer ${infiniteLoop ? 'bg-blue-500' : 'bg-gray-600'}`}
                  onClick={() => setInfiniteLoop(!infiniteLoop)}
                >
                  <span
                    className={`absolute left-1 top-1 w-4 h-4 transition-transform duration-200 ease-in-out bg-white rounded-full transform ${
                      infiniteLoop ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  ></span>
                </div>
              </div>
            </div>
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
