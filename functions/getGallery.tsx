'use client';

import React, { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import {
  FaExternalLinkAlt,
  FaImage,
  FaVideo,
  FaPlus,
  FaHeart,
  FaDownload,
  FaShare
} from 'react-icons/fa';
import { useUserId } from '@/context/UserIdContext';
import { useUserIp } from '@/context/UserIpContext';
import { useRouter } from 'next/navigation';
import MyAssets from '@/components/dynamic/my-assets';
import Modal from '@/components/ui/Modal';

interface GalleryItem {
  id?: string;
  CreatedAssetUrl: string;
  Prompt: string;
  AssetSource: string;
  AssetType: string;
  UserId?: string | null;
  CreatorName?: string | null;
}

interface AssetLikeInfo {
  likesCount: number;
  isLiked: boolean;
}

const ImageGallery: React.FC = () => {
  const [media, setMedia] = useState<GalleryItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitting] = useState(false);
  const [regenerateInProgress, setRegenerateInProgress] = useState(false);
  const [showMyAssets, setShowMyAssets] = useState(false);
  const [assetLikes, setAssetLikes] = useState<{
    [key: string]: AssetLikeInfo;
  }>({});
  const [isLiking, setIsLiking] = useState(false);
  const [isRefreshingGallery, setIsRefreshingGallery] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMediaUrl, setModalMediaUrl] = useState('');
  const [isFullScreenModal, setIsFullScreenModal] = useState(false);
  const userId = useUserId();
  const userIp = useUserIp();
  const router = useRouter();

  // Check for an asset ID in the URL
  useEffect(() => {
    const fetchMedia = async () => {
      try {
        // Read the URL params to see if we have a direct link to an asset
        const urlParams = new URLSearchParams(window.location.search);
        const assetIdParam = urlParams.get('id');

        if (assetIdParam) {
          console.log(`Direct link to asset ID: ${assetIdParam} detected`);
        }

        const cachedMedia = localStorage.getItem('mediaUrls');
        const cachedTimestamp = localStorage.getItem('mediaUrlsTimestamp');
        const tenMinutes = 10 * 60 * 1000; // 10 minutes in milliseconds

        // Only use cache if we don't have a specific asset ID to show
        if (!assetIdParam && cachedMedia && cachedTimestamp) {
          const parsedTimestamp = new Date(cachedTimestamp).getTime();
          const currentTime = new Date().getTime();

          if (currentTime - parsedTimestamp < tenMinutes) {
            const parsedMedia = JSON.parse(cachedMedia);
            if (parsedMedia.length > 0 && parsedMedia[0].CreatedAssetUrl) {
              setMedia(parsedMedia);

              return;
            }
          }
        }

        // Always fetch fresh data if we have an asset ID
        await fetchAndSetMedia(assetIdParam);
      } catch (error) {
        console.error('Error fetching media:', error);
      }
    };

    fetchMedia();
  }, []);

  // Fetch likes for the current media item
  useEffect(() => {
    const fetchLikesForCurrentItem = async () => {
      if (!media.length || !media[currentIndex].id) return;

      try {
        const assetId = media[currentIndex].id;
        if (!assetId) return;

        // Add a cache buster only when necessary (changing user or first fetch)
        const cacheBusterValue = `${userId || 'anonymous'}-${new Date().getDate()}`;
        const cacheBuster =
          localStorage.getItem(`like-cache-${assetId}`) !== cacheBusterValue
            ? `&cache=${Date.now()}`
            : '';

        // Fetch likes with or without userId - we'll still get the count even if user isn't logged in
        const response = await fetch(
          `/api/getAssetLikes?assetId=${assetId}${userId ? `&userId=${userId}` : ''}${cacheBuster}`
        );
        const likeInfo = await response.json();

        // Store cache validation value
        localStorage.setItem(`like-cache-${assetId}`, cacheBusterValue);

        setAssetLikes((prev) => ({
          ...prev,
          [assetId]: likeInfo
        }));
      } catch (error) {
        console.error('Error fetching likes for current item:', error);
      }
    };

    fetchLikesForCurrentItem();
  }, [userId, media, currentIndex]);

  const fetchAndSetMedia = async (targetAssetId: string | null = null) => {
    try {
      const response = await fetch('/api/getGalleryAssets?limit=60', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const mediaData = await response.json();

      // Log the media data to debug missing prompts
      console.log('Gallery assets fetched:', mediaData);

      // Ensure each item has the required properties with fallbacks
      const processedMedia = mediaData.map((item: any) => ({
        ...item,
        id: item.id || null, // Important for likes
        Prompt: item.Prompt || 'No prompt available',
        AssetType: item.AssetType || 'unknown',
        AssetSource: item.AssetSource || ''
      }));

      setMedia(processedMedia);
      localStorage.setItem('mediaUrls', JSON.stringify(processedMedia));
      localStorage.setItem('mediaUrlsTimestamp', new Date().toISOString());

      // If we have a specific asset ID to display, find and set it as current
      if (targetAssetId && processedMedia.length > 0) {
        const assetIndex = processedMedia.findIndex(
          (item) => item.id === targetAssetId
        );
        if (assetIndex !== -1) {
          setCurrentIndex(assetIndex);
          console.log(
            `Found and displaying asset ID ${targetAssetId} at index ${assetIndex}`
          );

          // Fetch likes for the target asset
          if (processedMedia[assetIndex].id) {
            const likeResponse = await fetch(
              `/api/getAssetLikes?assetId=${processedMedia[assetIndex].id}${userId ? `&userId=${userId}` : ''}`
            );
            const likeInfo = await likeResponse.json();

            setAssetLikes({
              [processedMedia[assetIndex].id]: likeInfo
            });
          }
        } else {
          console.log(`Asset ID ${targetAssetId} not found in gallery`);
        }
      }
      // Otherwise, always fetch likes for the first item
      else if (processedMedia.length > 0) {
        const currentItem = processedMedia[0];
        if (currentItem.id) {
          const likeResponse = await fetch(
            `/api/getAssetLikes?assetId=${currentItem.id}${userId ? `&userId=${userId}` : ''}`
          );
          const likeInfo = await likeResponse.json();

          setAssetLikes({
            [currentItem.id]: likeInfo
          });
        }
      }
    } catch (error) {
      console.error('Error fetching media:', error);
    }
  };

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex > 0 ? prevIndex - 1 : media.length - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex < media.length - 1 ? prevIndex + 1 : 0
    );
  };

  // We're using openModal directly now for both normal and fullscreen views
  
  // Handle opening the modal with the media URL
  // Enhanced modal open function that takes a media item index
  const openModalForItem = (index: number, fullScreen = false) => {
    const item = media[index];
    if (item) {
      setCurrentIndex(index); // Update the current index to the displayed item
      setModalMediaUrl(item.CreatedAssetUrl);
      setIsModalOpen(true);
      setIsFullScreenModal(fullScreen);
    }
  };
  
  // Original function for backward compatibility - opens the modal for a URL
  const openModal = (url: string, fullScreen = false) => {
    // Find the index of the media item with this URL
    const index = media.findIndex(item => item.CreatedAssetUrl === url);
    if (index !== -1) {
      openModalForItem(index, fullScreen);
    } else {
      // Fallback if the URL is not found in the media array
      setModalMediaUrl(url);
      setIsModalOpen(true);
      setIsFullScreenModal(fullScreen);
    }
  };
  
  // Navigate to the next item in the modal
  const handleNextInModal = () => {
    if (currentIndex < media.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setModalMediaUrl(media[currentIndex + 1].CreatedAssetUrl);
    }
  };
  
  // Navigate to the previous item in the modal
  const handlePreviousInModal = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setModalMediaUrl(media[currentIndex - 1].CreatedAssetUrl);
    }
  };
  
  // Handle closing the modal
  const closeModal = () => {
    setIsModalOpen(false);
    setModalMediaUrl('');
  };

  // Handle downloading the current media
  const handleDownload = async (url: string, isVideo: boolean) => {
    try {
      // Determine file extension based on media type
      const fileExtension = isVideo ? '.mp4' : '.jpg';
      const fileName = `gentube-download${fileExtension}`;

      // Fetch the file as a blob
      const response = await fetch(url);
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

  // Handle liking/unliking from the gallery
  // Handle copying a shareable URL to the clipboard
  const handleShareUrl = (mediaItem: GalleryItem) => {
    if (!mediaItem.id) {
      return;
    }

    // Create a URL that links directly to this item in the gallery
    // Using window.location to get the current base URL
    const shareUrl = `${window.location.origin}/gallery?id=${mediaItem.id}`;

    // Copy to clipboard with a custom message
    handleCopy(shareUrl, 'Share URL copied to clipboard!');
  };

  // Generic function to handle copying text to the clipboard with a notification
  const handleCopy = (
    text: string,
    message: string = 'Copied to clipboard!'
  ) => {
    navigator.clipboard.writeText(text);

    // Use a more user-friendly notification instead of an alert
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.padding = '10px 15px';
    notification.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    notification.style.color = 'white';
    notification.style.borderRadius = '4px';
    notification.style.zIndex = '1000';
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s ease-in-out';

    document.body.appendChild(notification);

    // Fade in
    setTimeout(() => {
      notification.style.opacity = '1';
    }, 10);

    // Fade out and remove after 2 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 2000);
  };

  const handleToggleLike = async (mediaItem: GalleryItem) => {
    if (!mediaItem.id) {
      return;
    }

    // If user is not logged in, redirect to sign in page
    if (!userId) {
      router.push('/signin');
      return;
    }

    try {
      setIsLiking(true);
      const assetId = mediaItem.id;
      const currentLikeInfo = assetLikes[assetId] || {
        likesCount: 0,
        isLiked: false
      };
      const action = currentLikeInfo.isLiked ? 'unlike' : 'like';

      const response = await fetch('/api/toggleAssetLike', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          assetId,
          action
        })
      });

      const result = await response.json();

      if (result.success) {
        // Update the local state with the new like info
        setAssetLikes({
          ...assetLikes,
          [assetId]: {
            likesCount: result.likesCount,
            isLiked: result.isLiked
          }
        });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleStartFresh = () => {
    router.push('/');
  };

  const handleCreateImage = async (prompt: string) => {
    if (!userId) {
      router.push('/signin');
      return;
    }

    if (!prompt || prompt.trim() === '') {
      alert('Cannot create image: No prompt available');
      return;
    }

    const MAX_PROMPT_LENGTH = 1500;
    if (prompt.length > MAX_PROMPT_LENGTH) {
      alert(
        `Prompt is too long. Maximum length is ${MAX_PROMPT_LENGTH} characters. Your prompt is ${prompt.length} characters.`
      );
      return;
    }

    setRegenerateInProgress(true);
    setShowMyAssets(true);

    try {
      console.log('Creating image with prompt:', prompt);

      const response = await fetch('/api/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId || 'none',
          'x-forwarded-for': userIp
        },
        body: JSON.stringify({ prompt: prompt })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Failed to create image:', data);
        if (data.error && data.error.includes('too long')) {
          alert(data.error);
        } else {
          alert('Failed to create image. Please try again.');
        }
      } else {
        console.log('Image creation response:', data);
        if (data.result === 'InQueue') {
          alert(
            'Your image has been added to the queue. Check My Assets for updates.'
          );
        }
      }
    } catch (error) {
      console.error('Error creating image:', error);
      alert('An error occurred while creating the image. Please try again.');
    } finally {
      setRegenerateInProgress(false);
    }
  };

  const handleCreateVideo = async (item: GalleryItem) => {
    if (!userId) {
      router.push('/signin');
      return;
    }

    // Check prompt length before proceeding
    if (item.Prompt) {
      const MAX_PROMPT_LENGTH = 1500;
      if (item.Prompt.length > MAX_PROMPT_LENGTH) {
        alert(
          `Prompt is too long. Maximum length is ${MAX_PROMPT_LENGTH} characters. Your prompt is ${item.Prompt.length} characters.`
        );
        return;
      }
    }

    setRegenerateInProgress(true);
    setShowMyAssets(true);

    try {
      // Use AssetSource if the current item is a video, otherwise use CreatedAssetUrl
      const imageUrl =
        item.AssetType === 'vid' ? item.AssetSource : item.CreatedAssetUrl;

      // Log data being sent for debugging
      console.log('Creating video with:', {
        imageUrl,
        prompt: item.Prompt,
        assetType: item.AssetType
      });

      // Don't proceed if we don't have an image URL
      if (!imageUrl) {
        console.error('Cannot create video: Missing image URL');
        alert('Cannot create video: Missing source image');
        setRegenerateInProgress(false);
        return;
      }

      const response = await fetch('/api/video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId || 'none',
          'x-forwarded-for': userIp
        },
        body: JSON.stringify({
          url: imageUrl,
          description: item.Prompt || 'Generate a video from this image',
          duration: '5',
          aspectRatio: '16:9',
          motion: 'Static',
          loop: false
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Failed to create video:', data);
        if (data.error && data.error.includes('too long')) {
          alert(data.error);
        } else {
          alert('Failed to create video. Please try again.');
        }
      } else {
        console.log('Video creation response:', data);
        if (data.result === 'InQueue') {
          alert(
            'Your video has been added to the queue. Check My Assets for updates.'
          );
        }
      }
    } catch (error) {
      console.error('Error creating video:', error);
      alert('An error occurred while creating the video. Please try again.');
    } finally {
      setRegenerateInProgress(false);
    }
  };

  const renderMedia = (mediaItem: GalleryItem) => {
    const url = mediaItem.CreatedAssetUrl;
    const isVideo = Boolean(url && url.length > 0 && url.endsWith('.mp4'));

    // Determine source image URL for video items
    const sourceImageUrl =
      mediaItem.AssetType === 'vid' && mediaItem.AssetSource
        ? mediaItem.AssetSource
        : null;

    console.log('Rendering media item:', {
      type: mediaItem.AssetType,
      url,
      sourceUrl: mediaItem.AssetSource,
      isVideo
    });

    return (
      <div className="relative">
        {/* Main media display */}
        {isVideo ? (
          <>
            <video
              src={url}
              controls
              autoPlay
              preload="auto"
              className="w-full cursor-pointer md:w-full max-w-2xl mx-auto"
              onClick={() => openModal(url, false)}
              onLoadStart={() => console.log(`Started loading video: ${url}`)}
              onLoadedData={() =>
                console.log(`Video loaded and cached: ${url}`)
              }
            />

            {/* Show source image if available for videos and not empty or "none" */}
            {sourceImageUrl &&
              sourceImageUrl !== 'none' &&
              sourceImageUrl !== '' && (
                <div className="mt-2 text-center">
                  <p className="text-sm text-gray-500 mb-1">Source image:</p>
                  <img
                    src={sourceImageUrl}
                    alt="Source image"
                    loading="eager"
                    decoding="async"
                    className="w-full md:w-full max-w-lg mx-auto border border-gray-300"
                    onLoad={() =>
                      console.log(
                        `Source image loaded and cached: ${sourceImageUrl}`
                      )
                    }
                  />
                </div>
              )}
          </>
        ) : (
          <img
            src={url}
            alt={`Media ${currentIndex + 1}`}
            loading="eager"
            decoding="async"
            className="w-full cursor-pointer md:w-full max-w-2xl mx-auto"
            onClick={() => openModal(url, false)}
            onLoad={() => console.log(`Image loaded and cached: ${url}`)}
          />
        )}

        {/* Action icons bar under the image */}
        <div className="flex justify-end items-center mt-4 mb-4 max-w-2xl mx-auto w-full">
          <div className="flex items-center space-x-4">
            {/* Download button */}
            <button
              onClick={() => handleDownload(url, isVideo)}
              className="text-gray-500 hover:text-gray-700 p-1"
              title="Download"
            >
              <FaDownload className="text-lg" />
            </button>

            {/* Open in full screen modal button */}
            <button
              onClick={() => openModal(url, true)}
              className="text-gray-500 hover:text-gray-700 p-1"
              title="View in Full Screen"
            >
              <FaExternalLinkAlt className="text-lg" />
            </button>

            {/* Like/Heart button - always show likes count */}
            {mediaItem.id && (
              <button
                onClick={() => handleToggleLike(mediaItem)}
                disabled={isLiking}
                className={`flex items-center gap-1 p-1 ${
                  assetLikes[mediaItem.id]?.isLiked
                    ? 'text-red-500 hover:text-red-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                title={
                  userId
                    ? assetLikes[mediaItem.id]?.isLiked
                      ? 'Unlike'
                      : 'Like'
                    : 'Sign in to like'
                }
              >
                <span className="text-sm font-medium mr-1">
                  {assetLikes[mediaItem.id]?.likesCount || 0}
                </span>
                <FaHeart
                  className={`text-lg ${isLiking ? 'animate-pulse' : ''}`}
                />
              </button>
            )}

            {/* Share button - new button for copying shareable URL */}
            {mediaItem.id && (
              <button
                onClick={() => handleShareUrl(mediaItem)}
                className="text-gray-500 hover:text-gray-700 p-1"
                title="Copy shareable link"
              >
                <FaShare className="text-lg" />
              </button>
            )}

            <div>Share with your friends and ask them to heart your image!</div>
          </div>
        </div>

        {/* Prompt Display */}
        <div className="my-4 text-center max-w-2xl mx-auto">
          {/* Centered Prompt heading */}
          <h3 className="font-bold text-center mb-2">Prompt:</h3>

          <p className="mb-4">{mediaItem.Prompt || 'No prompt available'}</p>

          {/* Creator Name Display */}
          <p className="text-sm text-gray-600 mb-2">
            Created by:{' '}
            {mediaItem.CreatorName ? (
              mediaItem.CreatorName
            ) : mediaItem.UserId === userId ? (
              <a
                href="/account"
                title="Set your name in your account settings"
                className="text-blue-500 hover:underline"
              >
                Anonymous
              </a>
            ) : (
              'Anonymous'
            )}
          </p>

          {/* Debug Info - only show in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-500 mb-2">
              <p>Asset ID: {mediaItem.id || 'Unknown'}</p>
              <p>Asset Type: {mediaItem.AssetType || 'Unknown'}</p>
              {mediaItem.AssetSource && (
                <p>Source: {mediaItem.AssetSource.substring(0, 40)}...</p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4 mt-4">
            <Button
              variant="slim"
              onClick={() => handleCreateImage(mediaItem.Prompt || '')}
              disabled={regenerateInProgress || !mediaItem.Prompt}
              title={
                !mediaItem.Prompt
                  ? 'No prompt available for regeneration'
                  : 'Create image using this prompt'
              }
              loading={regenerateInProgress}
              className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
            >
              <FaImage /> Create Image
            </Button>

            <Button
              variant="slim"
              onClick={() => handleCreateVideo(mediaItem)}
              disabled={regenerateInProgress}
              title="Create video from this media"
              loading={regenerateInProgress}
              className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
            >
              <FaVideo /> Create Video
            </Button>

            <Button
              variant="slim"
              onClick={() => handleStartFresh()}
              title="Start generating images and videos from a black slate"
              loading={regenerateInProgress}
              className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
            >
              <FaPlus /> Start Fresh
            </Button>
          </div>
        </div>
        <div className="my-4 text-center max-w-2xl mx-auto">
          <p>Create from this prompt or start something new.</p>
        </div>
      </div>
    );
  };

  // Function to handle manual refresh of gallery data
  const handleRefreshGallery = async () => {
    console.log('Manually refreshing gallery data');
    setIsRefreshingGallery(true);
    try {
      await fetchAndSetMedia();
      // Reset to first image after refresh
      setCurrentIndex(0);
    } catch (error) {
      console.error('Error refreshing gallery:', error);
    } finally {
      setIsRefreshingGallery(false);
    }
  };

  return (
    <div>
      <h1 className="text-center text-2xl font-bold pt-5">
        Public Media Gallery
      </h1>
      <div className="text-center mb-4">
        <button
          onClick={handleRefreshGallery}
          className="text-sm text-blue-500 hover:text-blue-700 underline"
          disabled={isRefreshingGallery}
        >
          {isRefreshingGallery ? 'Refreshing...' : 'Refresh Gallery'}
        </button>
        <span className="text-xs text-gray-500 ml-2">
          (Refresh to see your added assets)
        </span>
        <span className={'pl-2'}>
          <Button
            variant="slim"
            onClick={() => handleStartFresh()}
            title="Start generating images and videos from a black slate"
            loading={regenerateInProgress}
            className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
          >
            <FaPlus size={12} />
          </Button>
        </span>
      </div>
      {media.length > 0 && (
        <div className="mt-1">
          <div className="flex justify-center gap-1">
            <Button
              variant="slim"
              onClick={handlePrevious}
              loading={isSubmitting}
            >
              Previous
            </Button>
            <Button variant="slim" onClick={handleNext} loading={isSubmitting}>
              Next
            </Button>
          </div>
          <div className="flex justify-center mt-5 flex-col">
            {renderMedia(media[currentIndex])}
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {regenerateInProgress && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-lg font-semibold">Processing your request...</p>
            <p className="text-sm text-gray-600 mt-2">
              This may take a few moments.
            </p>
          </div>
        </div>
      )}

      {/* Show MyAssets component when regenerate is triggered */}
      {showMyAssets && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-center mb-4">
            Your Generated Assets
          </h2>
          <MyAssets autoRefreshQueued={true} />
        </div>
      )}

      {/* Add the Modal component for viewing images with navigation, like, and share functionality */}
      {isModalOpen && media.length > 0 && 
        <Modal 
          mediaUrl={modalMediaUrl} 
          onClose={closeModal} 
          fullScreen={isFullScreenModal}
          onNext={handleNextInModal}
          onPrevious={handlePreviousInModal}
          hasNext={currentIndex < media.length - 1}
          hasPrevious={currentIndex > 0}
          onLike={() => handleToggleLike(media[currentIndex])}
          isLiked={media[currentIndex].id ? assetLikes[media[currentIndex].id]?.isLiked : false}
          likesCount={media[currentIndex].id ? assetLikes[media[currentIndex].id]?.likesCount || 0 : 0}
          showLikeButton={true}
          currentItemId={media[currentIndex].id}
          onShare={() => handleShareUrl(media[currentIndex])}
          showShareButton={true}
        />
      }
    </div>
  );
};

export default ImageGallery;
