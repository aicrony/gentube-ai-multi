import { NextApiRequest, NextApiResponse } from 'next';
import { callImageApi } from '@/services/generateImage';
import { parse, serialize } from 'cookie';

const MAX_REQUESTS_PER_DAY = 20;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const cookies = parse(req.headers.cookie || '');
  const currentCount = parseInt(cookies.imageRequestCount || '0', 10);
  const imageLastRequestDate = cookies.imageLastRequestDate
    ? new Date(cookies.imageLastRequestDate)
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
    const imagePrompt = req.query.prompt;
    const result = await callImageApi(imagePrompt);
    // const result = { imageUrl: 'https://www.youtube.com/watch?v=6n3pFFPSlW4' };

    const newCount = isSameDay(today, imageLastRequestDate)
      ? currentCount + 1
      : 1;
    res.setHeader('Set-Cookie', [
      serialize('imageRequestCount', newCount.toString(), {
        path: '/',
        maxAge: 86400,
        httpOnly: true,
        secure: true
      }),
      serialize('imageLastRequestDate', today.toISOString(), {
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

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}
