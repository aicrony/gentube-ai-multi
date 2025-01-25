import React, { useEffect, useState } from 'react';
import { useUserId } from '@/context/UserIdContext';
import { FaExternalLinkAlt, FaCopy, FaImage, FaVideo } from 'react-icons/fa';

interface UserActivity {
  CreatedAssetUrl: string;
  Prompt: string;
  AssetSource: string;
  AssetType: string;
}

const MyAssets: React.FC = () => {
  const userId = useUserId();
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [expandedPrompts, setExpandedPrompts] = useState<{
    [key: number]: boolean;
  }>({});
  const limit = 10;
  const promptLength = 100;

  const fetchUserActivities = async () => {
    if (userId) {
      try {
        const response = await fetch(
          `/api/getUserAssets?userId=${userId}&limit=${limit}&offset=${page * limit}`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch user assets');
        }
        const data = await response.json();
        setActivities((prev) => [...prev, ...data.assets]);
        setHasMore(data.assets.length === limit);
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
  }, [userId, page]);

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

  if (loading) {
    return <p>Loading...</p>;
  }

  if (activities && activities.length === 0) {
    return <p>No assets found.</p>;
  }

  return (
    <div className="my-assets-container">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">My Assets</h1>
        <button onClick={handleRefresh} className="text-blue-500">
          Refresh Assets
        </button>
      </div>
      {activities.map((activity, index) => (
        <div key={index} className="border p-4 flex items-center">
          <a
            href={activity.CreatedAssetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-16 h-16 flex items-center justify-center bg-gray-200 mr-4"
          >
            {activity.AssetType === 'vid' ? (
              <img
                src={activity.AssetSource}
                alt="Thumbnail"
                className="w-16 h-16 object-cover"
              />
            ) : (
              <img
                src={activity.CreatedAssetUrl}
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
                  : activity.AssetType === 'upl'
                    ? 'Upload'
                    : 'Image'}
              </p>
            </div>
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
                    className="text-blue-500"
                  >
                    {expandedPrompts[index] ? 'less' : 'more'}
                  </button>
                )}
                <button
                  onClick={() => handleCopy(activity.Prompt, 'Prompt copied!')}
                  className="text-blue-500 icon-size-small ml-2"
                  title="Copy Prompt"
                >
                  <FaCopy />
                </button>
              </p>
            </div>
          </div>
          <div>
            <div className="flex flex-col items-center space-y-2 sm:flex-row sm:items-start sm:space-y-0 sm:space-x-2 mt-2">
              <a
                href={activity.CreatedAssetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 icon-size"
                title="Open"
              >
                <FaExternalLinkAlt />
              </a>
              <button
                onClick={() =>
                  handleCopy(
                    activity.CreatedAssetUrl,
                    activity.AssetType === 'vid'
                      ? 'Video URL copied!'
                      : 'Image URL copied!'
                  )
                }
                className="text-blue-500 icon-size"
                title="Copy Image URL"
              >
                <FaImage />
              </button>
              {activity.AssetType === 'vid' && (
                <button
                  onClick={() =>
                    handleCopy(activity.CreatedAssetUrl, 'Video URL copied!')
                  }
                  className="text-blue-500 icon-size"
                  title="Copy Video URL"
                >
                  <FaVideo />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
      {hasMore && (
        <button onClick={() => setPage((prev) => prev + 1)} className="mt-4">
          Load More
        </button>
      )}
    </div>
  );
};

export default MyAssets;
