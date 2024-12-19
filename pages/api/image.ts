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
  let MAX_REQUESTS_PER_DAY = 20; // Trial limit
  let MAX_REQUESTS_PER_MONTH = 0; // Trial limit

  // Determine MAX_REQUESTS_PER_DAY based on product name and subscription status
  const productName = req.headers['x-product-name'];
  const subscriptionStatus = req.headers['x-subscription-status'];
  let monthlySubscriber: boolean = false;
  let subscriptionTier;

  if (productName === '"Image Creator"' && subscriptionStatus === '"active"') {
    MAX_REQUESTS_PER_MONTH = 200; // Subscription limit - count monthly
    monthlySubscriber = true;
    subscriptionTier = 1;
  } else if (
    productName === '"Video Creator"' &&
    subscriptionStatus === '"active"'
  ) {
    MAX_REQUESTS_PER_MONTH = 200; // Subscription limit - count monthly
    monthlySubscriber = true;
    subscriptionTier = 2;
  } else if (
    productName === '"HQ Video Creator"' &&
    subscriptionStatus === '"active"'
  ) {
    MAX_REQUESTS_PER_MONTH = 220; // Subscription limit - count monthly
    monthlySubscriber = true;
    subscriptionTier = 3;
  } else {
    subscriptionTier = 0;
  }

  console.log('productName (image api): ', productName);
  console.log('subscriptionStatus (image api): ', subscriptionStatus);
  console.log('subscriptionTier (image api): ', subscriptionTier);
  console.log('MAX_REQUESTS_PER_DAY (image api): ', MAX_REQUESTS_PER_DAY);
  console.log('MAX_REQUESTS_PER_MONTH (image api): ', MAX_REQUESTS_PER_MONTH);

  if (req.method !== 'POST') {
    res.status(405).end(); // Method Not Allowed
    console.error('Method Not Allowed on /api/image');
    return;
  }

  // Cookies declaration
  const cookies = parse(req.headers.cookie || '');

  if (!monthlySubscriber) {
    const currentCount = decodeCount(cookies._owt || 'MA=='); // 'MA==' is Base64 for '0'
    const imageLastRequestDate = cookies._eno
      ? new Date(cookies._eno)
      : new Date(0);
    const today = new Date();
    console.log('today', today);
    console.log('imageLastRequestDate', imageLastRequestDate);

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
      let result;
      if (subscriptionTier == 1) {
        result = await callImageApi('none', imagePrompt);
      } else if (subscriptionTier == 2) {
        result = await callImageApi('none', imagePrompt);
      } else if (subscriptionTier == 3) {
        result = await callImageApi('none', imagePrompt);
      } else {
        result = await callImageApi('none', imagePrompt);
      }

      if (!result) {
        res.status(500).json({ error: 'An unknown error occurred' });
        return;
      }

      console.log('****** IMAGE RESULT: ********');
      console.log(result);

      const newCount = isSameDay(today, imageLastRequestDate)
        ? currentCount + 1
        : 1;

      console.log('today', today);
      console.log('imageLastRequestDate', imageLastRequestDate);
      console.log('image newCount', newCount);
      console.log('image currentCount', currentCount);

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
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'An unknown error occurred' });
      }
    }
  }

  if (monthlySubscriber) {
    const currentCount = decodeCount(cookies._mem4 || 'MA=='); // 'MA==' is Base64 for '0'
    const imageLastRequestDate = cookies._mem3
      ? new Date(cookies._mem3)
      : new Date(0);
    const today = new Date();

    if (
      currentCount >= MAX_REQUESTS_PER_MONTH &&
      isSameMonth(today, imageLastRequestDate)
    ) {
      console.log('Monthly IMAGE request limit exceeded');
      res.status(429).json({
        error:
          'Monthly IMAGE request limit exceeded. Please contact support@eekotech.com to increase your credits.'
      });
      return;
    }

    try {
      const { prompt: imagePrompt } = req.body;
      let result;
      if (subscriptionTier == 1) {
        result = await callImageApi('none', imagePrompt);
      } else if (subscriptionTier == 2) {
        result = await callImageApi('none', imagePrompt);
      } else if (subscriptionTier == 3) {
        result = await callImageApi('none', imagePrompt);
      } else {
        result = await callImageApi('none', imagePrompt);
      }

      if (!result) {
        res.status(500).json({ error: 'An unknown error occurred' });
        return;
      }

      console.log('****** IMAGE RESULT: ********');
      console.log(result);

      const newCount = isSameMonth(today, imageLastRequestDate)
        ? currentCount + 1
        : 1;

      console.log('member today', today);
      console.log('member imageLastRequestDate', imageLastRequestDate);
      console.log('member image newCount', newCount);
      console.log('member image currentCount', currentCount);

      res.setHeader('Set-Cookie', [
        serialize('_mem4', encodeCount(newCount), {
          path: '/',
          maxAge: 5184000,
          httpOnly: true,
          secure: true
        }),
        serialize('_mem3', today.toISOString(), {
          path: '/',
          maxAge: 5184000,
          httpOnly: true,
          secure: true
        })
      ]);

      res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'An unknown error occurred' });
      }
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

function isSameMonth(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth()
  );
}
