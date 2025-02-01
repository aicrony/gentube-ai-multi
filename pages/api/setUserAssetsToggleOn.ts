import { NextApiRequest, NextApiResponse } from 'next';
import { toggleOnGallery } from '@/utils/gcloud/userGalleryToggle';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.status(405).end(); // Method Not Allowed
    return;
  }

  const { userId, assetUrl } = req.body;

  console.log('userId:', userId);
  console.log('assetUrl:', assetUrl);

  try {
    const assets = await toggleOnGallery(userId as string, assetUrl as string);
    res.status(200).json({ assets });
  } catch (error) {
    console.error('Failed to fetch user assets:', error);
    res.status(500).json({ error: 'Failed to fetch user assets' });
  }
}
