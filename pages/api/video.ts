import { NextApiRequest, NextApiResponse } from 'next';
import callRay2VideoApi from '@/services/generateFrontierLumaVideo';
import { serialize } from 'cookie';
import { saveUserActivity } from '@/utils/gcloud/saveUserActivity';
import { getUserCredits, updateUserCredits } from '@/utils/gcloud/userCredits';
import generateFalVideo from '@/services/generateFalVideo';
import { getSubscriptionTier } from '@/functions/getSubscriptionTier';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const userId = req.headers['x-user-id'];
  const userIp =
    req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

  if (req.method !== 'POST') {
    res.status(405).end(); // Method Not Allowed
    console.error('Method Not Allowed on /api/video');
    return;
  }

  const subscriptionObject = getSubscriptionTier();

  const initialCredits = subscriptionObject.initialCredits;

  // Get user credits from the new table
  let userCredits = await getUserCredits(userId, userIp);

  if (userCredits === null) {
    userCredits = initialCredits;
    console.log('Set Initial Credits: ', userCredits);
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
      await new Promise((resolve) => setTimeout(resolve, 20000));
      result =
        'https://storage.cdn-luma.com/dream_machine/fb797f94-8657-4a93-927b-5cd307298827/85eab626-a48e-4c53-92b0-7aa633129478_result.mp4';
      creditCost = 40;
    } else if (imageUrl === 'none') {
      result = await callRay2VideoApi(imageUrl || 'none', videoDescription);
      creditCost = 80;
    } else if (imageUrl !== 'none') {
      result = await generateFalVideo(imageUrl || 'none', videoDescription);
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
