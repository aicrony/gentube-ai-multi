import { Datastore } from '@google-cloud/datastore';
import { google_app_creds } from '@/interfaces/googleCredentials';

require('dotenv').config();

const datastore = new Datastore({
  projectId: google_app_creds.projectId,
  credentials: google_app_creds
});

const USER_ACTIVITY_KIND = 'UserActivity';
const NAMESPACE = 'GenTube';

/**
 * Find a user activity by ID, trying multiple approaches
 */
async function findUserActivity(assetId: string) {
  // First try: query by modified timestamp (most reliable way to find assets)
  try {
    // Get the most recent assets first
    const query = datastore
      .createQuery(NAMESPACE, USER_ACTIVITY_KIND)
      .order('DateTime', { descending: true })
      .limit(100);

    console.log('Querying recent assets to find match for:', assetId);
    const [entities] = await datastore.runQuery(query);

    console.log(`Found ${entities.length} entities to scan`);

    // Loop through entities to find one with matching key ID
    for (const entity of entities) {
      const entityKey = entity[datastore.KEY];
      const keyId = entityKey.id || entityKey.name;

      // Check different formats of ID to match
      if (
        String(keyId) === String(assetId) ||
        keyId === Number(assetId) ||
        keyId === assetId
      ) {
        console.log(
          `Found matching entity by scanning: Key ID ${keyId} matches ${assetId}`
        );
        return { entity, key: entityKey };
      }
    }

    console.log(`No matching entity found in scan for ID: ${assetId}`);
  } catch (error) {
    console.error('Error scanning entities:', error);
  }

  // Second try: direct get with numeric ID
  try {
    const numericId = Number(assetId);
    if (!isNaN(numericId)) {
      const key = datastore.key({
        namespace: NAMESPACE,
        path: [USER_ACTIVITY_KIND, numericId]
      });

      console.log('Trying numeric ID lookup:', key);
      const [entity] = await datastore.get(key);

      if (entity) {
        console.log('Found entity using numeric ID');
        return { entity, key };
      }
    }
  } catch (error) {
    console.error('Error in numeric ID lookup:', error);
  }

  // Second try: direct get with string ID
  try {
    const key = datastore.key({
      namespace: NAMESPACE,
      path: [USER_ACTIVITY_KIND, assetId]
    });

    console.log('Trying string ID lookup:', key);
    const [entity] = await datastore.get(key);

    if (entity) {
      console.log('Found entity using string ID');
      return { entity, key };
    }
  } catch (error) {
    console.error('Error in string ID lookup:', error);
  }

  // Third try: query by "id" field
  try {
    const query = datastore
      .createQuery(NAMESPACE, USER_ACTIVITY_KIND)
      .filter('id', '=', assetId)
      .limit(1);

    console.log('Trying query by id field');
    const [entities] = await datastore.runQuery(query);

    if (entities && entities.length > 0) {
      console.log('Found entity using id field query');
      const entity = entities[0];
      const key = entity[datastore.KEY];
      return { entity, key };
    }
  } catch (error) {
    console.error('Error in id field query:', error);
  }

  // No entity found with any method
  return { entity: null, key: null };
}

/**
 * Add an existing asset to the gallery by enabling its gallery flag
 */
export async function addAssetToGallery(
  userId: string,
  assetId: string
): Promise<boolean> {
  try {
    console.log(
      `Attempting to add asset ${assetId} to gallery for user ${userId}`
    );

    // Find the user activity entity
    const { entity: asset, key: assetKey } = await findUserActivity(assetId);

    if (!asset || !assetKey) {
      console.error('Asset not found:', assetId);
      return false;
    }

    console.log('Found asset to add to gallery:', asset);

    // Owner checking is optional during debugging
    if (asset.UserId && asset.UserId !== userId) {
      console.log(`Asset belongs to user ${asset.UserId}, not ${userId}`);
      // During development, you may want to bypass this check
      //return false;
    }

    // Don't allow uploaded images to be added to gallery
    if (asset.AssetType === 'upl') {
      console.error('Uploaded images cannot be added to gallery');
      return false;
    }

    // Store the user's original subscription tier if not already saved
    if (!asset.UserSubscriptionTier && asset.SubscriptionTier !== 4) {
      asset.UserSubscriptionTier = asset.SubscriptionTier || 0;
    }

    // Set the subscription tier to 3 to mark it as gallery-visible
    // TODO (CONTEST) Step 2 to a new contest is to increment the SubscriptionTier (find and replace all for below var)
    asset.SubscriptionTier = 4;

    // Update the timestamp fields
    if (asset.DateTime) {
      // Keep the existing DateTime for consistency
    } else {
      asset.DateTime = new Date();
    }

    if (asset.LastUpdated) {
      asset.LastUpdated = new Date();
    }

    if (asset.lastUpdated) {
      asset.lastUpdated = new Date();
    }

    console.log('Updating asset with gallery flag:', asset);

    // Update the entity
    await datastore.update({
      key: assetKey,
      data: asset
    });

    return true;
  } catch (error) {
    console.error('Error adding asset to gallery:', error);
    return false;
  }
}

/**
 * Remove an asset from the gallery by disabling its gallery flag
 */
export async function removeAssetFromGallery(
  userId: string,
  assetId: string
): Promise<boolean> {
  try {
    console.log(
      `Attempting to remove asset ${assetId} from gallery for user ${userId}`
    );

    // Find the user activity entity
    const { entity: asset, key: assetKey } = await findUserActivity(assetId);

    if (!asset || !assetKey) {
      console.error('Asset not found:', assetId);
      return false;
    }

    console.log('Found asset to remove from gallery:', asset);

    // Owner checking is optional during debugging
    if (asset.UserId && asset.UserId !== userId) {
      console.log(`Asset belongs to user ${asset.UserId}, not ${userId}`);
      // During development, you may want to bypass this check
      //return false;
    }

    // Only proceed if the asset is currently in the gallery
    if (asset.SubscriptionTier !== 4) {
      console.log(
        'Asset is not in the gallery (SubscriptionTier !=4):',
        asset.SubscriptionTier
      );
      return true; // Already in the state we want
    }

    // Reset the subscription tier to the user's actual tier
    asset.SubscriptionTier = asset.UserSubscriptionTier || 0;

    // Update the timestamp fields
    if (asset.LastUpdated) {
      asset.LastUpdated = new Date();
    }

    if (asset.lastUpdated) {
      asset.lastUpdated = new Date();
    }

    console.log('Updating asset to remove gallery flag:', asset);

    // Update the entity
    await datastore.update({
      key: assetKey,
      data: asset
    });

    return true;
  } catch (error) {
    console.error('Error removing asset from gallery:', error);
    return false;
  }
}
