import type { NextApiRequest, NextApiResponse } from 'next';
import { Storage } from '@google-cloud/storage';
import { deleteUserActivity } from '@/utils/gcloud/deleteUserActivity';
import { google_app_creds } from '@/interfaces/googleCredentials';

const storage = new Storage({
  credentials: google_app_creds
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  let { userId, assetUrl, assetType } = req.body;

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
  } else if (assetType === 'que') {
    bucketName = 'none';
  } else if (assetType === 'err') {
    bucketName = 'none';
  }

  try {
    const error = JSON.parse(JSON.stringify(assetUrl)).error
      ? JSON.parse(JSON.stringify(assetUrl)).error
      : null;
    const bucket = storage.bucket(bucketName);
    console.log('DELETE bucketname:', bucketName);
    if (!error) {
      const fileName = assetUrl.split('/').pop();
      console.log('DELETE fileName:', fileName);
      await bucket.file(fileName).delete();
    }
  } catch (error) {
    console.log('Error deleting asset:', error);
  }

  try {
    if (typeof assetUrl !== 'string') {
      assetUrl = JSON.stringify(assetUrl);
    }
    await deleteUserActivity(userId, assetUrl);
    console.log('DELETE deleteUserActivity id:', userId);
    console.log('DELETE deleteUserActivity url:', assetUrl);
    res.status(200).json({ message: 'Asset deleted successfully' });
  } catch (error) {
    console.log('Error deleting user activity:', error);
    res
      .status(500)
      .json({ error: 'An error occurred while deleting the user activity' });
  }
}
