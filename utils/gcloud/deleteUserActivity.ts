import { Datastore } from '@google-cloud/datastore';
import { google_app_creds } from '@/interfaces/googleCredentials';

const datastore = new Datastore({
  namespace: 'GenTube',
  projectId: google_app_creds.projectId,
  credentials: google_app_creds
});

export const deleteUserActivity = async (
  userId: string, 
  assetUrl?: string, 
  entityId?: string
) => {
  try {
    console.log('Deleting user activity with:', { userId, assetUrl, entityId });
    
    // If entityId is provided, delete directly by key
    if (entityId) {
      console.log('Deleting by entity ID:', entityId);
      
      try {
        // Create a key using the entity ID
        const key = datastore.key({
          namespace: 'GenTube', 
          path: ['UserActivity', datastore.int(entityId)]
        });
        
        // Delete the entity
        await datastore.delete(key);
        console.log('Successfully deleted entity with ID:', entityId);
        return;
      } catch (error) {
        console.error('Error deleting by entity ID:', error);
        console.log('Falling back to URL-based deletion');
        // If direct deletion fails, continue with URL-based deletion
      }
    }
    
    // If no assetUrl is provided and entity ID deletion failed, there's nothing to do
    if (!assetUrl) {
      console.log('No assetUrl provided and entity ID deletion failed');
      return;
    }

    // Create a query to find the matching activity by URL
    const query = datastore
      .createQuery('UserActivity')
      .filter('UserId', '=', userId)
      .filter('CreatedAssetUrl', '=', assetUrl);
    
    const [activities] = await datastore.runQuery(query);
    
    if (activities.length === 0) {
      console.log('No activities found with exact URL match, checking if this is a queued item');
      
      // For queued items, the assetUrl might be a request ID instead of a full URL
      // Try to find records with AssetType = 'que' for this user
      const queuedQuery = datastore
        .createQuery('UserActivity')
        .filter('UserId', '=', userId)
        .filter('AssetType', '=', 'que');
      
      const [queuedActivities] = await datastore.runQuery(queuedQuery);
      
      // Check if any of these queued activities match our assetUrl
      const matchingActivities = queuedActivities.filter(activity => 
        activity.CreatedAssetUrl === assetUrl ||
        (typeof activity.CreatedAssetUrl === 'string' && 
         typeof assetUrl === 'string' && 
         activity.CreatedAssetUrl.includes(assetUrl))
      );
      
      if (matchingActivities.length > 0) {
        console.log('Found matching queued activities:', matchingActivities.length);
        
        // Delete the matching activities
        const keys = matchingActivities.map(activity => activity[datastore.KEY]);
        if (keys.length > 0) {
          await datastore.delete(keys);
          console.log('Deleted queued activities:', keys.length);
          return;
        }
      }
      
      console.log('No queued activities found either');
    }
    
    // Delete the original activities if found
    if (activities.length > 0) {
      console.log('Found activities to delete:', activities.length);
      const keys = activities.map(activity => activity[datastore.KEY]);
      await datastore.delete(keys);
      console.log('Deleted activities:', keys.length);
    } else {
      console.log('No activities found to delete');
    }
  } catch (error) {
    console.error('Error in deleteUserActivity:', error);
    throw error;
  }
};
