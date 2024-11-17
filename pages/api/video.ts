import { NextApiRequest, NextApiResponse } from 'next';
import callVideoApi from '@/services/generateLumaVideo';
import { parse, serialize } from 'cookie';

const MAX_REQUESTS_PER_DAY = 10;

export const config = {
  maxDuration: 120
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.status(405).end(); // Method Not Allowed
    console.error('Method Not Allowed on /api/video');
    return null;
  }
  const cookies = parse(req.headers.cookie || '');
  const currentCount = parseInt(cookies.videoRequestCount || '0', 10);
  const videoLastRequestDate = cookies.videoLastRequestDate
    ? new Date(cookies.videoLastRequestDate)
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
    const videoDescription = req.query.description as string;
    const imageUrl = req.query.url as string | undefined;
    const result = await callVideoApi(imageUrl || 'none', videoDescription);
    //const result = { videoUrl: 'https://www.youtube.com/watch?v=6n3pFFPSlW4' };

    const newCount = isSameDay(today, videoLastRequestDate)
      ? currentCount + 1
      : 1;

    console.log('today', today);
    console.log('videoLastRequestDate', videoLastRequestDate);
    console.log('newCount', newCount);
    console.log('currentCount', currentCount);

    res.setHeader('Set-Cookie', [
      serialize('videoRequestCount', newCount.toString(), {
        path: '/',
        maxAge: 86400,
        httpOnly: true,
        secure: true
      }),
      serialize('videoLastRequestDate', today.toISOString(), {
        path: '/',
        maxAge: 86400,
        httpOnly: true,
        secure: true
      })
    ]);

    res.status(200).send(result);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}
