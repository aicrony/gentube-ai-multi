import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { Storage } from '@google-cloud/storage';
import { google_app_creds } from '@/interfaces/googleCredentials';
require('dotenv').config();

// TODO: Storage for GCP, which requires higher security - https://cloud.google.com/run/docs/configuring/services/environment-variables
// const storage = new Storage({ keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS });

// Storage for Vercel
const storage = new Storage({
  credentials: google_app_creds
});

const bucketName = 'gen-image-storage';
const gcsBucket = storage.bucket(bucketName);

export async function uploadImageToGCSFromBase64(
  base64data: string
): Promise<string> {
  const imageBuffer = Buffer.from(base64data, 'base64');
  const fileName = `${uuidv4()}.png`;
  const file = gcsBucket.file(fileName);

  await new Promise((resolve, reject) => {
    const stream = file.createWriteStream({
      metadata: {
        contentType: 'image/png'
      }
    });
    stream.on('error', reject);
    stream.on('finish', resolve);
    stream.end(imageBuffer);
  });

  const resultingGcsUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
  console.log(`Image uploaded to GCS: ${resultingGcsUrl}`);
  return resultingGcsUrl;
}

export default async function uploadImageToGCSFromUrl(
  imageUrl: string
): Promise<string> {
  console.log('IMAGE GOING TO GCS: ' + imageUrl);

  const urlParts = new URL(imageUrl);
  const pathParts = urlParts.pathname.split('/');
  const fileName = pathParts[pathParts.length - 1];

  const file = gcsBucket.file(fileName);

  const response = await axios({
    method: 'get',
    url: imageUrl,
    responseType: 'stream'
  });

  await new Promise((resolve, reject) => {
    response.data
      .pipe(
        file.createWriteStream({
          metadata: {
            contentType: 'image/png',
            validation: 'md5'
          }
        })
      )
      .on('error', reject)
      .on('finish', resolve);
  });

  const resultingGcsUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
  console.log(`Image uploaded to GCS: ${resultingGcsUrl}`);
  return resultingGcsUrl;
}

function extractImageName(url: string) {
  const urlParts = new URL(url);
  const pathParts = urlParts.pathname.split('/');
  const extractedImageName = pathParts[pathParts.length - 1];
  console.log('Extracted Image Name: ' + extractedImageName);
  return extractedImageName;
}
