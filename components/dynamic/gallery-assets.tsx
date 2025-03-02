import React, { useEffect, useState } from 'react';
import {
  FaExternalLinkAlt,
  FaCopy,
  FaImage,
  FaVideo,
  FaTrash,
  FaPlay,
  FaMinus,
  FaPlus
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
            ? { ...activity, SubscriptionTier: 3 }
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
        <button onClick={handleRefresh} className="text-blue-700">
          Refresh Assets
        </button>
      </div>
      <div className="flex items-center mb-4">
        <label className="mr-2">Removable Assets Only:</label>
        <label className="switch">
          <input
            type="checkbox"
            checked={subscriptionTier === 3}
            onChange={() => setSubscriptionTier(subscriptionTier === 0 ? 3 : 0)}
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
      {activities.map((activity, index) => (
        <div key={index} className="border p-4 flex items-center">
          <a
            href={activity.CreatedAssetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-16 h-16 flex items-center justify-center bg-gray-200 mr-4"
            onClick={(e) => {
              e.preventDefault();
              openModal(activity.CreatedAssetUrl);
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
          </a>
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
                      : activity.AssetType === 'err'
                        ? 'Error'
                        : 'Unknown'}
              </p>
            </div>
            {activity.AssetType !== 'upl' && (
              <div>
                <p>
                  <strong>Prompt:</strong>
                  {expandedPrompts[index] ||
                  activity.Prompt.length <= promptLength
                    ? activity.Prompt
                    : `${activity.Prompt.substring(0, promptLength)}... `}
                  {activity.Prompt.length > promptLength && (
                    <button
                      onClick={() => togglePrompt(index)}
                      className="text-blue-700"
                    >
                      {expandedPrompts[index] ? 'less' : 'more'}
                    </button>
                  )}
                  <button
                    onClick={() =>
                      handleCopy(activity.Prompt, 'Prompt copied!')
                    }
                    className="text-blue-700 icon-size-small ml-2"
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
                className="text-blue-700 icon-size"
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
                className="text-blue-700 icon-size"
                title="Copy Image URL"
              >
                <FaImage />
              </button>
              {activity.AssetType === 'vid' && (
                <button
                  onClick={() =>
                    handleCopy(activity.CreatedAssetUrl, 'Video URL copied!')
                  }
                  className="text-blue-700 icon-size"
                  title="Copy Video URL"
                >
                  <FaVideo />
                </button>
              )}
              {activity.SubscriptionTier === 0 ? (
                <button
                  onClick={() =>
                    handleToggleOnGallery(
                      userId,
                      activity.CreatedAssetUrl,
                      setActivities
                    )
                  }
                  className="text-blue-700 icon-size"
                  title="Add to Gallery"
                >
                  <FaPlus />
                </button>
              ) : activity.SubscriptionTier === 3 ? (
                <button
                  onClick={() =>
                    handleToggleOffGallery(
                      userId,
                      activity.CreatedAssetUrl,
                      setActivities
                    )
                  }
                  className="text-blue-700 icon-size"
                  title="Remove from Gallery"
                >
                  <FaMinus />
                </button>
              ) : null}
              <button
                onClick={() => handleDelete(activity)}
                className="text-red-500 icon-size"
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

export default GalleryAssets;
