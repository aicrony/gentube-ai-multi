import { NextApiRequest, NextApiResponse } from 'next';
import { getUserCredits } from '@/utils/gcloud/userCredits';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.status(405).end(); // Method Not Allowed
    return;
  }

  const { userId } = req.query;

  try {
    const credits = await getUserCredits(userId as string, '-');
    console.log('getUserCredits: ', credits);
    res.status(200).json({ credits });
  } catch (error) {
    console.error('Failed to fetch user credits:', error);
    res.status(500).json({ error: 'Failed to fetch user credits' });
  }
}
