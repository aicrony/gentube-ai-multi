import { NextApiRequest, NextApiResponse } from 'next';
import callVideoApi from '@/services/generateLumaVideo';
import callHqVideoApi from '@/services/generateFalVideo';
import { serialize } from 'cookie';
import { saveUserActivity } from '@/utils/gcloud/saveUserActivity';
import { getSubscriptionTier } from '@/functions/getSubscriptionTier';
import { getUserCredits, updateUserCredits } from '@/utils/gcloud/userCredits';

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

  // Get user credits from the new table
  let userCredits = await getUserCredits(userId, userIp);

  if (userCredits === null) {
    userCredits = 120;
    await updateUserCredits(userId, userIp, userCredits);
  }

  console.log('Check credit count: ', userCredits);

  if (userCredits <= 0) {
    console.log('Credit limit exceeded');
    res.status(429).json({
      error: 'Credit limit exceeded. Purchase credits on the PRICING page.'
    });
    return;
  }

  try {
    // Prompt declaration
    const videoDescription = req.body.description as string;
    const imageUrl = (req.body.url as string) || 'none';
    let creditCost = 100;

    let result;
    if (process.env.TEST_MODE && process.env.TEST_MODE === 'true') {
      result =
        'https://storage.googleapis.com/gen-image-storage/4e1805d4-5841-46a9-bdff-fcdf29b2c790.png';
      creditCost = 40;
    } else if (imageUrl === 'none') {
      result = await callVideoApi(imageUrl || 'none', videoDescription);
      creditCost = 40;
    } else if (imageUrl !== 'none') {
      result = await callHqVideoApi(imageUrl || 'none', videoDescription);
      creditCost = 50;
    }

    console.log('****** VIDEO RESULT: ********');
    // Check for error response code
    if (result.error) {
      res.status(result.error.code).json({ error: result.error.message });
      return;
    }
    console.log(result);

    // Update user credits
    userCredits -= creditCost;
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
      CountedAssetPreviousState: creditCost,
      CountedAssetState: userCredits,
      CreatedAssetUrl: result,
      DateTime: new Date().toISOString(),
      Prompt: videoDescription,
      SubscriptionTier: 0,
      UserId: userId,
      UserIp: userIp
    });

    console.log('Data saved: ', activityResponse);

    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ result, userCredits });
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
