import { Datastore, PropertyFilter } from '@google-cloud/datastore';
import { google_app_creds } from '@/interfaces/googleCredentials';
import { localIpConfig } from '@/utils/ipUtils';

require('dotenv').config();

/**
 * Helper function to migrate activities without order values
 * This assigns order values based on DateTime sorting and updates the database
 * @export This function is exported so it can be used by groupManager.ts
 */
export async function migrateActivityOrderValues(activities: UserActivity[]): Promise<UserActivity[]> {
  const hasActivitiesWithoutOrder = activities.some(activity => activity.order === undefined);
  
  if (!hasActivitiesWithoutOrder || activities.length === 0) {
    return activities;
  }
  
  console.log('Some assets missing order values, initiating migration');
  
  // Sort by DateTime first to establish the initial order
  // NOTE: We first sort by DateTime in descending order (newest first)
  // but then assign order values in ASCENDING order (lower values come first)
  // This creates a consistent behavior with drag-n-drop where visually ordered items
  // from top to bottom get order values from low to high (e.g., 0, 10, 20...)
  activities.sort((a, b) => {
    const dateA = a.DateTime ? new Date(a.DateTime).getTime() : 0;
    const dateB = b.DateTime ? new Date(b.DateTime).getTime() : 0;
    return dateB - dateA; // Newest first (descending)
  });
  
  // Assign order values with 10-unit spacing
  // IMPORTANT: We're assigning LOWER values to items that should appear FIRST in the UI
  // This means the first item in the array gets the lowest order value (0)
  const orderInterval = 10;
  const transaction = datastore.transaction();
  
  try {
    // Start transaction to update all assets
    await transaction.run();
    
    const updates: any[] = [];
    
    // For each activity without an order value, assign one and prepare update
    activities.forEach((activity, index) => {
      if (activity.order === undefined && activity.id) {
        // Set the new order value based on current position (after DateTime sort)
        // Lower order values (0, 10, 20) appear first in the UI when sorted by order
        const newOrder = index * orderInterval;
        
        // Update the local object
        activity.order = newOrder;
        
        // Prepare transaction update
        const key = datastore.key({
          namespace: NAMESPACE,
          path: [USER_ACTIVITY_KIND, datastore.int(Number(activity.id))]
        });
        
        updates.push(transaction.get(key).then(([existingAsset]) => {
          if (existingAsset) {
            existingAsset.order = newOrder;
            transaction.save({
              key,
              data: existingAsset
            });
            console.log(`Assigned order ${newOrder} to asset ${activity.id}`);
          }
        }));
      }
    });
    
    // Wait for all updates to be prepared
    await Promise.all(updates);
    
    // Commit the transaction if we have updates
    if (updates.length > 0) {
      await transaction.commit();
      console.log(`Migration complete: Updated order for ${updates.length} assets`);
    } else {
      await transaction.rollback();
    }
  } catch (error) {
    console.error('Error migrating order values:', error);
    await transaction.rollback();
    // Continue with existing activities even if migration fails
  }
  
  return activities;
}

const datastore = new Datastore({
  projectId: google_app_creds.projectId,
  credentials: google_app_creds
});

const USER_ACTIVITY_KIND = 'UserActivity';
const NAMESPACE = 'GenTube';

interface UserActivity {
  id?: string; // Datastore entity ID
  CreatedAssetUrl: string;
  Prompt: string;
  AssetSource: string;
  AssetType?: string | string[] | undefined;
  DateTime: Date;
  UserId?: string | null; // Added for creator info
  CreatorName?: string | null; // Added for creator display
  SubscriptionTier?: number; // Added for gallery status
  order?: number; // Added for explicit ordering
}

export async function getUserAssets(
  userId: string | string[] | undefined,
  userIp: string | string[],
  limit: number,
  offset: number,
  assetType?: string | string[] | undefined,
  migrateOrderValues: boolean = true // Add parameter to control order migration
): Promise<UserActivity[] | null> {
  // if (!userId || userId.length === 0) {
  //   console.log('Invalid userId');
  //   return null;
  // }

  let query;
  const normalizedIpAddress = localIpConfig(userIp);
  const isValidIp = userIp && userIp.length > 4 && userIp !== 'unknown';
  const isValidUserId = userId && userId !== 'none';

  // Log the query parameters to help with debugging
  console.log('getUserAssets query params:', { isValidUserId, isValidIp, userId, normalizedIpAddress });

  // Primary case: Valid userId - Use this even if IP is unknown
  if (isValidUserId) {
    console.log('Query UA1: Filtering by userId');
    // First sort by order field (ascending - lower values first), then by DateTime (descending)
    query = datastore
      .createQuery(NAMESPACE, USER_ACTIVITY_KIND)
      .filter(new PropertyFilter('UserId', '=', userId))
      .limit(limit)
      .offset(offset)
      .order('order') // Primary sort by order field (ascending by default)
      .order('DateTime', { descending: true }); // Secondary sort by DateTime when order is same/missing
  } 
  // Secondary case: Only valid IP, no userId
  else if (isValidIp) {
    console.log('Query UA2: Filtering by userIp');
    // First sort by order field (ascending - lower values first), then by DateTime (descending)
    query = datastore
      .createQuery(NAMESPACE, USER_ACTIVITY_KIND)
      .filter(new PropertyFilter('UserIp', '=', normalizedIpAddress))
      .limit(limit)
      .offset(offset)
      .order('order') // Primary sort by order field (ascending by default)
      .order('DateTime', { descending: true }); // Secondary sort by DateTime when order is same/missing
  } 
  // Fallback case: No valid userId or IP - use both (will likely return no results)
  else {
    console.log('Query UA3: Fallback with both filters');
    // First sort by order field (ascending - lower values first), then by DateTime (descending)
    query = datastore
      .createQuery(NAMESPACE, USER_ACTIVITY_KIND)
      .filter(new PropertyFilter('UserId', '=', userId))
      .filter(new PropertyFilter('UserIp', '=', normalizedIpAddress))
      .limit(limit)
      .offset(offset)
      .order('order') // Primary sort by order field (ascending by default)
      .order('DateTime', { descending: true }); // Secondary sort by DateTime when order is same/missing
  }

  // Handle multiple asset types (comma-separated)
  if (assetType && assetType.length > 0) {
    if (assetType.includes(',')) {
      // For multiple asset types, use an 'IN' filter
      const assetTypes = (
        typeof assetType === 'string' ? assetType.split(',') : assetType
      ).map((type: string) => type.trim());
      query = query.filter(new PropertyFilter('AssetType', 'IN', assetTypes));
    } else {
      // For a single asset type, use the '=' filter
      query = query.filter(new PropertyFilter('AssetType', '=', assetType));
    }
  } else {
    // When no specific asset type is requested (All Assets), exclude 'processed' items
    // by filtering for common asset types to ensure we get actual displayable assets
    const displayableTypes = ['img', 'vid', 'upl', 'que', 'err'];
    query = query.filter(new PropertyFilter('AssetType', 'IN', displayableTypes));
  }

  const [results] = await datastore.runQuery(query);
  
  // Create properly mapped activities
  let mappedActivities = results.map((activity: any) => ({
    id: String(activity[datastore.KEY].name || activity[datastore.KEY].id), // Include entity ID as string
    CreatedAssetUrl: activity.CreatedAssetUrl,
    Prompt: activity.Prompt,
    AssetSource: activity.AssetSource,
    AssetType: activity.AssetType,
    DateTime: activity.DateTime,
    SubscriptionTier: activity.SubscriptionTier,
    order: activity.order
  }));
  
  // Migrate order values if needed
  if (migrateOrderValues) {
    mappedActivities = await migrateActivityOrderValues(mappedActivities);
  }
  
  return mappedActivities;
}

export async function getPublicAssets(
  limit: number,
  offset: number,
  assetType?: string | string[] | undefined,
  migrateOrderValues: boolean = true
): Promise<UserActivity[] | null> {
  // First sort by order field (ascending - lower values first), then by DateTime (descending)
  let query = datastore
    .createQuery(NAMESPACE, USER_ACTIVITY_KIND)
    .filter(new PropertyFilter('UserId', '=', 'none'))
    .limit(limit)
    .offset(offset)
    .order('order') // Primary sort by order field (ascending by default)
    .order('DateTime', { descending: true }); // Secondary sort by DateTime when order is same/missing

  // Handle multiple asset types (comma-separated)
  if (assetType && assetType.length > 0) {
    if (assetType.includes(',')) {
      // For multiple asset types, use an 'IN' filter
      const assetTypes = (
        typeof assetType === 'string' ? assetType.split(',') : assetType
      ).map((type: string) => type.trim());
      query = query.filter(new PropertyFilter('AssetType', 'IN', assetTypes));
    } else {
      // For a single asset type, use the '=' filter
      query = query.filter(new PropertyFilter('AssetType', '=', assetType));
    }
  }

  const [results] = await datastore.runQuery(query);
  
  // Create properly mapped activities
  let mappedActivities = results.map((activity: any) => ({
    id: String(activity[datastore.KEY].name || activity[datastore.KEY].id), // Include entity ID as string
    CreatedAssetUrl: activity.CreatedAssetUrl,
    Prompt: activity.Prompt,
    AssetSource: activity.AssetSource,
    AssetType: activity.AssetType,
    DateTime: activity.DateTime,
    SubscriptionTier: activity.SubscriptionTier,
    order: activity.order
  }));
  
  // Migrate order values if needed
  if (migrateOrderValues) {
    mappedActivities = await migrateActivityOrderValues(mappedActivities);
  }
  
  return mappedActivities;
}

export async function getGalleryAssets(
  limit: number,
  offset: number,
  assetType?: string | string[] | undefined,
  migrateOrderValues: boolean = true
): Promise<UserActivity[] | null> {
  // First sort by order field (ascending - lower values first), then by DateTime (descending)
  let query = datastore
    .createQuery(NAMESPACE, USER_ACTIVITY_KIND)
    .filter(new PropertyFilter('SubscriptionTier', '=', 3))
    .limit(limit)
    .offset(offset)
    .order('order') // Primary sort by order field (ascending by default)
    .order('DateTime', { descending: true }); // Secondary sort by DateTime when order is same/missing

  // Handle multiple asset types (comma-separated)
  if (assetType && assetType.length > 0) {
    if (assetType.includes(',')) {
      // For multiple asset types, use an 'IN' filter
      const assetTypes = (
        typeof assetType === 'string' ? assetType.split(',') : assetType
      ).map((type: string) => type.trim());
      query = query.filter(new PropertyFilter('AssetType', 'IN', assetTypes));
    } else {
      // For a single asset type, use the '=' filter
      query = query.filter(new PropertyFilter('AssetType', '=', assetType));
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
  let creatorNames: { [key: string]: string } = {};
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

  // Create properly mapped activities with creator names
  let mappedActivities = results.map((activity: any) => {
    // Provide fallbacks for missing data
    let prompt = activity.Prompt;
    if (!prompt && activity.description) {
      prompt = activity.description;
    } else if (!prompt) {
      prompt = '';
    }

    // Get creator name if available
    let creatorName: string | null = null;
    if (activity.UserId && creatorNames[activity.UserId]) {
      creatorName = creatorNames[activity.UserId];
      console.log(`Found creator name for ${activity.UserId}: ${creatorName}`);
    } else if (activity.UserId) {
      console.log(`No creator name found for user ID: ${activity.UserId}`);
    } else {
      console.log('No user ID associated with this activity');
    }

    return {
      id: String(activity[datastore.KEY].name || activity[datastore.KEY].id), // Include entity ID as string
      CreatedAssetUrl: activity.CreatedAssetUrl || '',
      Prompt: prompt,
      AssetSource: activity.AssetSource || '',
      AssetType: activity.AssetType || 'unknown',
      DateTime: activity.DateTime,
      UserId: activity.UserId || null,
      CreatorName: creatorName,
      SubscriptionTier: activity.SubscriptionTier || 3, // Default to 3 for gallery assets
      order: activity.order
    };
  });
  
  // Migrate order values if needed
  if (migrateOrderValues) {
    mappedActivities = await migrateActivityOrderValues(mappedActivities);
  }
  
  return mappedActivities;
}

export async function getAllAssets(
  limit: number,
  offset: number,
  assetType?: string | string[] | undefined,
  migrateOrderValues: boolean = true
): Promise<UserActivity[] | null> {
  // Admin function to get ALL assets from UserActivity, not filtered by SubscriptionTier
  // First sort by order field (ascending - lower values first), then by DateTime (descending)
  let query = datastore
    .createQuery(NAMESPACE, USER_ACTIVITY_KIND)
    .limit(limit)
    .offset(offset)
    .order('order') // Primary sort by order field (ascending by default)
    .order('DateTime', { descending: true }); // Secondary sort by DateTime when order is same/missing

  // Handle multiple asset types (comma-separated)
  if (assetType && assetType.length > 0) {
    if (assetType.includes(',')) {
      // For multiple asset types, use an 'IN' filter
      const assetTypes = (
        typeof assetType === 'string' ? assetType.split(',') : assetType
      ).map((type: string) => type.trim());
      query = query.filter(new PropertyFilter('AssetType', 'IN', assetTypes));
    } else {
      // For a single asset type, use the '=' filter
      query = query.filter(new PropertyFilter('AssetType', '=', assetType));
    }
  }

  const [results] = await datastore.runQuery(query);

  // Log the raw results to debug
  console.log(`Found ${results.length} total assets for admin`);
  if (results.length > 0) {
    console.log('First admin asset raw data:', JSON.stringify(results[0]));
  }

  // Get all unique user IDs from the results to fetch creator names in one batch
  const userIds = results
    .map((activity: any) => activity.UserId)
    .filter((userId: string | undefined) => userId && userId !== 'none');

  console.log('Admin asset user IDs extracted:', userIds);

  // Fetch creator names for all user IDs
  let creatorNames: { [key: string]: string } = {};
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

  // Create properly mapped activities with creator names
  let mappedActivities = results.map((activity: any) => {
    // Provide fallbacks for missing data
    let prompt = activity.Prompt;
    if (!prompt && activity.description) {
      prompt = activity.description;
    } else if (!prompt) {
      prompt = '';
    }

    // Get creator name if available
    let creatorName: string | null = null;
    if (activity.UserId && creatorNames[activity.UserId]) {
      creatorName = creatorNames[activity.UserId];
      console.log(`Found creator name for ${activity.UserId}: ${creatorName}`);
    } else if (activity.UserId) {
      console.log(`No creator name found for user ID: ${activity.UserId}`);
    } else {
      console.log('No user ID associated with this activity');
    }

    return {
      id: String(activity[datastore.KEY].name || activity[datastore.KEY].id), // Include entity ID as string
      CreatedAssetUrl: activity.CreatedAssetUrl || '',
      Prompt: prompt,
      AssetSource: activity.AssetSource || '',
      AssetType: activity.AssetType || 'unknown',
      DateTime: activity.DateTime,
      UserId: activity.UserId || null,
      CreatorName: creatorName,
      SubscriptionTier: activity.SubscriptionTier || null, // Keep original SubscriptionTier value
      order: activity.order
    };
  });
  
  // Migrate order values if needed
  if (migrateOrderValues) {
    mappedActivities = await migrateActivityOrderValues(mappedActivities);
  }
  
  return mappedActivities;
}
