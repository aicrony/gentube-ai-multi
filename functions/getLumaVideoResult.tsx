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
  // TODO: Storage for GCP, which requires higher security - https://cloud.google.com/run/docs/configuring/services/environment-variables
  // const storage = new Storage({ keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS });

  // Storage for Vercel
  const storage = new Storage({
    credentials: google_app_creds
  });

  const bucketName = process.env.GCLOUD_BUCKET_NAME;
  const bucket = storage.bucket(`${bucketName}`);

  const file = bucket.file(fileName);
  await file.save(videoData, {
    metadata: { contentType: 'video/mp4' }
  });
  // await file.makePublic(); // Make the file publicly accessible
  return `https://storage.googleapis.com/${bucketName}/${fileName}`;
}

export async function pingUntilVideoCompleted(
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
        console.log('Video generation is completed.');
        console.log('Video URL:', response.data.assets.video);
        return response.data.assets.video;
      }

      if (state === 'failed') {
        console.log('Video generation did NOT complete.');
        return null;
      }

      console.log(`Current state: ${state}. Retrying in 10 seconds...`);
      await new Promise((resolve) => setTimeout(resolve, 100000));
    } catch (error) {
      console.error('An error occurred while pinging the URL:', error);
      throw error;
    }
  }
}
