import { Datastore } from '@google-cloud/datastore';
import { google_app_creds } from '@/interfaces/googleCredentials';

const datastore = new Datastore({
  namespace: 'GenTube',
  projectId: google_app_creds.projectId,
  credentials: google_app_creds
});

export const deleteUserActivity = async (userId: string, assetUrl: string) => {
  const query = datastore
    .createQuery('UserActivity')
    .filter('UserId', '=', userId)
    .filter('CreatedAssetUrl', '=', assetUrl);
  const [activities] = await datastore.runQuery(query);

  console.log('DELETE activities:', activities);

  const keys = activities.map((activity) => activity[datastore.KEY]);
  await datastore.delete(keys);
};
