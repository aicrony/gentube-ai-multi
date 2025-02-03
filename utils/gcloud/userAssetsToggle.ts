import { Datastore } from '@google-cloud/datastore';
import { google_app_creds } from '@/interfaces/googleCredentials';

require('dotenv').config();

const datastore = new Datastore({
  projectId: google_app_creds.projectId,
  credentials: google_app_creds
});

const USER_ACTIVITY_KIND = 'UserActivity';
const NAMESPACE = 'GenTube';

interface UserActivity {
  CreatedAssetUrl: string;
  Prompt: string;
  AssetSource: string;
  AssetType?: string | string[] | undefined;
  DateTime: Date;
  SubscriptionTier?: number | undefined;
}

export async function getUserAssetsToggle(
  userId: string | string[] | undefined,
  limit: number,
  offset: number,
  assetType?: string | string[] | undefined,
  subscriptionTier?: number | undefined
): Promise<UserActivity[] | null> {
  if (!userId || userId.length === 0) {
    console.log('Invalid userId');
    return null;
  }

  let query = datastore
    .createQuery(NAMESPACE, USER_ACTIVITY_KIND)
    .filter('UserId', '=', userId || 'none')
    .limit(limit)
    .offset(offset)
    .order('DateTime', { descending: true });

  if (subscriptionTier && subscriptionTier >= 0) {
    query = query.filter('SubscriptionTier', '=', Number(subscriptionTier));
  }
  console.log('subscriptionTier:', subscriptionTier);

  if (assetType && assetType.length > 0) {
    query = query.filter('AssetType', '=', assetType);
  }

  const [results] = await datastore.runQuery(query);
  return results.map((activity: any) => ({
    CreatedAssetUrl: activity.CreatedAssetUrl,
    Prompt: activity.Prompt,
    AssetSource: activity.AssetSource,
    AssetType: activity.AssetType,
    DateTime: activity.DateTime,
    SubscriptionTier: activity.SubscriptionTier
  }));
}
