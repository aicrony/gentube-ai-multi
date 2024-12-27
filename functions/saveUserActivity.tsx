import { Datastore } from '@google-cloud/datastore';
import { GcloudUserActivity } from '@/interfaces/gcloudUserActivity';
require('dotenv').config();

const datastore = new Datastore({
  projectId: process.env.PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

const kind = 'UserActivity';
const namespace = 'GenTube';

export async function saveUserActivity(
  activity: GcloudUserActivity
): Promise<string | undefined> {
  const taskKey = datastore.key({
    namespace: namespace,
    path: [kind]
  });

  const entity = {
    key: taskKey,
    data: [
      { name: 'AssetSource', value: activity.AssetSource },
      { name: 'AssetType', value: activity.AssetType },
      {
        name: 'CountedAssetPreviousState',
        value: activity.CountedAssetPreviousState
      },
      { name: 'CountedAssetState', value: activity.CountedAssetState },
      { name: 'CreatedAssetUrl', value: activity.CreatedAssetUrl },
      { name: 'DateTime', value: activity.DateTime },
      { name: 'Prompt', value: activity.Prompt },
      { name: 'SubscriptionTier', value: activity.SubscriptionTier },
      { name: 'UserId', value: activity.UserId }
    ]
  };

  try {
    await datastore.save(entity);
  } catch (error) {
    console.error('Error saving activity', error);
    return 'Error: ' + error;
  }

  await datastore.save(entity);
  console.log(`Saved ${kind}: ${taskKey.id}`);
  return taskKey.id;
}
