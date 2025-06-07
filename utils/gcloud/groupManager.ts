import { Datastore } from '@google-cloud/datastore';
import { google_app_creds } from '@/interfaces/googleCredentials';

const datastore = new Datastore({
  projectId: google_app_creds.projectId,
  credentials: google_app_creds
});

const USER_GROUP_KIND = 'UserGroup';
const ASSET_GROUP_MEMBERSHIP_KIND = 'AssetGroupMembership';
const NAMESPACE = 'GenTube';

export interface UserGroup {
  id: string;
  name: string;
  description?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  color?: string;
  assetCount?: number;
}

export interface AssetWithGroups {
  id?: string;
  CreatedAssetUrl: string;
  Prompt: string;
  AssetSource: string;
  AssetType: string;
  DateTime: Date | string;
  SubscriptionTier?: number;
  groups?: UserGroup[]; // Groups this asset belongs to
  order?: number; // Order for asset sorting
}

/**
 * Get all groups for a user
 */
export async function getUserGroups(userId: string): Promise<UserGroup[]> {
  try {
    const query = datastore
      .createQuery(NAMESPACE, USER_GROUP_KIND)
      .filter('userId', '=', userId);

    const [groups] = await datastore.runQuery(query);

    return groups
      .map((group: any) => ({
        id: group[datastore.KEY].id?.toString() || group[datastore.KEY].name,
        name: group.name,
        description: group.description,
        userId: group.userId,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
        color: group.color || '#3B82F6'
      }))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ); // Sort newest first
  } catch (error) {
    console.error('Error fetching user groups:', error);
    return [];
  }
}

/**
 * Get groups for specific assets
 */
export async function getGroupsForAssets(
  assetIds: string[],
  userId: string
): Promise<{ [assetId: string]: UserGroup[] }> {
  try {
    if (assetIds.length === 0) {
      return {};
    }

    // Get all memberships for these assets
    const membershipQuery = datastore
      .createQuery(NAMESPACE, ASSET_GROUP_MEMBERSHIP_KIND)
      .filter('userId', '=', userId)
      .filter('assetId', 'IN', assetIds);

    const [memberships] = await datastore.runQuery(membershipQuery);

    if (memberships.length === 0) {
      return {};
    }

    // Get unique group IDs
    const groupIds = [...new Set(memberships.map((m: any) => m.groupId))];

    // Fetch group details
    const groupKeys = groupIds.map((groupId) =>
      datastore.key({
        namespace: NAMESPACE,
        path: [USER_GROUP_KIND, datastore.int(Number(groupId))]
      })
    );

    const [groups] = await datastore.get(groupKeys);

    // Create a map of group ID to group data
    // Fix: Use the actual group key ID rather than array index to avoid mismatches
    const groupMap: { [groupId: string]: UserGroup } = {};
    groups.forEach((group: any) => {
      if (group && group[datastore.KEY]) {
        const groupId = group[datastore.KEY].id.toString();
        groupMap[groupId] = {
          id: groupId,
          name: group.name,
          description: group.description,
          userId: group.userId,
          createdAt: group.createdAt,
          updatedAt: group.updatedAt,
          color: group.color || '#3B82F6'
        };
      }
    });

    // Organize by asset ID
    const assetGroupMap: { [assetId: string]: UserGroup[] } = {};

    for (const assetId of assetIds) {
      assetGroupMap[assetId] = [];
    }

    for (const membership of memberships) {
      const assetId = membership.assetId;
      const groupId = membership.groupId.toString(); // Ensure string type consistency

      if (groupMap[groupId] && assetGroupMap[assetId]) {
        assetGroupMap[assetId].push(groupMap[groupId]);
      }
    }

    return assetGroupMap;
  } catch (error) {
    console.error('Error fetching groups for assets:', error);
    return {};
  }
}

/**
 * Get assets in a specific group
 */
export async function getAssetsInGroup(
  groupId: string,
  userId: string
): Promise<string[]> {
  try {
    console.log(`getAssetsInGroup called for groupId: ${groupId}, userId: ${userId}`);
    
    // Create query to get all assets in the group
    let query = datastore
      .createQuery(NAMESPACE, ASSET_GROUP_MEMBERSHIP_KIND)
      .filter('groupId', '=', groupId)
      .filter('userId', '=', userId)
      .order('createdAt', { descending: true });
      
    // Execute the query
    const [memberships] = await datastore.runQuery(query);
    
    console.log(`Found ${memberships.length} memberships for group ${groupId}`);
    
    // For debugging, log the first few membership objects
    if (memberships.length > 0) {
      console.log('Sample membership:', JSON.stringify(memberships[0], null, 2));
    }
    
    // Extract asset IDs, logging any potential issues
    const assetIds = memberships.map((membership: any) => {
      if (!membership.assetId) {
        console.log('Found membership without assetId:', membership);
      }
      return membership.assetId;
    }).filter(Boolean); // Remove any undefined/null entries
    
    console.log(`Returning ${assetIds.length} asset IDs for group ${groupId}`);
    return assetIds;
  } catch (error) {
    console.error('Error fetching assets in group:', error);
    return [];
  }
}

/**
 * Get asset count for each group
 */
export async function getGroupAssetCounts(
  groupIds: string[],
  userId: string
): Promise<{ [groupId: string]: number }> {
  try {
    if (groupIds.length === 0) {
      return {};
    }

    const query = datastore
      .createQuery(NAMESPACE, ASSET_GROUP_MEMBERSHIP_KIND)
      .filter('userId', '=', userId)
      .filter('groupId', 'IN', groupIds);

    const [memberships] = await datastore.runQuery(query);

    const counts: { [groupId: string]: number } = {};

    // Initialize all group counts to 0
    for (const groupId of groupIds) {
      counts[groupId] = 0;
    }

    // Count memberships per group
    for (const membership of memberships) {
      const groupId = membership.groupId;
      if (counts.hasOwnProperty(groupId)) {
        counts[groupId]++;
      }
    }

    return counts;
  } catch (error) {
    console.error('Error fetching group asset counts:', error);
    return {};
  }
}

/**
 * Enhanced version of getUserAssets that includes group information
 */
export async function getUserAssetsWithGroups(
  userId: string,
  userIp: string,
  limit: number,
  offset: number,
  assetType?: string,
  groupId?: string, // Optional filter by group
  migrateOrderValues: boolean = true // Add parameter to control order migration
): Promise<AssetWithGroups[]> {
  try {
    console.log('getUserAssetsWithGroups called with:');
    console.log('- userId:', userId);
    console.log('- groupId:', groupId, 'type:', typeof groupId);
    console.log('- assetType:', assetType);
    
    // Import needed functions to avoid circular dependency
    const { getUserAssets, migrateActivityOrderValues } = await import('./userAssets');

    let assets;

    if (groupId) {
      console.log('Filtering by group:', groupId);
      // If filtering by group, get assets in that group first
      const assetIdsInGroup = await getAssetsInGroup(groupId, userId);

      if (assetIdsInGroup.length === 0) {
        return [];
      }

      // Import the new utility function
      const { getUserActivityByIds } = await import('./getUserActivityById');
      
      // Apply pagination to the asset IDs before fetching them
      const paginatedAssetIds = assetIdsInGroup.slice(offset, offset + limit);
      
      // Directly fetch only the assets needed by their IDs
      console.log(`Fetching ${paginatedAssetIds.length} assets for group ${groupId}`);
      assets = await getUserActivityByIds(paginatedAssetIds);
      
      if (!assets || assets.length === 0) {
        return [];
      }
      
      // Apply asset type filtering if needed
      if (assetType) {
        if (assetType.includes(',')) {
          const types = assetType.split(',').map((t: string) => t.trim());
          assets = assets.filter((asset) => 
            asset.AssetType && types.includes(asset.AssetType.toString())
          );
        } else {
          assets = assets.filter((asset) => 
            asset.AssetType === assetType
          );
        }
      }
      
      // Migrate order values if needed
      if (migrateOrderValues && assets && assets.length > 0) {
        console.log('Checking for order migration in group assets');
        assets = await migrateActivityOrderValues(assets);
      }
    } else {
      console.log('No groupId - fetching all assets');
      // Regular asset fetch
      assets = await getUserAssets(userId, userIp, limit, offset, assetType, migrateOrderValues);
      console.log('All assets fetched, count:', assets?.length);
    }

    if (!assets || assets.length === 0) {
      return [];
    }

    // Get group information for all assets
    const assetIds = assets
      .map((asset) => asset.id?.toString())
      .filter(Boolean) as string[];

    const assetGroupMap = await getGroupsForAssets(assetIds, userId);

    // Enhance assets with group information
    const assetsWithGroups: AssetWithGroups[] = assets.map((asset) => ({
      ...asset,
      groups: asset.id ? assetGroupMap[asset.id.toString()] || [] : []
    }));

    return assetsWithGroups;
  } catch (error) {
    console.error('Error fetching user assets with groups:', error);
    return [];
  }
}
