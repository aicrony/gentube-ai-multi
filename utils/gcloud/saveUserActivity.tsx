import { Datastore } from '@google-cloud/datastore';
import { GcloudUserActivity } from '@/interfaces/gcloudUserActivity';
import { google_app_creds } from '@/interfaces/googleCredentials';
import { localIpConfig, normalizeIp } from '@/utils/ipUtils';
require('dotenv').config();

const datastore = new Datastore({
  projectId: google_app_creds.projectId,
  credentials: google_app_creds
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

  console.log('Activity: ', activity);
  const normalizedIpAddress = localIpConfig(activity.UserIp);

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
      {
        name: 'CreatedAssetUrl',
        value: activity.CreatedAssetUrl.error
          ? activity.CreatedAssetUrl.error
          : activity.CreatedAssetUrl
      },
      { name: 'DateTime', value: activity.DateTime },
      { name: 'Prompt', value: activity.Prompt },
      { name: 'SubscriptionTier', value: activity.SubscriptionTier },
      { name: 'UserId', value: activity.UserId },
      { name: 'UserIp', value: normalizedIpAddress } // Add this line
    ]
  };

  try {
    await datastore.save(entity);
    console.log(`Saved ${kind}: ${taskKey.id}`);
    return taskKey.id;
  } catch (error) {
    console.error('Error saving activity', error);
    return 'Error saving activity, check prompt log.';
  }
}
