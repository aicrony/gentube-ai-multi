import { Datastore } from '@google-cloud/datastore';
import { google_app_creds } from '@/interfaces/googleCredentials';
import { normalizeIp, localIpConfig } from '@/utils/ipUtils';
import type { NextApiRequest, NextApiResponse } from 'next';
require('dotenv').config();

const datastore = new Datastore({
  projectId: google_app_creds.projectId,
  credentials: google_app_creds
});

const kind = 'UserCredits';
const namespace = 'GenTube';

export default async function getUserCredits(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const { userId, userIp } = req.query;

  try {
    const normalizedIpAddress = normalizeIp(localIpConfig(userIp as string));
    let query;
    if (userId != undefined && userId.length > 0) {
      console.log('Query 1');
      query = datastore
        .createQuery(namespace, kind)
        .filter('UserId', '=', userId)
        .limit(1);
    } else if (
      normalizedIpAddress != undefined &&
      normalizedIpAddress.length > 0 &&
      (userId == undefined || userId.length == 0)
    ) {
      console.log('Query 2');
      query = datastore
        .createQuery(namespace, kind)
        .filter('UserIp', '=', normalizedIpAddress)
        .limit(1);
    } else if (
      userId != undefined &&
      userId.length > 0 &&
      normalizedIpAddress != undefined &&
      normalizedIpAddress.length > 0
    ) {
      console.log('Query 3');
      query = datastore
        .createQuery(namespace, kind)
        .filter('UserId', '=', userId)
        .filter('UserIp', '=', normalizedIpAddress)
        .limit(1);
    } else {
      console.log('Invalid userId and normalizedIpAddress');
      res.status(400).json({ error: 'Invalid userId and normalizedIpAddress' });
      return;
    }

    const [credits] = await datastore.runQuery(query);
    let response = credits.length > 0 ? credits[0].Credits : null;
    console.log('getUserCredits response: ', response);

    res.status(200).json({ credits: response });
  } catch (e) {
    console.log('Error: ' + e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
