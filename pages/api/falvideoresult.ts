import { NextApiRequest, NextApiResponse } from 'next';
import { getLatestActivityByRequestId } from '@/utils/gcloud/getUserActivityByRequestId';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.status(405).end(); // Method Not Allowed
    console.error('Method Not Allowed on /api/falvideoresult');
    return;
  }

  console.log('Webhook data upon completion:', req.body);

  if (req.body.requestId && req.body.status === 'OK') {
    console.log('Request ID:', req.body.requestId);
    console.log('Status:', req.body.status);
    const userQueueRecord = await getLatestActivityByRequestId(
      req.body.requestId
    );
    console.log('Queue Record:', JSON.stringify(userQueueRecord));

    if (userQueueRecord && userQueueRecord.UserId) {
      console.log('Queue Record - UserId:', userQueueRecord.UserId);
    }
  } else {
    console.error('Invalid data received');
    res.status(400).json({ message: 'Invalid data received' });
    return;
  }

  res.status(200).json({ message: 'Data received successfully' });
}
