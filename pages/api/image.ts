import { NextApiRequest, NextApiResponse } from 'next';
import callImageApi from '@/services/generateImage';
import { parse, serialize } from 'cookie';
import { saveUserActivity } from '@/functions/saveUserActivity';
import { getLatestActivityByIp } from '@/functions/getLatestActivityByIp';
import { getSubscriptionTier } from '@/functions/getSubscriptionTier';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Parse cookies at the start
  const cookies = parse(req.headers.cookie || '');

  let MAX_REQUESTS_PER_DAY = 20; // Trial limit
  let MAX_REQUESTS_PER_MONTH = 0; // Trial limit

  // Determine MAX_REQUESTS_PER_DAY based on product name and subscription status
  const productName = req.headers['x-product-name'];
  const subscriptionStatus = req.headers['x-subscription-status'];
  const userId = req.headers['x-user-id'];
  const userIp =
    req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  let monthlySubscriber: boolean = false;
  let subscriptionTier: number = 0;
  let result;

  const subscriptionObject = getSubscriptionTier(
    productName,
    subscriptionStatus
  );

  subscriptionTier = subscriptionObject.subscriptionTier;
  MAX_REQUESTS_PER_MONTH = subscriptionObject.maxRequestsPerMonth;
  monthlySubscriber = subscriptionObject.monthlySubscriber;

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

  // Prompt declaration
  const { prompt: imagePrompt } = req.body;

  if (!monthlySubscriber) {
    let currentCount = decodeCount(cookies._owti || 'MA=='); // 'MA==' is Base64 for '0'
    let imageLastRequestDate = cookies._enoi
      ? new Date(cookies._enoi)
      : new Date(0);
    const today = new Date();

    if (currentCount === 0) {
      const latestActivity = await getLatestActivityByIp(userIp, 'img');
      if (
        latestActivity &&
        isSameDay(today, new Date(latestActivity.DateTime))
      ) {
        currentCount = latestActivity.CountedAssetState;
        imageLastRequestDate = new Date(latestActivity.DateTime);
      }
    }

    console.log('Check current count: ', currentCount);
    console.log('Check MAX DAILY count: ', MAX_REQUESTS_PER_DAY);
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
      if (process.env.TEST_MODE && process.env.TEST_MODE === 'true') {
        result =
          'https://storage.googleapis.com/gen-image-storage/4e1805d4-5841-46a9-bdff-fcdf29b2c790.png';
      } else {
        if (subscriptionTier == 1) {
          result = await callImageApi('none', imagePrompt);
        } else if (subscriptionTier == 2) {
          result = await callImageApi('none', imagePrompt);
        } else if (subscriptionTier == 3) {
          result = await callImageApi('none', imagePrompt);
        } else {
          result = await callImageApi('none', imagePrompt);
        }
      }

      if (!result) {
        res.status(500).json({ error: 'An unknown error occurred' });
        return;
      }

      console.log('****** IMAGE RESULT: ********');
      console.log(result);

      let newCount = isSameDay(today, imageLastRequestDate)
        ? currentCount + 1
        : 1;

      console.log('today', today);
      console.log('imageLastRequestDate', imageLastRequestDate);
      console.log('image newCount', newCount);
      console.log('image currentCount', currentCount);

      if (currentCount > newCount) {
        newCount = currentCount + 1;
        console.log('QUERIED image newCount', newCount);
      }

      res.setHeader('Set-Cookie', [
        serialize('_owti', encodeCount(newCount), {
          path: '/',
          maxAge: 86400,
          httpOnly: true,
          secure: true
        }),
        serialize('_enoi', today.toISOString(), {
          path: '/',
          maxAge: 86400,
          httpOnly: true,
          secure: true
        })
      ]);

      // Data save
      const activityResponse = await saveUserActivity({
        AssetSource: '',
        AssetType: 'img',
        CountedAssetPreviousState: currentCount,
        CountedAssetState: newCount,
        CreatedAssetUrl: result,
        DateTime: new Date().toISOString(),
        Prompt: imagePrompt,
        SubscriptionTier: subscriptionTier,
        UserId: userId,
        UserIp: userIp
      });

      console.log('Data saved: ', activityResponse);

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
    let currentCount = decodeCount(cookies._mem4i || 'MA=='); // 'MA==' is Base64 for '0'
    const imageLastRequestDate = cookies._mem3i
      ? new Date(cookies._mem3i)
      : new Date(0);
    const today = new Date();

    console.log('Check current count: ', currentCount);
    console.log('Check MONTHLY MAX count: ', MAX_REQUESTS_PER_MONTH);

    if (currentCount === 0) {
      const latestActivity = await getLatestActivityByIp(userIp, 'img');
      if (
        latestActivity &&
        isSameMonth(today, new Date(latestActivity.DateTime))
      ) {
        currentCount = latestActivity.CountedAssetState;
      }
    }

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
      if (process.env.TEST_MODE && process.env.TEST_MODE === 'true') {
        result =
          'https://storage.googleapis.com/gen-image-storage/4e1805d4-5841-46a9-bdff-fcdf29b2c790.png';
      } else {
        if (subscriptionTier == 1) {
          result = await callImageApi('none', imagePrompt);
        } else if (subscriptionTier == 2) {
          result = await callImageApi('none', imagePrompt);
        } else if (subscriptionTier == 3) {
          result = await callImageApi('none', imagePrompt);
        } else {
          result = await callImageApi('none', imagePrompt);
        }
      }

      if (!result) {
        res.status(500).json({ error: 'An unknown error occurred' });
        return;
      }

      console.log('****** IMAGE RESULT: ********');
      console.log(result);

      let newCount = isSameMonth(today, imageLastRequestDate)
        ? currentCount + 1
        : 1;

      console.log('member today', today);
      console.log('member imageLastRequestDate', imageLastRequestDate);
      console.log('member image newCount', newCount);
      console.log('member image currentCount', currentCount);

      if (currentCount > newCount) {
        newCount = currentCount + 1;
        console.log('QUERIED member image newCount', newCount);
      }

      res.setHeader('Set-Cookie', [
        serialize('_mem4i', encodeCount(newCount), {
          path: '/',
          maxAge: 5184000,
          httpOnly: true,
          secure: true
        }),
        serialize('_mem3i', today.toISOString(), {
          path: '/',
          maxAge: 5184000,
          httpOnly: true,
          secure: true
        })
      ]);

      // Data save
      const activityResponse = await saveUserActivity({
        AssetSource: '',
        AssetType: 'img',
        CountedAssetPreviousState: currentCount,
        CountedAssetState: newCount,
        CreatedAssetUrl: result,
        DateTime: new Date().toISOString(),
        Prompt: imagePrompt,
        SubscriptionTier: subscriptionTier,
        UserId: userId,
        UserIp: userIp
      });

      console.log('Data saved: ', activityResponse);

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
