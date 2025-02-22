import { NextApiRequest, NextApiResponse } from 'next';
import callImageApi from '@/services/generateImage';
import { parse, serialize } from 'cookie';
import { saveUserActivity } from '@/utils/gcloud/saveUserActivity';
import { getSubscriptionTier } from '@/functions/getSubscriptionTier';
import { getUserCredits, updateUserCredits } from '@/utils/gcloud/userCredits';

type ImageApiResult = {
  error?: {
    code: number;
    message: string;
  };
  url?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const userId = req.headers['x-user-id'];
  const userIp =
    req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

  if (req.method !== 'POST') {
    res.status(405).end(); // Method Not Allowed
    console.error('Method Not Allowed on /api/image');
    return;
  }

  const subscriptionObject = getSubscriptionTier();

  const initialCredits = subscriptionObject.initialCredits;

  // Get user credits from the new table
  console.log('userId: ', userId);
  console.log('userIp: ', userIp);
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
    const { prompt: imagePrompt } = req.body;
    // const imageUrl = req.body.url as string | '';
    let creditCost = 100;

    let result: string | ImageApiResult;
    if (process.env.TEST_MODE && process.env.TEST_MODE === 'true') {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      result =
        'https://storage.googleapis.com/gentube-upload-image-storage/5b5fe70c-e0f0-4ed1-bf64-42a3bc71fd0c.png';
    } else {
      result = (await callImageApi('none', imagePrompt)) as ImageApiResult;
    }
    creditCost = 4;
    console.log('****** IMAGE RESULT: ********');
    console.log(JSON.stringify(result));

    // Update user credits
    userCredits -= creditCost;
    console.log('UPDATED User Credits: ', userCredits);
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
      id: undefined,
      AssetSource: '',
      AssetType: 'img',
      CountedAssetPreviousState: creditCost,
      CountedAssetState: userCredits,
      CreatedAssetUrl: result,
      DateTime: new Date().toISOString(),
      Prompt: imagePrompt,
      SubscriptionTier: 0 /**/,
      UserId: userId,
      UserIp: userIp
    });

    console.log('Image Data saved: ', activityResponse);

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
