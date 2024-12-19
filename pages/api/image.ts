import { NextApiRequest, NextApiResponse } from 'next';
import callImageApi from '@/services/generateImage';
import { parse, serialize } from 'cookie';

export const config = {
  maxDuration: 120
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  let MAX_REQUESTS_PER_DAY = 20;

  // Determine MAX_REQUESTS_PER_DAY based on product name and subscription status
  const productName = req.headers['x-product-name'];
  const subscriptionStatus = req.headers['x-subscription-status'];

  if (productName === '"Image Creator"' && subscriptionStatus === '"active"') {
    MAX_REQUESTS_PER_DAY = 50;
  } else if (
    productName === '"Video Creator"' &&
    subscriptionStatus === '"active"'
  ) {
    MAX_REQUESTS_PER_DAY = 50;
  }

  console.log('productName (image api): ', productName);
  console.log('subscriptionStatus (image api): ', subscriptionStatus);
  console.log('MAX_REQUESTS_PER_DAY (image api): ', MAX_REQUESTS_PER_DAY);

  if (req.method !== 'POST') {
    res.status(405).end(); // Method Not Allowed
    console.error('Method Not Allowed on /api/image');
    return;
  }

  const cookies = parse(req.headers.cookie || '');
  const currentCount = decodeCount(cookies._owt || 'MA=='); // 'MA==' is Base64 for '0'
  const imageLastRequestDate = cookies._eno
    ? new Date(cookies._eno)
    : new Date(0);
  const today = new Date();
  console.log('today', today);
  console.log('imageLastRequestDate', imageLastRequestDate);
  console.log('currentCount', currentCount);

  if (
    currentCount >= MAX_REQUESTS_PER_DAY &&
    isSameDay(today, imageLastRequestDate)
  ) {
    console.log('Daily IMAGE request limit exceeded');
    res.status(429).json({
      error:
        'Daily IMAGE request limit exceeded. Please subscribe on the PRICING page.'
    });
    return;
  }

  try {
    const { prompt: imagePrompt } = req.body;
    const result = await callImageApi('none', imagePrompt);

    const newCount = isSameDay(today, imageLastRequestDate)
      ? currentCount + 1
      : 1;
    res.setHeader('Set-Cookie', [
      serialize('_owt', encodeCount(newCount), {
        path: '/',
        maxAge: 86400,
        httpOnly: true,
        secure: true
      }),
      serialize('_eno', today.toISOString(), {
        path: '/',
        maxAge: 86400,
        httpOnly: true,
        secure: true
      })
    ]);

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Response code 400')) {
        res.status(400).json({ error: 'Bad Request: Invalid image prompt' });
      } else {
        res.status(500).json({ error: error.message });
      }
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

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}
