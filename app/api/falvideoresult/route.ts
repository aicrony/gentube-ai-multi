import { NextRequest, NextResponse } from 'next/server';
import { Datastore } from '@google-cloud/datastore';
import { google_app_creds } from '@/interfaces/googleCredentials';
import { getLatestActivityByRequestId } from '@/utils/gcloud/getUserActivityByRequestId';

const datastore = new Datastore({
  projectId: google_app_creds.projectId,
  credentials: google_app_creds
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Video webhook request body:', body);

    // Get the status from the request body
    const status = body.status;
    console.log('Status:', status);

    if (status === 'ERROR') {
      const userQueueRecord = await getLatestActivityByRequestId(
        body.request_id
      );

      console.log('userQueueRecord on ERROR: ' + userQueueRecord);

      if (userQueueRecord && userQueueRecord.UserId) {
        console.log('Queue Record - UserId:', userQueueRecord.UserId);

        const transaction = datastore.transaction();
        const userActivityKey = datastore.key({
          namespace: 'GenTube',
          path: ['UserActivity', datastore.int(Number(userQueueRecord.id))]
        });

        console.log(
          'userActivityKey on ERROR: ' + JSON.stringify(userActivityKey)
        );

        try {
          await transaction.run();
          const [userActivity] = await transaction.get(userActivityKey);

          console.log('userActivity: ', userActivity);

          if (userActivity) {
            userActivity.AssetType = 'err';
            transaction.save({
              key: userActivityKey,
              data: userActivity
            });
            await transaction.commit();
            console.log('UserActivity updated successfully with ERROR');
          } else {
            console.error('UserActivity not found');
            await transaction.rollback();
          }
        } catch (error) {
          console.error('Error updating UserActivity:', error);
          await transaction.rollback();
        }
      }
    } else if (body.request_id && body.status === 'OK' && body.error === null) {
      console.log('Request ID:', body.request_id);
      console.log('Status:', body.status);
      console.log('Incoming Payload: ', JSON.stringify(body.payload));

      const userQueueRecord = await getLatestActivityByRequestId(
        body.request_id
      );

      console.log('Queue Record:', JSON.stringify(userQueueRecord));

      if (userQueueRecord && userQueueRecord.UserId) {
        console.log('Queue Record - UserId:', userQueueRecord.UserId);

        const transaction = datastore.transaction();
        const userActivityKey = datastore.key({
          namespace: 'GenTube',
          path: ['UserActivity', datastore.int(Number(userQueueRecord.id))]
        });

        console.log('userActivityKey: ' + JSON.stringify(userActivityKey));

        try {
          await transaction.run();
          const [userActivity] = await transaction.get(userActivityKey);

          console.log('userActivity: ', userActivity);

          if (userActivity) {
            // Save video to GCloud bucket first
            let videoUrl = body.payload.video.url;
            try {
              // Import dynamically to avoid issues with circular dependencies
              const { default: uploadImageToGCSFromUrl } = await import('@/utils/gcloud/uploadImage');
              // Upload to GCS and get the new URL
              videoUrl = await uploadImageToGCSFromUrl('gen-video-storage', body.payload.video.url);
              console.log('Video saved to GCS bucket:', videoUrl);
            } catch (uploadError) {
              console.error('Error uploading video to GCS bucket:', uploadError);
              // Continue with original URL if upload fails
              console.log('Continuing with original URL:', body.payload.video.url);
            }
            
            userActivity.CreatedAssetUrl = videoUrl;
            userActivity.AssetType = 'vid';
            transaction.save({
              key: userActivityKey,
              data: userActivity
            });
            await transaction.commit();
            console.log('UserActivity updated successfully with video URL:', videoUrl);
          } else {
            console.error('UserActivity not found');
            await transaction.rollback();
          }
        } catch (error) {
          console.error('Error updating UserActivity:', error);
          await transaction.rollback();
        }
      }
    } else {
      console.error('Invalid data received');
      return NextResponse.json(
        { message: 'Invalid data received' },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: 'Data received successfully' });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Error processing request' },
      { status: 500 }
    );
  }
}
