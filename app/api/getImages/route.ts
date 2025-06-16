import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';
import { google_app_creds } from '@/interfaces/googleCredentials';

const storage = new Storage({
  credentials: google_app_creds
});

const bucketName = 'gen-image-storage';
const gcsBucket = storage.bucket(bucketName);

export async function POST(request: NextRequest) {
  try {
    const [files] = await gcsBucket.getFiles({ maxResults: 100 });
    const imageUrls = files.map(
      (file) => `https://storage.googleapis.com/${bucketName}/${file.name}`
    );
    return NextResponse.json(imageUrls);
  } catch (error) {
    console.error('Error fetching images from GCS:', error);
    return NextResponse.json(
      { error: 'Error fetching images from GCS' },
      { status: 500 }
    );
  }
}
