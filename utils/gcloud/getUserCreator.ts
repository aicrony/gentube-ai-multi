import { Datastore } from '@google-cloud/datastore';
import { google_app_creds } from '@/interfaces/googleCredentials';
require('dotenv').config();

const datastore = new Datastore({
  projectId: google_app_creds.projectId,
  credentials: google_app_creds
});

const USER_CREDITS_KIND = 'UserCredits';
const NAMESPACE = 'GenTube';

/**
 * Gets a user's name from the UserCredits datastore
 */
export async function getUserCreator(
  userId: string
): Promise<string | null> {
  try {
    if (!userId || userId === 'none') {
      return null;
    }

    // First try direct key lookup (most reliable)
    const key = datastore.key({
      namespace: NAMESPACE,
      path: [USER_CREDITS_KIND, userId]
    });
    
    const [entity] = await datastore.get(key);
    
    if (entity) {
      // Check for both field names (Name and CreatorName) for compatibility
      if (entity.CreatorName) {
        console.log(`Found CreatorName for userId=${userId}: ${entity.CreatorName}`);
        return entity.CreatorName;
      } else if (entity.Name) {
        console.log(`Found Name for userId=${userId}: ${entity.Name}`);
        return entity.Name;
      }
    }
    
    // If direct lookup fails, try query by UserId field
    const query = datastore
      .createQuery(NAMESPACE, USER_CREDITS_KIND)
      .filter('UserId', '=', userId)
      .limit(1);

    const [userCredits] = await datastore.runQuery(query);
    
    if (userCredits.length > 0) {
      if (userCredits[0].CreatorName) {
        console.log(`Found CreatorName via query for userId=${userId}: ${userCredits[0].CreatorName}`);
        return userCredits[0].CreatorName;
      } else if (userCredits[0].Name) {
        console.log(`Found Name via query for userId=${userId}: ${userCredits[0].Name}`);
        return userCredits[0].Name;
      }
    }
    
    console.log(`No name found for userId=${userId}`);
    return null;
  } catch (error) {
    console.error('Error getting user creator name:', error);
    return null;
  }
}

/**
 * Gets creator names for multiple user IDs
 */
export async function getCreatorNames(
  userIds: string[]
): Promise<{[key: string]: string}> {
  try {
    // Filter out 'none' and empty user IDs
    const validUserIds = userIds.filter(id => id && id !== 'none');
    
    console.log('Getting creator names for user IDs:', validUserIds);
    
    if (validUserIds.length === 0) {
      console.log('No valid user IDs to fetch creator names for');
      return {};
    }
    
    // Create a map of userId to name
    const creatorMap: {[key: string]: string} = {};
    
    // Instead of the 'IN' filter which might be problematic, get each user individually
    // to ensure we don't miss any matches due to data format issues
    for (const userId of validUserIds) {
      try {
        // First try direct key lookup (most reliable)
        const key = datastore.key({
          namespace: NAMESPACE,
          path: [USER_CREDITS_KIND, userId]
        });
        
        const [entity] = await datastore.get(key);
        
        if (entity && entity.Name) {
          console.log(`Found name for userId=${userId}: ${entity.Name}`);
          creatorMap[userId] = entity.Name;
          continue; // Skip to next user
        }
        
        // If direct lookup fails, try query by UserId
        const query = datastore
          .createQuery(NAMESPACE, USER_CREDITS_KIND)
          .filter('UserId', '=', userId)
          .limit(1);
        
        const [results] = await datastore.runQuery(query);
        
        if (results.length > 0 && results[0].Name) {
          console.log(`Found name via query for userId=${userId}: ${results[0].Name}`);
          creatorMap[userId] = results[0].Name;
        } else {
          console.log(`No name found for userId=${userId}`);
        }
      } catch (error) {
        console.error(`Error getting creator name for userId=${userId}:`, error);
      }
    }
    
    console.log('Final creator map:', creatorMap);
    return creatorMap;
  } catch (error) {
    console.error('Error getting creator names:', error);
    return {};
  }
}