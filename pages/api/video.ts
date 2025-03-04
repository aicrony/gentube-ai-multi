import { NextApiRequest, NextApiResponse } from 'next';
import { processUserVideoRequest } from '@/utils/gcloud/processUserVideoRequest';
import { localIpConfig } from '@/utils/ipUtils';

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

  try {
    // Get user credits from the new table
    console.log('userId: ', userId);
    console.log('userIp: ', localIpConfig(userIp));
    console.log('description: ', req.body.description);
    const videoDescription = req.body.description as string;
    const duration = req.body.duration as string;
    const aspectRatio = req.body.aspectRatio as string;
    const loop = req.body.loop;
    const motion = req.body.motion as string;
    const imageUrl = (req.body.url as string) || 'none';

    const userResponse = await processUserVideoRequest(
      userId,
      userIp,
      videoDescription,
      imageUrl,
      duration,
      aspectRatio,
      loop,
      motion
    );

    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(userResponse);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
}
