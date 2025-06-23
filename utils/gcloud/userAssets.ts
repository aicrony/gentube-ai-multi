import { Datastore } from '@google-cloud/datastore';
import { google_app_creds } from '@/interfaces/googleCredentials';
import { localIpConfig } from '@/utils/ipUtils';

require('dotenv').config();

const datastore = new Datastore({
  projectId: google_app_creds.projectId,
  credentials: google_app_creds
});

const USER_ACTIVITY_KIND = 'UserActivity';
const ASSET_LIKES_KIND = 'AssetLikes';
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
  hasMore?: boolean; // Flag to indicate if there are more assets
}

export async function getUserAssets(
  userId: string | string[] | undefined,
  userIp: string | string[],
  limit: number,
  offset: number,
  assetType?: string | string[] | undefined,
  searchPrompt?: string | null
): Promise<UserActivity[] | null> {
  // We need to fetch enough assets to fill exactly the limit, even after filtering
  const batchSize = limit * 2; // Fetch twice the needed amount per query
  let allFilteredResults: any[] = [];
  let hasMore = false;

  // if (!userId || userId.length === 0) {
  //   console.log('Invalid userId');
  //   return null;
  // }

  const normalizedIpAddress = localIpConfig(userIp);

  // Log the exact pagination parameters
  console.log(
    `Fetching assets - limit: ${limit}, offset: ${offset}, batch size: ${batchSize}`
  );

  // If we have a searchPrompt, we'll need a special approach
  const hasSearchPrompt = searchPrompt && searchPrompt.trim().length > 0;

  // For search prompts, we might need a larger batch to find enough matching results
  if (hasSearchPrompt) {
    console.log(
      `Searching for prompt containing: "${searchPrompt}" - using larger batch size`
    );
    // Use a larger batch size for searching to ensure we get enough matches
    // This will be filtered down after the query
  }

  // Function to create a query with the provided offset
  const createQuery = (queryOffset: number) => {
    let query;

    if (userId && userId !== 'none') {
      console.log(`Query UA1 with offset ${queryOffset}`);
      query = datastore
        .createQuery(NAMESPACE, USER_ACTIVITY_KIND)
        .filter('UserId', '=', userId)
        .limit(batchSize)
        .offset(queryOffset)
        .order('DateTime', { descending: true });
    } else if (userIp && userIp.length > 4) {
      console.log(`Query UA2 with offset ${queryOffset}`);
      query = datastore
        .createQuery(NAMESPACE, USER_ACTIVITY_KIND)
        .filter('UserIp', '=', normalizedIpAddress)
        .limit(batchSize)
        .offset(queryOffset)
        .order('DateTime', { descending: true });
    } else {
      console.log(`Query UA3 with offset ${queryOffset}`);
      query = datastore
        .createQuery(NAMESPACE, USER_ACTIVITY_KIND)
        .filter('UserId', '=', userId)
        .filter('UserIp', '=', normalizedIpAddress)
        .limit(batchSize)
        .offset(queryOffset)
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

    // If we're searching by prompt, we need to retrieve more records
    // since we'll be filtering them client-side
    if (hasSearchPrompt) {
      return query.limit(1000).offset(0); // Get a larger batch for text search
    }

    return query;
  };

  // Execute a single query first
  const query = createQuery(offset);
  const [results] = await datastore.runQuery(query);

  // Process search results if we have a search term
  if (hasSearchPrompt && searchPrompt) {
    console.log(`Filtering results for prompt search: "${searchPrompt}"`);
    const searchTermLower = searchPrompt.toLowerCase();

    // Filter results that match the search term in the prompt
    allFilteredResults = results.filter(
      (item) =>
        item.Prompt && item.Prompt.toLowerCase().includes(searchTermLower)
    );

    // Apply pagination manually after filtering by search term
    // This ensures we return the right page of results that match the search
    const startIndex = offset;
    const endIndex = offset + limit;
    allFilteredResults = allFilteredResults.slice(startIndex, endIndex);

    // Set hasMore based on total filtered results matching the search term
    hasMore =
      results.filter(
        (item) =>
          item.Prompt && item.Prompt.toLowerCase().includes(searchTermLower)
      ).length >
      offset + limit;

    console.log(
      `Found ${allFilteredResults.length} results matching search: "${searchPrompt}"`
    );
  } else {
    // Standard processing without search term
    // Don't filter out 'processed' assets anymore - they should no longer be created
    allFilteredResults = [...results];
  }

  // Check if this batch returned the full amount requested
  // If so, there might be more results available
  hasMore = results.length === batchSize;

  console.log(`Query returned ${results.length} results`);

  // Return exactly the requested number of items (or all if we have fewer)
  const limitedResults = allFilteredResults.slice(0, limit);

  // If we have more results than limit, there are definitely more
  hasMore = hasMore || allFilteredResults.length > limit;

  console.log(
    `Returning ${limitedResults.length} results, hasMore: ${hasMore}`
  );

  // Attach the hasMore flag to the returned array for the API to use
  const returnResults = limitedResults.map((activity: any) => ({
    id: activity[datastore.KEY].name || activity[datastore.KEY].id, // Include entity ID
    CreatedAssetUrl: activity.CreatedAssetUrl,
    Prompt: activity.Prompt,
    AssetSource: activity.AssetSource,
    AssetType: activity.AssetType,
    DateTime: activity.DateTime,
    SubscriptionTier: activity.SubscriptionTier,
    hasMore // Add the hasMore flag to each result (will be used by the API)
  }));

  return returnResults;
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

  // Filter out 'processed' assets after querying to avoid Datastore inequality filter limitations
  const filteredResults = results.filter(
    (activity: any) => activity.AssetType !== 'processed'
  );

  // Ensure we only return up to the original limit requested
  const limitedResults = filteredResults.slice(0, limit);

  // Set hasMore flag based on whether we had to trim results
  const hasMore = filteredResults.length > limit;

  return limitedResults.map((activity: any) => ({
    id: activity[datastore.KEY].name || activity[datastore.KEY].id, // Include entity ID
    CreatedAssetUrl: activity.CreatedAssetUrl,
    Prompt: activity.Prompt,
    AssetSource: activity.AssetSource,
    AssetType: activity.AssetType,
    DateTime: activity.DateTime,
    SubscriptionTier: activity.SubscriptionTier
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

  return results.map((activity: any) => {
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
      id: activity[datastore.KEY].name || activity[datastore.KEY].id, // Include entity ID
      CreatedAssetUrl: activity.CreatedAssetUrl || '',
      Prompt: prompt,
      AssetSource: activity.AssetSource || '',
      AssetType: activity.AssetType || 'unknown',
      DateTime: activity.DateTime,
      UserId: activity.UserId || null,
      CreatorName: creatorName,
      SubscriptionTier: activity.SubscriptionTier || 3 // Default to 3 for gallery assets
    };
  });
}

export async function getTopGalleryAssets(
  limit: number = 10
): Promise<UserActivity[] | null> {
  try {
    // Step 1: Query all gallery assets (SubscriptionTier = 3)
    const galleryQuery = datastore
      .createQuery(NAMESPACE, USER_ACTIVITY_KIND)
      .filter('SubscriptionTier', '=', 3);
    
    const [galleryAssets] = await datastore.runQuery(galleryQuery);
    console.log(`Found ${galleryAssets.length} total gallery assets`);
    
    // Step 2: Get all the asset IDs from the gallery assets
    const assetIds = galleryAssets.map((asset: any) => 
      asset[datastore.KEY].name || asset[datastore.KEY].id
    );
    
    // Step 3: Query the likes for all these assets
    const likesQueries = assetIds.map(assetId => {
      const assetLikesKey = datastore.key({
        namespace: NAMESPACE,
        path: [ASSET_LIKES_KIND, assetId]
      });
      return datastore.get(assetLikesKey);
    });
    
    // Execute all queries in parallel
    const likesResults = await Promise.all(likesQueries);
    
    // Step 4: Combine gallery assets with their like counts
    const assetsWithLikes = galleryAssets.map((asset: any, index: number) => {
      const assetId = asset[datastore.KEY].name || asset[datastore.KEY].id;
      const [likesEntity] = likesResults[index];
      const likesCount = likesEntity ? (likesEntity.totalLikes || 0) : 0;
      
      return {
        asset,
        assetId,
        likesCount
      };
    });
    
    // Step 5: Sort by likes count (most hearts first) and take top 'limit'
    const topAssets = assetsWithLikes
      .sort((a, b) => b.likesCount - a.likesCount)
      .slice(0, limit)
      .map(({ asset }) => asset);
    
    console.log(`Returning top ${topAssets.length} assets by heart count`);
    
    // Step 6: Get creator names for the top assets
    const userIds = topAssets
      .map((activity: any) => activity.UserId)
      .filter((userId: string | undefined) => userId && userId !== 'none');
    
    console.log('Top assets user IDs extracted:', userIds);
    
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
    
    // Step 7: Format and return the results
    return topAssets.map((activity: any) => {
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
      }
      
      return {
        id: activity[datastore.KEY].name || activity[datastore.KEY].id,
        CreatedAssetUrl: activity.CreatedAssetUrl || '',
        Prompt: prompt,
        AssetSource: activity.AssetSource || '',
        AssetType: activity.AssetType || 'unknown',
        DateTime: activity.DateTime,
        UserId: activity.UserId || null,
        CreatorName: creatorName,
        SubscriptionTier: activity.SubscriptionTier || 3
      };
    });
  } catch (error) {
    console.error('Error getting top gallery assets:', error);
    return null;
  }
}
