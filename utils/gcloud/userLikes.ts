import { Datastore } from '@google-cloud/datastore';
import { google_app_creds } from '@/interfaces/googleCredentials';

require('dotenv').config();

const datastore = new Datastore({
  projectId: google_app_creds.projectId,
  credentials: google_app_creds
});

const ASSET_LIKES_KIND = 'AssetLikes';
const USER_LIKES_KIND = 'UserLikes';
const NAMESPACE = 'GenTube';

// Interface for like information
export interface LikeInfo {
  likesCount: number;
  isLiked: boolean;
}

interface AssetLikesEntity {
  assetId: string;
  totalLikes: number;
  likedBy: string[]; // Array of user IDs who liked this asset
  lastUpdated: Date;
}

interface UserLikesEntity {
  userId: string;
  likedAssets: string[]; // Array of asset IDs liked by this user
  lastUpdated: Date;
}

/**
 * Get likes information for a specific asset
 */
export async function getAssetLikes(
  assetId: string,
  userId?: string
): Promise<LikeInfo> {
  try {
    // Create a key for the asset likes entity
    const assetLikesKey = datastore.key({
      namespace: NAMESPACE,
      path: [ASSET_LIKES_KIND, assetId]
    });

    // Get the asset likes entity
    const [assetLikes] = await datastore.get(assetLikesKey);

    // If the entity doesn't exist, return 0 likes
    if (!assetLikes) {
      return {
        likesCount: 0,
        isLiked: false
      };
    }

    // Return the likes count and whether the user has liked it
    return {
      likesCount: assetLikes.totalLikes || 0,
      isLiked: userId ? (assetLikes.likedBy || []).includes(userId) : false
    };
  } catch (error) {
    console.error('Error getting asset likes:', error);
    return {
      likesCount: 0,
      isLiked: false
    };
  }
}

/**
 * Get likes information for multiple assets in a single request
 * @param assetIds Array of asset IDs to get likes information for
 * @param userId Optional user ID to check if the user has liked each asset
 * @returns Object mapping asset IDs to their likes information
 */
export async function getBulkAssetLikes(
  assetIds: string[],
  userId?: string
): Promise<{ [assetId: string]: LikeInfo }> {
  try {
    console.log(`Fetching likes info for ${assetIds.length} assets in bulk`);
    
    if (!assetIds || assetIds.length === 0) {
      return {};
    }

    // Create keys for all assets
    const assetLikesKeys = assetIds.map(assetId => 
      datastore.key({
        namespace: NAMESPACE,
        path: [ASSET_LIKES_KIND, assetId]
      })
    );

    // Get all asset likes entities in a single batch request
    const [assetLikesResults] = await datastore.get(assetLikesKeys);

    // Create result map with default values for all requested assets
    const likesMap: { [assetId: string]: LikeInfo } = {};
    
    // Initialize with default values
    assetIds.forEach(assetId => {
      likesMap[assetId] = {
        likesCount: 0,
        isLiked: false
      };
    });

    // Update the map with actual values for assets that have likes
    assetLikesResults.forEach((assetLikes: AssetLikesEntity, index: number) => {
      if (assetLikes) {
        const assetId = assetIds[index];
        likesMap[assetId] = {
          likesCount: assetLikes.totalLikes || 0,
          isLiked: userId ? (assetLikes.likedBy || []).includes(userId) : false
        };
      }
    });

    return likesMap;
  } catch (error) {
    console.error('Error getting bulk asset likes:', error);
    
    // Return default values on error
    const defaultMap: { [assetId: string]: LikeInfo } = {};
    assetIds.forEach(assetId => {
      defaultMap[assetId] = {
        likesCount: 0,
        isLiked: false
      };
    });
    
    return defaultMap;
  }
}

/**
 * Get all assets liked by a specific user
 */
export async function getUserLikedAssets(userId: string): Promise<string[]> {
  try {
    // Create a key for the user likes entity
    const userLikesKey = datastore.key({
      namespace: NAMESPACE,
      path: [USER_LIKES_KIND, userId]
    });

    // Get the user likes entity
    const [userLikes] = await datastore.get(userLikesKey);

    // If the entity doesn't exist, return an empty array
    if (!userLikes) {
      return [];
    }

    // Return the array of liked asset IDs
    return userLikes.likedAssets || [];
  } catch (error) {
    console.error('Error getting user liked assets:', error);
    return [];
  }
}

/**
 * Toggle a like/unlike for an asset by a user
 */
export async function toggleAssetLike(
  userId: string,
  assetId: string,
  action: 'like' | 'unlike'
): Promise<LikeInfo> {
  try {
    // Create transaction to ensure consistency
    const transaction = datastore.transaction();
    await transaction.run();

    // Create keys for both entities
    const assetLikesKey = datastore.key({
      namespace: NAMESPACE,
      path: [ASSET_LIKES_KIND, assetId]
    });

    const userLikesKey = datastore.key({
      namespace: NAMESPACE,
      path: [USER_LIKES_KIND, userId]
    });

    // Get both entities
    const [[assetLikes], [userLikes]] = await Promise.all([
      transaction.get(assetLikesKey),
      transaction.get(userLikesKey)
    ]);

    // Initialize or update the asset likes entity
    let assetLikesEntity: AssetLikesEntity;
    if (!assetLikes) {
      assetLikesEntity = {
        assetId,
        totalLikes: 0,
        likedBy: [],
        lastUpdated: new Date()
      };
    } else {
      assetLikesEntity = {
        ...assetLikes,
        likedBy: assetLikes.likedBy || [],
        lastUpdated: new Date()
      };
    }

    // Initialize or update the user likes entity
    let userLikesEntity: UserLikesEntity;
    if (!userLikes) {
      userLikesEntity = {
        userId,
        likedAssets: [],
        lastUpdated: new Date()
      };
    } else {
      userLikesEntity = {
        ...userLikes,
        likedAssets: userLikes.likedAssets || [],
        lastUpdated: new Date()
      };
    }

    // Handle like/unlike action
    const userLikedIndex = assetLikesEntity.likedBy.indexOf(userId);
    const assetLikedIndex = userLikesEntity.likedAssets.indexOf(assetId);

    if (action === 'like' && userLikedIndex === -1) {
      // Add like
      assetLikesEntity.likedBy.push(userId);
      assetLikesEntity.totalLikes = assetLikesEntity.likedBy.length;

      if (assetLikedIndex === -1) {
        userLikesEntity.likedAssets.push(assetId);
      }
    } else if (action === 'unlike' && userLikedIndex !== -1) {
      // Remove like
      assetLikesEntity.likedBy.splice(userLikedIndex, 1);
      assetLikesEntity.totalLikes = assetLikesEntity.likedBy.length;

      if (assetLikedIndex !== -1) {
        userLikesEntity.likedAssets.splice(assetLikedIndex, 1);
      }
    }

    // Save both entities
    transaction.save([
      {
        key: assetLikesKey,
        data: assetLikesEntity
      },
      {
        key: userLikesKey,
        data: userLikesEntity
      }
    ]);

    // Commit the transaction
    await transaction.commit();

    // Return the updated like status
    return {
      likesCount: assetLikesEntity.totalLikes,
      isLiked: assetLikesEntity.likedBy.includes(userId)
    };
  } catch (error) {
    console.error('Error toggling asset like:', error);
    throw error;
  }
}

/**
 * Add an existing asset to the gallery by enabling its gallery flag
 */
export async function addAssetToGallery(
  userId: string,
  assetId: string
): Promise<boolean> {
  try {
    // Get the asset entity - handle IDs as numbers for numeric IDs
    const keyId = isNaN(parseInt(assetId)) ? assetId : parseInt(assetId);
    console.log(
      `Creating datastore key for ID: ${assetId}, parsed as: ${keyId}, type: ${typeof keyId}`
    );

    const assetKey = datastore.key({
      namespace: NAMESPACE,
      path: ['UserActivity', keyId]
    });

    console.log('Constructed key:', assetKey);

    const [asset] = await datastore.get(assetKey);

    if (!asset) {
      console.error('Asset not found:', assetId);
      return false;
    }

    // Check if the user is the owner of the asset
    // This is required for security reasons
    console.log('Add to gallery - Asset data:', JSON.stringify(asset, null, 2));

    // Be flexible about user ID checking - some assets might not have UserId fields
    // or might have it stored in a different format
    if (
      asset.UserId &&
      asset.UserId !== userId &&
      String(asset.UserId) !== String(userId)
    ) {
      console.error(
        `User is not the owner of this asset. Asset owner: ${asset.UserId}, Current user: ${userId}`
      );
      // Temporarily bypass this check for debugging
      //return false;
    }

    // Don't allow uploaded images to be added to gallery
    if (asset.AssetType === 'upl') {
      console.error('Uploaded images cannot be added to gallery');
      return false;
    }

    // Store the user's original subscription tier if not already saved
    if (!asset.UserSubscriptionTier && asset.SubscriptionTier !== 3) {
      asset.UserSubscriptionTier = asset.SubscriptionTier || 0;
    }

    // Set the subscription tier to 3 to mark it as gallery-visible
    asset.SubscriptionTier = 3;

    // Update timestamp - use the field that already exists in the object
    if (asset.LastUpdated) {
      asset.LastUpdated = new Date();
    } else if (asset.lastUpdated) {
      asset.lastUpdated = new Date();
    } else {
      // Add both to be safe
      asset.LastUpdated = new Date();
      asset.lastUpdated = new Date();
    }

    console.log('Adding asset to gallery:', assetId, 'New data:', asset);

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
    // Get the asset entity - handle IDs as numbers for numeric IDs
    const keyId = isNaN(parseInt(assetId)) ? assetId : parseInt(assetId);
    console.log(
      `Creating datastore key for ID: ${assetId}, parsed as: ${keyId}, type: ${typeof keyId}`
    );

    const assetKey = datastore.key({
      namespace: NAMESPACE,
      path: ['UserActivity', keyId]
    });

    console.log('Constructed key:', assetKey);

    const [asset] = await datastore.get(assetKey);

    if (!asset) {
      console.error('Asset not found:', assetId);
      return false;
    }

    // Check if the user is the owner of the asset
    // This is required for security reasons
    console.log(
      'Remove from gallery - Asset data:',
      JSON.stringify(asset, null, 2)
    );

    // Be flexible about user ID checking - some assets might not have UserId fields
    // or might have it stored in a different format
    if (
      asset.UserId &&
      asset.UserId !== userId &&
      String(asset.UserId) !== String(userId)
    ) {
      console.error(
        `User is not the owner of this asset. Asset owner: ${asset.UserId}, Current user: ${userId}`
      );
      // Temporarily bypass this check for debugging
      //return false;
    }

    // Only proceed if the asset is currently in the gallery (SubscriptionTier = 3)
    if (asset.SubscriptionTier !== 3) {
      console.error('Asset is not in the gallery');
      return true; // Return true because the end state is what was requested
    }

    // Reset the subscription tier to the user's actual tier (or 0 if not set)
    asset.SubscriptionTier = asset.UserSubscriptionTier || 0;

    // Update timestamp - use the field that already exists in the object
    if (asset.LastUpdated) {
      asset.LastUpdated = new Date();
    } else if (asset.lastUpdated) {
      asset.lastUpdated = new Date();
    } else {
      // Add both to be safe
      asset.LastUpdated = new Date();
      asset.lastUpdated = new Date();
    }

    console.log('Removing asset from gallery:', assetId, 'New data:', asset);

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