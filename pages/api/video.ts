import { NextApiRequest, NextApiResponse } from 'next';
import callVideoApi from '@/services/generateLumaVideo';
import callHqVideoApi from '@/services/generateFalVideo';
import { parse, serialize } from 'cookie';
import { saveUserActivity } from '@/functions/saveUserActivity';
import { getLatestActivityByIp } from '@/functions/getLatestActivityByIp';
import { getSubscriptionTier } from '@/functions/getSubscriptionTier';
import { getUserCredits, updateUserCredits } from '@/functions/userCredits';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const productName = req.headers['x-product-name'];
  const subscriptionStatus = req.headers['x-subscription-status'];
  const userId = req.headers['x-user-id'];
  const userIp =
    req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

  if (req.method !== 'POST') {
    res.status(405).end(); // Method Not Allowed
    console.error('Method Not Allowed on /api/video');
    return;
  }

  const subscriptionObject = getSubscriptionTier(
    productName,
    subscriptionStatus
  );

  const subscriptionTier = subscriptionObject.subscriptionTier;
  const initialCredits = subscriptionObject.initialCredits;
  const currentSubscriber = subscriptionObject.currentSubscriber;

  console.log('productName (video api): ', productName);
  console.log('subscriptionStatus (video api): ', subscriptionStatus);
  console.log('subscriptionTier (video api): ', subscriptionTier);

  // Get user credits from the new table
  let userCredits = await getUserCredits(userId, userIp);

  if (userCredits === null) {
    userCredits = initialCredits;
    await updateUserCredits(userId, userIp, userCredits);
  }

  console.log('Check credit count: ', userCredits);

  if (userCredits <= 0) {
    console.log('Credit limit exceeded');
    res.status(429).json({
      error: 'Credit limit exceeded. Please subscribe on the PRICING page.'
    });
    return;
  }

  try {
    const videoDescription = req.body.description as string;
    const imageUrl = req.body.url as string | undefined;

    let result;
    if (process.env.TEST_MODE && process.env.TEST_MODE === 'true') {
      result =
        'https://storage.googleapis.com/gen-image-storage/4e1805d4-5841-46a9-bdff-fcdf29b2c790.png';
    } else {
      result = await callVideoApi(imageUrl || 'none', videoDescription);
    }

    console.log('****** VIDEO RESULT: ********');
    console.log(result);

    // Update user credits
    userCredits -= 1;
    await updateUserCredits(userId, userIp, userCredits);

    res.setHeader('Set-Cookie', [
      serialize('_ruofv', encodeCount(userCredits), {
        path: '/',
        maxAge: 86400,
        httpOnly: true,
        secure: true
      })
    ]);

    // Data save
    const activityResponse = await saveUserActivity({
      AssetSource: imageUrl,
      AssetType: 'vid',
      CountedAssetPreviousState: userCredits - 1,
      CountedAssetState: userCredits,
      CreatedAssetUrl: result,
      DateTime: new Date().toISOString(),
      Prompt: videoDescription,
      SubscriptionTier: subscriptionTier,
      UserId: userId,
      UserIp: userIp
    });

    console.log('Data saved: ', activityResponse);

    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(result);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
}

function encodeCount(count: number): string {
  return Buffer.from(count.toString()).toString('base64');
}

function decodeCount(encodedCount: string): number {
  return parseInt(Buffer.from(encodedCount, 'base64').toString('ascii'), 10);
}
