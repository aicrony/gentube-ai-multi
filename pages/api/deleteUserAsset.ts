import type { NextApiRequest, NextApiResponse } from 'next';
import { Storage } from '@google-cloud/storage';
import { deleteUserActivity } from '@/utils/gcloud/deleteUserActivity';

const storage = new Storage();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  const { userId, assetUrl, assetType } = req.body;

  console.log('DELETE userId:', userId);
  console.log('DELETE assetUrl:', assetUrl);
  console.log('DELETE assetType:', assetType);

  if (!userId || !assetUrl || !assetType) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  let bucketName = '';
  if (assetType === 'upl') {
    bucketName = 'gentube-upload-image-storage';
  } else if (assetType === 'img') {
    bucketName = 'gen-image-storage';
  } else if (assetType === 'vid') {
    bucketName = 'gen-video-storage';
  }

  const fileName = assetUrl.split('/').pop();
  console.log('DELETE fileName:', fileName);
  const bucket = storage.bucket(bucketName);
  console.log('DELETE bucketname:', bucketName);

  try {
    await bucket.file(fileName).delete();
  } catch (error) {
    console.error('Error deleting asset:', error);
  }

  try {
    await deleteUserActivity(userId, assetUrl);
    console.log('DELETE deleteUserActivity id:', userId);
    console.log('DELETE deleteUserActivity url:', assetUrl);
    res.status(200).json({ message: 'Asset deleted successfully' });
  } catch (error) {
    console.error('Error deleting user activity:', error);
    res
      .status(500)
      .json({ error: 'An error occurred while deleting the user activity' });
  }
}
