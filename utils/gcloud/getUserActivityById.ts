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
    console.log(`Fetching ${activityIds.length} activities by ID`);
    
    // Create keys for each activity ID
    const keys = activityIds.map(id => {
      // Handle numeric vs string IDs
      const idValue = /^\d+$/.test(id) ? datastore.int(Number(id)) : id;
      return datastore.key({
        namespace: NAMESPACE,
        path: [USER_ACTIVITY_KIND, idValue]
      });
    });

    // Fetch all activities in a single batch
    const [results] = await datastore.get(keys);

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
        SubscriptionTier: activity.SubscriptionTier || null
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