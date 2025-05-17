import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { Storage } from '@google-cloud/storage';
import { google_app_creds } from '@/interfaces/googleCredentials';

// App Router route configuration
export const dynamic = 'force-dynamic';
export const maxDuration = 30; // 30 seconds timeout
export const runtime = 'nodejs';

// Initialize Google Cloud Storage
const storage = new Storage({
  credentials: google_app_creds
});

export async function POST(request: NextRequest) {
  try {
    // Get userId from headers instead of body for security
    const userId = request.headers.get('x-user-id');
    const userIp = request.headers.get('x-forwarded-for') || 'unknown';
    
    // Require both userId and userIp
    if (!userId || userId === 'none') {
      return NextResponse.json(
        { error: 'User ID is required. Please sign in for free credits.' }, 
        { status: 430 } // Custom status code for sign-in required
      );
    }
    
    if (!userIp || userIp === 'unknown') {
      return NextResponse.json(
        { error: 'User IP is required' }, 
        { status: 400 }
      );
    }

    const body = await request.json();
    const { contentType, fileName } = body;

    if (!contentType) {
      return NextResponse.json(
        { error: 'Content type is required' },
        { status: 400 }
      );
    }

    // Generate a unique filename to prevent collisions
    const fileExtension = fileName ? `.${fileName.split('.').pop()}` : '.png';
    const uniqueFileName = `${uuidv4()}${fileExtension}`;
    
    // Get the appropriate bucket
    const bucketName = process.env.GCLOUD_TEMP_PUBLIC_BUCKET_NAME || 'gen-image-storage';
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(uniqueFileName);

    // Create a signed URL for upload
    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: contentType
    });

    // Construct the final URL that will be used after upload
    const finalUrl = `https://storage.googleapis.com/${bucketName}/${uniqueFileName}`;

    return NextResponse.json({ 
      signedUrl,
      finalUrl,
      fileName: uniqueFileName
    });

  } catch (error) {
    console.error('Error generating signed URL:', error);
    return NextResponse.json(
      { error: 'An error occurred while generating the upload URL' },
      { status: 500 }
    );
  }
}