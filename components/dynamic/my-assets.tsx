import React, { useEffect, useState } from 'react';
import { useUserId } from '@/context/UserIdContext';
import { useUserIp } from '@/context/UserIpContext';
import {
  FaExternalLinkAlt,
  FaCopy,
  FaImage,
  FaVideo,
  FaTrash,
  FaPlay,
  FaDownload,
  FaHeart,
  FaStar
} from 'react-icons/fa';
import Modal from '@/components/ui/Modal'; // Import the Modal component

interface UserActivity {
  id?: string;
  CreatedAssetUrl: string;
  Prompt: string;
  AssetSource: string;
  AssetType: string;
  SubscriptionTier?: number;
}

interface AssetLikeInfo {
  likesCount: number;
  isLiked: boolean;
}

interface MyAssetsProps {
  assetType?: string;
  onSelectAsset?: (url: string) => void;
  selectedUrl?: string;
  autoRefreshQueued?: boolean; // New prop to trigger auto-refresh for queued items
}

const MyAssets: React.FC<MyAssetsProps> = ({
  assetType,
  onSelectAsset,
  selectedUrl,
  autoRefreshQueued = false
}) => {
  const userId = useUserId();
  const userIp = useUserIp();
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [expandedPrompts, setExpandedPrompts] = useState<{
    [key: number]: boolean;
  }>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMediaUrl, setModalMediaUrl] = useState('');
  const [selectedAssetUrl, setSelectedAssetUrl] = useState<string | undefined>(
    selectedUrl
  );
  const [autoRefreshTimer, setAutoRefreshTimer] =
    useState<NodeJS.Timeout | null>(null);
  const [autoRefreshStartTime, setAutoRefreshStartTime] = useState<
    number | null
  >(null);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0); // Track number of refreshes
  const [nextRefreshIn, setNextRefreshIn] = useState<number | null>(null); // Countdown to next refresh in seconds
  const [assetLikes, setAssetLikes] = useState<{
    [key: string]: AssetLikeInfo;
  }>({});
  const [galleryActionAssetId, setGalleryActionAssetId] = useState<
    string | null
  >(null); // Track which asset is being updated
  const limit = 10;
  const promptLength = 100;

  const fetchUserActivities = async (userId: string, userIp: string) => {
    if (userId || userIp) {
      try {
        // Support comma-separated asset types
        const assetTypeParam = assetType || '';

        const response = await fetch(
          `/api/getUserAssets?userId=${userId ? userId : 'none'}&userIp=${userIp ? userIp : 'none'}&limit=${limit}&offset=${page * limit}&assetType=${assetTypeParam}`
        );
        if (!response.ok) {
          console.log('Error fetching user assets.');
          throw new Error('Failed to fetch user assets');
        }
        const data = await response.json();
        if (page == 0) {
          setActivities([]);
        }
        setActivities((prev) => [...prev, ...data.assets]);
        setHasMore(data.assets.length === limit && data.assets.length > 0);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserActivities(userId, userIp);
  }, [userId, userIp, page, assetType]);

  // Fetch likes for all displayed assets
  useEffect(() => {
    const fetchLikes = async () => {
      if (!userId || !activities.length) return;

      try {
        // Fetch all likes for this user
        const response = await fetch(`/api/getAssetLikes?userId=${userId}`);
        const likedAssets = await response.json();

        // Fetch individual like counts for each asset
        const likesPromises = activities.map(async (activity) => {
          if (!activity.id) return null;

          const response = await fetch(
            `/api/getAssetLikes?assetId=${activity.id}&userId=${userId}`
          );
          const likeInfo = await response.json();

          return {
            assetId: activity.id,
            likeInfo
          };
        });

        const likesResults = await Promise.all(likesPromises);

        // Update the asset likes state
        const newAssetLikes = { ...assetLikes };
        likesResults.forEach((result) => {
          if (result && result.assetId) {
            newAssetLikes[result.assetId] = result.likeInfo;
          }
        });

        setAssetLikes(newAssetLikes);
      } catch (error) {
        console.error('Error fetching likes:', error);
      }
    };

    fetchLikes();
  }, [userId, activities]);

  // Update internal state when selectedUrl prop changes
  useEffect(() => {
    setSelectedAssetUrl(selectedUrl);
  }, [selectedUrl]);

  // Auto-refresh logic for queued items
  useEffect(() => {
    // Only proceed if autoRefreshQueued is true
    if (!autoRefreshQueued) {
      return;
    }

    // Clear any existing timer
    if (autoRefreshTimer) {
      clearTimeout(autoRefreshTimer);
      setAutoRefreshTimer(null);
    }

    // Check if any assets are in queue
    const hasQueuedItems = activities.some(
      (activity) => activity.AssetType === 'que'
    );

    if (hasQueuedItems) {
      // Start auto-refresh only if we haven't exceeded the 10-minute limit
      const currentTime = Date.now();
      const tenMinutesInMs = 10 * 60 * 1000;

      if (!autoRefreshStartTime) {
        // First time seeing queued items, start the timer
        setAutoRefreshStartTime(currentTime);
        setIsAutoRefreshing(true);
      } else if (currentTime - autoRefreshStartTime > tenMinutesInMs) {
        // We've been refreshing for over 10 minutes, stop auto-refresh
        console.log('Auto-refresh timeout reached after 10 minutes');
        setIsAutoRefreshing(false);
        return;
      }

      // Determine refresh interval based on refresh count
      // First refresh: 10 seconds, Second refresh: 20 seconds, Subsequent refreshes: 30 seconds
      let refreshInterval;
      if (refreshCount === 0) {
        refreshInterval = 10000; // 10 seconds for first refresh
      } else if (refreshCount === 1) {
        refreshInterval = 20000; // 20 seconds for second refresh
      } else {
        refreshInterval = 30000; // 30 seconds for all subsequent refreshes
      }

      console.log(
        `Setting up refresh in ${refreshInterval / 1000} seconds (refresh #${refreshCount + 1})`
      );

      // Set initial countdown value
      setNextRefreshIn(Math.floor(refreshInterval / 1000));

      // Create countdown timer that updates every second
      const countdownInterval = setInterval(() => {
        setNextRefreshIn((prev) => {
          if (prev === null || prev <= 1) {
            // Clear this interval when we reach zero
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Set a new timer with the calculated interval
      const timer = setTimeout(() => {
        console.log(
          `Auto-refreshing assets due to queued items (refresh #${refreshCount + 1})`
        );
        fetchUserActivities(userId, userIp);
        // Increment refresh count
        setRefreshCount((prevCount) => prevCount + 1);
        // Clear the countdown interval
        clearInterval(countdownInterval);
      }, refreshInterval);

      // Store the timer so we can clear it if needed
      setAutoRefreshTimer(timer);
    } else {
      // No more queued items, reset the state
      if (autoRefreshStartTime) {
        setAutoRefreshStartTime(null);
        setIsAutoRefreshing(false);
        setRefreshCount(0); // Reset the refresh count when no more queued items
        setNextRefreshIn(null); // Clear the countdown timer
      }
    }

    // Cleanup function
    return () => {
      if (autoRefreshTimer) {
        clearTimeout(autoRefreshTimer);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activities,
    userId,
    userIp,
    autoRefreshQueued,
    autoRefreshStartTime,
    refreshCount
  ]);

  const handleCopy = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    alert(message);
  };

  const togglePrompt = (index: number) => {
    setExpandedPrompts((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleRefresh = () => {
    setLoading(true);
    setPage(0);
    fetchUserActivities(userId, userIp);
    // Reset refresh count for auto-refresh timing to start over
    setRefreshCount(0);
  };

  const handleDelete = async (activity: UserActivity) => {
    if (confirm('Are you sure you want to delete this asset?')) {
      try {
        const response = await fetch('/api/deleteUserAsset', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId,
            entityId: activity.id, // Send the Datastore entity ID
            assetUrl: activity.CreatedAssetUrl, // Keep for backward compatibility
            assetType: activity.AssetType
          })
        });
        if (!response.ok) {
          throw new Error('Failed to delete asset');
        }
        handleRefresh();
      } catch (error) {
        console.error('Error deleting asset:', error);
      }
    }
  };

  const handleDownload = async (url: string, assetType: string) => {
    try {
      // For videos and images, determine file extension
      const fileExtension = assetType === 'vid' ? '.mp4' : '.jpg';
      const fileName = `asset${fileExtension}`;

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
      console.error('Error downloading asset:', error);
      alert('Failed to download the asset');
    }
  };

  // Handle liking/unliking an asset
  const handleToggleLike = async (activity: UserActivity) => {
    if (!userId || !activity.id) return;

    try {
      const assetId = activity.id;
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
    }
  };

  // Handle adding/removing an asset to/from the gallery
  const handleToggleGallery = async (activity: UserActivity) => {
    if (!userId || !activity.id) {
      if (!userId) {
        alert('You must be signed in to add items to the gallery.');
      } else {
        alert('Cannot add this item to the gallery: Missing item ID.');
      }
      return;
    }

    try {
      const assetId = activity.id;
      setGalleryActionAssetId(assetId); // Set this specific asset as being processed

      const isInGallery = activity.SubscriptionTier === 3;
      const action = isInGallery ? 'remove' : 'add';

      // Don't allow uploaded images to be added to gallery
      if (action === 'add' && activity.AssetType === 'upl') {
        alert('Uploaded images cannot be added to the gallery.');
        setGalleryActionAssetId(null);
        return;
      }

      console.log(`Toggling gallery status: ${action} for asset ${assetId}`);

      const response = await fetch('/api/toggleGalleryAsset', {
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

      if (response.ok && result.success) {
        // Refresh the user activities to show the updated gallery status
        handleRefresh();
        alert(
          isInGallery
            ? 'Asset has been removed from the gallery.'
            : 'Asset has been added to the gallery!'
        );
      } else {
        console.error('Gallery toggle API error:', result);
        // Show detailed error message for debugging
        if (result.error) {
          alert(`Error: ${result.error}\n${result.details || ''}`);
        } else {
          alert(
            'Failed to update gallery status. Please try again.\nCheck browser console for details.'
          );
        }
        console.log('Full error details:', result);
      }
    } catch (error) {
      console.error('Error toggling gallery status:', error);
      alert(
        'An error occurred while updating gallery status. Please try again.'
      );
    } finally {
      setGalleryActionAssetId(null); // Clear the processing state
    }
  };

  const openModal = (url: string) => {
    setModalMediaUrl(url);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalMediaUrl('');
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  // Create a descriptive title for asset types
  const getAssetTypeTitle = (type: string | undefined): string => {
    if (!type) return '';

    if (type.includes(',')) {
      // Handle multiple types
      const types = type.split(',').map((t) => t.trim());

      // Map specific combinations to friendly titles
      if (
        types.includes('upl') &&
        types.includes('img') &&
        types.length === 2
      ) {
        return 'Image';
      }

      // For other combinations, create a combined title
      const typeTitles = types.map((t) =>
        t === 'vid'
          ? 'Video'
          : t === 'img'
            ? 'Image'
            : t === 'upl'
              ? 'Uploaded'
              : t
      );

      return typeTitles.join(' & ');
    }

    // Single type
    return type === 'vid'
      ? 'Video'
      : type === 'img'
        ? 'Image'
        : type === 'upl'
          ? 'Uploaded'
          : type;
  };

  const assetTypeTitle = getAssetTypeTitle(assetType);

  return (
    <div className="my-assets-container">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">My {assetTypeTitle} Assets</h1>
        <p>
          <strong>*New:</strong> Star your asset to add it to the{' '}
          <a href={'/gallery'}>public gallery</a>. Heart your asset to be first
          to love it.
        </p>
        <div className="flex items-center">
          {isAutoRefreshing && (
            <span
              className="text-xs mr-2"
              style={{ color: 'var(--primary-color)' }}
            >
              {/*Auto-refreshing {nextRefreshIn !== null ? `(${nextRefreshIn}s)` : '...'}*/}
              Auto-refreshing...
            </span>
          )}
          <button onClick={handleRefresh}>
            {isAutoRefreshing ? 'Refresh Now' : 'Refresh Assets'}
          </button>
        </div>
      </div>
      {activities && activities.length === 0 && (
        <p>
          No assets found. You may need to <a href="/signin">sign in</a> to see
          your assets.
        </p>
      )}
      {activities.map((activity, index) => (
        <div
          key={index}
          className={`border p-4 flex items-center ${
            onSelectAsset ? 'cursor-pointer asset-item-hover' : ''
          } ${
            selectedAssetUrl === activity.CreatedAssetUrl ||
            selectedAssetUrl === activity.AssetSource
              ? 'asset-item-selected'
              : ''
          }`}
          onClick={(e) => {
            if (onSelectAsset) {
              // If in selection mode, make the whole row clickable
              e.preventDefault();
              const urlToSelect =
                activity.AssetType === 'vid'
                  ? activity.AssetSource || activity.CreatedAssetUrl
                  : activity.CreatedAssetUrl;

              // Check if this asset is already selected
              const isAlreadySelected =
                selectedAssetUrl === activity.CreatedAssetUrl ||
                selectedAssetUrl === activity.AssetSource;

              if (isAlreadySelected) {
                // If already selected, deselect it
                setSelectedAssetUrl(undefined);
                onSelectAsset(''); // Pass empty string to deselect
              } else {
                // Otherwise select it
                setSelectedAssetUrl(urlToSelect);
                onSelectAsset(urlToSelect);
              }
            }
          }}
        >
          <div
            className={`w-16 h-16 flex items-center justify-center mr-4 ${activity.AssetType === 'que' || activity.AssetType === 'err' ? 'disabled' : ''}`}
            style={{ backgroundColor: 'var(--card-bg-hover)' }}
            onClick={(e) => {
              e.preventDefault();
              if (onSelectAsset) {
                // If in selection mode, call the selection callback
                const urlToSelect =
                  activity.AssetType === 'vid'
                    ? activity.AssetSource || activity.CreatedAssetUrl
                    : activity.CreatedAssetUrl;

                // Check if this asset is already selected
                const isAlreadySelected =
                  selectedAssetUrl === activity.CreatedAssetUrl ||
                  selectedAssetUrl === activity.AssetSource;

                if (isAlreadySelected) {
                  // If already selected, deselect it
                  setSelectedAssetUrl(undefined);
                  onSelectAsset(''); // Pass empty string to deselect
                } else {
                  // Otherwise select it
                  setSelectedAssetUrl(urlToSelect);
                  onSelectAsset(urlToSelect);
                }
              } else {
                // Otherwise, open the modal as usual
                openModal(activity.CreatedAssetUrl);
              }
            }}
          >
            {activity.AssetType === 'vid' && activity.AssetSource === 'none' ? (
              <FaPlay className="w-8 h-8 text-gray-500" />
            ) : (
              <img
                src={
                  activity.AssetType === 'vid'
                    ? activity.AssetSource
                    : activity.AssetType === 'img'
                      ? activity.CreatedAssetUrl
                      : activity.AssetType === 'upl'
                        ? activity.CreatedAssetUrl
                        : activity.AssetType === 'que'
                          ? '/logo.png'
                          : activity.AssetType === 'err'
                            ? '/logo.png'
                            : '/logo.png'
                }
                alt="Thumbnail"
                className="w-16 h-16 object-cover"
              />
            )}
          </div>
          <div className="flex flex-wrap w-full max-w-full">
            <div className="pr-2">
              <p>
                <strong>Type:</strong>{' '}
                {activity.AssetType === 'vid'
                  ? 'Video'
                  : activity.AssetType === 'img'
                    ? 'Image'
                    : activity.AssetType === 'upl'
                      ? 'Upload'
                      : activity.AssetType === 'que'
                        ? 'In Queue'
                        : activity.AssetType === 'err'
                          ? 'ERROR'
                          : activity.AssetType}
              </p>
            </div>
            {activity.AssetType !== 'upl' && (
              <div className="flex flex-wrap w-full max-w-full">
                <p>
                  <strong>Prompt:</strong>{' '}
                  {expandedPrompts[index] ||
                  activity.Prompt.length <= promptLength
                    ? activity.Prompt
                    : `${activity.Prompt.substring(0, promptLength)}... `}
                  {activity.Prompt.length > promptLength && (
                    <button
                      onClick={() => togglePrompt(index)}
                      style={{ color: 'var(--primary-color)' }}
                    >
                      {expandedPrompts[index] ? 'less' : 'more'}
                    </button>
                  )}
                  <button
                    onClick={() =>
                      handleCopy(activity.Prompt, 'Prompt copied!')
                    }
                    className="icon-size-small ml-2"
                    title="Copy Prompt"
                  >
                    <FaCopy />
                  </button>
                </p>
              </div>
            )}
          </div>
          <div>
            <div className="flex flex-col items-center space-y-2 sm:flex-row sm:items-start sm:space-y-0 sm:space-x-2 mt-2">
              <button
                onClick={() => openModal(activity.CreatedAssetUrl)}
                className="icon-size"
                title="Open"
              >
                <FaExternalLinkAlt />
              </button>
              <button
                onClick={() =>
                  handleCopy(
                    activity.AssetType === 'vid'
                      ? activity.AssetSource
                      : activity.CreatedAssetUrl,
                    'Image URL copied!'
                  )
                }
                className="icon-size"
                title="Copy Image URL"
              >
                <FaImage />
              </button>
              {activity.AssetType === 'vid' && (
                <button
                  onClick={() =>
                    handleCopy(activity.CreatedAssetUrl, 'Video URL copied!')
                  }
                  className="icon-size"
                  title="Copy Video URL"
                >
                  <FaVideo />
                </button>
              )}
              <button
                onClick={() =>
                  handleDownload(
                    activity.AssetType === 'vid'
                      ? activity.CreatedAssetUrl
                      : activity.CreatedAssetUrl,
                    activity.AssetType
                  )
                }
                className="icon-size"
                title="Download Asset"
              >
                <FaDownload />
              </button>
              {/* Heart/Like button */}
              {activity.AssetType !== 'upl' && activity.id && (
                <button
                  onClick={() => handleToggleLike(activity)}
                  className={`icon-size ${assetLikes[activity.id]?.isLiked ? 'text-red-500' : ''}`}
                  title={assetLikes[activity.id]?.isLiked ? 'Unlike' : 'Like'}
                >
                  <div className="flex items-center">
                    {assetLikes[activity.id]?.likesCount > 0 && (
                      <span className="mr-1 text-xs">
                        {assetLikes[activity.id]?.likesCount}
                      </span>
                    )}
                    <FaHeart />
                  </div>
                </button>
              )}

              {/* Gallery toggle button */}
              {activity.AssetType !== 'upl' && (
                <button
                  onClick={() => handleToggleGallery(activity)}
                  className={`icon-size ${activity.SubscriptionTier === 3 ? 'text-yellow-500' : ''} ${galleryActionAssetId === activity.id ? 'opacity-50' : ''}`}
                  title={
                    activity.SubscriptionTier === 3
                      ? 'Remove from Gallery'
                      : 'Add to Gallery'
                  }
                  disabled={galleryActionAssetId !== null} // Disable all gallery buttons while any operation is in progress
                >
                  <FaStar
                    className={
                      galleryActionAssetId === activity.id
                        ? 'animate-pulse'
                        : ''
                    }
                  />
                </button>
              )}

              <button
                onClick={() => handleDelete(activity)}
                className="red icon-size"
                title="Delete Asset"
              >
                <FaTrash />
              </button>
            </div>
          </div>
        </div>
      ))}
      {activities.length > 0 && hasMore && (
        <button onClick={() => setPage((prev) => prev + 1)} className="mt-4">
          Load More
        </button>
      )}
      {isModalOpen && <Modal mediaUrl={modalMediaUrl} onClose={closeModal} />}
    </div>
  );
};

export default MyAssets;
