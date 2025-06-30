import { Datastore } from '@google-cloud/datastore';
import { google_app_creds } from '@/interfaces/googleCredentials';

const datastore = new Datastore({
  projectId: google_app_creds.projectId,
  credentials: google_app_creds
});

const USER_ACTIVITY_KIND = 'UserActivity';
const NAMESPACE = 'GenTube';

interface UserActivity {
  id?: string;
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
 * Fetches a UserActivity by its ID
 * @param id The ID of the UserActivity to fetch
 * @returns The UserActivity object or null if not found
 */
export async function getUserActivityById(id: string): Promise<UserActivity | null> {
  try {
    // Create a key for the UserActivity with the provided ID
    const key = datastore.key({
      namespace: NAMESPACE,
      path: [USER_ACTIVITY_KIND, id]
    });

    // Get the entity from Datastore
    const [entity] = await datastore.get(key);
    
    // If no entity was found, return null
    if (!entity) {
      console.log(`No UserActivity found with ID: ${id}`);
      return null;
    }

    // Get creator name if available
    let creatorName: string | null = null;
    if (entity.UserId) {
      try {
        // Dynamically import to avoid circular dependency
        const { getCreatorName } = await import('./getUserCreator');
        creatorName = await getCreatorName(entity.UserId);
      } catch (error) {
        console.error('Error fetching creator name:', error);
      }
    }

    // Map the entity to the UserActivity interface
    const activity: UserActivity = {
      id: id,
      CreatedAssetUrl: entity.CreatedAssetUrl || '',
      Prompt: entity.Prompt || entity.description || '',
      AssetSource: entity.AssetSource || '',
      AssetType: entity.AssetType || 'unknown',
      DateTime: entity.DateTime,
      UserId: entity.UserId || null,
      CreatorName: creatorName,
      SubscriptionTier: entity.SubscriptionTier || 0
    };

    return activity;
  } catch (error) {
    console.error(`Error fetching UserActivity with ID ${id}:`, error);
    return null;
  }
}