import { Datastore } from '@google-cloud/datastore';
import { google_app_creds } from '@/interfaces/googleCredentials';
import { normalizeIp, localIpConfig } from '@/utils/ipUtils';
require('dotenv').config();

const datastore = new Datastore({
  projectId: google_app_creds.projectId,
  credentials: google_app_creds
});

const kind = 'UserCredits';
const namespace = 'GenTube';

/**
 * Updates the user's name in the UserCredits datastore
 */
export async function updateUserName(
  userId: string,
  name: string
): Promise<boolean> {
  try {
    if (!userId || userId === 'none' || !name) {
      console.log('Invalid userId or name');
      return false;
    }

    // First check if the user already has a record
    const query = datastore
      .createQuery(namespace, kind)
      .filter('UserId', '=', userId)
      .limit(1);

    const [userCredits] = await datastore.runQuery(query);
    
    if (userCredits.length > 0) {
      // User exists, update the name
      const userCreditsKey = userCredits[0][datastore.KEY];
      
      // Get current entity data
      const userCreditsEntity = { ...userCredits[0] };
      
      // Update the name
      userCreditsEntity.Name = name;
      userCreditsEntity.LastUpdated = new Date();
      
      // Save the updated entity
      await datastore.update({
        key: userCreditsKey,
        data: userCreditsEntity
      });
      
      console.log(`Updated user ${userId}'s name to ${name}`);
      return true;
    } else {
      // User doesn't exist yet, create a new record
      const userCreditsKey = datastore.key({
        namespace: namespace,
        path: [kind, userId]
      });
      
      const userCreditsEntity = {
        UserId: userId,
        Name: name,
        Credits: 0,
        LastUpdated: new Date()
      };
      
      await datastore.save({
        key: userCreditsKey,
        data: userCreditsEntity
      });
      
      console.log(`Created new user ${userId} with name ${name}`);
      return true;
    }
  } catch (error) {
    console.error('Error updating user name:', error);
    return false;
  }
}