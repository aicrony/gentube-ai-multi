import { Datastore } from '@google-cloud/datastore';

const datastore = new Datastore({
  namespace: 'GenTube'
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
