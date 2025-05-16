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
  id?: string;          // Datastore entity ID
  CreatedAssetUrl: string;
  Prompt: string;
  AssetSource: string;
  AssetType?: string | string[] | undefined;
  DateTime: Date;
  UserId?: string | null; // Added for creator info
  CreatorName?: string | null; // Added for creator display
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
    id: activity[datastore.KEY].name || activity[datastore.KEY].id, // Include entity ID
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
    id: activity[datastore.KEY].name || activity[datastore.KEY].id, // Include entity ID
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
  
  // Log the raw results to debug missing prompts
  console.log(`Found ${results.length} gallery assets`);
  if (results.length > 0) {
    console.log('First gallery asset raw data:', JSON.stringify(results[0]));
  }
  
  // Get all unique user IDs from the results to fetch creator names in one batch
  const userIds = results
    .map((activity: any) => activity.UserId)
    .filter((userId: string | undefined) => userId && userId !== 'none');
  
  console.log('Gallery asset user IDs extracted:', userIds);
  
  // Fetch creator names for all user IDs
  let creatorNames: {[key: string]: string} = {};
  try {
    // Dynamically import to avoid circular dependency
    const { getCreatorNames } = await import('./getUserCreator');
    if (userIds.length > 0) {
      // Unique user IDs to avoid duplicates
      const uniqueUserIds = [...new Set(userIds)];
      console.log('Fetching creator names for unique user IDs:', uniqueUserIds);
      creatorNames = await getCreatorNames(uniqueUserIds);
      console.log('Creator names fetched:', creatorNames);
    }
  } catch (error) {
    console.error('Error fetching creator names:', error);
  }
  
  return results.map((activity: any) => {
    // Provide fallbacks for missing data
    let prompt = activity.Prompt;
    if (!prompt && activity.description) {
      prompt = activity.description;
    } else if (!prompt) {
      prompt = '';
    }
    
    // Get creator name if available
    let creatorName = null;
    if (activity.UserId && creatorNames[activity.UserId]) {
      creatorName = creatorNames[activity.UserId];
      console.log(`Found creator name for ${activity.UserId}: ${creatorName}`);
    } else if (activity.UserId) {
      console.log(`No creator name found for user ID: ${activity.UserId}`);
    } else {
      console.log('No user ID associated with this activity');
    }
    
    return {
      id: activity[datastore.KEY].name || activity[datastore.KEY].id, // Include entity ID
      CreatedAssetUrl: activity.CreatedAssetUrl || '',
      Prompt: prompt,
      AssetSource: activity.AssetSource || '',
      AssetType: activity.AssetType || 'unknown',
      DateTime: activity.DateTime,
      UserId: activity.UserId || null,
      CreatorName: creatorName
    };
  });
}
