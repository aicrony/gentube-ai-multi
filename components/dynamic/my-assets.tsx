import React, { useEffect, useState } from 'react';
import { useUserId } from '@/context/UserIdContext';
import { useUserIp } from '@/context/UserIpContext';
import {
  FaExternalLinkAlt,
  FaCopy,
  FaImage,
  FaVideo,
  FaTrash,
  FaPlay
} from 'react-icons/fa';
import Modal from '@/components/ui/Modal'; // Import the Modal component

interface UserActivity {
  CreatedAssetUrl: string;
  Prompt: string;
  AssetSource: string;
  AssetType: string;
}

interface MyAssetsProps {
  assetType?: string;
}

const MyAssets: React.FC<MyAssetsProps> = ({ assetType }) => {
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
  const limit = 10;
  const promptLength = 100;

  const fetchUserActivities = async (userId: string, userIp: string) => {
    if (userId || userIp) {
      try {
        const response = await fetch(
          `/api/getUserAssets?userId=${userId ? userId : 'none'}&userIp=${userIp ? userIp : 'none'}&limit=${limit}&offset=${page * limit}&assetType=${assetType || ''}`
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

  const assetTypeTitle =
    assetType === 'vid'
      ? 'Video'
      : assetType === 'img'
        ? 'Image'
        : assetType === 'upl'
          ? 'Uploads'
          : '';

  return (
    <div className="my-assets-container">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">My {assetTypeTitle} Assets</h1>
        <button onClick={handleRefresh}>Refresh Assets</button>
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
            className={`w-16 h-16 flex items-center justify-center bg-gray-200 mr-4 ${activity.AssetType === 'que' || activity.AssetType === 'err' ? 'disabled' : ''}`}
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
                      className="text-blue-700"
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
