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
  const [currentModalIndex, setCurrentModalIndex] = useState(0);
  const [selectedAssetUrl, setSelectedAssetUrl] = useState<string | undefined>(
    selectedUrl
  );
  // Image editing states
  const [showImageEditPane, setShowImageEditPane] = useState(false);
  const [editingImageUrl, setEditingImageUrl] = useState('');
  const [editPrompt, setEditPrompt] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState('');
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
        // Add exclusion for 'processed' assets in the API query
        let assetTypeParam = filters.assetType || '';
        // If no specific asset type is specified, exclude 'processed' with a NOT_EQUAL operator
        // This needs to be handled on the backend, adding a note here for future implementation
        // For now, we'll rely on client-side filtering

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

    // Filter out assets with AssetType of 'processed'
    result = result.filter((activity) => activity.AssetType !== 'processed');

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
  // Toggle the image edit pane in the modal
  const toggleImageEditPane = () => {
    setShowImageEditPane(!showImageEditPane);
    if (showImageEditPane) {
      // Clear the edit state when closing the pane
      setEditPrompt('');
      setEditError('');
    }
  };

  // Handle the submission of an image edit request
  const handleSubmitImageEdit = async (prompt: string) => {
    if (!editingImageUrl || !prompt.trim()) {
      setEditError('Both image and edit instructions are required');
      return;
    }

    setIsSubmittingEdit(true);
    setEditError('');

    try {
      const response = await fetch('/api/image-edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId || 'none'
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          imageUrl: editingImageUrl
        })
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle specific error responses
        if (result.error) {
          if (result.result === 'LimitExceeded') {
            setEditError(
              'You need more credits to edit images. Please purchase credits on the pricing page.'
            );
          } else {
            setEditError(result.error);
          }
        } else {
          setEditError('Failed to submit edit request. Please try again.');
        }
        return;
      }

      // Close the edit pane on successful submission
      setShowImageEditPane(false);
      setEditPrompt('');

      // Show a success notification
      const notification = document.createElement('div');
      notification.textContent =
        'Image edit request submitted! Refresh in a few minutes to see your edited image.';
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

      // Fade out and remove after 5 seconds
      setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 300);
      }, 5000);

      // Automatically refresh the assets list after a delay
      setTimeout(() => {
        handleRefresh();
      }, 6000);
    } catch (error) {
      console.error('Error submitting image edit:', error);
      setEditError(
        'An error occurred while submitting your edit request. Please try again.'
      );
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const openModalForAsset = (index: number, fullScreen = false) => {
    if (index >= 0 && index < filteredAndSortedActivities.length) {
      const activity = filteredAndSortedActivities[index];
      const url =
        activity.AssetType === 'vid'
          ? activity.CreatedAssetUrl
          : activity.CreatedAssetUrl;
      setCurrentModalIndex(index);
      setModalMediaUrl(url);
      setEditingImageUrl(url); // Store the current image URL for editing
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
      setEditingImageUrl(url); // Store the URL for image editing
      setIsModalOpen(true);
      setIsFullScreenModal(fullScreen);
    }
  };

  // Navigation functions for modal
  const handleNextInModal = () => {
    if (currentModalIndex < filteredAndSortedActivities.length - 1) {
      const nextActivity = filteredAndSortedActivities[currentModalIndex + 1];
      const url =
        nextActivity.AssetType === 'vid'
          ? nextActivity.CreatedAssetUrl
          : nextActivity.CreatedAssetUrl;
      setCurrentModalIndex(currentModalIndex + 1);
      setModalMediaUrl(url);
      setEditingImageUrl(url); // Update image URL for editing
      // Reset edit state when changing images
      setShowImageEditPane(false);
      setEditPrompt('');
      setEditError('');
    }
  };

  const handlePreviousInModal = () => {
    if (currentModalIndex > 0) {
      const prevActivity = filteredAndSortedActivities[currentModalIndex - 1];
      const url =
        prevActivity.AssetType === 'vid'
          ? prevActivity.CreatedAssetUrl
          : prevActivity.CreatedAssetUrl;
      setCurrentModalIndex(currentModalIndex - 1);
      setModalMediaUrl(url);
      setEditingImageUrl(url); // Update image URL for editing
      // Reset edit state when changing images
      setShowImageEditPane(false);
      setEditPrompt('');
      setEditError('');
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
      setEditingImageUrl(url); // Update image URL for editing
      // Reset edit state when changing images
      setShowImageEditPane(false);
      setEditPrompt('');
      setEditError('');
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
      setEditingImageUrl(url); // Update image URL for editing
      // Reset edit state when changing images
      setShowImageEditPane(false);
      setEditPrompt('');
      setEditError('');
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
    setShowImageEditPane(false);
    setEditPrompt('');
    setEditError('');
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
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Search Box */}
            <div>
              <label className="text-xs font-medium mb-1 block">
                Search Prompts
              </label>
              <div className="relative">
                <FaSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="p-1.5 pl-7 rounded border w-full text-sm"
                  style={{ borderColor: 'var(--border-color)' }}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <FaTimesCircle className="text-xs" />
                  </button>
                )}
              </div>
            </div>

            {/* Asset Type Filter */}
            <div>
              <label className="text-xs font-medium mb-1 block">
                Asset Type
              </label>
              <select
                value={filters.assetType}
                onChange={(e) =>
                  handleFilterChange('assetType', e.target.value)
                }
                className="p-1.5 rounded border w-full text-sm"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <option value="">All</option>
                <option value="img">Images</option>
                <option value="vid">Videos</option>
                <option value="que">Queue</option>
                <option value="upl">Uploads</option>
              </select>
            </div>

            {/* Combined Min Hearts and Gallery Status Filter */}
            <div className="flex space-x-3 items-start">
              {/* Heart Count Filter */}
              <div className="flex-1">
                <label className="text-xs font-medium mb-1 block">
                  Min Hearts <FaHeart className="inline text-red-500 ml-1" />
                </label>
                <input
                  type="number"
                  min="0"
                  value={filters.minHearts}
                  onChange={(e) =>
                    handleFilterChange(
                      'minHearts',
                      parseInt(e.target.value) || 0
                    )
                  }
                  className="p-1.5 rounded border w-full text-sm"
                  style={{ borderColor: 'var(--border-color)' }}
                />
              </div>

              {/* Gallery Filter */}
              <div className="flex-1">
                <label className="text-xs font-medium mb-1 block">
                  Gallery
                </label>
                <div className="flex items-center h-[34px] text-sm">
                  <input
                    type="checkbox"
                    checked={filters.inGallery}
                    onChange={(e) =>
                      handleFilterChange('inGallery', e.target.checked)
                    }
                    className="mr-2"
                  />
                  <label>
                    <FaStar className="inline text-yellow-500 mr-1" /> Only
                  </label>
                </div>
              </div>
            </div>

            {/* Sort Direction */}
            <div>
              <label className="text-xs font-medium mb-1 block">
                Sort Order
              </label>
              <button
                onClick={() =>
                  setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc')
                }
                className="flex items-center justify-start gap-1 p-1.5 border rounded w-full text-sm"
                style={{ borderColor: 'var(--border-color)' }}
              >
                {sortDirection === 'desc' ? (
                  <>
                    <FaSortAmountDown className="text-xs ml-1" />{' '}
                    <span>Newest First</span>
                  </>
                ) : (
                  <>
                    <FaSortAmountUp className="text-xs ml-1" />{' '}
                    <span>Oldest First</span>
                  </>
                )}
              </button>
            </div>

            {/* Reset Filters */}
            <div className="flex items-end justify-end">
              <button
                onClick={clearFilters}
                className="text-xs px-2 py-1.5 transition-colors"
              >
                Reset All Filters
              </button>
            </div>
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
          <strong>*WIN:</strong> 500 Credits EVERY MONTH - Star your images and
          get the most hearts in the <a href={'/gallery'}>GenTube.ai gallery</a>
          . Next winner: June 30, 2025.
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
            ? `No assets found. You may need to ${userId ? '' : <a href="/signin">sign in</a> + 'to'} see your assets.`
            : 'No assets match your current filters. Try changing or clearing the filters.'}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredAndSortedActivities.map((activity, index) => (
          <div
            key={index}
            className={`relative rounded-lg overflow-hidden transition-transform duration-200 ${onSelectAsset ? 'cursor-pointer' : ''} ${
              selectedAssetUrl === activity.CreatedAssetUrl ||
              selectedAssetUrl === activity.AssetSource
                ? 'ring-2 ring-primary scale-[0.98]'
                : 'hover:scale-[0.98]'
            }`}
            onClick={(e) => {
              if (onSelectAsset) {
                // If in selection mode, make the whole card clickable
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
                  setSelectedAssetUrl(undefined);
                  onSelectAsset(''); // Pass empty string to deselect
                } else {
                  setSelectedAssetUrl(urlToSelect);
                  onSelectAsset(urlToSelect);
                }
              } else {
                // Open modal when clicking on the image
                openModal(activity.CreatedAssetUrl, false);
              }
            }}
          >
            {/* Status Indicators shown on top of the image */}
            <div className="absolute top-2 right-2 flex flex-col items-end space-y-1 z-10">
              {/* Asset Type Badge */}
              <div className="bg-gray-800 bg-opacity-70 text-white rounded-full px-2 py-0.5 text-xs">
                {activity.AssetType === 'vid'
                  ? 'Video'
                  : activity.AssetType === 'img'
                    ? 'Image'
                    : activity.AssetType === 'upl'
                      ? 'Upload'
                      : activity.AssetType === 'que'
                        ? 'Queue'
                        : activity.AssetType === 'err'
                          ? 'Error'
                          : activity.AssetType}
              </div>

              {/* Gallery Status */}
              {(activity.isInGallery || activity.SubscriptionTier === 3) && (
                <div className="bg-gray-800 bg-opacity-70 text-yellow-500 rounded-full px-2 py-0.5 text-xs flex items-center">
                  <FaStar className="mr-1" size={10} />
                  <span>Gallery</span>
                </div>
              )}

              {/* Hearts Count */}
              {activity.id && assetLikes[activity.id]?.likesCount > 0 && (
                <div className="bg-gray-800 bg-opacity-70 text-white rounded-full px-2 py-0.5 text-xs flex items-center">
                  <FaHeart className="mr-1 text-red-500" size={10} />
                  <span>{assetLikes[activity.id]?.likesCount}</span>
                </div>
              )}
            </div>

            {/* Image Thumbnail */}
            <div className="aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
              {activity.AssetType === 'vid' &&
              activity.AssetSource === 'none' ? (
                <FaPlay className="w-12 h-12 text-gray-400" />
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
                  className="w-full h-full object-cover transition-transform duration-300"
                  onError={(e) => {
                    if (activity.AssetType === 'vid') {
                      // Hide the broken image
                      e.currentTarget.style.display = 'none';
                      // Create play icon with label
                      const container = e.currentTarget.parentElement;
                      if (container) {
                        const playIcon = document.createElement('div');
                        playIcon.className =
                          'w-full h-full flex flex-col items-center justify-center';

                        const iconElement = document.createElement('div');
                        iconElement.className = 'w-12 h-12 text-gray-400';

                        const svgIcon = document.createElementNS(
                          'http://www.w3.org/2000/svg',
                          'svg'
                        );
                        svgIcon.setAttribute('fill', 'currentColor');
                        svgIcon.setAttribute('viewBox', '0 0 448 512');
                        svgIcon.setAttribute('class', 'w-12 h-12');

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

                        const textElement = document.createElement('div');
                        textElement.className = 'mt-2 text-gray-500';
                        textElement.textContent = '';

                        playIcon.appendChild(iconElement);
                        playIcon.appendChild(textElement);
                        container.appendChild(playIcon);
                      }
                    }
                  }}
                />
              )}
            </div>

            {/* Hover Overlay - Only visible on hover */}
            <div className="absolute inset-0 bg-black bg-opacity-0 opacity-0 hover:bg-opacity-70 hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-3">
              {/* Top section with prompt */}
              <div className="overflow-auto max-h-[60%] scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-transparent text-white text-sm">
                {activity.AssetType !== 'upl' && (
                  <div>
                    <p className="font-medium mb-1 flex items-center">
                      <span className="mr-1">Prompt:</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(activity.Prompt, 'Prompt copied!');
                        }}
                        className="text-gray-400 hover:text-white transition-colors"
                        title="Copy Full Prompt"
                      >
                        <FaCopy className="text-xs" />
                      </button>
                    </p>
                    <p className="text-sm text-gray-200 break-words">
                      {activity.Prompt.length > 100
                        ? `${activity.Prompt.substring(0, 100)}...`
                        : activity.Prompt}
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom section with action buttons */}
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openModal(activity.CreatedAssetUrl, true);
                  }}
                  className="bg-gray-800 bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 text-white focus:outline-none transition-all shadow-md"
                  title="Open in Full Screen"
                >
                  <FaExternalLinkAlt className="text-xs" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(
                      activity.AssetType === 'vid'
                        ? activity.AssetSource
                        : activity.CreatedAssetUrl,
                      'Image URL copied!'
                    );
                  }}
                  className="bg-gray-800 bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 text-white focus:outline-none transition-all shadow-md"
                  title="Copy URL"
                >
                  <FaCopy className="text-xs" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(
                      activity.AssetType === 'vid'
                        ? activity.CreatedAssetUrl
                        : activity.CreatedAssetUrl,
                      activity.AssetType
                    );
                  }}
                  className="bg-gray-800 bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 text-white focus:outline-none transition-all shadow-md"
                  title="Download Asset"
                >
                  <FaDownload className="text-xs" />
                </button>

                {/* Heart/Like button */}
                {activity.AssetType !== 'upl' && activity.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleLike(activity);
                    }}
                    className={`bg-gray-800 bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 ${assetLikes[activity.id]?.isLiked ? 'text-red-500' : 'text-white'} focus:outline-none transition-all shadow-md`}
                    title={assetLikes[activity.id]?.isLiked ? 'Unlike' : 'Like'}
                  >
                    <FaHeart className="text-xs" />
                  </button>
                )}

                {/* Gallery toggle button */}
                {activity.AssetType !== 'upl' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleGallery(activity, e);
                    }}
                    className={`bg-gray-800 bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 ${activity.isInGallery || activity.SubscriptionTier === 3 ? 'text-yellow-500' : 'text-white'} focus:outline-none transition-all shadow-md ${galleryActionAssetId === activity.id ? 'opacity-50' : ''}`}
                    title={
                      activity.isInGallery || activity.SubscriptionTier === 3
                        ? 'Remove from Gallery'
                        : 'Add to Gallery'
                    }
                    disabled={galleryActionAssetId !== null}
                  >
                    <FaStar
                      className={`text-xs ${galleryActionAssetId === activity.id ? 'animate-pulse' : ''}`}
                    />
                  </button>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(activity);
                  }}
                  className="bg-gray-800 bg-opacity-80 hover:bg-opacity-100 hover:bg-red-700 rounded-full p-2 text-white focus:outline-none transition-all shadow-md"
                  title="Delete Asset"
                >
                  <FaTrash className="text-xs" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
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
          hasNext={currentModalIndex < filteredAndSortedActivities.length - 1}
          hasPrevious={currentModalIndex > 0}
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
          onJumpToFirst={handleJumpToFirstImage}
          onJumpToLast={handleJumpToLastImage}
          currentAssets={
            filteredAndSortedActivities
              .map((a) => a.id)
              .filter(Boolean) as string[]
          }
          onCreateSlideshow={userId ? handleCreateSlideshow : undefined}
          onToggleImageEditPane={toggleImageEditPane}
          showImageEditPane={showImageEditPane}
          onSubmitImageEdit={handleSubmitImageEdit}
        />
      )}
    </div>
  );
};

export default MyAssets;
