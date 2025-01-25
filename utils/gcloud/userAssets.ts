import { Datastore } from '@google-cloud/datastore';
import { google_app_creds } from '@/interfaces/googleCredentials';

require('dotenv').config();

const datastore = new Datastore({
  projectId: google_app_creds.project_id,
  credentials: google_app_creds
});

const USER_ACTIVITY_KIND = 'UserActivity';
const NAMESPACE = 'GenTube';

interface UserActivity {
  CreatedAssetUrl: string;
  Prompt: string;
  AssetSource: string;
  AssetType: string;
}

export async function getUserAssets(
  userId: string | string[] | undefined,
  limit: number,
  offset: number
): Promise<UserActivity[] | null> {
  if (!userId || userId.length === 0) {
    console.log('Invalid userId');
    return null;
  }

  const query = datastore
    .createQuery(NAMESPACE, USER_ACTIVITY_KIND)
    .filter('UserId', '=', userId)
    .limit(limit)
    .offset(offset);

  const [results] = await datastore.runQuery(query);
  return results.map((activity: any) => ({
    CreatedAssetUrl: activity.CreatedAssetUrl,
    Prompt: activity.Prompt,
    AssetSource: activity.AssetSource,
    AssetType: activity.AssetType
  }));
}
