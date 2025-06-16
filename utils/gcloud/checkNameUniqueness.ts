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
 * Checks if a display name is unique across all users
 * @param name The display name to check
 * @param currentUserId The current user's ID (to exclude from the check)
 * @returns true if the name is unique or belongs to the current user, false otherwise
 */
export async function isNameUnique(
  name: string,
  currentUserId: string
): Promise<boolean> {
  try {
    if (!name) {
      return false;
    }

    console.log(
      `Checking if name "${name}" is unique for user ${currentUserId}`
    );

    // Create a query to find users with this name - first check Name field
    const nameQuery = datastore
      .createQuery(NAMESPACE, USER_CREDITS_KIND)
      .filter('Name', '=', name);

    const [nameResults] = await datastore.runQuery(nameQuery);

    // Also check CreatorName field for compatibility with older records
    const creatorNameQuery = datastore
      .createQuery(NAMESPACE, USER_CREDITS_KIND)
      .filter('CreatorName', '=', name);

    const [creatorNameResults] = await datastore.runQuery(creatorNameQuery);

    // Combine results
    const results = [...nameResults, ...creatorNameResults];

    // Filter out any duplicates (same user ID might appear in both queries)
    const uniqueUserIds = new Set();
    const uniqueResults = results.filter((result) => {
      if (uniqueUserIds.has(result.UserId)) {
        return false;
      }
      uniqueUserIds.add(result.UserId);
      return true;
    });

    // If no results, the name is unique
    if (uniqueResults.length === 0) {
      console.log(`Name "${name}" is unique (no matches found)`);
      return true;
    }

    // If the only user with this name is the current user, it's still valid
    if (
      uniqueResults.length === 1 &&
      uniqueResults[0].UserId === currentUserId
    ) {
      console.log(
        `Name "${name}" belongs to the current user ${currentUserId}`
      );
      return true;
    }

    // Found another user with this name
    console.log(`Name "${name}" is already used by another user`);
    return false;
  } catch (error) {
    console.error('Error checking name uniqueness:', error);
    // In case of error, default to allowing the name (better UX than blocking)
    return true;
  }
}
