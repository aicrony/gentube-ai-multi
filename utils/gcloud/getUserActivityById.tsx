import { Datastore } from '@google-cloud/datastore';
import { google_app_creds } from '@/interfaces/googleCredentials';
import { GcloudUserActivity } from '@/interfaces/gcloudUserActivity';
require('dotenv').config();

const datastore = new Datastore({
  projectId: google_app_creds.projectId,
  credentials: google_app_creds
});

const kind = 'UserActivity';
const namespace = 'GenTube';

/**
 * Retrieves a UserActivity entity by its ID
 * @param id The ID of the UserActivity to retrieve
 * @returns The UserActivity entity or null if not found
 */
export async function getUserActivityById(
  id: string | number
): Promise<GcloudUserActivity | null> {
  try {
    // Create a key for the UserActivity entity
    const key = datastore.key({
      namespace: namespace,
      path: [kind, datastore.int(id)]
    });

    // Retrieve the entity
    const [entity] = await datastore.get(key);

    if (!entity) {
      console.log(`No UserActivity found with ID: ${id}`);
      return null;
    }

    // Add the ID to the entity
    entity.id = entity[datastore.KEY].id;
    console.log(`Retrieved UserActivity with ID: ${id}`, entity);

    return entity as GcloudUserActivity;
  } catch (error) {
    console.error(`Error retrieving UserActivity with ID ${id}:`, error);
    throw error;
  }
}