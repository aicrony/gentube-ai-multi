import { Datastore } from '@google-cloud/datastore';
import { google_app_creds } from '@/interfaces/googleCredentials';

require('dotenv').config();

const datastore = new Datastore({
  projectId: google_app_creds.projectId,
  credentials: google_app_creds
});

const USER_ACTIVITY_KIND = 'UserActivity';
const NAMESPACE = 'GenTube';

export interface UserActivity {
  id?: string; // Datastore entity ID
  CreatedAssetUrl: string;
  Prompt: string;
  AssetSource: string;
  AssetType?: string | string[] | undefined;
  DateTime: Date;
  UserId?: string | null;
  CreatorName?: string | null;
  SubscriptionTier?: number;
  order?: number; // New field for explicit ordering
}

/**
 * Efficiently fetches multiple user activities by their IDs
 * @param activityIds Array of activity IDs to fetch
 * @returns Array of UserActivity objects
 */
export async function getUserActivityByIds(
  activityIds: string[]
): Promise<UserActivity[]> {
  if (!activityIds || activityIds.length === 0) {
    console.log('No activity IDs provided');
    return [];
  }

  try {
    console.log(`Fetching ${activityIds.length} activities by ID:`, activityIds);
    
    // Create keys for each activity ID
    const keys = activityIds.map(id => {
      // Handle numeric vs string IDs
      const idValue = /^\d+$/.test(id) ? datastore.int(Number(id)) : id;
      const key = datastore.key({
        namespace: NAMESPACE,
        path: [USER_ACTIVITY_KIND, idValue]
      });
      console.log(`Created key for ID ${id}:`, key);
      return key;
    });

    // Fetch all activities in a single batch
    const [results] = await datastore.get(keys);
    
    console.log(`Retrieved ${results.length} results from datastore`);
    
    // For debugging, log the first result if available
    if (results.length > 0) {
      const firstResult = { ...results[0] };
      if (firstResult[datastore.KEY]) {
        // Extract key info for logging
        const keyInfo = {
          id: firstResult[datastore.KEY].id,
          name: firstResult[datastore.KEY].name,
          kind: firstResult[datastore.KEY].kind,
          path: firstResult[datastore.KEY].path
        };
        firstResult._key = keyInfo; // Add a safe-to-log version of the key
      }
      delete firstResult[datastore.KEY]; // Remove non-serializable field for logging
      console.log('First result:', JSON.stringify(firstResult, null, 2));
    }

    // Process results, handling any missing or null entries
    const activities: UserActivity[] = [];
    
    // Create a map to associate each result with its corresponding ID
    // This ensures we maintain the correct relationship between results and IDs
    results.forEach((activity: any, index: number) => {
      if (activity === null || activity === undefined) {
        console.log(`Activity at index ${index} is null or undefined`);
        return; // Skip this item
      }
      
      // Get the key from the activity
      const key = activity[datastore.KEY];
      const keyId = key.id?.toString();
      console.log(`Processing result at index ${index}, key ID: ${keyId}`);
      
      // Verify we have an ID
      if (!keyId) {
        console.log(`Missing key ID for result at index ${index}:`, key);
        return; // Skip items without proper IDs
      }
      
      // Provide fallbacks for potentially missing fields
      let prompt = activity.Prompt;
      if (!prompt && activity.description) {
        prompt = activity.description;
      } else if (!prompt) {
        prompt = '';
      }

      // Build the user activity object with the correct ID
      activities.push({
        id: keyId,
        CreatedAssetUrl: activity.CreatedAssetUrl || '',
        Prompt: prompt,
        AssetSource: activity.AssetSource || '',
        AssetType: activity.AssetType || 'unknown',
        DateTime: activity.DateTime || new Date(),
        UserId: activity.UserId || null,
        CreatorName: activity.CreatorName || null,
        SubscriptionTier: activity.SubscriptionTier || null,
        order: activity.order !== undefined ? activity.order : null // Include the order field if it exists
      });
    });

    console.log(`Successfully fetched ${activities.length} of ${activityIds.length} requested activities`);
    return activities;
  } catch (error) {
    console.error('Error fetching activities by ID:', error);
    return [];
  }
}

/**
 * Fetches a single user activity by ID
 * @param activityId ID of the activity to fetch
 * @returns UserActivity object or null if not found
 */
export async function getUserActivityById(
  activityId: string
): Promise<UserActivity | null> {
  if (!activityId) {
    console.log('No activity ID provided');
    return null;
  }

  try {
    const activities = await getUserActivityByIds([activityId]);
    return activities.length > 0 ? activities[0] : null;
  } catch (error) {
    console.error(`Error fetching activity with ID ${activityId}:`, error);
    return null;
  }
}