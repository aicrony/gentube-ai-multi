import { Datastore } from '@google-cloud/datastore';
import { google_app_creds } from '@/interfaces/googleCredentials';
require('dotenv').config();

const datastore = new Datastore({
  projectId: google_app_creds.projectId,
  credentials: google_app_creds
});

const kind = 'UserCredits';
const namespace = 'GenTube';

export async function getUserCredits(
  userId: string | string[] | undefined,
  userIp: string | string[] | undefined
): Promise<number | null> {
  let query;
  const partialIp = getPartialIp(userIp);
  console.log(
    '------------------------- Get User Credits -------------------------'
  );
  console.log('Partial IP: ', partialIp);
  console.log('userIp: ', userIp);
  if (
    userId != undefined &&
    userId.length > 0 &&
    (userIp == undefined || userIp.length == 0)
  ) {
    console.log('Query 1');
    query = datastore
      .createQuery(namespace, kind)
      .filter('UserId', '=', userId)
      .limit(1);
  } else if (
    userIp != undefined &&
    userIp.length > 0 &&
    (userId == undefined || userId.length == 0)
  ) {
    console.log('Query 2');
    query = datastore
      .createQuery(namespace, kind)
      .filter('UserIp', '=', userIp)
      .limit(1);
  } else if (
    userId != undefined &&
    userId.length > 0 &&
    userIp != undefined &&
    userIp.length > 0
  ) {
    console.log('Query 3');
    query = datastore
      .createQuery(namespace, kind)
      .filter('UserId', '=', userId)
      .filter('UserIp', '<=', partialIp)
      .limit(1);
  } else {
    console.log('Invalid userId and userIp');
    return null;
  }

  const [credits] = await datastore.runQuery(query);
  let response = credits.length > 0 ? credits[0].Credits : null;
  console.log('getUserCredits response: ', response);

  return response;
}

export async function updateUserCredits(
  userId: string | string[] | undefined,
  userIp: string | string[] | undefined,
  credits: number
): Promise<void> {
  console.log(
    '+++++++++++++++++++++++++++++ Update User Credits +++++++++++++++++++++++++++++'
  );
  console.log('UserId: ', userId);
  console.log('UserIp: ', userIp);
  const keyValue = [kind, userId ? userId : userIp];
  console.log('KeyValue: ', keyValue);
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

// Helper function to extract the first three octets of the IP address
function getPartialIp(userIp: string | string[] | undefined): string | null {
  if (typeof userIp === 'string') {
    const octets = userIp.split('.');
    if (octets.length >= 3) {
      return `${octets[0]}.${octets[1]}.${octets[2]}`;
    } else {
      return userIp;
    }
  }
  return null;
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
