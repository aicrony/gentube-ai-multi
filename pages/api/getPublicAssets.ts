import { NextApiRequest, NextApiResponse } from 'next';
import { getPublicAssets } from '@/utils/gcloud/userAssets';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.status(405).end(); // Method Not Allowed
    return;
  }

  const { limit = 100, offset = 0 } = req.query;

  try {
    const assetUrls = await getPublicAssets(Number(limit), Number(offset));
    res.status(200).json(assetUrls);
  } catch (error) {
    console.error('Failed to fetch public assets:', error);
    res.status(500).json({ error: 'Failed to fetch public assets' });
  }
}
