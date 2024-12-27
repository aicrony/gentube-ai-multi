import { NextApiRequest, NextApiResponse } from 'next';
import callVideoApi from '@/services/generateLumaVideo';
import callHqVideoApi from '@/services/generateFalVideo';
import { parse, serialize } from 'cookie';
import { saveUserActivity } from '@/functions/saveUserActivity';

export const config = {
  maxDuration: 120
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  let MAX_REQUESTS_PER_DAY = 10; // Trial limit
  let MAX_REQUESTS_PER_MONTH = 0; // Trial limit

  // Determine MAX_REQUESTS_PER_DAY based on product name and subscription status
  const productName = req.headers['x-product-name'];
  const subscriptionStatus = req.headers['x-subscription-status'];
  const userId = req.headers['x-user-id'];
  let monthlySubscriber: boolean = false;
  let subscriptionTier: number = 0;

  if (productName === '"Image Creator"' && subscriptionStatus === '"active"') {
    MAX_REQUESTS_PER_MONTH = 0; // Detect zero to know they are not on subscription - count daily
    monthlySubscriber = true;
    subscriptionTier = 1;
  } else if (
    productName === '"Video Creator"' &&
    subscriptionStatus === '"active"'
  ) {
    MAX_REQUESTS_PER_MONTH = 100; // Subscription limit - count monthly
    monthlySubscriber = true;
    subscriptionTier = 2;
  } else if (
    productName === '"HQ Video Creator"' &&
    subscriptionStatus === '"active"'
  ) {
    MAX_REQUESTS_PER_MONTH = 120; // Subscription limit - count monthly
    monthlySubscriber = true;
    subscriptionTier = 3;
  }

  console.log('productName (video api): ', productName);
  console.log('subscriptionStatus (video api): ', subscriptionStatus);
  console.log('subscriptionTier (video api): ', subscriptionTier);
  console.log('MAX_REQUESTS_PER_DAY (video api): ', MAX_REQUESTS_PER_DAY);
  console.log('MAX_REQUESTS_PER_MONTH (video api): ', MAX_REQUESTS_PER_MONTH);

  if (req.method !== 'POST') {
    res.status(405).end(); // Method Not Allowed
    console.error('Method Not Allowed on /api/video');
    return;
  }

  // Cookies declaration
  const cookies = parse(req.headers.cookie || '');

  if (!monthlySubscriber) {
    const currentCount = decodeCount(cookies._ruof || 'MA=='); // 'MA==' is Base64 for '0'
    const videoLastRequestDate = cookies._eerht
      ? new Date(cookies._eerht)
      : new Date(0);
    const today = new Date();
    console.log('today', today);
    console.log('videoLastRequestDate', videoLastRequestDate);

    if (
      currentCount >= MAX_REQUESTS_PER_DAY &&
      isSameDay(today, videoLastRequestDate)
    ) {
      console.log('Daily VIDEO request limit exceeded');
      res.status(429).json({
        error:
          'Daily VIDEO request limit exceeded. Please subscribe on the PRICING page.'
      });
      return;
    }

    try {
      const videoDescription = req.body.description as string;
      const imageUrl = req.body.url as string | undefined;
      const result = await callVideoApi(imageUrl || 'none', videoDescription);

      console.log('****** VIDEO RESULT: ********');
      console.log(result);

      const newCount = isSameDay(today, videoLastRequestDate)
        ? currentCount + 1
        : 1;

      console.log('today', today);
      console.log('videoLastRequestDate', videoLastRequestDate);
      console.log('newCount', newCount);
      console.log('currentCount', currentCount);

      res.setHeader('Set-Cookie', [
        serialize('_ruof', encodeCount(newCount), {
          path: '/',
          maxAge: 86400,
          httpOnly: true,
          secure: true
        }),
        serialize('_eerht', today.toISOString(), {
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
        CountedAssetPreviousState: currentCount,
        CountedAssetState: newCount,
        CreatedAssetUrl: result,
        DateTime: new Date().toISOString(),
        Prompt: videoDescription,
        SubscriptionTier: subscriptionTier,
        UserId: userId
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

  if (monthlySubscriber) {
    const currentCount = decodeCount(cookies._mem4 || 'MA=='); // 'MA==' is Base64 for '0'
    const videoLastRequestDate = cookies._mem3
      ? new Date(cookies._mem3)
      : new Date(0);
    const today = new Date();
    console.log('member today', today);
    console.log('member videoLastRequestDate', videoLastRequestDate);

    if (
      currentCount >= MAX_REQUESTS_PER_MONTH &&
      isSameMonth(today, videoLastRequestDate)
    ) {
      console.log('Monthly VIDEO request limit exceeded');
      res.status(429).json({
        error:
          'Daily VIDEO request limit exceeded. Please contact support@eekotech.com to increase your credits.'
      });
      return;
    }

    try {
      const videoDescription = req.body.description as string;
      const imageUrl = req.body.url as string | undefined;
      let result;

      if (subscriptionTier == 1) {
        result = await callVideoApi(imageUrl || 'none', videoDescription);
      } else if (subscriptionTier == 2) {
        result = await callVideoApi(imageUrl || 'none', videoDescription);
      } else if (
        subscriptionTier == 3 &&
        imageUrl &&
        imageUrl !== 'none' &&
        imageUrl.length > 0
      ) {
        result = await callHqVideoApi(imageUrl || 'none', videoDescription);
      } else {
        result = await callVideoApi(imageUrl || 'none', videoDescription);
      }

      if (!result) {
        res.status(500).json({ error: 'An unknown error occurred' });
        return;
      }

      console.log('****** VIDEO RESULT: ********');
      console.log(result);

      const newCount = isSameMonth(today, videoLastRequestDate)
        ? currentCount + 1
        : 1;

      console.log('member today', today);
      console.log('member videoLastRequestDate', videoLastRequestDate);
      console.log('member video newCount', newCount);
      console.log('member video currentCount', currentCount);

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

      // Data save
      const activityResponse = await saveUserActivity({
        AssetSource: imageUrl,
        AssetType: 'vid',
        CountedAssetPreviousState: currentCount,
        CountedAssetState: newCount,
        CreatedAssetUrl: result,
        DateTime: new Date().toISOString(),
        Prompt: videoDescription,
        SubscriptionTier: subscriptionTier,
        UserId: userId
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
