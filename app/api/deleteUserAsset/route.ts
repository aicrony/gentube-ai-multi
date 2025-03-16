import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';
import { deleteUserActivity } from '@/utils/gcloud/deleteUserActivity';
import { google_app_creds } from '@/interfaces/googleCredentials';

const storage = new Storage({
  credentials: google_app_creds
});

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    let { userId, assetUrl, assetType } = body;

    console.log('DELETE userId:', userId);
    console.log('DELETE assetUrl:', assetUrl);
    console.log('DELETE assetType:', assetType);

    if (!userId || !assetUrl || !assetType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
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
      
      return NextResponse.json({ message: 'Asset deleted successfully' });
    } catch (error) {
      console.log('Error deleting user activity:', error);
      return NextResponse.json(
        { error: 'An error occurred while deleting the user activity' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error parsing request body:', error);
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}