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

    // First try direct key lookup
    const directKey = datastore.key({
      namespace: namespace,
      path: [kind, userId]
    });
    
    console.log(`Trying to update user name with direct key: ${userId}`);
    
    try {
      // Try to get the entity by direct key first
      const [directEntity] = await datastore.get(directKey);
      
      if (directEntity) {
        // User exists with direct key, update the name
        console.log(`Found user directly by key: ${userId}`);
        
        // Get current entity data
        const userCreditsEntity = { ...directEntity };
        
        // Update the name and other fields
        userCreditsEntity.Name = name;
        userCreditsEntity.LastUpdated = new Date();
        
        // Ensure UserId is properly set (it might be missing)
        if (!userCreditsEntity.UserId) {
          userCreditsEntity.UserId = userId;
        }
        
        // Save the updated entity
        await datastore.update({
          key: directKey,
          data: userCreditsEntity
        });
        
        console.log(`Updated user ${userId}'s name to ${name} using direct key`);
        return true;
      }
    } catch (error) {
      console.error(`Error updating user by direct key: ${error}`);
      // Continue to other methods if direct lookup fails
    }
    
    // Try finding by UserId field if direct key fails
    const query = datastore
      .createQuery(namespace, kind)
      .filter('UserId', '=', userId)
      .limit(1);

    const [userCredits] = await datastore.runQuery(query);
    
    if (userCredits.length > 0) {
      // User exists, update the name
      console.log(`Found user by UserId field: ${userId}`);
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
      
      console.log(`Updated user ${userId}'s name to ${name} via query`);
      return true;
    } else {
      // User doesn't exist yet, create a new record with direct key
      console.log(`No existing user found, creating new record for ${userId}`);
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