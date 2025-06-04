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
    console.log('Image webhook request body:', body);

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
      console.log('Queue Record AssetSource (original image URL):', userQueueRecord?.AssetSource);
      console.log('New edited image URL:', body.payload.images[0].url);

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
            // Create a new user activity record for the edited image instead of updating the original
            const newActivityKey = datastore.key({
              namespace: 'GenTube',
              path: ['UserActivity']
            });

            // Save image to GCloud bucket first
            let imageUrl = body.payload.images[0].url;
            try {
              // Import dynamically to avoid issues with circular dependencies
              const { default: uploadImageToGCSFromUrl } = await import('@/utils/gcloud/uploadImage');
              // Upload to GCS and get the new URL
              imageUrl = await uploadImageToGCSFromUrl('gen-image-storage', body.payload.images[0].url);
              console.log('Image saved to GCS bucket:', imageUrl);
            } catch (uploadError) {
              console.error('Error uploading image to GCS bucket:', uploadError);
              // Continue with original URL if upload fails
              console.log('Continuing with original URL:', body.payload.images[0].url);
            }

            const newActivity = {
              AssetSource: userActivity.AssetSource, // Keep reference to original image
              AssetType: 'img', // Mark as completed image
              CountedAssetPreviousState: userActivity.CountedAssetPreviousState,
              CountedAssetState: userActivity.CountedAssetState,
              CreatedAssetUrl: imageUrl, // Use GCS URL if upload succeeded, otherwise original URL
              DateTime: new Date().toISOString(), // New timestamp for edited image
              Prompt: userActivity.Prompt, // Keep the edit prompt
              SubscriptionTier: 0, // Start with default gallery setting
              UserId: userActivity.UserId,
              UserIp: userActivity.UserIp
            };

            // Save the new edited image record
            transaction.save({
              key: newActivityKey,
              data: newActivity
            });

            // Update the original queue record to mark it as processed
            userActivity.AssetType = 'processed'; // Mark original as processed but don't change URL
            transaction.save({
              key: userActivityKey,
              data: userActivity
            });

            await transaction.commit();
            console.log('New UserActivity created for edited image and original marked as processed');
          } else {
            console.error('UserActivity not found');
            await transaction.rollback();
          }
        } catch (error) {
          console.error('Error creating new UserActivity for edited image:', error);
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
