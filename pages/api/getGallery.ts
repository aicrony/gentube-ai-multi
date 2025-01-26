import { NextApiRequest, NextApiResponse } from 'next';
import { Storage } from '@google-cloud/storage';
import { google_app_creds } from '@/interfaces/googleCredentials';

const storage = new Storage({
  credentials: google_app_creds
});

const bucketName = 'gen-image-storage';
const gcsBucket = storage.bucket(bucketName);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const [files] = await gcsBucket.getFiles({ maxResults: 100 });
    const imageUrls = files.map(
      (file) => `https://storage.googleapis.com/${bucketName}/${file.name}`
    );
    res.status(200).json(imageUrls);
  } catch (error) {
    console.error('Error fetching images from GCS:', error);
    res.status(500).json({ error: 'Error fetching images from GCS' });
  }
}
