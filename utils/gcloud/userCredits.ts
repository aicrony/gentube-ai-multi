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
  let query;
  if (userId != undefined && userIp == undefined) {
    query = datastore
      .createQuery(namespace, kind)
      .filter('UserId', '=', userId)
      .limit(1);
  } else if (userId == undefined && userIp != undefined) {
    query = datastore
      .createQuery(namespace, kind)
      .filter('UserIp', '=', userIp)
      .limit(1);
  } else if (userId != undefined && userIp != undefined) {
    query = datastore
      .createQuery(namespace, kind)
      .filter('UserId', '=', userId)
      .filter('UserId', '=', userId)
      .limit(1);
  } else {
    return null;
  }

  const [credits] = await datastore.runQuery(query);
  let response = credits.length > 0 ? credits[0].Credits : null;

  if (response == null) {
    await updateUserCredits(userId, userIp, 120);
    response = 120;
  }

  return response;
}

export async function updateUserCredits(
  userId: string | string[] | undefined,
  userIp: string | string[] | undefined,
  credits: number
): Promise<void> {
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
      Credits: credits
    }
  };

  await datastore.save(entity);
}

export async function aggregateUserCredits(
  userId: string | string[] | undefined,
  userIp: string | string[] | undefined,
  credits: number
): Promise<void> {
  if (userId == undefined) {
    return;
  } else if (userId && userId.length > 0) {
    const query = datastore
      .createQuery(namespace, kind)
      .filter('UserId', '=', userId)
      .limit(1);
    const [existingCredits] = await datastore.runQuery(query);
    const currentCredits =
      existingCredits.length > 0 ? existingCredits[0].Credits : 0;
    const newCredits = currentCredits + credits;
    await updateUserCredits(userId, '-', newCredits);
  }
}
