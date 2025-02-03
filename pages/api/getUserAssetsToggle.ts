import { NextApiRequest, NextApiResponse } from 'next';
import { getUserAssetsToggle } from '@/utils/gcloud/userAssetsToggle';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.status(405).end(); // Method Not Allowed
    return;
  }

  const {
    userId,
    limit = 10,
    offset = 0,
    assetType,
    subscriptionTier = 0
  } = req.query;

  try {
    const assets = await getUserAssetsToggle(
      userId as string,
      Number(limit),
      Number(offset),
      assetType as string,
      subscriptionTier as number
    );
    res.status(200).json({ assets });
  } catch (error) {
    console.error('Failed to fetch user assets:', error);
    res.status(500).json({ error: 'Failed to fetch user assets' });
  }
}
