'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useUserId } from '@/context/UserIdContext';
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

const AdminGallery: React.FC = () => {
  const userId = useUserId();
  const router = useRouter();
  const [media, setMedia] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMediaUrl, setModalMediaUrl] = useState('');
  const [currentModalIndex, setCurrentModalIndex] = useState(0);
  const [assetLikes, setAssetLikes] = useState<{ [key: string]: AssetLikeInfo }>({});
  const [isLiking, setIsLiking] = useState(false);
  
  // Gallery info state
  const [showGalleryInfoPane, setShowGalleryInfoPane] = useState(false);
  const [isLoadingGalleryInfo, setIsLoadingGalleryInfo] = useState(false);
  const [currentAssetInfo, setCurrentAssetInfo] = useState<{
    id?: string;
    prompt?: string;
    creatorName?: string;
    userId?: string;
    assetType?: string;
  } | null>(null);
  
  const imagesPerLoad = 20;
  const [currentOffset, setCurrentOffset] = useState(0);

  // Load initial set of images
  useEffect(() => {
    loadImages(0, false);
  }, []);

  const loadImages = async (offset: number, isLoadMore: boolean = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const response = await fetch(`/api/getAdminGalleryAssets?limit=${imagesPerLoad}&offset=${offset}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const mediaData = await response.json();

      // Process the media data
      const processedMedia = mediaData.map((item: any) => ({
        ...item,
        id: item.id || null,
        Prompt: item.Prompt || 'No prompt available',
        AssetType: item.AssetType || 'unknown',
        AssetSource: item.AssetSource || ''
      }));

      if (isLoadMore) {
        // Append to existing media
        setMedia(prevMedia => [...prevMedia, ...processedMedia]);
      } else {
        // Replace media (initial load)
        setMedia(processedMedia);
      }

      // Update pagination state
      setCurrentOffset(offset + imagesPerLoad);
      setHasMore(processedMedia.length === imagesPerLoad);

      console.log(`Loaded ${processedMedia.length} admin gallery images. Total: ${isLoadMore ? media.length + processedMedia.length : processedMedia.length}`);
    } catch (error) {
      console.error('Error loading admin gallery images:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadImages(currentOffset, true);
    }
  };

  const openModal = (index: number) => {
    const item = media[index];
    if (item) {
      console.log('Opening modal for item:', item);
      setCurrentModalIndex(index);
      setModalMediaUrl(item.CreatedAssetUrl);
      setIsModalOpen(true);
      
      // Load likes for the current item if it has an ID
      if (item.id) {
        console.log(`Loading likes for asset ${item.id}`);
        fetchLikesForItem(item.id);
      } else {
        console.warn('Asset has no ID, cannot load likes');
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalMediaUrl('');
    setShowGalleryInfoPane(false);
    setCurrentAssetInfo(null);
  };

  // Navigation functions for modal
  const handleNextInModal = () => {
    const nextIndex = currentModalIndex + 1;
    if (nextIndex < media.length) {
      setCurrentModalIndex(nextIndex);
      setModalMediaUrl(media[nextIndex].CreatedAssetUrl);
      
      // Load likes for next item
      if (media[nextIndex].id) {
        fetchLikesForItem(media[nextIndex].id);
      }
    }
  };

  const handlePreviousInModal = () => {
    const prevIndex = currentModalIndex - 1;
    if (prevIndex >= 0) {
      setCurrentModalIndex(prevIndex);
      setModalMediaUrl(media[prevIndex].CreatedAssetUrl);
      
      // Load likes for previous item
      if (media[prevIndex].id) {
        fetchLikesForItem(media[prevIndex].id);
      }
    }
  };

  // Jump to first/last for slideshow infinite loop
  const handleJumpToFirst = () => {
    if (media.length > 0) {
      setCurrentModalIndex(0);
      setModalMediaUrl(media[0].CreatedAssetUrl);
      if (media[0].id) {
        fetchLikesForItem(media[0].id);
      }
    }
  };

  const handleJumpToLast = () => {
    if (media.length > 0) {
      const lastIndex = media.length - 1;
      setCurrentModalIndex(lastIndex);
      setModalMediaUrl(media[lastIndex].CreatedAssetUrl);
      if (media[lastIndex].id) {
        fetchLikesForItem(media[lastIndex].id);
      }
    }
  };

  // Fetch likes for a specific item
  const fetchLikesForItem = async (assetId: string) => {
    try {
      // Include userId to get the current user's like status for this asset
      const url = userId 
        ? `/api/getAssetLikes?assetId=${assetId}&userId=${userId}`
        : `/api/getAssetLikes?assetId=${assetId}`;
      
      console.log(`Fetching likes for asset ${assetId} with user ${userId || 'anonymous'}`);
      
      const response = await fetch(url);
      const likeInfo = await response.json();
      
      console.log(`Likes fetched for ${assetId}:`, likeInfo);
      
      setAssetLikes(prev => ({
        ...prev,
        [assetId]: likeInfo
      }));
    } catch (error) {
      console.error('Error fetching likes:', error);
    }
  };

  // Handle liking/unliking
  const handleToggleLike = async () => {
    const currentItem = media[currentModalIndex];
    if (!currentItem?.id) {
      console.log('No asset ID available for liking');
      return;
    }

    // If user is not logged in, redirect to sign in page
    if (!userId) {
      console.log('User not logged in, redirecting to sign in');
      router.push('/signin');
      return;
    }

    try {
      setIsLiking(true);
      const assetId = currentItem.id;
      const currentLikeInfo = assetLikes[assetId] || { likesCount: 0, isLiked: false };
      const action = currentLikeInfo.isLiked ? 'unlike' : 'like';

      console.log(`Toggling like: ${action} for asset ${assetId} by user ${userId}`);

      const response = await fetch('/api/toggleAssetLike', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId,
          assetId, 
          action 
        })
      });

      const result = await response.json();
      console.log('Like toggle response:', result);

      if (result.success) {
        setAssetLikes(prev => ({
          ...prev,
          [assetId]: {
            likesCount: result.likesCount,
            isLiked: result.isLiked
          }
        }));
        console.log(`Like updated: ${result.isLiked ? 'liked' : 'unliked'}, count: ${result.likesCount}`);
      } else {
        console.error('Like toggle failed:', result.error);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  // Handle sharing
  const handleShare = () => {
    const currentItem = media[currentModalIndex];
    if (!currentItem?.id) return;

    const shareUrl = `${window.location.origin}/gallery?id=${currentItem.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      // Create temporary notification
      const notification = document.createElement('div');
      notification.textContent = 'Share URL copied to clipboard!';
      notification.style.cssText = `
        position: fixed; bottom: 20px; left: 20px; right: 20px; max-width: 90vw;
        padding: 10px 15px; background-color: rgba(0, 0, 0, 0.7); color: white; 
        border-radius: 4px; z-index: 1000; opacity: 0; transition: opacity 0.3s ease-in-out;
        font-size: 14px; text-align: center;
      `;
      
      // Add responsive behavior for larger screens
      if (window.innerWidth >= 640) {
        notification.style.left = 'auto';
        notification.style.right = '20px';
        notification.style.maxWidth = '420px';
      }
      
      document.body.appendChild(notification);
      setTimeout(() => notification.style.opacity = '1', 10);
      setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => document.body.removeChild(notification), 300);
      }, 2000);
    });
  };

  // Gallery info handlers
  const handleToggleGalleryInfoPane = async () => {
    if (!showGalleryInfoPane && !currentAssetInfo) {
      // Load gallery info when opening the pane
      await loadGalleryInfo();
    }
    setShowGalleryInfoPane(!showGalleryInfoPane);
  };

  const loadGalleryInfo = async () => {
    const currentItem = media[currentModalIndex];
    if (!currentItem) return;

    setIsLoadingGalleryInfo(true);
    
    try {
      // Simulate loading (in a real implementation, you might fetch additional data)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setCurrentAssetInfo({
        id: currentItem.id,
        prompt: currentItem.Prompt,
        creatorName: currentItem.CreatorName,
        userId: currentItem.UserId,
        assetType: currentItem.AssetType
      });
    } catch (error) {
      console.error('Error loading gallery info:', error);
    } finally {
      setIsLoadingGalleryInfo(false);
    }
  };

  // Gallery action handlers
  const handleModifyImage = (prompt: string) => {
    // Redirect to image generation page with pre-filled prompt
    if (typeof window !== 'undefined') {
      const encodedPrompt = encodeURIComponent(prompt);
      window.location.href = `/?prompt=${encodedPrompt}&action=modify`;
    }
  };

  const handleCreateVideo = () => {
    // Close modal and redirect to home page, trigger asset refresh
    closeModal();
    if (typeof window !== 'undefined') {
      window.location.href = '/';
      // Trigger a page refresh to show the assets panel and auto-refresh
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  };

  const handleSubmitModifyFromGallery = async (prompt: string) => {
    // Close modal and redirect to image generation with the modified prompt
    closeModal();
    if (typeof window !== 'undefined') {
      const encodedPrompt = encodeURIComponent(prompt);
      window.location.href = `/?prompt=${encodedPrompt}&action=modify`;
    }
  };

  const handleStartFresh = () => {
    // Redirect to home page
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  // Create slideshow from current assets
  const handleCreateSlideshow = async (settings: {
    interval: number;
    direction: 'forward' | 'backward';
    infiniteLoop: boolean;
  }) => {
    const assetIds = media.map(item => item.id).filter(Boolean) as string[];
    
    if (!assetIds.length) {
      return { success: false, error: 'No assets available for slideshow' };
    }

    try {
      const response = await fetch('/api/slideshow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetIds,
          title: 'Admin Gallery Slideshow',
          settings
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        return {
          success: true,
          shareUrl: `${window.location.origin}/slideshow/${data.slideshowId}`
        };
      } else {
        return { success: false, error: data.error || 'Failed to create slideshow' };
      }
    } catch (error) {
      console.error('Error creating slideshow:', error);
      return { success: false, error: 'An error occurred while creating the slideshow' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg">Loading admin gallery...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-center text-3xl font-bold mb-8">Admin Gallery</h1>
      
      {/* Grid of thumbnails - 4 rows of 5 */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        {media.map((item, index) => (
          <div
            key={`${item.id || index}-${item.CreatedAssetUrl}`}
            className="relative aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer group"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={() => openModal(index)}
          >
            {/* Thumbnail image */}
            {item.AssetType === 'vid' ? (
              <video
                src={item.CreatedAssetUrl}
                className="w-full h-full object-cover"
                muted
                preload="metadata"
              />
            ) : (
              <Image
                src={item.CreatedAssetUrl}
                alt={item.Prompt || 'Gallery item'}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                unoptimized
              />
            )}
            
            {/* Hover overlay with Open button */}
            {hoveredIndex === index && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center transition-opacity">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
                  Open
                </button>
              </div>
            )}
            
            {/* Video indicator */}
            {item.AssetType === 'vid' && (
              <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                VIDEO
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Load More button */}
      {hasMore && (
        <div className="text-center">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {loadingMore ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Loading...
              </div>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}

      {/* No more items message */}
      {!hasMore && media.length > 0 && (
        <div className="text-center text-gray-500">
          <p>No more images to load</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && media.length === 0 && (
        <div className="text-center py-12">
          <p className="text-lg text-gray-500">No images found in the admin gallery</p>
        </div>
      )}

      {/* Modal for viewing images with full functionality */}
      {isModalOpen && media.length > 0 && (
        <Modal
          mediaUrl={modalMediaUrl}
          onClose={closeModal}
          fullScreen={false}
          onNext={handleNextInModal}
          onPrevious={handlePreviousInModal}
          hasNext={currentModalIndex < media.length - 1}
          hasPrevious={currentModalIndex > 0}
          onLike={handleToggleLike}
          isLiked={media[currentModalIndex]?.id ? assetLikes[media[currentModalIndex].id]?.isLiked || false : false}
          likesCount={media[currentModalIndex]?.id ? assetLikes[media[currentModalIndex].id]?.likesCount || 0 : 0}
          showLikeButton={!!media[currentModalIndex]?.id}
          currentItemId={media[currentModalIndex]?.id}
          onShare={handleShare}
          showShareButton={!!media[currentModalIndex]?.id}
          onJumpToFirst={handleJumpToFirst}
          onJumpToLast={handleJumpToLast}
          currentAssets={media.map(item => item.id || '').filter(Boolean)}
          onCreateSlideshow={handleCreateSlideshow}
          // Enable slideshow functionality with all assets
          slideshowAssets={media.map(item => ({
            id: item.id || '',
            url: item.CreatedAssetUrl,
            thumbnailUrl: item.AssetType === 'vid' ? item.AssetSource : item.CreatedAssetUrl,
            assetType: item.AssetType
          }))}
          currentAssetIndex={currentModalIndex}
          onAssetClick={(index) => {
            setCurrentModalIndex(index);
            setModalMediaUrl(media[index].CreatedAssetUrl);
            if (media[index].id) {
              fetchLikesForItem(media[index].id);
            }
          }}
          showSlideshowSettings={false}
          autoStartSlideshow={false}
          // Gallery info props
          showGalleryInfoPane={showGalleryInfoPane}
          onToggleGalleryInfoPane={handleToggleGalleryInfoPane}
          currentAssetInfo={currentAssetInfo}
          onModifyImage={handleModifyImage}
          onCreateVideo={handleCreateVideo}
          onStartFresh={handleStartFresh}
          isLoadingGalleryInfo={isLoadingGalleryInfo}
          onSubmitModifyFromGallery={handleSubmitModifyFromGallery}
        />
      )}
    </div>
  );
};

export default AdminGallery;