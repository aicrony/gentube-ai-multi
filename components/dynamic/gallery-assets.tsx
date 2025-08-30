import React, { useEffect, useState } from 'react';
import {
  FaExternalLinkAlt,
  FaCopy,
  FaImage,
  FaVideo,
  FaTrash,
  FaPlay,
  FaMinus,
  FaPlus,
  FaDownload
} from 'react-icons/fa';
import Modal from '@/components/ui/Modal'; // Import the Modal component
import { toggleOnGallery } from '@/utils/gcloud/userGalleryToggle';

interface UserActivity {
  CreatedAssetUrl: string;
  Prompt: string;
  AssetSource: string;
  AssetType: string;
  SubscriptionTier: number;
}

interface MyAssetsProps {
  assetType?: string;
}

const handleToggleOnGallery = async (
  userId: string,
  assetUrl: string,
  setActivities: React.Dispatch<React.SetStateAction<UserActivity[]>>
) => {
  if (confirm('Are you sure you want to add this asset to the gallery?')) {
    try {
      const response = await fetch('/api/setUserAssetsToggleOn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, assetUrl })
      });

      if (!response.ok) {
        throw new Error('Failed to add asset to gallery');
      }

      const result = await response.json();
      console.log('Asset added to gallery:', result);

      // Update the state to reflect the change
      setActivities((prevActivities: UserActivity[]) =>
        prevActivities.map((activity: UserActivity) =>
          activity.CreatedAssetUrl === assetUrl
            ? { ...activity, SubscriptionTier: 4 }
            : activity
        )
      );
    } catch (error) {
      console.error('Error adding asset to gallery:', error);
    }
  }
};

const handleToggleOffGallery = async (
  userId: string,
  assetUrl: string,
  setActivities: React.Dispatch<React.SetStateAction<UserActivity[]>>
) => {
  if (confirm('Are you sure you want to remove this asset from the gallery?')) {
    try {
      const response = await fetch('/api/setUserAssetsToggleOff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, assetUrl })
      });

      if (!response.ok) {
        throw new Error('Failed to remove asset from gallery');
      }

      const result = await response.json();
      console.log('Asset removed from gallery:', result);

      // Update the state to reflect the change
      setActivities((prevActivities: UserActivity[]) =>
        prevActivities.map((activity: UserActivity) =>
          activity.CreatedAssetUrl === assetUrl
            ? { ...activity, SubscriptionTier: 0 }
            : activity
        )
      );
    } catch (error) {
      console.error('Error removing asset from gallery:', error);
    }
  }
};

const GalleryAssets: React.FC<MyAssetsProps> = ({ assetType }) => {
  const userId = 'none';
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [expandedPrompts, setExpandedPrompts] = useState<{
    [key: number]: boolean;
  }>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMediaUrl, setModalMediaUrl] = useState('');
  const [subscriptionTier, setSubscriptionTier] = useState(0); // Add state for subscriptionTier
  const limit = 10;
  const promptLength = 100;

  const fetchUserActivities = async () => {
    if (userId) {
      try {
        const response = await fetch(
          `/api/getUserAssetsToggle?userId=${userId}&limit=${limit}&offset=${page * limit}&subscriptionTier=${subscriptionTier}&assetType=${assetType || ''}`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch user assets');
        }
        const data = await response.json();
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
    fetchUserActivities();
  }, [userId, page, assetType, subscriptionTier]); // Add subscriptionTier to dependencies

  const handleCopy = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    alert(message);
  };

  const togglePrompt = (index: number) => {
    setExpandedPrompts((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleRefresh = () => {
    setActivities([]);
    setPage(0);
    setLoading(true);
    fetchUserActivities();
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
            assetUrl: activity.CreatedAssetUrl,
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

  const handleDownload = async (
    url: string,
    assetType: string,
    prompt?: string
  ) => {
    try {
      // Show a small loading indicator
      const loadingToast = document.createElement('div');
      loadingToast.textContent = 'Downloading asset...';
      loadingToast.style.position = 'fixed';
      loadingToast.style.bottom = '20px';
      loadingToast.style.right = '20px';
      loadingToast.style.padding = '10px 15px';
      loadingToast.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      loadingToast.style.color = 'white';
      loadingToast.style.borderRadius = '4px';
      loadingToast.style.zIndex = '1000';
      document.body.appendChild(loadingToast);

      // For videos and images, determine file extension
      const fileExtension = assetType === 'vid' ? '.mp4' : '.jpg';

      // Generate a filename based on the prompt if available
      let fileName = 'asset';
      if (prompt) {
        // Take first 29 characters, remove invalid filename characters
        const sanitizedPrompt = prompt
          .substring(0, 29)
          .replace(/[\/?%*:|"<>]/g, '')
          .trim()
          .replace(/\s+/g, '-');

        if (sanitizedPrompt) {
          fileName = sanitizedPrompt;
        }
      }

      fileName = `${fileName}${fileExtension}`;

      // Use our API endpoint as a proxy to avoid CORS issues
      const proxyUrl = `/api/downloadAsset?url=${encodeURIComponent(url)}`;
      console.log('Downloading via proxy:', proxyUrl);

      // Fetch the file through our proxy
      const response = await fetch(proxyUrl);

      // Remove loading indicator
      document.body.removeChild(loadingToast);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Error ${response.status}: ${response.statusText}`
        );
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
      console.error('Error downloading asset:', error);
      alert(
        `Failed to download the asset: ${error instanceof Error ? error.message : String(error)}`
      );
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

  const assetTypeName =
    assetType === 'vid' ? 'Video' : assetType === 'upl' ? 'Uploaded' : '';

  return (
    <div className="my-assets-container">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Gallery {assetTypeName} Assets</h1>
        <button onClick={handleRefresh}>Refresh Assets</button>
      </div>
      <div className="flex items-center mb-4">
        <label className="mr-2">Removable Assets Only:</label>
        <label className="switch">
          <input
            type="checkbox"
            checked={subscriptionTier === 4}
            onChange={() => setSubscriptionTier(subscriptionTier === 0 ? 4 : 0)}
          />
          <span className="slider round"></span>
        </label>
      </div>
      {activities && activities.length === 0 && (
        <p>
          No assets found. You may need to <a href="/signin">sign in</a> to see
          your assets.
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 px-4 w-full">
        {activities.map((activity, index) => (
          <div
            key={index}
            className="relative rounded-lg overflow-hidden transition-transform duration-200 hover:scale-[0.98]"
            onClick={() => openModal(activity.CreatedAssetUrl)}
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
            </div>

            {/* Image Thumbnail */}
            <div className="aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden relative">
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
                />
              )}
            </div>

            {/* Hover Overlay - Only visible on hover */}
            <div className="absolute inset-0 bg-black bg-opacity-0 opacity-0 hover:bg-opacity-70 hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-3">
              {/* Top section with prompt */}
              <div className="overflow-hidden max-h-[60%] text-white text-sm">
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
                    openModal(activity.CreatedAssetUrl);
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
                      'Asset URL copied!'
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
                      activity.AssetType,
                      activity.Prompt
                    );
                  }}
                  className="bg-gray-800 bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 text-white focus:outline-none transition-all shadow-md"
                  title="Download Asset"
                >
                  <FaDownload className="text-xs" />
                </button>

                {activity.SubscriptionTier === 0 ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleOnGallery(
                        userId,
                        activity.CreatedAssetUrl,
                        setActivities
                      );
                    }}
                    className="bg-gray-800 bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 text-white focus:outline-none transition-all shadow-md"
                    title="Add to Gallery"
                  >
                    <FaPlus className="text-xs" />
                  </button>
                ) : activity.SubscriptionTier === 4 ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleOffGallery(
                        userId,
                        activity.CreatedAssetUrl,
                        setActivities
                      );
                    }}
                    className="bg-gray-800 bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 text-yellow-500 focus:outline-none transition-all shadow-md"
                    title="Remove from Gallery"
                  >
                    <FaMinus className="text-xs" />
                  </button>
                ) : null}

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
      {activities.length > 0 && hasMore && (
        <button
          onClick={() => setPage((prev) => prev + 1)}
          className="mt-4 px-4 py-2 rounded border flex items-center justify-center"
        >
          Load More
        </button>
      )}
      {isModalOpen && (
        <Modal
          mediaUrl={modalMediaUrl}
          onClose={closeModal}
          prompt={
            activities.find((a) => a.CreatedAssetUrl === modalMediaUrl)?.Prompt
          }
        />
      )}
    </div>
  );
};

export default GalleryAssets;
