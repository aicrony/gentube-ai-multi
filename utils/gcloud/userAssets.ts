import { Datastore } from '@google-cloud/datastore';
import { google_app_creds } from '@/interfaces/googleCredentials';
import { localIpConfig } from '@/utils/ipUtils';

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
  // if (!userId || userId.length === 0) {
  //   console.log('Invalid userId');
  //   return null;
  // }

  let query;
  const normalizedIpAddress = localIpConfig(userIp);

  if (userId && userId !== 'none') {
    console.log('Query UA1');
    query = datastore
      .createQuery(NAMESPACE, USER_ACTIVITY_KIND)
      .filter('UserId', '=', userId)
      .limit(limit)
      .offset(offset)
      .order('DateTime', { descending: true });
  } else if (userIp && userIp.length > 4) {
    console.log('Query UA2');
    query = datastore
      .createQuery(NAMESPACE, USER_ACTIVITY_KIND)
      .filter('UserIp', '=', normalizedIpAddress)
      .limit(limit)
      .offset(offset)
      .order('DateTime', { descending: true });
  } else {
    console.log('Query UA3');
    query = datastore
      .createQuery(NAMESPACE, USER_ACTIVITY_KIND)
      .filter('UserId', '=', userId)
      .filter('UserIp', '=', normalizedIpAddress)
      .limit(limit)
      .offset(offset)
      .order('DateTime', { descending: true });
  }

  // Handle multiple asset types (comma-separated)
  if (assetType && assetType.length > 0) {
    if (assetType.includes(',')) {
      // For multiple asset types, use an 'IN' filter
      const assetTypes = (
        typeof assetType === 'string' ? assetType.split(',') : assetType
      ).map((type: string) => type.trim());
      query = query.filter('AssetType', 'IN', assetTypes);
    } else {
      // For a single asset type, use the '=' filter
      query = query.filter('AssetType', '=', assetType);
    }
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

  // Handle multiple asset types (comma-separated)
  if (assetType && assetType.length > 0) {
    if (assetType.includes(',')) {
      // For multiple asset types, use an 'IN' filter
      const assetTypes = (
        typeof assetType === 'string' ? assetType.split(',') : assetType
      ).map((type: string) => type.trim());
      query = query.filter('AssetType', 'IN', assetTypes);
    } else {
      // For a single asset type, use the '=' filter
      query = query.filter('AssetType', '=', assetType);
    }
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

  // Handle multiple asset types (comma-separated)
  if (assetType && assetType.length > 0) {
    if (assetType.includes(',')) {
      // For multiple asset types, use an 'IN' filter
      const assetTypes = (
        typeof assetType === 'string' ? assetType.split(',') : assetType
      ).map((type: string) => type.trim());
      query = query.filter('AssetType', 'IN', assetTypes);
    } else {
      // For a single asset type, use the '=' filter
      query = query.filter('AssetType', '=', assetType);
    }
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
