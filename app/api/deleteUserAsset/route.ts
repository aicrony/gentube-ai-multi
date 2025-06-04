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
    let { userId, assetUrl, assetType, entityId } = body;

    console.log('DELETE userId:', userId);
    console.log('DELETE assetUrl:', assetUrl);
    console.log('DELETE assetType:', assetType);
    console.log('DELETE entityId:', entityId);

    if (!userId || !assetType || (!assetUrl && !entityId)) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: need userId, assetType, and either assetUrl or entityId'
        },
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

      // Only attempt to delete from storage if it's a physical asset (not a queued item)
      if (assetType !== 'que' && assetType !== 'err' && bucketName !== 'none') {
        const bucket = storage.bucket(bucketName);
        console.log('DELETE bucketname:', bucketName);
        if (!error) {
          const fileName = assetUrl.split('/').pop();
          console.log('DELETE fileName:', fileName);
          await bucket.file(fileName).delete();
        }
      } else {
        console.log('Skipping physical file deletion for queued or error item');
      }
    } catch (error) {
      console.log('Error deleting asset:', error);
      // Continue anyway since we still want to delete the database entry
    }

    try {
      if (assetUrl && typeof assetUrl !== 'string') {
        assetUrl = JSON.stringify(assetUrl);
      }

      // Prefer entity ID for deletion if available, fall back to assetUrl
      if (entityId) {
        try {
          await deleteUserActivity(userId, undefined, entityId);
          console.log('DELETE deleteUserActivity by entityId:', entityId);
        } catch (error) {
          console.error('Failed to delete by entityId, falling back to URL:', error);
          if (assetUrl) {
            await deleteUserActivity(userId, assetUrl);
            console.log('DELETE deleteUserActivity by url after entityId failure:', assetUrl);
          } else {
            throw new Error('Failed to delete by entityId and no assetUrl provided');
          }
        }
      } else {
        await deleteUserActivity(userId, assetUrl);
        console.log('DELETE deleteUserActivity by url:', assetUrl);
      }

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
