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

export async function getLatestActivityByIp(
  userIp: string | string[],
  assetType: string | string[]
): Promise<GcloudUserActivity | null> {
  const query = datastore
    .createQuery(namespace, kind)
    .filter('UserId', '=', userIp)
    .order('DateTime', { descending: true })
    .limit(1);

  const [activities] = await datastore.runQuery(query);
  console.log('Last Activity: ', activities.length > 0 ? activities[0] : null);
  return activities.length > 0 ? activities[0] : null;
}
