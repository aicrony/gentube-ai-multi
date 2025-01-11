import { NextApiRequest, NextApiResponse } from 'next';
import { updateUserCredits } from '@/utils/gcloud/userCredits';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.status(405).end(); // Method Not Allowed
    console.error('Method Not Allowed on /api/creditsync');
    return;
  }

  try {
    console.log('Request body:', req.body);
    await updateUserCredits('1234', '-', 17001);
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Sync Webhook handler failed.', error);
    res.status(500).json({ error: 'Sync Webhook handler failed.' });
  }
}
