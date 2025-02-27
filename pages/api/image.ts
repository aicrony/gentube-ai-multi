import { NextApiRequest, NextApiResponse } from 'next';

import { processUserImageRequest } from '@/utils/gcloud/processUserImageRequest';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const userId = req.headers['x-user-id'];
  const userIp =
    req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  let prompt: string = 'X';
  if (req.method !== 'POST') {
    res.status(405).end(); // Method Not Allowed
    console.error('Method Not Allowed on /api/image');
    return;
  }

  // const subscriptionObject = getSubscriptionTier();

  // const initialCredits = subscriptionObject.initialCredits;

  try {
    // Get user credits from the new table
    console.log('userId: ', userId);
    console.log('userIp: ', userIp);
    console.log('prompt: ', req.body.prompt);
    prompt = req.body.prompt ? req.body.prompt : '';
    console.log('Prompt OK');

    const userResponse = await processUserImageRequest(userId, userIp, prompt);

    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(userResponse);
    res.status(200);
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
