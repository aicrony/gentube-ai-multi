import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { Storage } from '@google-cloud/storage';
import { google_app_creds } from '@/interfaces/googleCredentials';

require('dotenv').config();

const storage = new Storage({
  credentials: google_app_creds
});

function getBucketName(bucketName: string | undefined) {
  if (bucketName == 'default') {
    bucketName = 'gen-image-storage';
  }
  return bucketName;
}

function setBucketFile(fileName: string, bucketName: string | undefined) {
  if (bucketName != null) {
    const gcsBucket = storage.bucket(bucketName);
    return gcsBucket.file(fileName);
  }
  throw new Error('Bucket name is required');
}

export async function uploadImageToGCSFromBase64(
  bucketName: string | undefined,
  base64data: string
): Promise<string> {
  const imageBuffer = Buffer.from(base64data, 'base64');
  const fileName = `${uuidv4()}.png`;

  bucketName = getBucketName(bucketName);
  const file = setBucketFile(fileName, bucketName);

  await new Promise((resolve, reject) => {
    const stream = file.createWriteStream({
      metadata: {
        contentType: 'image/png'
      }
      // Removed predefinedAcl: 'publicRead' as it's incompatible with uniform bucket-level access
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
  bucketName: string | undefined,
  imageUrl: string
): Promise<string> {
  console.log('IMAGE GOING TO GCS: ' + imageUrl);

  // Generate a unique filename to prevent collisions
  const urlParts = new URL(imageUrl);
  const pathParts = urlParts.pathname.split('/');
  const originalFileName = pathParts[pathParts.length - 1];
  const fileExtension = originalFileName.includes('.') ? 
    originalFileName.substring(originalFileName.lastIndexOf('.')) : '.png';
  const fileName = `${uuidv4()}${fileExtension}`;

  bucketName = getBucketName(bucketName);
  const file = setBucketFile(fileName, bucketName);

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
          // Removed predefinedAcl: 'publicRead' as it's incompatible with uniform bucket-level access
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
