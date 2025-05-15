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

    const query = datastore
      .createQuery(NAMESPACE, USER_CREDITS_KIND)
      .filter('UserId', '=', userId)
      .limit(1);

    const [userCredits] = await datastore.runQuery(query);
    
    if (userCredits.length > 0 && userCredits[0].Name) {
      return userCredits[0].Name;
    }
    
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
    
    if (validUserIds.length === 0) {
      return {};
    }
    
    // Create a query to get all user records at once
    const query = datastore
      .createQuery(NAMESPACE, USER_CREDITS_KIND)
      .filter('UserId', 'IN', validUserIds);
      
    const [userCredits] = await datastore.runQuery(query);
    
    // Create a map of userId to name
    const creatorMap: {[key: string]: string} = {};
    
    userCredits.forEach((user: any) => {
      if (user.UserId && user.Name) {
        creatorMap[user.UserId] = user.Name;
      }
    });
    
    return creatorMap;
  } catch (error) {
    console.error('Error getting creator names:', error);
    return {};
  }
}