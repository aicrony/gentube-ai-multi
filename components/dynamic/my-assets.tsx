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
  FaTimesCircle,
  FaPlayCircle,
  FaEdit,
  FaGripVertical,
  FaTag,
  FaFolder
} from 'react-icons/fa';
import Modal from '@/components/ui/Modal'; // Import the Modal component
import { useToast } from '@/components/ui/Toast';
import GroupManager from './group-manager';
import AssetGroupManager from './asset-group-manager';

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
  groups?: Array<{
    id: string;
    name: string;
    color?: string;
  }>; // Groups this asset belongs to
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
  const { showToast } = useToast();
  const [activities, setActivities] = useState<UserActivity[]>([]);

  // Check for URL parameter to open specific image
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const openImageId = urlParams.get('openImage');

      if (openImageId && activities.length > 0) {
        // Find the image with this ID and open it
        const imageIndex = activities.findIndex(
          (activity) => activity.id === openImageId
        );
        if (imageIndex !== -1) {
          const activity = activities[imageIndex];
          // Open the modal with this image
          openModalForAsset(imageIndex, false);

          // If it's an image or upload, automatically show the edit pane
          if (activity.AssetType === 'img' || activity.AssetType === 'upl') {
            // Set the edit pane to show after modal opens
            setTimeout(() => {
              setShowImageEditPane(true);
              setEditImageUrl(activity.CreatedAssetUrl);
              setEditPrompt('');
            }, 100); // Small delay to ensure modal is open
          }

          // Clear the URL parameter
          window.history.replaceState({}, '', window.location.pathname);
        }
      }
    }
  }, [activities]); // Run when activities change

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [expandedPrompts, setExpandedPrompts] = useState<{
    [key: number]: boolean;
  }>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMediaUrl, setModalMediaUrl] = useState('');
  const [currentModalIndex, setCurrentModalIndex] = useState(0);
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
    minHearts: 0,
    groupId: null as string | null // Add group filter
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc'); // newest first by default
  const [showFilters, setShowFilters] = useState(false);

  // Group management state
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [isGroupManagerOpen, setIsGroupManagerOpen] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [showGroupsPanel, setShowGroupsPanel] = useState(false);
  const [groupRefreshKey, setGroupRefreshKey] = useState(0); // Force re-render of GroupManager

  const limit = 10;
  const promptLength = 100;

  const fetchUserActivities = async (userId: string, userIp: string) => {
    if (userId || userIp) {
      try {
        // Support comma-separated asset types - use the filters state
        const assetTypeParam = filters.assetType || '';
        const groupIdParam = filters.groupId || '';
        
        // Build query parameters
        const params = new URLSearchParams({
          userId: userId ? userId : 'none',
          userIp: userIp ? userIp : 'none',
          limit: limit.toString(),
          offset: (page * limit).toString(),
          includeGroups: 'true' // Always include group information
        });
        
        if (assetTypeParam) {
          params.append('assetType', assetTypeParam);
        }
        
        if (groupIdParam) {
          params.append('groupId', groupIdParam);
        }

        const response = await fetch(`/api/getUserAssets?${params.toString()}`);
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
  }, [userId, userIp, page, filters.assetType, filters.groupId]);


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

  // Handle sharing an asset URL
  const handleShareUrl = (activity: UserActivity) => {
    if (!activity.id) {
      return;
    }

    // Create a URL that links directly to the gallery with this item
    const shareUrl = `${window.location.origin}/gallery?id=${activity.id}`;

    // Copy to clipboard with a custom message
    handleCopy(shareUrl, 'Share URL copied to clipboard!');
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

  // Enhanced modal open function that takes index and activity reference
  const openModalForAsset = (index: number, fullScreen = false) => {
    if (index >= 0 && index < filteredAndSortedActivities.length) {
      const activity = filteredAndSortedActivities[index];
      const url =
        activity.AssetType === 'vid'
          ? activity.CreatedAssetUrl
          : activity.CreatedAssetUrl;
      setCurrentModalIndex(index);
      setModalMediaUrl(url);

      // Set edit image URL for images and uploads so edit functionality works
      if (activity.AssetType === 'img' || activity.AssetType === 'upl') {
        setEditImageUrl(activity.CreatedAssetUrl);
      }

      setIsModalOpen(true);
      setIsFullScreenModal(fullScreen);
    }
  };

  // Original function for backward compatibility - opens the modal by URL
  const openModal = (url: string, fullScreen = false) => {
    // Find the index of the asset with this URL
    const index = filteredAndSortedActivities.findIndex(
      (activity) =>
        activity.CreatedAssetUrl === url || activity.AssetSource === url
    );

    if (index !== -1) {
      openModalForAsset(index, fullScreen);
    } else {
      // Fallback if no matching asset found
      setModalMediaUrl(url);

      // Try to set edit image URL for edit functionality even in fallback
      const matchingActivity = filteredAndSortedActivities.find(
        (activity) => activity.CreatedAssetUrl === url
      );
      if (
        matchingActivity &&
        (matchingActivity.AssetType === 'img' ||
          matchingActivity.AssetType === 'upl')
      ) {
        setEditImageUrl(url);
      }

      setIsModalOpen(true);
      setIsFullScreenModal(fullScreen);
    }
  };

  // Navigation functions for modal
  const handleNextInModal = () => {
    // "Next" should go to newer (chronologically later) image
    // Since array is sorted newest first (desc), we go backward in array for newer
    if (currentModalIndex > 0) {
      const nextActivity = filteredAndSortedActivities[currentModalIndex - 1];
      const url =
        nextActivity.AssetType === 'vid'
          ? nextActivity.CreatedAssetUrl
          : nextActivity.CreatedAssetUrl;
      setCurrentModalIndex(currentModalIndex - 1);
      setModalMediaUrl(url);

      // Update edit image URL for the new image
      if (
        nextActivity.AssetType === 'img' ||
        nextActivity.AssetType === 'upl'
      ) {
        setEditImageUrl(nextActivity.CreatedAssetUrl);
      } else {
        setEditImageUrl(''); // Clear for videos
      }
    }
  };

  const handlePreviousInModal = () => {
    // "Previous" should go to older (chronologically earlier) image
    // Since array is sorted newest first (desc), we go forward in array for older
    if (currentModalIndex < filteredAndSortedActivities.length - 1) {
      const prevActivity = filteredAndSortedActivities[currentModalIndex + 1];
      const url =
        prevActivity.AssetType === 'vid'
          ? prevActivity.CreatedAssetUrl
          : prevActivity.CreatedAssetUrl;
      setCurrentModalIndex(currentModalIndex + 1);
      setModalMediaUrl(url);

      // Update edit image URL for the new image
      if (
        prevActivity.AssetType === 'img' ||
        prevActivity.AssetType === 'upl'
      ) {
        setEditImageUrl(prevActivity.CreatedAssetUrl);
      } else {
        setEditImageUrl(''); // Clear for videos
      }
    }
  };

  // Jump to first image in slideshow mode (for infinite looping)
  const handleJumpToFirstImage = () => {
    if (filteredAndSortedActivities.length > 0) {
      const firstActivity = filteredAndSortedActivities[0];
      const url =
        firstActivity.AssetType === 'vid'
          ? firstActivity.CreatedAssetUrl
          : firstActivity.CreatedAssetUrl;
      setCurrentModalIndex(0);
      setModalMediaUrl(url);

      // Update edit image URL for the first image
      if (
        firstActivity.AssetType === 'img' ||
        firstActivity.AssetType === 'upl'
      ) {
        setEditImageUrl(firstActivity.CreatedAssetUrl);
      } else {
        setEditImageUrl(''); // Clear for videos
      }
    }
  };

  // Jump to last image in slideshow mode (for infinite looping)
  const handleJumpToLastImage = () => {
    if (filteredAndSortedActivities.length > 0) {
      const lastIndex = filteredAndSortedActivities.length - 1;
      const lastActivity = filteredAndSortedActivities[lastIndex];
      const url =
        lastActivity.AssetType === 'vid'
          ? lastActivity.CreatedAssetUrl
          : lastActivity.CreatedAssetUrl;
      setCurrentModalIndex(lastIndex);
      setModalMediaUrl(url);

      // Update edit image URL for the last image
      if (
        lastActivity.AssetType === 'img' ||
        lastActivity.AssetType === 'upl'
      ) {
        setEditImageUrl(lastActivity.CreatedAssetUrl);
      } else {
        setEditImageUrl(''); // Clear for videos
      }
    }
  };

  // Create a shareable slideshow
  const handleCreateSlideshow = async (settings: {
    interval: number;
    direction: 'forward' | 'backward';
    infiniteLoop: boolean;
  }) => {
    // Get asset IDs for the current filtered view
    const assetIds = filteredAndSortedActivities
      .map((activity) => activity.id)
      .filter(Boolean) as string[];

    if (!assetIds.length || !userId) {
      return {
        success: false,
        error: 'No assets available or user not logged in'
      };
    }

    // Save current assets to localStorage for faster loading
    const slideShowAssets = filteredAndSortedActivities
      .filter((activity) => activity.id && assetIds.includes(activity.id))
      .map((activity) => ({
        id: activity.id || '',
        createdAssetUrl: activity.CreatedAssetUrl,
        prompt: activity.Prompt,
        assetType: activity.AssetType
      }));

    try {
      const response = await fetch('/api/slideshow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId, // Pass the userId explicitly
          userIp, // Pass the userIp explicitly
          assetIds,
          title: 'My Custom Slideshow',
          settings
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to create slideshow'
        };
      }

      // If slideshow creation was successful, save the assets to localStorage
      if (data.success && data.slideshowId) {
        try {
          // Save the assets data to localStorage for this slideshow
          if (typeof window !== 'undefined') {
            localStorage.setItem(
              `slideshow_${data.slideshowId}`,
              JSON.stringify({
                assets: slideShowAssets,
                timestamp: Date.now()
              })
            );
            console.log(
              'Saved slideshow assets to localStorage:',
              data.slideshowId
            );
          }
        } catch (err) {
          console.error('Error saving slideshow data to localStorage:', err);
          // Non-critical error, continue anyway
        }
      }

      return {
        success: true,
        shareUrl: data.shareUrl
      };
    } catch (error) {
      console.error('Error creating slideshow:', error);
      return {
        success: false,
        error: 'An error occurred while creating the slideshow'
      };
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalMediaUrl('');
    setShowSlideshowSettings(false);
    setAutoStartSlideshow(false);
    setShowImageEditPane(false);
    setEditImageUrl('');
    setEditPrompt('');
    setIsEditingImage(false);
  };

  // Function to start slideshow with the first displayed asset
  const handleStartSlideshow = () => {
    if (filteredAndSortedActivities.length > 0) {
      // Open modal with first asset
      const firstActivity = filteredAndSortedActivities[0];
      const url =
        firstActivity.AssetType === 'vid'
          ? firstActivity.CreatedAssetUrl
          : firstActivity.CreatedAssetUrl;

      setCurrentModalIndex(0);
      setModalMediaUrl(url);
      setShowSlideshowSettings(true); // Show slideshow options
      setAutoStartSlideshow(true); // Auto-start the slideshow
      setIsModalOpen(true);
      setIsFullScreenModal(false);
    }
  };

  // Function to handle image editing
  const handleEditImage = (activity: UserActivity) => {
    if (activity.AssetType === 'img' || activity.AssetType === 'upl') {
      // Open modal without automatically showing edit pane
      setCurrentModalIndex(
        filteredAndSortedActivities.findIndex((a) => a.id === activity.id)
      );
      setModalMediaUrl(activity.CreatedAssetUrl);
      setEditImageUrl(activity.CreatedAssetUrl);
      setShowImageEditPane(true); // Show edit pane when opened via edit button
      setEditPrompt('');
      setIsModalOpen(true);
      setIsFullScreenModal(false);
    }
  };

  // Function to toggle image edit pane
  const handleToggleImageEditPane = () => {
    setShowImageEditPane(!showImageEditPane);
    if (!showImageEditPane) {
      // Opening edit pane - clear any existing prompt
      setEditPrompt('');
    }
  };

  // Function to submit image edit
  const handleSubmitImageEdit = async () => {
    if (!editPrompt.trim() || !editImageUrl) return;

    setIsEditingImage(true); // Start loading state

    try {
      const response = await fetch('/api/image-edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId || 'none',
          'x-forwarded-for': userIp
        },
        body: JSON.stringify({
          imageUrl: editImageUrl,
          prompt: editPrompt
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Failed to edit image:', data);

        // Check if it's a credit limit exceeded error
        if (response.status === 429 && data.result === 'LimitExceeded') {
          // Show error toast for credit limit exceeded
          showToast({
            type: 'error',
            prompt: `Credit limit exceeded! You need 6 credits to edit images. Prompt: ${editPrompt}`,
            duration: 15000
          });
        } else {
          alert('Failed to edit image. Please try again.');
        }
      } else {
        console.log('Image edit response:', data);
        if (data.result === 'InQueue') {
          // Close the edit pane but keep modal open
          setShowImageEditPane(false);

          // Show toast notification
          showToast({
            type: 'image-edit',
            prompt: editPrompt,
            duration: 15000
          });

          // Clear edit prompt after successful submission
          setEditPrompt('');

          // Refresh assets to show queued item
          handleRefresh();
        } else if (data.result === 'Completed') {
          // Image edit completed immediately
          setShowImageEditPane(false);

          // Show success toast notification with edited image ID
          showToast({
            type: 'image-edit',
            prompt: `Image edit completed! ${editPrompt}`,
            duration: 10000,
            editedImageId: data.editedImageId // Include the new image ID for opening
          });

          // Clear edit prompt after successful submission
          setEditPrompt('');

          // Refresh assets to show the new edited image
          handleRefresh();
        }
      }
    } catch (error) {
      console.error('Error editing image:', error);
      alert('An error occurred while editing the image. Please try again.');
    } finally {
      setIsEditingImage(false); // End loading state
    }
  };

  // Add state to track whether modal should open in full screen mode
  const [isFullScreenModal, setIsFullScreenModal] = useState(false);
  const [showSlideshowSettings, setShowSlideshowSettings] = useState(false);
  const [autoStartSlideshow, setAutoStartSlideshow] = useState(false);
  const [showImageEditPane, setShowImageEditPane] = useState(false);
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditingImage, setIsEditingImage] = useState(false);

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Listen for closeModal event from toast clicks
  useEffect(() => {
    const handleCloseModal = () => {
      if (isModalOpen) {
        setIsModalOpen(false);
        setModalMediaUrl('');
        setShowSlideshowSettings(false);
        setAutoStartSlideshow(false);
        setShowImageEditPane(false);
        setEditImageUrl('');
        setEditPrompt('');
        setIsEditingImage(false);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('closeModal', handleCloseModal);
      
      return () => {
        window.removeEventListener('closeModal', handleCloseModal);
      };
    }
  }, [isModalOpen]); // Include isModalOpen as dependency to ensure we have the latest state

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
      minHearts: 0,
      groupId: null
    });
    setSearchTerm('');
    setSortDirection('desc');
  };

  // Group management functions
  const handleGroupSelect = (groupId: string | null) => {
    setFilters(prev => ({ ...prev, groupId }));
    setPage(0); // Reset pagination when changing groups
  };

  const handleBulkModeToggle = () => {
    setBulkMode(!bulkMode);
    setSelectedAssets([]); // Clear selection when toggling
  };

  const handleAssetSelect = (assetId: string) => {
    setSelectedAssets(prev => {
      if (prev.includes(assetId)) {
        return prev.filter(id => id !== assetId);
      } else {
        return [...prev, assetId];
      }
    });
  };

  const handleSelectAllVisible = () => {
    const visibleAssetIds = filteredAndSortedActivities
      .map(activity => activity.id)
      .filter(Boolean) as string[];
    
    setSelectedAssets(visibleAssetIds);
  };

  const handleClearSelection = () => {
    setSelectedAssets([]);
  };

  const handleGroupManager = (assetIds?: string[]) => {
    if (assetIds) {
      setSelectedAssets(assetIds);
    }
    setIsGroupManagerOpen(true);
  };

  const handleGroupManagerUpdate = () => {
    // Refresh the asset list to show updated group information
    fetchUserActivities(userId, userIp);
    setSelectedAssets([]);
    // Force refresh of GroupManager to update asset counts
    setGroupRefreshKey(prev => prev + 1);
  };

  // Slideshow preview functions
  const generateSlideshowAssets = () => {
    return filteredAndSortedActivities.slice().reverse().map((activity) => ({
      id: activity.id || '',
      url: activity.CreatedAssetUrl,
      thumbnailUrl: activity.AssetType === 'vid' ? activity.AssetSource : activity.CreatedAssetUrl,
      assetType: activity.AssetType
    }));
  };

  const handleSlideshowAssetClick = (index: number) => {
    if (index >= 0 && index < filteredAndSortedActivities.length) {
      // Convert thumbnail index (creation order) to modal index (newest first)
      const modalIndex = filteredAndSortedActivities.length - 1 - index;
      const activity = filteredAndSortedActivities[modalIndex];
      const url = activity.AssetType === 'vid' 
        ? activity.CreatedAssetUrl 
        : activity.CreatedAssetUrl;
      
      setCurrentModalIndex(modalIndex);
      setModalMediaUrl(url);

      // Set edit image URL for images and uploads so edit functionality works
      if (activity.AssetType === 'img' || activity.AssetType === 'upl') {
        setEditImageUrl(activity.CreatedAssetUrl);
      }
    }
  };

  const handleSlideshowAssetReorder = (fromIndex: number, toIndex: number) => {
    // For now, we'll just show a message that reordering affects the slideshow
    // In a full implementation, this would update the order in the backend
    console.log(`Moving asset from position ${fromIndex} to position ${toIndex}`);
    
    // Temporarily reorder the local state for immediate feedback
    const newActivities = [...filteredAndSortedActivities];
    const [movedItem] = newActivities.splice(fromIndex, 1);
    newActivities.splice(toIndex, 0, movedItem);
    
    // Update current modal index if needed
    if (currentModalIndex === fromIndex) {
      setCurrentModalIndex(toIndex);
    } else if (currentModalIndex > fromIndex && currentModalIndex <= toIndex) {
      setCurrentModalIndex(currentModalIndex - 1);
    } else if (currentModalIndex < fromIndex && currentModalIndex >= toIndex) {
      setCurrentModalIndex(currentModalIndex + 1);
    }
    
    // For a complete implementation, you would call an API to persist this order
    // handleRefresh(); // Refresh to get the updated order from the server
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', '');
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear drag over if we're actually leaving the container
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      setIsDragging(false);
      return;
    }

    try {
      const draggedAsset = filteredAndSortedActivities[draggedIndex];
      if (!draggedAsset.id) {
        console.error('Cannot reorder asset without ID');
        return;
      }

      // Get all asset IDs in current order
      const allAssetIds = filteredAndSortedActivities
        .map(activity => activity.id)
        .filter(Boolean) as string[];

      console.log('Reordering asset:', {
        assetId: draggedAsset.id,
        fromIndex: draggedIndex,
        toIndex: dropIndex,
        allAssetIds
      });

      // Call API to update the order
      const response = await fetch('/api/reorderAssets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          assetId: draggedAsset.id,
          targetIndex: dropIndex,
          allAssetIds
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reorder assets');
      }

      console.log('Asset reordered successfully:', result);

      // Refresh the asset list to show new order
      handleRefresh();

      // Show success toast
      showToast({
        type: 'image',
        prompt: 'Asset order updated successfully!',
        duration: 3000
      });

    } catch (error) {
      console.error('Error reordering assets:', error);
      showToast({
        type: 'error',
        prompt: 'Failed to reorder assets. Please try again.',
        duration: 5000
      });
    } finally {
      setDraggedIndex(null);
      setDragOverIndex(null);
      setIsDragging(false);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    setIsDragging(false);
  };

  // Group slideshow handlers
  const handleStartGroupSlideshow = (groupId: string) => {
    // Set the group filter to show only this group's assets
    setFilters(prev => ({ ...prev, groupId }));
    setPage(0);
    
    // Wait a moment for the filter to take effect, then start slideshow
    setTimeout(() => {
      if (filteredAndSortedActivities.length > 0) {
        const firstActivity = filteredAndSortedActivities[0];
        const url = firstActivity.AssetType === 'vid'
          ? firstActivity.CreatedAssetUrl
          : firstActivity.CreatedAssetUrl;

        setCurrentModalIndex(0);
        setModalMediaUrl(url);
        setShowSlideshowSettings(true); // Show slideshow options
        setAutoStartSlideshow(true); // Auto-start the slideshow
        setIsModalOpen(true);
        setIsFullScreenModal(false);
      }
    }, 100);
  };

  const handleOpenGroupSlideshowSettings = (groupId: string) => {
    // Set the group filter to show only this group's assets
    setFilters(prev => ({ ...prev, groupId }));
    setPage(0);
    
    // Wait a moment for the filter to take effect, then open with settings
    setTimeout(() => {
      if (filteredAndSortedActivities.length > 0) {
        const firstActivity = filteredAndSortedActivities[0];
        const url = firstActivity.AssetType === 'vid'
          ? firstActivity.CreatedAssetUrl
          : firstActivity.CreatedAssetUrl;

        setCurrentModalIndex(0);
        setModalMediaUrl(url);
        setShowSlideshowSettings(true); // Show slideshow options but don't auto-start
        setAutoStartSlideshow(false);
        setIsModalOpen(true);
        setIsFullScreenModal(false);
      }
    }, 100);
  };

  return (
    <div className={`my-assets-container ${isDragging ? 'select-none' : ''}`}>
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

          {/* Start Slideshow button */}
          {filteredAndSortedActivities.length > 0 && (
            <button
              onClick={handleStartSlideshow}
              className="flex items-center gap-1 px-2 py-1 rounded"
              style={{
                backgroundColor: 'var(--primary-color)',
                color: 'white'
              }}
              title="Start slideshow with the first asset"
            >
              <FaPlayCircle /> Start Slideshow
            </button>
          )}

          {/* Groups toggle button */}
          <button
            onClick={() => setShowGroupsPanel(!showGroupsPanel)}
            className="flex items-center gap-1 px-2 py-1 rounded relative"
            style={{
              backgroundColor: showGroupsPanel
                ? 'var(--primary-color)'
                : 'transparent',
              color: showGroupsPanel ? 'white' : 'var(--primary-color)'
            }}
          >
            <FaFolder /> {showGroupsPanel ? 'Hide Groups' : 'Groups'}
            {filters.groupId && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full"></span>
            )}
          </button>

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

      {/* Group Management Panel */}
      {showGroupsPanel && (
        <div className="flex flex-col md:flex-row gap-4 mb-4 p-4 border rounded"
          style={{
            borderColor: 'var(--border-color)',
            backgroundColor: 'var(--card-bg-hover)'
          }}
        >
          {/* Groups Sidebar */}
          <div className="md:w-64 flex-shrink-0">
            <GroupManager
              key={groupRefreshKey}
              onGroupSelect={handleGroupSelect}
              selectedGroupId={filters.groupId}
              showCreateButton={true}
              compact={false}
              onStartGroupSlideshow={handleStartGroupSlideshow}
              onOpenGroupSlideshowSettings={handleOpenGroupSlideshowSettings}
            />
          </div>

          {/* Bulk Actions */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkModeToggle}
                  className={`flex items-center gap-1 px-3 py-1 rounded text-sm ${
                    bulkMode
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <FaTag />
                  {bulkMode ? 'Exit Add Mode' : 'Add Assets'}
                </button>

                {bulkMode && (
                  <>
                    <button
                      onClick={handleSelectAllVisible}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      Select All Visible
                    </button>
                    <button
                      onClick={handleClearSelection}
                      className="text-gray-600 hover:text-gray-700 text-sm"
                    >
                      Clear Selection
                    </button>
                    {selectedAssets.length > 0 && (
                      <button
                        onClick={() => handleGroupManager()}
                        className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                      >
                        <FaFolder />
                        Manage Groups ({selectedAssets.length})
                      </button>
                    )}
                  </>
                )}
              </div>

              {filters.groupId && (
                <div className="text-sm text-gray-600">
                  Showing assets in selected group
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick bulk actions when groups panel is closed */}
      {!showGroupsPanel && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkModeToggle}
              className={`flex items-center gap-1 px-3 py-1 rounded text-sm ${
                bulkMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <FaTag />
              {bulkMode ? 'Exit Add Mode' : 'Add Assets'}
            </button>

            {bulkMode && (
              <>
                <button
                  onClick={handleSelectAllVisible}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  Select All Visible
                </button>
                <button
                  onClick={handleClearSelection}
                  className="text-gray-600 hover:text-gray-700 text-sm"
                >
                  Clear Selection
                </button>
                {selectedAssets.length > 0 && (
                  <button
                    onClick={() => handleGroupManager()}
                    className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    <FaFolder />
                    Manage Groups ({selectedAssets.length})
                  </button>
                )}
              </>
            )}
          </div>

          {filters.groupId && (
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-600">
                Showing assets in selected group
              </div>
              <button
                onClick={() => handleGroupSelect(null)}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                Clear Filter
              </button>
            </div>
          )}
        </div>
      )}

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
                <option value=""></option>
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
            <button onClick={clearFilters} className="text-sm">
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
          {!(filters.assetType || filters.inGallery || filters.minHearts > 0 || searchTerm) && 
           !onSelectAsset && 
           filteredAndSortedActivities.length > 1 && (
            <p className="text-xs text-gray-500 mt-1">
              <FaGripVertical className="inline mr-1" />
              Drag assets by the handle to reorder them
            </p>
          )}
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
            ? `No assets found. You may need to ${userId ? 'refresh' : <a href="/signin">sign in</a>} to see your assets.`
            : 'No assets match your current filters. Try changing or clearing the filters.'}
        </p>
      )}
      {filteredAndSortedActivities.map((activity, index) => (
        <div
          key={activity.id || index}
          className={`border p-4 ${
            onSelectAsset ? 'cursor-pointer asset-item-hover' : ''
          } ${
            selectedAssetUrl === activity.CreatedAssetUrl ||
            selectedAssetUrl === activity.AssetSource
              ? 'asset-item-selected'
              : ''
          } ${
            draggedIndex === index ? 'opacity-50' : ''
          } ${
            dragOverIndex === index ? 'border-blue-500 border-2' : ''
          } flex flex-col md:flex-row md:items-center transition-all duration-200`}
          draggable={Boolean(
            !onSelectAsset && 
            activity.id && 
            !filters.assetType && 
            !filters.inGallery && 
            !filters.minHearts && 
            !searchTerm.trim()
          )} // Only draggable if not in selection mode, has ID, and no filters applied
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
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
          {/* Drag handle - only show if draggable */}
          {!onSelectAsset && 
           activity.id && 
           !filters.assetType && 
           !filters.inGallery && 
           !filters.minHearts && 
           !searchTerm.trim() && (
            <div 
              className="flex items-center justify-center w-6 h-6 md:mr-2 mb-2 md:mb-0 cursor-grab active:cursor-grabbing"
              onMouseDown={(e) => e.stopPropagation()}
              title="Drag to reorder"
            >
              <FaGripVertical className="text-gray-400 hover:text-gray-600 transition-colors" />
            </div>
          )}

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

            {/* Bulk selection and group indicators */}
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Bulk selection checkbox */}
                {bulkMode && activity.id && (
                  <input
                    type="checkbox"
                    checked={selectedAssets.includes(activity.id)}
                    onChange={() => handleAssetSelect(activity.id!)}
                    className="w-4 h-4"
                  />
                )}

                {/* Group indicators */}
                {activity.groups && activity.groups.length > 0 && (
                  <div className="flex items-center gap-1">
                    <FaFolder className="text-xs text-gray-500" />
                    <div className="flex gap-1">
                      {activity.groups.slice(0, 3).map((group) => (
                        <span
                          key={group.id}
                          className="inline-block px-1 py-0.5 text-xs rounded"
                          style={{
                            backgroundColor: group.color + '20',
                            color: group.color,
                            border: `1px solid ${group.color}40`
                          }}
                          title={group.name}
                        >
                          {group.name}
                        </span>
                      ))}
                      {activity.groups.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{activity.groups.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
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
                  className="bg-gray-800 bg-opacity-70 hover:bg-opacity-90 rounded-full p-2 text-white focus:outline-none transition-all shadow-md"
                  title="Open in Full Screen"
                >
                  <FaExternalLinkAlt className="text-sm" />
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
                  className="bg-gray-800 bg-opacity-70 hover:bg-opacity-90 rounded-full p-2 text-white focus:outline-none transition-all shadow-md"
                  title="Copy Image URL"
                >
                  <FaImage className="text-sm" />
                </button>
                {activity.AssetType === 'vid' && (
                  <button
                    onClick={() =>
                      handleCopy(activity.CreatedAssetUrl, 'Video URL copied!')
                    }
                    className="bg-gray-800 bg-opacity-70 hover:bg-opacity-90 rounded-full p-2 text-white focus:outline-none transition-all shadow-md"
                    title="Copy Video URL"
                  >
                    <FaVideo className="text-sm" />
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
                  className="bg-gray-800 bg-opacity-70 hover:bg-opacity-90 rounded-full p-2 text-white focus:outline-none transition-all shadow-md"
                  title="Download Asset"
                >
                  <FaDownload className="text-sm" />
                </button>
                {/* Heart/Like button */}
                {activity.AssetType !== 'upl' && activity.id && (
                  <button
                    onClick={() => handleToggleLike(activity)}
                    className={`bg-gray-800 bg-opacity-70 hover:bg-opacity-90 rounded-full p-2 ${
                      assetLikes[activity.id]?.isLiked
                        ? 'text-red-500'
                        : 'text-white'
                    } focus:outline-none transition-all shadow-md flex items-center`}
                    title={assetLikes[activity.id]?.isLiked ? 'Unlike' : 'Like'}
                  >
                    {assetLikes[activity.id]?.likesCount > 0 && (
                      <span className="mr-1 text-xs font-medium">
                        {assetLikes[activity.id]?.likesCount}
                      </span>
                    )}
                    <FaHeart className="text-sm" />
                  </button>
                )}

                {/* Gallery toggle button */}
                {activity.AssetType !== 'upl' && (
                  <button
                    onClick={(e) => handleToggleGallery(activity, e)}
                    className={`bg-gray-800 bg-opacity-70 hover:bg-opacity-90 rounded-full p-2 ${
                      activity.isInGallery || activity.SubscriptionTier === 3
                        ? 'text-yellow-500'
                        : 'text-white'
                    } focus:outline-none transition-all shadow-md ${galleryActionAssetId === activity.id ? 'opacity-50' : ''}`}
                    title={
                      activity.isInGallery || activity.SubscriptionTier === 3
                        ? 'Remove from Gallery'
                        : 'Add to Gallery'
                    }
                    disabled={galleryActionAssetId !== null} // Disable all gallery buttons while any operation is in progress
                  >
                    <FaStar
                      className={`text-sm ${
                        galleryActionAssetId === activity.id
                          ? 'animate-pulse'
                          : ''
                      }`}
                    />
                  </button>
                )}

                {/* Edit button - only show for images and uploads */}
                {(activity.AssetType === 'img' ||
                  activity.AssetType === 'upl') && (
                  <button
                    onClick={() => handleEditImage(activity)}
                    className="bg-gray-800 bg-opacity-70 hover:bg-opacity-90 rounded-full p-2 text-white focus:outline-none transition-all shadow-md"
                    title="Edit Image"
                  >
                    <FaEdit className="text-sm" />
                  </button>
                )}

                {/* Group management button */}
                {activity.id && (
                  <button
                    onClick={() => handleGroupManager([activity.id!])}
                    className="bg-gray-800 bg-opacity-70 hover:bg-opacity-90 rounded-full p-2 text-white focus:outline-none transition-all shadow-md"
                    title="Manage Groups"
                  >
                    <FaTag className="text-sm" />
                  </button>
                )}

                <button
                  onClick={() => handleDelete(activity)}
                  className="bg-gray-800 bg-opacity-70 hover:bg-opacity-90 hover:bg-red-700 rounded-full p-2 text-white focus:outline-none transition-all shadow-md"
                  title="Delete Asset"
                >
                  <FaTrash className="text-sm" />
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
      {isModalOpen && filteredAndSortedActivities.length > 0 && (
        <Modal
          mediaUrl={modalMediaUrl}
          onClose={closeModal}
          fullScreen={isFullScreenModal}
          onNext={handleNextInModal}
          onPrevious={handlePreviousInModal}
          hasNext={currentModalIndex > 0}
          hasPrevious={
            currentModalIndex < filteredAndSortedActivities.length - 1
          }
          onLike={() => {
            const activity = filteredAndSortedActivities[currentModalIndex];
            if (activity && activity.id) {
              handleToggleLike(activity);
            }
          }}
          isLiked={
            filteredAndSortedActivities[currentModalIndex]?.id
              ? assetLikes[filteredAndSortedActivities[currentModalIndex].id]
                  ?.isLiked
              : false
          }
          likesCount={
            filteredAndSortedActivities[currentModalIndex]?.id
              ? assetLikes[filteredAndSortedActivities[currentModalIndex].id]
                  ?.likesCount || 0
              : 0
          }
          showLikeButton={
            filteredAndSortedActivities[currentModalIndex]?.AssetType !== 'upl'
          }
          currentItemId={filteredAndSortedActivities[currentModalIndex]?.id}
          onShare={() =>
            handleShareUrl(filteredAndSortedActivities[currentModalIndex])
          }
          showShareButton={!!filteredAndSortedActivities[currentModalIndex]?.id}
          onJumpToFirst={handleJumpToLastImage}
          onJumpToLast={handleJumpToFirstImage}
          currentAssets={
            filteredAndSortedActivities
              .map((a) => a.id)
              .filter(Boolean) as string[]
          }
          onCreateSlideshow={userId ? handleCreateSlideshow : undefined}
          autoStartSlideshow={autoStartSlideshow}
          showSlideshowSettings={showSlideshowSettings}
          slideshowAssets={generateSlideshowAssets()}
          currentAssetIndex={filteredAndSortedActivities.length - 1 - currentModalIndex}
          onAssetClick={handleSlideshowAssetClick}
          onAssetReorder={handleSlideshowAssetReorder}
          showImageEditPane={showImageEditPane}
          editPrompt={editPrompt}
          onEditPromptChange={setEditPrompt}
          onSubmitImageEdit={handleSubmitImageEdit}
          onToggleImageEditPane={handleToggleImageEditPane}
          isEditingImage={isEditingImage}
        />
      )}

      {/* Asset Group Manager Modal */}
      <AssetGroupManager
        assetIds={selectedAssets}
        isOpen={isGroupManagerOpen}
        onClose={() => setIsGroupManagerOpen(false)}
        onUpdate={handleGroupManagerUpdate}
      />
    </div>
  );
};

export default MyAssets;
