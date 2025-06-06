import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { useUserId } from '@/context/UserIdContext';
import { useUserIp } from '@/context/UserIpContext';
import { useRouter } from 'next/navigation';
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
  FaFolder,
  FaTrophy,
  FaTimes,
  FaCog
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
  DateTime?: Date; // For backward compatibility
  order?: number; // Added for explicit ordering
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
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [pendingNavigation, setPendingNavigation] = useState(false);
  const [currentModalIndex, setCurrentModalIndex] = useState(0);
  const [modalMediaUrl, setModalMediaUrl] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');

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

          // Set up the edit image URL for edit functionality, but don't automatically show edit pane
          if (activity.AssetType === 'img' || activity.AssetType === 'upl') {
            // Set the edit image URL so edit functionality is available if user chooses to edit
            setTimeout(() => {
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

  // Listen for the custom event to refresh and show edited image
  React.useEffect(() => {
    const handleRefreshAndShowEditedImage = (event: CustomEvent) => {
      const { editedImageId } = event.detail;
      console.log('Received refreshAndShowEditedImage event for ID:', editedImageId);
      
      // Store the ID to open after refresh
      sessionStorage.setItem('pendingEditedImageId', editedImageId);
      
      // Clear filters to ensure we show all assets
      setFilters({
        assetType: '',
        inGallery: false,
        minHearts: 0,
        groupId: null
      });
      setSearchTerm('');
      
      // Do the same thing as handleRefresh
      setLoading(true);
      setPage(0);
      setActivities([]); // Clear activities to ensure fresh load
      
      // Force a refresh by incrementing the refresh key
      // This will trigger the useEffect that fetches data
      setRefreshKey(prev => prev + 1);
      
      // Scroll to the first queued asset (if any) or first asset after a delay
      setTimeout(() => {
        const firstQueuedAsset = document.getElementById('first-queued-asset');
        const firstAsset = document.getElementById('first-asset');
        const targetElement = firstQueuedAsset || firstAsset;
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 1000);
    };

    // Add event listener
    window.addEventListener('refreshAndShowEditedImage', handleRefreshAndShowEditedImage as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('refreshAndShowEditedImage', handleRefreshAndShowEditedImage as EventListener);
    };
  }, []);

  // Listen for the custom event to refresh assets (for regular image/video toasts)
  React.useEffect(() => {
    const handleRefreshAssets = () => {
      console.log('Received refreshAssets event');
      // Simply trigger a refresh
      setRefreshKey(prev => prev + 1);
      
      // Scroll to the first queued asset (if any) or first asset after a delay to allow content to load
      setTimeout(() => {
        const firstQueuedAsset = document.getElementById('first-queued-asset');
        const firstAsset = document.getElementById('first-asset');
        const targetElement = firstQueuedAsset || firstAsset;
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 1000);
    };

    // Add event listener
    window.addEventListener('refreshAssets', handleRefreshAssets);

    // Cleanup
    return () => {
      window.removeEventListener('refreshAssets', handleRefreshAssets);
    };
  }, []);

  const [expandedPrompts, setExpandedPrompts] = useState<{
    [key: number]: boolean;
  }>({});
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
  const [refreshKey, setRefreshKey] = useState(0); // Force refresh of activities

  const limit = 10;
  const promptLength = 100;

  const fetchUserActivities = async (userId: string, userIp: string) => {
    if (userId || userIp) {
      try {
        // Support comma-separated asset types - use the filters state
        const assetTypeParam = filters.assetType || '';
        const groupIdParam = filters.groupId || '';

        console.log('fetchUserActivities called with filters:', filters);
        console.log('groupIdParam:', groupIdParam);

        // Build query parameters
        const params = new URLSearchParams({
          userId: userId ? userId : 'none',
          userIp: userIp ? userIp : 'none',
          limit: limit.toString(),
          offset: (page * limit).toString()
        });
        
        // Only include groups when actually needed (when groups panel is shown or filtering by group)
        if (showGroupsPanel || groupIdParam) {
          params.append('includeGroups', 'true');
        }

        if (assetTypeParam) {
          params.append('assetType', assetTypeParam);
        }

        if (groupIdParam) {
          params.append('groupId', groupIdParam);
        }

        const finalUrl = `/api/getUserAssets?${params.toString()}`;
        console.log('Final API URL:', finalUrl);
        console.log('Request includes groupId param:', !!groupIdParam);

        const response = await fetch(finalUrl);
        if (!response.ok) {
          console.log('Error fetching user assets.');
          throw new Error('Failed to fetch user assets');
        }
        const data = await response.json();
        console.log('API response data:', data);
        
        if (page === 0) {
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

  // Ref to track ongoing fetches to prevent duplicates
  const isFetchingRef = React.useRef(false);
  const lastFetchParamsRef = React.useRef('');

  // Effect for fetching data when page or filters change
  useEffect(() => {
    // Generate a params string to compare with last fetch
    const paramsString = `${userId}-${userIp}-${page}-${filters.assetType}-${filters.groupId}-${refreshKey}`;
    
    // Skip if already fetching or same params as last fetch
    if (isFetchingRef.current || paramsString === lastFetchParamsRef.current) {
      return;
    }
    
    console.log('Fetching assets with params:', paramsString);
    isFetchingRef.current = true;
    lastFetchParamsRef.current = paramsString;
    
    fetchUserActivities(userId, userIp).finally(() => {
      isFetchingRef.current = false;
    });
  }, [userId, userIp, page, filters.assetType, filters.groupId, refreshKey]);

  // Effect for when filters change - reset pagination (separate from fetch to avoid race conditions)
  useEffect(() => {
    setPage(0);
  }, [filters.assetType, filters.groupId]);

  // Process and filter/sort the activities based on user preferences
  const filteredAndSortedActivities = useMemo(() => {
    let result = [...activities];

    // NOTE: assetType and groupId filtering is handled by the backend API
    // Only apply client-side filters that aren't handled by the backend

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
      // If both have order field, use it for sorting
      if (a.order !== undefined && b.order !== undefined) {
        return sortDirection === 'asc'
          ? a.order - b.order // Lower order value first
          : b.order - a.order; // Higher order value first
      }
      
      // If only one has order field, prioritize it
      if (a.order !== undefined) return sortDirection === 'asc' ? -1 : 1;
      if (b.order !== undefined) return sortDirection === 'asc' ? 1 : -1;
      
      // Fallback to DateTime if order is not available
      const dateA = a.DateTime ? new Date(a.DateTime).getTime() : 0;
      const dateB = b.DateTime ? new Date(b.DateTime).getTime() : 0;

      return sortDirection === 'asc'
        ? dateA - dateB // Oldest first
        : dateB - dateA; // Newest first
    });

    return result;
  }, [activities, filters, searchTerm, sortDirection, assetLikes]);

  // Handle automatic navigation after loading more data
  useEffect(() => {
    if (pendingNavigation && !loading && currentModalIndex < filteredAndSortedActivities.length - 1) {
      // New data has loaded, now we can navigate to the next image
      const nextIndex = currentModalIndex + 1;
      const nextActivity = filteredAndSortedActivities[nextIndex];
      if (nextActivity) {
        const url = nextActivity.AssetType === 'vid' 
          ? nextActivity.CreatedAssetUrl 
          : nextActivity.CreatedAssetUrl;
        setCurrentModalIndex(nextIndex);
        setModalMediaUrl(url);
        
        // Update edit image URL for the new image
        if (nextActivity.AssetType === 'img' || nextActivity.AssetType === 'upl') {
          setEditImageUrl(nextActivity.CreatedAssetUrl);
        } else {
          setEditImageUrl('');
        }
        
        setPendingNavigation(false);
        console.log('Auto-navigated to newly loaded image');
      }
    }
  }, [loading, pendingNavigation, currentModalIndex, filteredAndSortedActivities]);

  // Ref to track which asset IDs we've already fetched likes for
  const fetchedLikesRef = React.useRef<Set<string>>(new Set());
  
  // Fetch likes for displayed assets that we haven't fetched yet
  useEffect(() => {
    const fetchLikes = async () => {
      if (!userId || !activities.length) return;

      try {
        // Collect asset IDs that we haven't fetched likes for yet
        const newAssetIds = activities
          .filter(activity => activity.id && !fetchedLikesRef.current.has(activity.id as string))
          .map(activity => activity.id as string);
        
        if (newAssetIds.length === 0) return;
        
        console.log(`Fetching likes for ${newAssetIds.length} new assets`);
        
        // Fetch likes for new assets only
        const response = await fetch(
          `/api/getAssetLikes?assetIds=${newAssetIds.join(',')}&userId=${userId}`
        );
        
        const bulkLikesData = await response.json();
        
        // Add these IDs to our tracking set
        newAssetIds.forEach(id => fetchedLikesRef.current.add(id));
        
        // Update the state by merging with existing likes data
        setAssetLikes(prevLikes => ({
          ...prevLikes,
          ...bulkLikesData
        }));
      } catch (error) {
        console.error('Error fetching likes:', error);
      }
    };

    fetchLikes();
    
    // Return cleanup function to reset the tracking if userId changes
    return () => {
      if (!userId) {
        fetchedLikesRef.current.clear();
      }
    };
  }, [userId, activities]);

  // Check for pending edited image after activities load
  useEffect(() => {
    if (activities.length > 0 && !loading) {
      const pendingEditedImageId = sessionStorage.getItem('pendingEditedImageId');
      if (pendingEditedImageId) {
        console.log('Checking for pending edited image:', pendingEditedImageId);
        console.log('Current activities count:', activities.length);
        
        // Find the image index in the filtered and sorted activities
        const imageIndex = filteredAndSortedActivities.findIndex(
          (activity) => activity.id === pendingEditedImageId
        );
        
        if (imageIndex !== -1) {
          console.log('Found pending edited image at index:', imageIndex);
          // Clear the pending ID
          sessionStorage.removeItem('pendingEditedImageId');
          
          // Open the modal with a small delay to ensure UI is ready
          setTimeout(() => {
            openModalForAsset(imageIndex, false);
          }, 500);
        } else if (page === 0 && hasMore) {
          // If not found on first page and there are more pages, keep the pending ID
          // It might be on a different page due to sorting
          console.log('Image not found on first page, may need to load more data');
        } else {
          // Only clear if we've checked all available data
          console.log('Image not found after checking available data');
          sessionStorage.removeItem('pendingEditedImageId');
        }
      }
    }
  }, [activities, loading, filteredAndSortedActivities, page, hasMore]);

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

  // Handle InfoPanel events for opening features
  useEffect(() => {
    const handleOpenGroupsPanel = () => {
      setShowGroupsPanel(true);
    };

    const handleStartDemoSlideshow = (event: CustomEvent) => {
      const demoImage = event.detail?.demoImage;

      if (filteredAndSortedActivities.length > 0) {
        // If user has assets, start normal slideshow
        handleStartSlideshow();
      } else if (demoImage) {
        // If no assets, use demo image
        setCurrentModalIndex(0);
        setModalMediaUrl(demoImage);
        setShowSlideshowSettings(true);
        setAutoStartSlideshow(true);
        setIsModalOpen(true);
        setIsFullScreenModal(false);
      }
    };

    const handleOpenImageEdit = (event: CustomEvent) => {
      const demoImage = event.detail?.demoImage;

      if (filteredAndSortedActivities.length > 0) {
        // If user has assets, edit the first image
        const firstImageAsset = filteredAndSortedActivities.find(
          (activity) =>
            activity.AssetType === 'img' || activity.AssetType === 'upl'
        );
        if (firstImageAsset) {
          handleEditImage(firstImageAsset);
        }
      } else if (demoImage) {
        // If no assets, use demo image
        setCurrentModalIndex(0);
        setModalMediaUrl(demoImage);
        setEditImageUrl(demoImage);
        setShowImageEditPane(true);
        setEditPrompt('');
        setIsModalOpen(true);
        setIsFullScreenModal(false);
      }
    };

    window.addEventListener('openGroupsPanel', handleOpenGroupsPanel);
    window.addEventListener(
      'startDemoSlideshow',
      handleStartDemoSlideshow as EventListener
    );
    window.addEventListener(
      'openImageEdit',
      handleOpenImageEdit as EventListener
    );

    return () => {
      window.removeEventListener('openGroupsPanel', handleOpenGroupsPanel);
      window.removeEventListener(
        'startDemoSlideshow',
        handleStartDemoSlideshow as EventListener
      );
      window.removeEventListener(
        'openImageEdit',
        handleOpenImageEdit as EventListener
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredAndSortedActivities]);

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
        // Log asset details before deletion
        console.log('Deleting asset:', {
          id: activity.id,
          url: activity.CreatedAssetUrl,
          type: activity.AssetType,
          prompt: activity.Prompt,
          timestamp: activity.DateTime
        });
        
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
        
        // Parse response data for logging
        let responseData;
        try {
          responseData = await response.json();
          console.log('Deletion API response:', responseData);
        } catch (jsonError) {
          console.log('Response is not JSON:', await response.text());
        }
        
        if (!response.ok) {
          throw new Error(`Failed to delete asset: ${response.status} ${response.statusText}${responseData ? ' - ' + JSON.stringify(responseData) : ''}`);
        }

        console.log('Asset deleted successfully:', activity.id);
        
        // Instead of refreshing, just remove the deleted asset from the state
        setActivities((currentActivities) =>
          currentActivities.filter((item) => item.id !== activity.id)
        );

        // Show a toast to confirm deletion
        const notification = document.createElement('div');
        notification.textContent = 'Asset deleted successfully';
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

        // Fade out and remove after 3 seconds
        setTimeout(() => {
          notification.style.opacity = '0';
          setTimeout(() => {
            document.body.removeChild(notification);
          }, 300);
        }, 3000);
      } catch (error) {
        // Enhanced error logging
        console.error('Error deleting asset:', {
          error,
          assetId: activity.id,
          assetUrl: activity.CreatedAssetUrl
        });
        
        // More informative error message to the user
        alert(`Failed to delete asset. Check console for details.`);
      }
    }
  };

  const handleDownload = async (activity: UserActivity) => {
    try {
      const { CreatedAssetUrl: url, AssetType: assetType, Prompt: prompt, id } = activity;
      
      // Generate filename based on prompt (first 25 chars, alphanumeric only, spaces to dashes)
      const generateFileName = (prompt: string, assetType: string, originalUrl: string, assetId?: string): string => {
        // Extract file extension from the original URL
        let fileExtension = '.jpg'; // Default fallback
        
        if (assetType === 'vid') {
          fileExtension = '.mp4';
        } else {
          // Extract extension from URL for images/uploads
          try {
            const urlPath = new URL(originalUrl).pathname;
            const match = urlPath.match(/\.[a-zA-Z0-9]+$/);
            if (match) {
              fileExtension = match[0].toLowerCase();
            }
          } catch (error) {
            console.log('Could not extract file extension from URL, using default .jpg');
          }
        }
        
        // Check if prompt exists and has content
        if (prompt && prompt.trim().length > 0) {
          // Take first 25 characters of prompt
          let baseName = prompt.substring(0, 25);
          // Keep only letters, numbers, and spaces
          baseName = baseName.replace(/[^a-zA-Z0-9\s]/g, '');
          // Replace spaces with dashes and trim
          baseName = baseName.replace(/\s+/g, '-').trim();
          // Remove leading/trailing dashes
          baseName = baseName.replace(/^-+|-+$/g, '');
          
          return baseName ? `${baseName}${fileExtension}` : `downloaded-gentube-asset${fileExtension}`;
        } else {
          // Fallback for uploads or assets without prompts
          return `downloaded-gentube-asset${fileExtension}`;
        }
      };

      const fileName = generateFileName(prompt, assetType, url, id);

      // For uploaded assets, create a proxy API call to avoid CORS issues
      if (assetType === 'upl') {
        console.log('Using API proxy for uploaded asset to avoid CORS issues');
        try {
          // Use a Next.js API route to proxy the download and avoid CORS
          const proxyUrl = `/api/download-proxy?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(fileName)}`;
          
          const response = await fetch(proxyUrl);
          if (!response.ok) {
            throw new Error(`Proxy download failed: ${response.status}`);
          }
          
          const blob = await response.blob();
          
          // Create download link from blob
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = fileName;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
          return;
        } catch (error) {
          console.log('Proxy download failed, trying direct approach:', error);
          // If proxy fails, try direct download with Content-Disposition
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          // Add additional attributes to force download
          link.setAttribute('type', 'application/octet-stream');
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          return;
        }
      }

      // Standard fetch approach for generated assets (external URLs typically have CORS configured)
      try {
        const response = await fetch(url, {
          mode: 'cors',
          credentials: 'omit'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
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
      } catch (corsError) {
        console.log('CORS error with generated asset, falling back to direct download:', corsError);
        // Fallback to direct download if CORS fails
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.setAttribute('crossorigin', 'anonymous');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error downloading asset:', error);
      alert('Failed to download the asset. The file may not be accessible or may have been moved.');
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
    // Prioritize exact CreatedAssetUrl matches over AssetSource matches to avoid opening edited images when clicking originals
    let index = filteredAndSortedActivities.findIndex(
      (activity) => activity.CreatedAssetUrl === url
    );
    
    // Only fall back to AssetSource matching if no CreatedAssetUrl match found
    if (index === -1) {
      index = filteredAndSortedActivities.findIndex(
        (activity) => activity.AssetSource === url
      );
    }

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
      // Normal case: navigate to next image in current data
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

      // Auto-load next page when approaching end of current data
      // Load more when user is within 3 images of the end and there's more data available
      const isNearEnd = currentModalIndex + 1 >= filteredAndSortedActivities.length - 3;
      const shouldLoadMore = isNearEnd && hasMore && !loading;
      
      if (shouldLoadMore) {
        console.log('Auto-loading next page for modal navigation');
        setPage((prev) => prev + 1);
      }
    } else if (currentModalIndex === filteredAndSortedActivities.length - 1 && hasMore && !loading) {
      // Edge case: at the last image but more data is available
      // Trigger loading of next page and set pending navigation
      console.log('Loading next page from last image');
      setPendingNavigation(true);
      setPage((prev) => prev + 1);
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

  const router = useRouter();

  const closeModal = () => {
    setIsModalOpen(false);
    setModalMediaUrl('');
    setShowSlideshowSettings(false);
    setAutoStartSlideshow(false);
    setShowImageEditPane(false);
    setEditImageUrl('');
    setEditPrompt('');
    setIsEditingImage(false);
    
    // Restore original activities if we were in group slideshow mode
    if (isGroupSlideshow && originalActivities.length > 0) {
      console.log('Restoring original activities after group slideshow');
      setActivities(originalActivities);
      setIsGroupSlideshow(false);
      setOriginalActivities([]);
    }
  };

  // Handler for "Modify Image" button - same functionality as gallery
  const handleModifyImageFromModal = (prompt: string) => {
    if (!userId) {
      router.push('/signin');
      return;
    }

    if (!prompt || !prompt.trim()) {
      alert('No prompt available for modification');
      return;
    }

    // Check prompt length before proceeding
    const MAX_PROMPT_LENGTH = 1500;
    if (prompt.length > MAX_PROMPT_LENGTH) {
      alert(
        `Prompt is too long. Maximum length is ${MAX_PROMPT_LENGTH} characters. Your prompt is ${prompt.length} characters.`
      );
      return;
    }

    // Set the edit prompt and show the edit pane
    setEditPrompt(prompt);
    setShowImageEditPane(true);
    
    // Make sure we have the current image URL for editing
    const currentActivity = filteredAndSortedActivities[currentModalIndex];
    if (currentActivity) {
      setEditImageUrl(currentActivity.CreatedAssetUrl);
    }
  };

  // Handler for "Create Video" button - same functionality as gallery
  const handleCreateVideoFromModal = async () => {
    if (!userId) {
      router.push('/signin');
      return;
    }

    const currentActivity = filteredAndSortedActivities[currentModalIndex];
    if (!currentActivity) {
      console.error('No current activity found');
      return;
    }

    // Check prompt length before proceeding
    if (currentActivity.Prompt) {
      const MAX_PROMPT_LENGTH = 1500;
      if (currentActivity.Prompt.length > MAX_PROMPT_LENGTH) {
        alert(
          `Prompt is too long. Maximum length is ${MAX_PROMPT_LENGTH} characters. Your prompt is ${currentActivity.Prompt.length} characters.`
        );
        return;
      }
    }

    try {
      // Use AssetSource if the current item is a video, otherwise use CreatedAssetUrl
      const imageUrl =
        currentActivity.AssetType === 'vid' 
          ? currentActivity.AssetSource 
          : currentActivity.CreatedAssetUrl;

      console.log('Creating video with:', {
        imageUrl,
        prompt: currentActivity.Prompt,
        assetType: currentActivity.AssetType
      });

      // Don't proceed if we don't have an image URL
      if (!imageUrl) {
        console.error('Cannot create video: Missing image URL');
        alert('Cannot create video: Missing source image');
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
          description: currentActivity.Prompt || 'Generate a video from this image',
          duration: '5',
          motion: '2'
        })
      });

      const data = await response.json();

      if (response.ok) {
        showToast({
          type: 'video',
          prompt: `Video creation started! ${currentActivity.Prompt || 'Creating video...'}`,
          duration: 10000
        });

        // Close the modal and refresh assets to show the new video in queue
        closeModal();
        setRefreshKey(prev => prev + 1);
      } else {
        const errorMessage = data.error || 'Failed to create video';
        if (response.status === 429) {
          showToast({
            type: 'error',
            prompt: errorMessage,
            duration: 10000
          });
        } else {
          alert(`Error: ${errorMessage}`);
        }
      }
    } catch (error) {
      console.error('Error creating video:', error);
      alert('An error occurred while creating the video. Please try again.');
    }
  };

  // Function to start slideshow with the first displayed asset (directly play)
  const handleStartSlideshow = () => {
    if (filteredAndSortedActivities.length > 0) {
      // Open modal with first asset and start playing immediately
      const firstActivity = filteredAndSortedActivities[0];
      const url =
        firstActivity.AssetType === 'vid'
          ? firstActivity.CreatedAssetUrl
          : firstActivity.CreatedAssetUrl;

      // Step 1: First set all necessary state for the first image BEFORE opening the modal
      setCurrentModalIndex(0);
      setModalMediaUrl(url);
      setShowSlideshowSettings(false); // Don't show settings - start playing
      setIsFullScreenModal(false);
      
      // Step 2: Critical - ensure autoStartSlideshow is false when opening modal
      setAutoStartSlideshow(false);
      
      // Step 3: Now open the modal which will display the first image
      setIsModalOpen(true);
      
      // Step 4: Wait for modal to fully render and display first image before auto-starting
      // This delay is crucial - it ensures the first image is fully visible
      // before the slideshow starts advancing
      setTimeout(() => {
        console.log('First image displayed, now starting slideshow from index 0');
        setAutoStartSlideshow(true);
      }, 1500); // Using a 1.5 second delay to ensure the first image is fully visible
    }
  };

  // Function to open slideshow settings without auto-starting
  const handleOpenSlideshowSettings = () => {
    if (filteredAndSortedActivities.length > 0) {
      // Open modal with first asset but show settings instead of playing
      const firstActivity = filteredAndSortedActivities[0];
      const url =
        firstActivity.AssetType === 'vid'
          ? firstActivity.CreatedAssetUrl
          : firstActivity.CreatedAssetUrl;

      setCurrentModalIndex(0);
      setModalMediaUrl(url);
      setShowSlideshowSettings(true); // Show slideshow settings
      setAutoStartSlideshow(false); // Don't auto-start - let user configure first
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
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditingImage, setIsEditingImage] = useState(false);

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Group slideshow state
  const [isGroupSlideshow, setIsGroupSlideshow] = useState(false);
  const [originalActivities, setOriginalActivities] = useState<UserActivity[]>([]);

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
        
        // Restore original activities if we were in group slideshow mode
        if (isGroupSlideshow && originalActivities.length > 0) {
          console.log('Restoring original activities after group slideshow (from event)');
          setActivities(originalActivities);
          setIsGroupSlideshow(false);
          setOriginalActivities([]);
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('closeModal', handleCloseModal);

      return () => {
        window.removeEventListener('closeModal', handleCloseModal);
      };
    }
  }, [isModalOpen, isGroupSlideshow, originalActivities]); // Include isModalOpen as dependency to ensure we have the latest state

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
    // Note: Page reset is handled by the useEffect for filters
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
    console.log('handleGroupSelect called with groupId:', groupId);
    const prevGroupId = filters.groupId;
    
    setFilters((prev) => {
      console.log('Previous filters:', prev);
      const newFilters = { ...prev, groupId };
      console.log('New filters:', newFilters);
      return newFilters;
    });
    
    // Force a refresh if we're clearing the group filter and state is already null
    // This handles the case where the visual state and actual state are out of sync
    if (groupId === null && prevGroupId === null) {
      console.log('Forcing refresh for All Assets (state sync fix)');
      setPage(0);
      // Force refresh by calling fetchUserActivities directly
      setTimeout(() => {
        fetchUserActivities(userId, userIp);
      }, 0);
    }
    
    // Note: Page reset is handled by the useEffect for filters
  };

  const handleBulkModeToggle = () => {
    setBulkMode(!bulkMode);
    setSelectedAssets([]); // Clear selection when toggling
  };

  const handleAssetSelect = (assetId: string) => {
    setSelectedAssets((prev) => {
      if (prev.includes(assetId)) {
        return prev.filter((id) => id !== assetId);
      } else {
        return [...prev, assetId];
      }
    });
  };

  const handleSelectAllVisible = () => {
    const visibleAssetIds = filteredAndSortedActivities
      .map((activity) => activity.id)
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
    setGroupRefreshKey((prev) => prev + 1);
  };

  // Function to remove an asset from a specific group
  const handleRemoveFromGroup = async (assetId: string, groupId: string, groupName: string) => {
    if (!userId || !assetId || !groupId) return;

    try {
      const response = await fetch('/api/groups/assets', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          groupIds: [groupId],
          assetIds: [assetId]
        })
      });

      if (response.ok) {
        // Update the local state to remove the group from this asset
        setActivities((currentActivities) =>
          currentActivities.map((activity) => {
            if (activity.id === assetId) {
              return {
                ...activity,
                groups: activity.groups?.filter(group => group.id !== groupId) || []
              };
            }
            return activity;
          })
        );

        // Force refresh of GroupManager to update asset counts
        setGroupRefreshKey((prev) => prev + 1);

        showToast({
          type: 'success',
          prompt: `Asset removed from "${groupName}" group`,
          duration: 3000
        });
      } else {
        throw new Error('Failed to remove asset from group');
      }
    } catch (error) {
      console.error('Error removing asset from group:', error);
      showToast({
        type: 'error',
        prompt: 'Failed to remove asset from group. Please try again.',
        duration: 5000
      });
    }
  };

  // Slideshow preview functions
  const generateSlideshowAssets = () => {
    return filteredAndSortedActivities
      .slice()
      .map((activity) => ({
        id: activity.id || '',
        url: activity.CreatedAssetUrl,
        thumbnailUrl:
          activity.AssetType === 'vid'
            ? activity.AssetSource
            : activity.CreatedAssetUrl,
        assetType: activity.AssetType
      }));
  };

  const handleSlideshowAssetClick = (index: number) => {
    if (index >= 0 && index < filteredAndSortedActivities.length) {
      // Slideshow index now matches modal index directly
      const modalIndex = index;
      const activity = filteredAndSortedActivities[modalIndex];
      const url =
        activity.AssetType === 'vid'
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
    // Slideshow indices now match filteredAndSortedActivities indices directly
    const originalFromIndex = fromIndex;
    const originalToIndex = toIndex;

    // We need to update the main activities array, not the filtered one
    // The issue is that filteredAndSortedActivities is a computed value, not the source state
    
    // First, let's identify which items from the main activities array correspond to our filtered items
    const itemToMove = filteredAndSortedActivities[originalFromIndex];
    const targetItem = filteredAndSortedActivities[originalToIndex];

    // Update the main activities state by finding the items in the original array and reordering them
    setActivities((currentActivities) => {
      const updatedActivities = [...currentActivities];
      
      // Find the actual indices in the main activities array
      const actualFromIndex = updatedActivities.findIndex(activity => activity.id === itemToMove?.id);
      const actualToIndex = updatedActivities.findIndex(activity => activity.id === targetItem?.id);
      
      if (actualFromIndex !== -1 && actualToIndex !== -1) {
        // Remove the item from its current position
        const [movedItem] = updatedActivities.splice(actualFromIndex, 1);
        // Insert it at the new position
        updatedActivities.splice(actualToIndex, 0, movedItem);
        
        // Update order values to preserve the new order when sorting
        // Use 10-unit intervals for spacing (similar to the API endpoints)
        const orderInterval = 10;
        updatedActivities.forEach((activity, index) => {
          // Use index-based ordering with spacing to match API behavior
          activity.order = index * orderInterval;
          // Keep DateTime for backward compatibility
          activity.DateTime = activity.DateTime || new Date();
        });
      }
      
      return updatedActivities;
    });

    // Update current modal index to follow the moved item
    if (currentModalIndex === originalFromIndex) {
      setCurrentModalIndex(originalToIndex);
    } else if (originalFromIndex < originalToIndex) {
      // Moving item down: indices between fromIndex and toIndex shift up
      if (currentModalIndex > originalFromIndex && currentModalIndex <= originalToIndex) {
        setCurrentModalIndex(currentModalIndex - 1);
      }
    } else {
      // Moving item up: indices between toIndex and fromIndex shift down
      if (currentModalIndex >= originalToIndex && currentModalIndex < originalFromIndex) {
        setCurrentModalIndex(currentModalIndex + 1);
      }
    }
  };

  const handleSaveAssetOrder = async (orderedAssets: Array<{id: string; url: string; thumbnailUrl?: string; assetType: string}>) => {
    try {
      console.log('Saving asset order to database for assets:', orderedAssets.length);
      
      // Declare response variable before if/else block to make it accessible throughout the function
      let response;
      
      // Determine if we need to use group-specific ordering
      if (isGroupSlideshow && currentGroupId) {
        console.log('Using group-specific ordering for group:', currentGroupId);
        
        // Use the group-specific API endpoint
        response = await fetch('/api/saveGroupAssetOrder', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userId,
            groupId: currentGroupId,
            orderedAssetIds: orderedAssets.map(asset => asset.id)
          }),
        });
      } else {
        // Use the global asset ordering API
        response = await fetch('/api/saveAssetOrder', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userId,
            orderedAssetIds: orderedAssets.map(asset => asset.id)
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to save asset order: ${errorData.error}`);
      }

      const result = await response.json();
      console.log('Asset order saved to database:', result);
      
      // The database update is complete, now update local state to reflect the new order
      const orderInterval = 10;
      setActivities(currentActivities => {
        const updatedActivities = [...currentActivities];
        
        // Update order values to reflect the database changes
        orderedAssets.forEach((orderedAsset, index) => {
          const activityIndex = updatedActivities.findIndex(activity => activity.id === orderedAsset.id);
          if (activityIndex !== -1) {
            // Set the order field to match server-side ordering
            updatedActivities[activityIndex].order = index * orderInterval;
            // Keep DateTime for backward compatibility
            updatedActivities[activityIndex].DateTime = updatedActivities[activityIndex].DateTime || new Date();
          }
        });
        
        return updatedActivities;
      });

      console.log('Asset order saved successfully to database and local state');

      // Show success message
      showToast({
        type: 'success',
        prompt: 'Asset order saved successfully!',
        duration: 3000
      });

      // The order is now preserved in the local state and will be reflected in the UI
      // Note: For a full implementation, you might want to also update the server-side order
      // by calling an API endpoint that accepts the complete ordered list
      
    } catch (error) {
      console.error('Error saving asset order:', error);
      showToast({
        type: 'error',
        prompt: 'Failed to save asset order. Please try again.',
        duration: 5000
      });
      throw error; // Re-throw to let Modal handle the error state
    }
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
        .map((activity) => activity.id)
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
        type: 'success',
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

  // Helper function to fetch all assets for a group (no pagination)
  const fetchAllGroupAssets = async (groupId: string): Promise<UserActivity[]> => {
    try {
      console.log('Fetching all assets for group:', groupId);
      
      // Fetch with a very high limit to get all assets
      const params = new URLSearchParams({
        userId: userId ? userId : 'none',
        userIp: userIp ? userIp : 'none',
        limit: '1000', // High limit to get all assets
        offset: '0',
        groupId: groupId,
        includeGroups: 'true'
      });

      const url = `/api/getUserAssets?${params.toString()}`;
      console.log('Fetching all group assets from URL:', url);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch group assets: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Fetched all group assets:', data.assets?.length || 0, 'assets');
      
      return data.assets || [];
    } catch (error) {
      console.error('Error fetching all group assets:', error);
      return [];
    }
  };

  // Group slideshow handlers
  const handleStartGroupSlideshow = async (groupId: string) => {
    // Set current group ID for tracking
    setCurrentGroupId(groupId);
    console.log('Starting group slideshow for group:', groupId);
    
    try {
      // Fetch ALL assets for this group to ensure complete slideshow
      const allGroupAssets = await fetchAllGroupAssets(groupId);
      
      console.log('Fetched group assets:', allGroupAssets.length);
      
      if (allGroupAssets.length > 0) {
        // Store original activities and enable group slideshow mode
        setOriginalActivities(activities);
        setIsGroupSlideshow(true);
        
        // Deep clone the array to avoid reference issues
        const clonedAssets = JSON.parse(JSON.stringify(allGroupAssets));
        
        // Let's log ALL assets to see what we're working with
        console.log('====== SLIDESHOW ASSETS DEBUG ======');
        clonedAssets.forEach((asset, index) => {
          console.log(`Asset ${index}:`, asset.id, asset.AssetType, asset.CreatedAssetUrl);
        });
        console.log('================================');
        
        // Sort assets by their ID or creation date to ensure consistent order
        // Let's force the penguin image to be first for testing
        const penguinAsset = clonedAssets.find(asset => 
          asset.CreatedAssetUrl.includes('penguin') ||
          asset.CreatedAssetUrl.includes('hb18nttzVIj60IMOnTInR')
        );
        
        // If we found the penguin asset, make it the first one
        if (penguinAsset) {
          console.log('Found penguin asset! Moving to first position:', penguinAsset.CreatedAssetUrl);
          // Remove penguin from its current position
          const filteredAssets = clonedAssets.filter(asset => asset.id !== penguinAsset.id);
          // Insert at the beginning
          filteredAssets.unshift(penguinAsset);
          // Replace the cloned assets with our reordered version
          clonedAssets.length = 0;
          clonedAssets.push(...filteredAssets);
        }
        
        // Now get the first asset after our reordering
        const firstAsset = clonedAssets[0];
        const firstAssetUrl = firstAsset.CreatedAssetUrl;
        
        console.log('====== SLIDESHOW INIT DEBUG ======');
        console.log('First asset ID:', firstAsset.id);
        console.log('First asset type:', firstAsset.AssetType);
        console.log('First asset URL:', firstAssetUrl);
        console.log('================================');
        
        // Now set the activities state
        setActivities(clonedAssets);
        
        // Force an override of Modal's source url to ensure it's correct
        // Important: Use the captured variables directly, don't re-access activities state
        const forcedFirstImageUrl = firstAssetUrl; // Use the same variable throughout
        
        // Ensure synchronous updates by using a small timeout
        setTimeout(() => {
          console.log('Setting modal props...');
          // Step 1: First set all necessary state for the first image BEFORE opening the modal
          setCurrentModalIndex(0);
          setModalMediaUrl(forcedFirstImageUrl); // Use the forced URL directly
          console.log('Setting modal media URL to:', forcedFirstImageUrl);
          setShowSlideshowSettings(false);
          setIsFullScreenModal(false);
          
          // Step 2: Critical - ensure autoStartSlideshow is false when opening modal
          setAutoStartSlideshow(false);
          
          // Step 3: Now open the modal which will display the first image
          console.log('Opening modal with first image URL:', forcedFirstImageUrl);
          setIsModalOpen(true);
          
          // Step 4: Wait for modal to fully render and display first image before auto-starting
          // This delay is crucial - it ensures the first image is fully visible
          // before the slideshow starts advancing
          setTimeout(() => {
            console.log('First image displayed, now starting slideshow from index 0');
            setAutoStartSlideshow(true);
          }, 2000); // Using a longer 2s delay to ensure the first image is fully visible
        }, 50); // Small delay to ensure state updates properly
      } else {
        console.log('No assets found for group:', groupId);
      }
    } catch (error) {
      console.error('Error starting group slideshow:', error);
    }
  };

  const handleOpenGroupSlideshowSettings = async (groupId: string) => {
    console.log('Opening group slideshow settings for group:', groupId);
    
    // Fetch ALL assets for this group to ensure complete slideshow
    const allGroupAssets = await fetchAllGroupAssets(groupId);
    
    if (allGroupAssets.length > 0) {
      // Store original activities and enable group slideshow mode
      setOriginalActivities(activities);
      setIsGroupSlideshow(true);
      setActivities(allGroupAssets);
      
      const firstActivity = allGroupAssets[0];
      const url =
        firstActivity.AssetType === 'vid'
          ? firstActivity.CreatedAssetUrl
          : firstActivity.CreatedAssetUrl;

      setCurrentModalIndex(0);
      setModalMediaUrl(url);
      setShowSlideshowSettings(true); // Show slideshow options but don't auto-start
      setAutoStartSlideshow(false);
      setIsModalOpen(true);
      setIsFullScreenModal(false);
    } else {
      console.log('No assets found for group:', groupId);
    }
  };

  // Early return if user is not signed in
  if (!userId) {
    return (
      <div className="my-assets-container">
        <h1 className="text-xl font-bold mb-2 text-left">My {assetTypeTitle} Assets</h1>
        <div className="text-center py-8">
          <p className="text-lg mb-4">Please sign in to view your assets.</p>
          <a
            href="/signin"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`my-assets-container ${isDragging ? 'select-none' : ''}`}>
      {/* Title and Refresh section - same line on mobile */}
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-xl font-bold text-left">My {assetTypeTitle} Assets</h1>
        <button 
          onClick={handleRefresh}
          className="md:hidden flex items-center gap-1 px-2 py-1 rounded text-sm"
          style={{
            backgroundColor: 'var(--primary-color)',
            color: 'white'
          }}
        >
          {isAutoRefreshing ? 'Refresh Now' : 'Refresh'}
        </button>
      </div>

      {/* Buttons section */}
      <div className="flex justify-between items-center mb-2">
        {/* Left side buttons */}
        <div className="flex items-center gap-2">
          {/* Slideshow buttons */}
          {filteredAndSortedActivities.length > 0 && (
            <>
              <button
                onClick={handleStartSlideshow}
                className="flex items-center gap-1 px-2 py-1 rounded"
                style={{
                  backgroundColor: 'var(--primary-color)',
                  color: 'white'
                }}
                title="Start slideshow immediately"
              >
                <FaPlayCircle /> Slideshow
              </button>
              <button
                onClick={handleOpenSlideshowSettings}
                className="flex items-center gap-1 px-2 py-1 rounded"
                style={{
                  backgroundColor: 'var(--secondary-color)',
                  color: 'var(--primary-color)',
                  border: `1px solid var(--primary-color)`
                }}
                title="Configure slideshow settings"
              >
                <FaCog />
              </button>
            </>
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
        </div>

        {/* Right side buttons */}
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

          {/* Desktop refresh button */}
          <button onClick={handleRefresh} className="hidden md:block">
            {isAutoRefreshing ? 'Refresh Now' : 'Refresh Assets'}
          </button>
        </div>
      </div>

      {/* Group Management Panel */}
      {showGroupsPanel && (
        <div
          className="flex flex-col md:flex-row gap-4 mb-4 p-4 border rounded"
          style={{
            borderColor: 'var(--border-color)',
            backgroundColor: 'var(--secondary-color)'
          }}
        >
          {/* Groups Sidebar */}
          <div className="md:w-80 flex-shrink-0">
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
                  {bulkMode ? 'Exit Add Mode' : 'Add Assets to a Group'}
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
                        Add to Group ({selectedAssets.length})
                      </button>
                    )}
                  </>
                )}
              </div>

              {filters.groupId && (
                <div className="flex items-center gap-1 ml-auto">
                  <div className="text-sm text-gray-600 text-right">
                    Showing assets in selected group
                  </div>
                  <button
                    onClick={() => handleGroupSelect(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Show all assets"
                  >
                    <FaTimes className="text-xs" />
                  </button>
                </div>
              )}
            </div>

            {bulkMode && (
              <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-sm text-blue-700 dark:text-blue-300">
                <strong>Instructions:</strong> Check the box next to the images that you want to add to a group
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick bulk actions when groups panel is closed and bulk mode is active */}
      {!showGroupsPanel && bulkMode && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
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
                Add to Group ({selectedAssets.length})
              </button>
            )}
          </div>

          {filters.groupId && (
            <div className="flex items-center gap-1 justify-end">
              <div className="text-sm text-gray-600 text-right">
                Showing assets in selected group
              </div>
              <button
                onClick={() => handleGroupSelect(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                title="Clear group filter"
              >
                <FaTimes className="text-xs" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Group filter indicator when groups panel is closed and not in bulk mode */}
      {!showGroupsPanel && !bulkMode && filters.groupId && (
        <div className="flex justify-end mb-4">
          <div className="flex items-center gap-1">
            <div className="text-sm text-gray-600 text-right">
              Showing assets in selected group
            </div>
            <button
              onClick={() => handleGroupSelect(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              title="Clear group filter"
            >
              <FaTimes className="text-xs" />
            </button>
          </div>
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
          {!(
            filters.assetType ||
            filters.inGallery ||
            filters.minHearts > 0 ||
            searchTerm
          ) &&
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
        <p className="flex items-center">
          <FaTrophy className="text-orange-500 mr-1" />
          <span>
            * Star your images and win 500 Credits EVERY MONTH for the most
            hearts in the <a href={'/gallery'}>GenTube.ai gallery</a>. Next
            winner: June 30, 2025.
          </span>
        </p>
      </div>

      {filteredAndSortedActivities.length === 0 && (
        <p>
          {activities.length === 0
            ? 'No assets found. You may need to refresh to see your assets.'
            : 'No assets match your current filters. Try changing or clearing the filters.'}
        </p>
      )}
      {filteredAndSortedActivities.map((activity, index) => (
        <div
          key={activity.id || index}
          id={
            index === 0 ? 'first-asset' : 
            (activity.AssetType === 'que' && !filteredAndSortedActivities.slice(0, index).some(a => a.AssetType === 'que')) ? 'first-queued-asset' : 
            undefined
          }
          className={`border p-4 asset-item ${
            onSelectAsset ? 'cursor-pointer asset-item-hover' : ''
          } ${
            selectedAssetUrl === activity.CreatedAssetUrl ||
            selectedAssetUrl === activity.AssetSource
              ? 'asset-item-selected'
              : ''
          } ${draggedIndex === index ? 'opacity-50' : ''} ${
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

          {/* Image/thumbnail - responsive with proper constraints */}
          <div className="flex justify-center w-full md:w-auto mb-3 md:mb-0">
            <div
              className={`asset-image-container w-full max-w-sm min-h-[12rem] max-h-[20rem] md:w-32 md:h-32 md:min-h-32 md:max-h-32 md:mr-4 ${activity.AssetType === 'que' || activity.AssetType === 'err' ? 'disabled' : ''}`}
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
                <Image
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
                  width={200}
                  height={200}
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '100%',
                    width: 'auto', 
                    height: 'auto',
                    objectFit: 'contain'
                  }}
                  unoptimized
                  onError={(e) => {
                    if (activity.AssetType === 'vid') {
                      // Hide the broken image and replace it with a play icon
                      const container = e.currentTarget.parentElement;
                      if (container) {
                        // Check if a play icon already exists to prevent duplicates
                        const existingPlayIcon = container.querySelector('.video-play-icon');
                        if (!existingPlayIcon) {
                          // Hide the broken image
                          e.currentTarget.style.display = 'none';
                          
                          // Create play icon container
                          const playIcon = document.createElement('div');
                          playIcon.className = 'video-play-icon w-full h-full flex items-center justify-center';

                          // Create the FaPlay icon element
                          const svgIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                          svgIcon.setAttribute('fill', 'currentColor');
                          svgIcon.setAttribute('viewBox', '0 0 448 512');
                          svgIcon.setAttribute('class', 'w-8 h-8 text-gray-500');

                          // FaPlay path data
                          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                          path.setAttribute('d', 'M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z');

                          svgIcon.appendChild(path);
                          playIcon.appendChild(svgIcon);
                          container.appendChild(playIcon);
                        }
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
                          className="inline-flex items-center gap-1 px-1 py-0.5 text-xs rounded"
                          style={{
                            backgroundColor: group.color + '20',
                            color: group.color,
                            border: `1px solid ${group.color}40`
                          }}
                          title={group.name}
                        >
                          {group.name}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (activity.id) {
                                handleRemoveFromGroup(activity.id, group.id, group.name);
                              }
                            }}
                            className="ml-1 hover:opacity-70 transition-opacity"
                            title={`Remove from ${group.name}`}
                          >
                            <FaTimes className="text-xs" />
                          </button>
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
                  onClick={() => handleDownload(activity)}
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
                    title="Add to Group"
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
          onNext={handlePreviousInModal}
          onPrevious={handleNextInModal}
          hasNext={
            currentModalIndex < filteredAndSortedActivities.length - 1 || 
            (currentModalIndex === filteredAndSortedActivities.length - 1 && hasMore)
          }
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
          currentAssetIndex={currentModalIndex}
          onAssetClick={handleSlideshowAssetClick}
          onAssetReorder={handleSlideshowAssetReorder}
          onSaveAssetOrder={handleSaveAssetOrder}
          showImageEditPane={showImageEditPane}
          editPrompt={editPrompt}
          onEditPromptChange={setEditPrompt}
          onSubmitImageEdit={handleSubmitImageEdit}
          onToggleImageEditPane={handleToggleImageEditPane}
          isEditingImage={isEditingImage}
          onModifyImage={handleModifyImageFromModal}
          onCreateVideo={handleCreateVideoFromModal}
          currentAssetInfo={{
            id: filteredAndSortedActivities[currentModalIndex]?.id,
            prompt: filteredAndSortedActivities[currentModalIndex]?.Prompt,
            assetType: filteredAndSortedActivities[currentModalIndex]?.AssetType
          }}
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
