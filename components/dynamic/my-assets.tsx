import React, { useEffect, useState, useMemo } from 'react';
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
  FaStar,
  FaFilter,
  FaSearch,
  FaSortAmountDown,
  FaSortAmountUp,
  FaList,
  FaTimesCircle
} from 'react-icons/fa';
import Modal from '@/components/ui/Modal'; // Import the Modal component

interface UserActivity {
  id?: string;
  CreatedAssetUrl: string;
  Prompt: string;
  AssetSource: string;
  AssetType: string;
  DateTime?: Date; // Added for sorting
  SubscriptionTier?: number;
  isInGallery?: boolean; // Helper property
  likesCount?: number; // Added for filtering by heart count
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

  // New state for filtering, searching, and sorting
  const [filters, setFilters] = useState({
    assetType: assetType || '', // initialize with prop if provided
    inGallery: false,
    minHearts: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc'); // newest first by default
  const [showFilters, setShowFilters] = useState(false);

  const limit = 10;
  const promptLength = 100;

  const fetchUserActivities = async (userId: string, userIp: string) => {
    if (userId || userIp) {
      try {
        // Support comma-separated asset types - use the filters state
        const assetTypeParam = filters.assetType || '';

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

        // Process the assets to ensure gallery status is properly reflected
        const processedAssets = data.assets.map((asset: UserActivity) => ({
          ...asset,
          isInGallery: asset.SubscriptionTier === 3
        }));

        // Log to help debug gallery status issues
        if (processedAssets.length > 0) {
          console.log(
            'First asset SubscriptionTier:',
            processedAssets[0].SubscriptionTier
          );
          console.log(
            'Assets in gallery:',
            processedAssets.filter((a) => a.isInGallery).length
          );
        }

        setActivities((prev) => [...prev, ...processedAssets]);
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
    // Reset to page 0 when filters change
    setPage(0);
    fetchUserActivities(userId, userIp);
  }, [userId, userIp, page, filters.assetType]);

  // Process and filter/sort the activities based on user preferences
  const filteredAndSortedActivities = useMemo(() => {
    let result = [...activities];

    // Apply gallery filter
    if (filters.inGallery) {
      result = result.filter(
        (activity) => activity.isInGallery || activity.SubscriptionTier === 3
      );
    }

    // Apply heart count filter
    if (filters.minHearts > 0) {
      result = result.filter((activity) => {
        const likeInfo = activity.id ? assetLikes[activity.id] : undefined;
        return likeInfo && likeInfo.likesCount >= filters.minHearts;
      });
    }

    // Apply search filter for prompt text
    if (searchTerm.trim()) {
      const searchTermLower = searchTerm.toLowerCase();
      result = result.filter(
        (activity) =>
          activity.Prompt &&
          activity.Prompt.toLowerCase().includes(searchTermLower)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      const dateA = a.DateTime ? new Date(a.DateTime).getTime() : 0;
      const dateB = b.DateTime ? new Date(b.DateTime).getTime() : 0;

      return sortDirection === 'asc'
        ? dateA - dateB // Oldest first
        : dateB - dateA; // Newest first
    });

    return result;
  }, [activities, filters, searchTerm, sortDirection, assetLikes]);

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

        // Instead of refreshing, just remove the deleted asset from the state
        setActivities((currentActivities) =>
          currentActivities.filter((item) => item.id !== activity.id)
        );

        // Show a toast to confirm deletion
        const notification = document.createElement('div');
        notification.textContent = 'Asset deleted successfully';
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

        // Fade out and remove after 3 seconds
        setTimeout(() => {
          notification.style.opacity = '0';
          setTimeout(() => {
            document.body.removeChild(notification);
          }, 300);
        }, 3000);
      } catch (error) {
        console.error('Error deleting asset:', error);
        alert('Failed to delete asset. Please try again.');
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
  const handleToggleGallery = async (
    activity: UserActivity,
    event: React.MouseEvent
  ) => {
    // Prevent event propagation to avoid any parent handlers
    event.preventDefault();
    event.stopPropagation();

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

      // Use either direct SubscriptionTier check or the isInGallery helper property
      const isInGallery =
        activity.isInGallery || activity.SubscriptionTier === 3;
      console.log(
        `Asset ${activity.id} - SubscriptionTier: ${activity.SubscriptionTier}, isInGallery: ${isInGallery}`
      );
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
        // Optimistically update the UI state without a full refresh
        setActivities(
          activities.map((item) => {
            if (item.id === assetId) {
              return {
                ...item,
                SubscriptionTier: isInGallery ? 0 : 3
              };
            }
            return item;
          })
        );

        // Show a subtle notification instead of an alert
        const message = isInGallery
          ? 'Asset removed from gallery'
          : 'Asset added to gallery!';

        // Create and show a toast-like notification
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

        // Fade out and remove after 3 seconds
        setTimeout(() => {
          notification.style.opacity = '0';
          setTimeout(() => {
            document.body.removeChild(notification);
          }, 300);
        }, 3000);
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

  const openModal = (url: string, fullScreen = false) => {
    setModalMediaUrl(url);
    setIsModalOpen(true);
    // The fullScreen parameter will be passed to the Modal component
    setIsFullScreenModal(fullScreen);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalMediaUrl('');
  };
  
  // Add state to track whether modal should open in full screen mode
  const [isFullScreenModal, setIsFullScreenModal] = useState(false);

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

  // Handle filter changes
  const handleFilterChange = (filterName: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value
    }));

    // Reset to page 0 when filters change
    setPage(0);
  };

  // Toggle filter panel
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      assetType: '',
      inGallery: false,
      minHearts: 0
    });
    setSearchTerm('');
    setSortDirection('desc');
  };

  return (
    <div className="my-assets-container">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-xl font-bold">My {assetTypeTitle} Assets</h1>
        <div className="flex items-center gap-2">
          {isAutoRefreshing && (
            <span
              className="text-xs mr-2"
              style={{ color: 'var(--primary-color)' }}
            >
              Auto-refreshing...
            </span>
          )}

          {/* Filter toggle button */}
          <button
            onClick={toggleFilters}
            className="flex items-center gap-1 px-2 py-1 rounded"
            style={{
              backgroundColor: showFilters
                ? 'var(--primary-color)'
                : 'transparent',
              color: showFilters ? 'white' : 'var(--primary-color)'
            }}
          >
            <FaFilter /> {showFilters ? 'Hide Filters' : 'Filters'}
          </button>

          <button onClick={handleRefresh}>
            {isAutoRefreshing ? 'Refresh Now' : 'Refresh Assets'}
          </button>
        </div>
      </div>

      {/* Filter and search panel */}
      {showFilters && (
        <div
          className="p-3 mb-4 border rounded"
          style={{
            borderColor: 'var(--border-color)',
            backgroundColor: 'var(--card-bg-hover)'
          }}
        >
          <div className="flex flex-col gap-4 md:flex-row md:justify-between">
            {/* Asset Type Filter */}
            <div className="flex flex-col">
              <label className="mb-1 font-medium">Asset Type</label>
              <select
                value={filters.assetType}
                onChange={(e) =>
                  handleFilterChange('assetType', e.target.value)
                }
                className="p-2 rounded border"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <option value="">All Types</option>
                <option value="img">Images</option>
                <option value="vid">Videos</option>
                <option value="que">In Queue</option>
                <option value="upl">Uploads</option>
              </select>
            </div>

            {/* Gallery Filter */}
            <div className="flex flex-col">
              <label className="mb-1 font-medium">In Gallery</label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.inGallery}
                  onChange={(e) =>
                    handleFilterChange('inGallery', e.target.checked)
                  }
                  className="mr-2"
                />
                <label>
                  Show only gallery items{' '}
                  <FaStar className="inline text-yellow-500 ml-1" />
                </label>
              </div>
            </div>

            {/* Heart Count Filter */}
            <div className="flex flex-col">
              <label className="mb-1 font-medium">
                Min Hearts <FaHeart className="inline text-red-500 ml-1" />
              </label>
              <input
                type="number"
                min="0"
                value={filters.minHearts}
                onChange={(e) =>
                  handleFilterChange('minHearts', parseInt(e.target.value) || 0)
                }
                className="p-2 rounded border w-20"
                style={{ borderColor: 'var(--border-color)' }}
              />
            </div>

            {/* Sort Direction */}
            <div className="flex flex-col">
              <label className="mb-1 font-medium">Sort By Date</label>
              <button
                onClick={() =>
                  setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc')
                }
                className="flex items-center gap-1 p-2 border rounded"
                style={{ borderColor: 'var(--border-color)' }}
              >
                {sortDirection === 'desc' ? (
                  <>
                    <FaSortAmountDown /> Newest First
                  </>
                ) : (
                  <>
                    <FaSortAmountUp /> Oldest First
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="mt-4">
            <label className="mb-1 font-medium">Search Prompts</label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search in prompts..."
                className="p-2 pl-10 rounded border w-full"
                style={{ borderColor: 'var(--border-color)' }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FaTimesCircle />
                </button>
              )}
            </div>
          </div>

          {/* Reset Filters */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={clearFilters}
              className="text-sm"
              style={{ color: 'var(--primary-color)' }}
            >
              Reset All Filters
            </button>
          </div>
        </div>
      )}

      {/* Results summary */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <p className="text-sm">
            Showing {filteredAndSortedActivities.length}{' '}
            {filteredAndSortedActivities.length === 1 ? 'asset' : 'assets'}
            {(filters.assetType ||
              filters.inGallery ||
              filters.minHearts > 0 ||
              searchTerm) &&
              ' (filtered)'}
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-2">
        <p>
          <strong>*New:</strong> Star your asset to add it to the{' '}
          <a href={'/gallery'}>public gallery</a>. Heart your asset to be first
          to love it.
        </p>
      </div>
      <div className="flex justify-between items-center mb-2">
        <p>
          <strong>*WIN:</strong> 500 Credits EVERY MONTH for the most hearts in
          the <a href={'/gallery'}>GenTube.ai gallery</a>. Next winner: June 30,
          2025.
        </p>
      </div>
      <div className="flex justify-between items-center mb-2">
        <p>
          <strong>*BUY MORE CREDITS:</strong> Keep the creative juices flowing!{' '}
          <a href={'/pricing'}>See Pricing</a>
        </p>
      </div>

      {filteredAndSortedActivities.length === 0 && (
        <p>
          {activities.length === 0
            ? `No assets found. You may need to ${userId ? '' : '<a href="/signin">sign in</a> to'} see your assets.`
            : 'No assets match your current filters. Try changing or clearing the filters.'}
        </p>
      )}
      {filteredAndSortedActivities.map((activity, index) => (
        <div
          key={index}
          className={`border p-4 ${
            onSelectAsset ? 'cursor-pointer asset-item-hover' : ''
          } ${
            selectedAssetUrl === activity.CreatedAssetUrl ||
            selectedAssetUrl === activity.AssetSource
              ? 'asset-item-selected'
              : ''
          } flex flex-col md:flex-row md:items-center`}
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
          {/* Image/thumbnail - larger on mobile */}
          <div className="flex justify-center w-full md:w-auto mb-3 md:mb-0">
            <div
              className={`w-48 h-48 md:w-32 md:h-32 flex items-center justify-center md:mr-4 ${activity.AssetType === 'que' || activity.AssetType === 'err' ? 'disabled' : ''}`}
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
                  openModal(activity.CreatedAssetUrl, false); // Regular size initially
                }
              }}
            >
              {activity.AssetType === 'vid' &&
              activity.AssetSource === 'none' ? (
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
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    if (activity.AssetType === 'vid') {
                      // Hide the broken image
                      e.currentTarget.style.display = 'none';
                      // Create play icon with label - using the same icon as for AssetSource === 'none'
                      const container = e.currentTarget.parentElement;
                      if (container) {
                        const playIcon = document.createElement('div');
                        playIcon.className =
                          'w-full h-full flex flex-col items-center justify-center';

                        // Create the FaPlay icon element
                        const iconElement = document.createElement('div');
                        iconElement.className = 'w-8 h-8 text-gray-500';

                        // Use the same icon component styling as above
                        const svgIcon = document.createElementNS(
                          'http://www.w3.org/2000/svg',
                          'svg'
                        );
                        svgIcon.setAttribute('fill', 'currentColor');
                        svgIcon.setAttribute('viewBox', '0 0 448 512');
                        svgIcon.setAttribute('class', 'w-8 h-8');

                        // This is the path data for FaPlay from react-icons
                        const path = document.createElementNS(
                          'http://www.w3.org/2000/svg',
                          'path'
                        );
                        path.setAttribute(
                          'd',
                          'M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z'
                        );

                        svgIcon.appendChild(path);
                        iconElement.appendChild(svgIcon);

                        // Add text
                        const textElement = document.createElement('div');
                        textElement.className = 'mt-2 text-gray-500';
                        textElement.textContent = '';

                        // Assemble the complete element
                        playIcon.appendChild(iconElement);
                        playIcon.appendChild(textElement);
                        container.appendChild(playIcon);
                      }
                    }
                  }}
                />
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-col flex-grow w-full">
            {/* Asset Type */}
            <div className="mb-2 text-center md:text-left">
              <p className="font-medium">
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

            {/* Prompt - with more space on mobile */}
            {activity.AssetType !== 'upl' && (
              <div className="mb-3 text-center md:text-left">
                <p className="break-words">
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

            {/* Action buttons - horizontally centered on mobile */}
            <div className="flex justify-center md:justify-start">
              <div className="flex items-center space-x-3 md:space-x-2">
                <button
                  onClick={() => openModal(activity.CreatedAssetUrl, true)} 
                  className="icon-size"
                  title="Open in Full Screen"
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
                    onClick={(e) => handleToggleGallery(activity, e)}
                    className={`icon-size ${activity.isInGallery || activity.SubscriptionTier === 3 ? 'text-yellow-500' : ''} ${galleryActionAssetId === activity.id ? 'opacity-50' : ''}`}
                    title={
                      activity.isInGallery || activity.SubscriptionTier === 3
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
        </div>
      ))}
      {/* Only show load more if we have more original assets and we're not applying client-side filters */}
      {activities.length > 0 &&
        hasMore &&
        !(filters.inGallery || filters.minHearts > 0 || searchTerm.trim()) && (
          <button
            onClick={() => setPage((prev) => prev + 1)}
            className="mt-4 px-4 py-2 rounded border"
            style={{ borderColor: 'var(--border-color)' }}
          >
            Load More
          </button>
        )}
      {isModalOpen && <Modal mediaUrl={modalMediaUrl} onClose={closeModal} fullScreen={isFullScreenModal} />}
    </div>
  );
};

export default MyAssets;
