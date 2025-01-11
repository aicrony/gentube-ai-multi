import { Datastore } from '@google-cloud/datastore';
import { google_app_creds } from '@/interfaces/googleCredentials';
require('dotenv').config();

const datastore = new Datastore({
  projectId: google_app_creds.project_id,
  credentials: google_app_creds
});

const kind = 'UserCredits';
const namespace = 'GenTube';

export async function getUserCredits(
  userId: string | string[] | undefined,
  userIp: string | string[] | undefined
): Promise<number | null> {
  const query = datastore
    .createQuery(namespace, kind)
    .filter('UserId', '=', userId)
    .filter('UserIp', '=', userIp)
    .limit(1);

  const [credits] = await datastore.runQuery(query);
  return credits.length > 0 ? credits[0].Credits : null;
}

export async function updateUserCredits(
  userId: string | string[] | undefined,
  userIp: string | string[] | undefined,
  credits: number
): Promise<void> {
  const query = datastore
    .createQuery(namespace, kind)
    .filter('UserId', '=', userId)
    .filter('UserIp', '=', userIp)
    .limit(1);

  const [existingCredits] = await datastore.runQuery(query);
  const currentCredits =
    existingCredits.length > 0 ? existingCredits[0].Credits : 0;
  const newCredits = currentCredits + credits;

  const keyValue = [kind, userId ? userId : userIp];
  const key = datastore.key({
    namespace,
    path: [kind, `${keyValue}`]
  });

  const entity = {
    key,
    data: {
      UserId: userId,
      UserIp: userIp,
      Credits: newCredits
    }
  };

  await datastore.save(entity);
}
