import { Datastore } from '@google-cloud/datastore';
import { google_app_creds } from '@/interfaces/googleCredentials';

const datastore = new Datastore({
  namespace: 'GenTube',
  projectId: google_app_creds.projectId,
  credentials: google_app_creds
});

export const toggleOnGallery = async (userId: string, assetUrl: string) => {
  const query = datastore
    .createQuery('UserActivity')
    .filter('UserId', '=', 'none')
    .filter('CreatedAssetUrl', '=', assetUrl);
  const [activities] = await datastore.runQuery(query);

  console.log('UPDATE activities:', activities);

  const updatedActivities = activities.map((activity) => {
    activity.SubscriptionTier = 4;
    return {
      key: activity[datastore.KEY],
      data: activity
    };
  });

  await datastore.upsert(updatedActivities);
};

export const toggleOffGallery = async (userId: string, assetUrl: string) => {
  const query = datastore
    .createQuery('UserActivity')
    .filter('UserId', '=', 'none')
    .filter('CreatedAssetUrl', '=', assetUrl);
  const [activities] = await datastore.runQuery(query);

  console.log('UPDATE activities:', activities);

  const updatedActivities = activities.map((activity) => {
    activity.SubscriptionTier = 0;
    return {
      key: activity[datastore.KEY],
      data: activity
    };
  });

  await datastore.upsert(updatedActivities);
};
