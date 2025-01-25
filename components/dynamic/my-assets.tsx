import React, { useEffect, useState } from 'react';
import { useUserId } from '@/context/UserIdContext';

interface UserActivity {
  CreatedAssetUrl: string;
  Prompt: string;
}

const MyAssets: React.FC = () => {
  const userId = useUserId();
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserActivities = async () => {
      if (userId) {
        console.log('Assets USERID: ', userId);
        try {
          const response = await fetch(`/api/getUserAssets?userId=${userId}`);
          if (!response.ok) {
            throw new Error('Failed to fetch user assets');
          }
          const data = await response.json();
          setActivities(data.assets || []);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchUserActivities();
  }, [userId]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (activities.length === 0) {
    return <p>No assets found.</p>;
  }

  return (
    <div className="grid gap-4">
      {activities.map((activity, index) => (
        <div key={index} className="border p-4">
          <p>
            <strong>Prompt:</strong> {activity.Prompt}
          </p>
          <p>
            <strong>Created Asset URL:</strong>{' '}
            <a
              href={activity.CreatedAssetUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {activity.CreatedAssetUrl}
            </a>
          </p>
        </div>
      ))}
    </div>
  );
};

export default MyAssets;
