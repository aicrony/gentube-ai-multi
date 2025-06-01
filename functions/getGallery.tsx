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
  FaShare,
  FaEdit
} from 'react-icons/fa';
import { useUserId } from '@/context/UserIdContext';
import { useUserIp } from '@/context/UserIpContext';
import { useRouter } from 'next/navigation';
import MyAssets from '@/components/dynamic/my-assets';
import Modal from '@/components/ui/Modal';
import { PromptInputWithStyles } from '@/components/dynamic/prompt-input-with-styles';

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

interface ModifiedImage {
  id: string;
  url: string;
  prompt: string;
  originalIndex: number;
}

interface ImageGalleryProps {
  apiEndpoint?: string; // Optional prop to specify different API endpoint
  title?: string; // Optional prop to customize the title
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ 
  apiEndpoint = '/api/getGalleryAssets',
  title = 'Public Media Gallery'
}) => {
  const [media, setMedia] = useState<GalleryItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitting] = useState(false);
  const [regenerateInProgress, setRegenerateInProgress] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showMyAssets, setShowMyAssets] = useState(false);
  const [assetLikes, setAssetLikes] = useState<{
    [key: string]: AssetLikeInfo;
  }>({});
  const [isLiking, setIsLiking] = useState(false);
  const [isRefreshingGallery, setIsRefreshingGallery] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMediaUrl, setModalMediaUrl] = useState('');
  const [isFullScreenModal, setIsFullScreenModal] = useState(false);
  const [showModifyPrompt, setShowModifyPrompt] = useState<{
    [key: number]: boolean;
  }>({});
  const [modifiedImages, setModifiedImages] = useState<{
    [key: number]: ModifiedImage[];
  }>({});
  const [modifyPromptValue, setModifyPromptValue] = useState('');
  // Add pagination state
  const [hasMoreAssets, setHasMoreAssets] = useState(true);
  const [isLoadingMoreAssets, setIsLoadingMoreAssets] = useState(false);
  const [currentOffset, setCurrentOffset] = useState(0);
  const assetsPerLoad = 60;
  // Gallery info state
  const [showGalleryInfoPane, setShowGalleryInfoPane] = useState(false);
  const [isLoadingGalleryInfo, setIsLoadingGalleryInfo] = useState(false);
  const [currentAssetInfo, setCurrentAssetInfo] = useState<{
    id?: string;
    prompt?: string;
    creatorName?: string;
    userId?: string;
    assetType?: string;
  } | undefined>(undefined);
  const userId = useUserId();
  const userIp = useUserIp();
  const router = useRouter();

  // Check for an asset ID in the URL
  useEffect(() => {
    const fetchMedia = async () => {
      try {
        setIsInitialLoading(true);
        
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
              setIsInitialLoading(false);
              return;
            }
          }
        }

        // Always fetch fresh data if we have an asset ID
        setCurrentOffset(0);
        setHasMoreAssets(true);
        await fetchAndSetMedia(assetIdParam, false);
      } catch (error) {
        console.error('Error fetching media:', error);
      } finally {
        setIsInitialLoading(false);
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

  // Gallery info function
  const loadGalleryInfo = async () => {
    const currentItem = media[currentIndex];
    if (!currentItem) return;

    setIsLoadingGalleryInfo(true);
    
    try {
      // Simulate loading (in a real implementation, you might fetch additional data)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setCurrentAssetInfo({
        id: currentItem.id,
        prompt: currentItem.Prompt,
        creatorName: currentItem.CreatorName || undefined,
        userId: currentItem.UserId || undefined,
        assetType: currentItem.AssetType
      });
    } catch (error) {
      console.error('Error loading gallery info:', error);
    } finally {
      setIsLoadingGalleryInfo(false);
    }
  };

  // Update gallery info when currentIndex changes and gallery info pane is open
  useEffect(() => {
    if (showGalleryInfoPane && media.length > 0) {
      // Load gallery info for the current item when navigating between images
      loadGalleryInfo();
    }
  }, [currentIndex, showGalleryInfoPane, media]);

  const fetchAndSetMedia = async (targetAssetId: string | null = null, isRefresh: boolean = false) => {
    try {
      // Reset pagination state if this is a refresh
      const offset = isRefresh ? 0 : currentOffset;
      
      const response = await fetch(`${apiEndpoint}?limit=${assetsPerLoad}&offset=${offset}`, {
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

      // Update pagination state
      setHasMoreAssets(mediaData.length === assetsPerLoad);
      
      if (isRefresh) {
        // For refresh, replace all media
        setMedia(processedMedia);
        setCurrentOffset(assetsPerLoad);
      } else {
        // For initial load or when not refreshing, replace all media
        setMedia(processedMedia);
        setCurrentOffset(assetsPerLoad);
      }
      
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

  // Function to load more assets and append them to the current media array
  const loadMoreAssets = async () => {
    if (isLoadingMoreAssets || !hasMoreAssets) {
      return;
    }

    try {
      setIsLoadingMoreAssets(true);
      console.log(`Loading more assets from offset ${currentOffset}`);

      const response = await fetch(`${apiEndpoint}?limit=${assetsPerLoad}&offset=${currentOffset}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const newMediaData = await response.json();

      if (newMediaData.length > 0) {
        // Process new media data
        const processedNewMedia = newMediaData.map((item: any) => ({
          ...item,
          id: item.id || null,
          Prompt: item.Prompt || 'No prompt available',
          AssetType: item.AssetType || 'unknown',
          AssetSource: item.AssetSource || ''
        }));

        // Append to existing media
        setMedia(prevMedia => [...prevMedia, ...processedNewMedia]);
        setCurrentOffset(prevOffset => prevOffset + assetsPerLoad);
        setHasMoreAssets(newMediaData.length === assetsPerLoad);

        console.log(`Loaded ${newMediaData.length} more assets. Total: ${media.length + newMediaData.length}`);
      } else {
        setHasMoreAssets(false);
        console.log('No more assets available');
      }
    } catch (error) {
      console.error('Error loading more assets:', error);
      setHasMoreAssets(false);
    } finally {
      setIsLoadingMoreAssets(false);
    }
  };

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => {
      if (prevIndex > 0) {
        return prevIndex - 1;
      } else {
        // At the beginning, wrap to the end
        return media.length - 1;
      }
    });
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => {
      const nextIndex = prevIndex + 1;
      
      // Check if we're near the end and should preload more assets
      const loadThreshold = Math.max(5, Math.ceil(media.length * 0.1)); // Load when within 5 items or 10% of the end
      if (nextIndex >= media.length - loadThreshold && hasMoreAssets && !isLoadingMoreAssets) {
        console.log(`Near end of gallery (${nextIndex}/${media.length}), preloading more assets...`);
        loadMoreAssets();
      }
      
      if (nextIndex < media.length) {
        return nextIndex;
      } else {
        // At the end, wrap to the beginning
        return 0;
      }
    });
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
    const index = media.findIndex((item) => item.CreatedAssetUrl === url);
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
    const nextIndex = currentIndex + 1;
    
    // Check if we're near the end and should preload more assets
    const loadThreshold = Math.max(5, Math.ceil(media.length * 0.1));
    if (nextIndex >= media.length - loadThreshold && hasMoreAssets && !isLoadingMoreAssets) {
      console.log(`Near end of gallery in modal (${nextIndex}/${media.length}), preloading more assets...`);
      loadMoreAssets();
    }
    
    if (nextIndex < media.length) {
      setCurrentIndex(nextIndex);
      setModalMediaUrl(media[nextIndex].CreatedAssetUrl);
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
    setShowGalleryInfoPane(false);
    setCurrentAssetInfo(undefined);
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
    notification.style.left = '20px';
    notification.style.right = '20px';
    notification.style.maxWidth = '90vw';
    notification.style.padding = '10px 15px';
    notification.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    notification.style.color = 'white';
    notification.style.borderRadius = '4px';
    notification.style.zIndex = '1000';
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s ease-in-out';
    notification.style.fontSize = '14px';
    notification.style.textAlign = 'center';
    
    // Add responsive behavior for larger screens
    if (window.innerWidth >= 640) {
      notification.style.left = 'auto';
      notification.style.right = '20px';
      notification.style.maxWidth = '420px';
    }

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

  const handleCreateImage = async (prompt: string, mediaIndex?: number) => {
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
    if (mediaIndex === undefined) {
      setShowMyAssets(true);
    }

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
          if (mediaIndex !== undefined) {
            // For modify operations, show success message and prepare for image update
            alert(
              'Your modified image has been added to the queue. Click "Generate" at the top to see your generated images.'
            );

            // Hide the modify prompt form
            setShowModifyPrompt((prev) => ({ ...prev, [mediaIndex]: false }));
            setModifyPromptValue('');

            // TODO: In a real implementation, you'd want to poll for the result and add it to modifiedImages
            // For now, we'll simulate this with a placeholder
            setTimeout(() => {
              if (data.imageUrl) {
                const newModifiedImage: ModifiedImage = {
                  id: Date.now().toString(),
                  url: data.imageUrl,
                  prompt: prompt,
                  originalIndex: mediaIndex
                };

                setModifiedImages((prev) => ({
                  ...prev,
                  [mediaIndex]: [...(prev[mediaIndex] || []), newModifiedImage]
                }));
              }
            }, 2000);
          } else {
            alert(
              'Your image has been added to the queue. Check My Assets for updates.'
            );
          }
        }
      }
    } catch (error) {
      console.error('Error creating image:', error);
      alert('An error occurred while creating the image. Please try again.');
    } finally {
      setRegenerateInProgress(false);
    }
  };

  const handleModifyImage = (mediaIndex: number) => {
    setShowModifyPrompt((prev) => ({
      ...prev,
      [mediaIndex]: !prev[mediaIndex]
    }));
    if (!showModifyPrompt[mediaIndex]) {
      // Pre-populate with the original prompt when opening the modify form
      setModifyPromptValue(media[mediaIndex]?.Prompt || '');
    }
  };

  const handleModifyPromptSubmit = async (mediaIndex: number) => {
    // Use the modified prompt directly instead of combining with original
    await handleCreateImage(modifyPromptValue, mediaIndex);
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

  // Gallery info handlers
  const handleToggleGalleryInfoPane = async () => {
    if (!showGalleryInfoPane) {
      // Always load gallery info when opening the pane to ensure current item data
      await loadGalleryInfo();
    }
    setShowGalleryInfoPane(!showGalleryInfoPane);
  };

  // Gallery action handlers for modal
  const handleModalModifyImage = (prompt: string) => {
    // Close modal and redirect to image generation page with pre-filled prompt
    closeModal();
    const encodedPrompt = encodeURIComponent(prompt);
    router.push(`/?prompt=${encodedPrompt}&action=modify`);
  };

  const handleModalCreateVideo = () => {
    // Close modal and redirect to home page, trigger asset refresh
    closeModal();
    router.push('/');
    // Note: The home page will show the My Assets component which auto-refreshes
  };

  const handleSubmitModifyFromGallery = async (prompt: string) => {
    // Close modal and redirect to image generation with the modified prompt
    closeModal();
    const encodedPrompt = encodeURIComponent(prompt);
    router.push(`/?prompt=${encodedPrompt}&action=modify`);
  };

  const handleModalStartFresh = () => {
    // Close modal and redirect to home page
    closeModal();
    router.push('/');
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
        <div className="mt-4 mb-3 max-w-2xl mx-auto w-full">
          <div className="flex justify-between items-center">
            {/* Share message - clickable with same functionality as share button */}
            {mediaItem.id && (
              <button
                onClick={() => handleShareUrl(mediaItem)}
                className="text-xs hover:text-slate-900 dark:hover:text-white transition-colors flex items-center cursor-pointer"
                title="Share this creation"
              >
                <FaShare className="inline mr-1 text-xs" />
                Share and ask friends to{' '}
                <FaHeart className="inline mx-1 text-xs text-red-500" /> your
                creations
              </button>
            )}

            <div className="flex items-center space-x-3">
              {/* Download button */}
              <button
                onClick={() => handleDownload(url, isVideo)}
                className="bg-gray-800 bg-opacity-70 hover:bg-opacity-90 rounded-full p-2 text-white focus:outline-none transition-all shadow-md"
                title="Download"
              >
                <FaDownload className="text-sm md:text-base" />
              </button>

              {/* Open in full screen modal button */}
              <button
                onClick={() => openModal(url, true)}
                className="bg-gray-800 bg-opacity-70 hover:bg-opacity-90 rounded-full p-2 text-white focus:outline-none transition-all shadow-md"
                title="View in Full Screen"
              >
                <FaExternalLinkAlt className="text-sm md:text-base" />
              </button>

              {/* Like/Heart button - always show likes count */}
              {mediaItem.id && (
                <button
                  onClick={() => handleToggleLike(mediaItem)}
                  disabled={isLiking}
                  className={`bg-gray-800 bg-opacity-70 hover:bg-opacity-90 rounded-full p-2 ${
                    assetLikes[mediaItem.id]?.isLiked
                      ? 'text-red-500'
                      : 'text-white'
                  } focus:outline-none transition-all shadow-md flex items-center`}
                  title={
                    userId
                      ? assetLikes[mediaItem.id]?.isLiked
                        ? 'Unlike'
                        : 'Like'
                      : 'Sign in to like'
                  }
                >
                  {assetLikes[mediaItem.id]?.likesCount > 0 && (
                    <span className="mr-1 text-xs font-medium">
                      {assetLikes[mediaItem.id]?.likesCount}
                    </span>
                  )}
                  <FaHeart
                    className={`text-sm md:text-base ${isLiking ? 'animate-pulse' : ''}`}
                  />
                </button>
              )}

              {/* Share button - new button for copying shareable URL */}
              {mediaItem.id && (
                <button
                  onClick={() => handleShareUrl(mediaItem)}
                  className="bg-gray-800 bg-opacity-70 hover:bg-opacity-90 rounded-full p-2 text-white focus:outline-none transition-all shadow-md"
                  title="Copy shareable link"
                >
                  <FaShare className="text-sm md:text-base" />
                </button>
              )}
            </div>
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
              onClick={() => handleModifyImage(currentIndex)}
              disabled={regenerateInProgress || !mediaItem.Prompt}
              title={
                !mediaItem.Prompt
                  ? 'No prompt available for modification'
                  : 'Modify this image with additional prompts'
              }
              loading={regenerateInProgress}
              className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
            >
              <FaEdit /> Modify Image
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

          {/* Modify Prompt Interface */}
          {showModifyPrompt[currentIndex] && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-semibold mb-3">Modify Image</h4>
              <div className="mb-4">
                <label
                  htmlFor="modify-prompt"
                  className="block text-sm font-medium mb-1"
                >
                  Edit prompt (modify as needed):
                </label>
                <textarea
                  id="modify-prompt"
                  value={modifyPromptValue}
                  onChange={(e) => setModifyPromptValue(e.target.value)}
                  placeholder="Edit the prompt to modify the image..."
                  rows={4}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-vertical"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="slim"
                  onClick={() => handleModifyImage(currentIndex)}
                  className="bg-gray-500 hover:bg-gray-600 text-white"
                >
                  Cancel
                </Button>
                <Button
                  variant="slim"
                  onClick={() => handleModifyPromptSubmit(currentIndex)}
                  disabled={regenerateInProgress || !modifyPromptValue.trim()}
                  loading={regenerateInProgress}
                  className="bg-purple-500 hover:bg-purple-600 text-white"
                >
                  Generate Modified Image
                </Button>
              </div>
            </div>
          )}

          {/* Display Modified Images */}
          {modifiedImages[currentIndex] &&
            modifiedImages[currentIndex].length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold mb-3 text-center">
                  Modified Versions
                </h4>
                {modifiedImages[currentIndex].map((modifiedImage, index) => (
                  <div key={modifiedImage.id} className="mt-4 border-t pt-4">
                    <img
                      src={modifiedImage.url}
                      alt={`Modified version ${index + 1}`}
                      className="w-full max-w-2xl mx-auto cursor-pointer"
                      onClick={() => openModal(modifiedImage.url, false)}
                    />

                    {/* Action icons for modified image */}
                    <div className="mt-4 mb-3 max-w-2xl mx-auto w-full">
                      <div className="flex justify-between items-center">
                        <div className="text-xs text-gray-600">
                          Modified with:{' '}
                          {modifiedImage.prompt
                            .replace(mediaItem.Prompt || '', '')
                            .replace(/^,\s*/, '')}
                        </div>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() =>
                              handleDownload(modifiedImage.url, false)
                            }
                            className="bg-gray-800 bg-opacity-70 hover:bg-opacity-90 rounded-full p-2 text-white focus:outline-none transition-all shadow-md"
                            title="Download"
                          >
                            <FaDownload className="text-sm md:text-base" />
                          </button>
                          <button
                            onClick={() => openModal(modifiedImage.url, true)}
                            className="bg-gray-800 bg-opacity-70 hover:bg-opacity-90 rounded-full p-2 text-white focus:outline-none transition-all shadow-md"
                            title="View in Full Screen"
                          >
                            <FaExternalLinkAlt className="text-sm md:text-base" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Prompt Display for Modified Image */}
                    <div className="my-4 text-center max-w-2xl mx-auto">
                      <h5 className="font-medium text-center mb-2">
                        Full Prompt:
                      </h5>
                      <p className="mb-4 text-sm">{modifiedImage.prompt}</p>

                      {/* Action Buttons for Modified Image */}
                      <div className="flex justify-center space-x-4 mt-4">
                        <Button
                          variant="slim"
                          onClick={() =>
                            handleCreateImage(modifiedImage.prompt)
                          }
                          disabled={regenerateInProgress}
                          title="Create another image using this modified prompt"
                          loading={regenerateInProgress}
                          className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
                        >
                          <FaImage /> Create Image
                        </Button>

                        <Button
                          variant="slim"
                          onClick={() => {
                            const tempMediaItem = {
                              ...mediaItem,
                              Prompt: modifiedImage.prompt,
                              CreatedAssetUrl: modifiedImage.url
                            };
                            handleCreateVideo(tempMediaItem);
                          }}
                          disabled={regenerateInProgress}
                          title="Create video from this modified image"
                          loading={regenerateInProgress}
                          className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
                        >
                          <FaVideo /> Create Video
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
      // Reset pagination state
      setCurrentOffset(0);
      setHasMoreAssets(true);
      await fetchAndSetMedia(null, true);
      // Reset to first image after refresh
      setCurrentIndex(0);
    } catch (error) {
      console.error('Error refreshing gallery:', error);
    } finally {
      setIsRefreshingGallery(false);
    }
  };

  // Show loading state while initial data is being fetched
  if (isInitialLoading) {
    return (
      <div>
        <h1 className="text-center text-2xl font-bold pt-5">
          {title}
        </h1>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-lg font-semibold text-gray-600 dark:text-gray-400">
              Loading gallery...
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Please wait while we fetch the latest images and videos
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-center text-2xl font-bold pt-5">
        {title}
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

      {/* Empty state when no media is found */}
      {!isInitialLoading && media.length === 0 && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="text-6xl mb-4">🖼️</div>
            <p className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
              No images or videos found
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
              The gallery appears to be empty. Try refreshing the page or check back later.
            </p>
            <button
              onClick={handleRefreshGallery}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              disabled={isRefreshingGallery}
            >
              {isRefreshingGallery ? 'Refreshing...' : 'Refresh Gallery'}
            </button>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {regenerateInProgress && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-lg font-semibold text-gray-600 mt-2">
              Processing your request...
            </p>
            <p className="text-sm text-gray-600 mt-2">
              This may take a few moments.
            </p>
          </div>
        </div>
      )}

      {/* Loading indicator for more assets */}
      {isLoadingMoreAssets && (
        <div className="text-center mt-4">
          <div className="inline-flex items-center px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
            <span className="text-sm text-blue-700 dark:text-blue-300">Loading more gallery assets...</span>
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
      {isModalOpen && media.length > 0 && (
        <Modal
          mediaUrl={modalMediaUrl}
          onClose={closeModal}
          fullScreen={isFullScreenModal}
          onNext={handleNextInModal}
          onPrevious={handlePreviousInModal}
          hasNext={currentIndex < media.length - 1}
          hasPrevious={currentIndex > 0}
          onLike={() => handleToggleLike(media[currentIndex])}
          isLiked={
            media[currentIndex].id
              ? assetLikes[media[currentIndex].id]?.isLiked
              : false
          }
          likesCount={
            media[currentIndex].id
              ? assetLikes[media[currentIndex].id]?.likesCount || 0
              : 0
          }
          showLikeButton={true}
          currentItemId={media[currentIndex].id}
          onShare={() => handleShareUrl(media[currentIndex])}
          showShareButton={true}
          // Gallery info props
          showGalleryInfoPane={showGalleryInfoPane}
          onToggleGalleryInfoPane={handleToggleGalleryInfoPane}
          currentAssetInfo={currentAssetInfo}
          onModifyImage={handleModalModifyImage}
          onCreateVideo={handleModalCreateVideo}
          onStartFresh={handleModalStartFresh}
          isLoadingGalleryInfo={isLoadingGalleryInfo}
          onSubmitModifyFromGallery={handleSubmitModifyFromGallery}
        />
      )}
    </div>
  );
};

export default ImageGallery;
