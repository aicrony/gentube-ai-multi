import { Datastore } from '@google-cloud/datastore';
import { google_app_creds } from '@/interfaces/googleCredentials';
import { localIpConfig, normalizeIp } from '@/utils/ipUtils';

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
}

export async function getUserAssets(
  userId: string | string[] | undefined,
  userIp: string | string[],
  limit: number,
  offset: number,
  assetType?: string | string[] | undefined
): Promise<UserActivity[] | null> {
  if (!userId || userId.length === 0) {
    console.log('Invalid userId');
    return null;
  }

  let query;
  const normalizedIpAddress = normalizeIp(localIpConfig(userIp));

  if (userId && userId !== 'none') {
    query = datastore
      .createQuery(NAMESPACE, USER_ACTIVITY_KIND)
      .filter('UserId', '=', userId)
      .limit(limit)
      .offset(offset)
      .order('DateTime', { descending: true });
  } else if (userIp && userIp.length > 4) {
    query = datastore
      .createQuery(NAMESPACE, USER_ACTIVITY_KIND)
      .filter('UserIp', '=', normalizedIpAddress)
      .limit(limit)
      .offset(offset)
      .order('DateTime', { descending: true });
  } else {
    query = datastore
      .createQuery(NAMESPACE, USER_ACTIVITY_KIND)
      .filter('UserId', '=', userId)
      .filter('UserIp', '=', normalizedIpAddress)
      .limit(limit)
      .offset(offset)
      .order('DateTime', { descending: true });
  }

  if (assetType && assetType.length > 0) {
    query = query.filter('AssetType', '=', assetType);
  }

  const [results] = await datastore.runQuery(query);
  return results.map((activity: any) => ({
    CreatedAssetUrl: activity.CreatedAssetUrl,
    Prompt: activity.Prompt,
    AssetSource: activity.AssetSource,
    AssetType: activity.AssetType,
    DateTime: activity.DateTime
  }));
}

export async function getPublicAssets(
  limit: number,
  offset: number,
  assetType?: string | string[] | undefined
): Promise<UserActivity[] | null> {
  let query = datastore
    .createQuery(NAMESPACE, USER_ACTIVITY_KIND)
    .filter('UserId', '=', 'none')
    .limit(limit)
    .offset(offset)
    .order('DateTime', { descending: true });

  if (assetType && assetType.length > 0) {
    query = query.filter('AssetType', '=', assetType);
  }

  const [results] = await datastore.runQuery(query);
  return results.map((activity: any) => ({
    CreatedAssetUrl: activity.CreatedAssetUrl,
    Prompt: activity.Prompt,
    AssetSource: activity.AssetSource,
    AssetType: activity.AssetType,
    DateTime: activity.DateTime
  }));
}

export async function getGalleryAssets(
  limit: number,
  offset: number,
  assetType?: string | string[] | undefined
): Promise<UserActivity[] | null> {
  let query = datastore
    .createQuery(NAMESPACE, USER_ACTIVITY_KIND)
    .filter('SubscriptionTier', '=', 3)
    .limit(limit)
    .offset(offset)
    .order('DateTime', { descending: true });

  if (assetType && assetType.length > 0) {
    query = query.filter('AssetType', '=', assetType);
  }

  const [results] = await datastore.runQuery(query);
  return results.map((activity: any) => ({
    CreatedAssetUrl: activity.CreatedAssetUrl,
    Prompt: activity.Prompt,
    AssetSource: activity.AssetSource,
    AssetType: activity.AssetType,
    DateTime: activity.DateTime
  }));
}
