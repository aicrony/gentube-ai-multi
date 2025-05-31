import { Datastore } from '@google-cloud/datastore';
import { google_app_creds } from '@/interfaces/googleCredentials';
import { GcloudUserActivity } from '@/interfaces/gcloudUserActivity';
require('dotenv').config();

const datastore = new Datastore({
  projectId: google_app_creds.projectId,
  credentials: google_app_creds
});

const kind = 'UserActivity';
const namespace = 'GenTube';

export async function getLatestActivityByRequestId(
  requestId: string | string[]
): Promise<GcloudUserActivity | null> {
  const query = datastore
    .createQuery(namespace, kind)
    .filter('CreatedAssetUrl', '=', requestId)
    .filter('AssetType', '=', 'que') // Only look for queued records
    .limit(1);

  const [activities] = await datastore.runQuery(query);
  console.log('Request found: ', activities.length > 0 ? activities[0] : null);

  if (activities.length > 0) {
    const activity = activities[0];
    activity.id = activity[datastore.KEY].id;
    return activity;
  }

  return null;
}
