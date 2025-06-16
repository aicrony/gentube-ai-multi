import { Datastore } from '@google-cloud/datastore';
import { google_app_creds } from '@/interfaces/googleCredentials';
require('dotenv').config();

const datastore = new Datastore({
  projectId: google_app_creds.projectId,
  credentials: google_app_creds
});

const kind = 'UserCredits';
const namespace = 'GenTube';

export async function getUserCreatorName(
  userId: string | string[] | undefined
): Promise<string | null> {
  if (!userId || userId === 'none' || userId.length === 0) {
    console.log('Invalid userId');
    return null;
  }

  console.log('Getting creator name for userId:', userId);

  const query = datastore
    .createQuery(namespace, kind)
    .filter('UserId', '=', userId)
    .limit(1);

  try {
    const [users] = await datastore.runQuery(query);
    const creatorName = users.length > 0 ? users[0].CreatorName : null;
    console.log('getUserCreatorName response:', creatorName);

    return creatorName;
  } catch (error) {
    console.error('Error fetching creator name:', error);
    return null;
  }
}
