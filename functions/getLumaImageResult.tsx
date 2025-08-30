import axios from 'axios';
import { Storage } from '@google-cloud/storage';
import { google_app_creds } from '@/interfaces/googleCredentials';
require('dotenv').config();

const apiKey = process.env.LUMA_API_KEY;
const apiEndpoint = process.env.LUMA_API_ENDPOINT;

async function uploadVideoToGCS(
  videoData: Buffer,
  fileName: string
): Promise<string> {
  const storage = new Storage({
    credentials: google_app_creds
  });

  const bucketName = process.env.GCLOUD_DEFAULT_BUCKET_NAME;
  const bucket = storage.bucket(`${bucketName}`);

  const file = bucket.file(fileName);
  await file.save(videoData, {
    metadata: { contentType: 'image/png' }
  });
  // await file.makePublic(); // Make the file publicly accessible
  return `https://storage.googleapis.com/${bucketName}/${fileName}`;
}

export async function pingUntilImageCompleted(
  generationId: string
): Promise<any> {
  const url = `${apiEndpoint}/${generationId}`;
  const headers = {
    accept: 'application/json',
    authorization: `Bearer ${apiKey}`
  };

  while (true) {
    try {
      const response = await axios.get(url, { headers });
      const state = response.data.state;

      if (state === 'completed') {
        console.log('Image generation is completed.');
        console.log('Image URL:', response.data.assets.image);
        return response.data.assets.image;
      }

      console.log(`Current state: ${state}. Retrying in 10 seconds...`);
      await new Promise((resolve) => setTimeout(resolve, 100000));
    } catch (error) {
      console.error('An error occurred while pinging the URL:', error);
      throw error;
    }
  }
}
