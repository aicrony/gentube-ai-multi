import { NextApiRequest, NextApiResponse } from 'next';
import { Datastore } from '@google-cloud/datastore';
import { google_app_creds } from '@/interfaces/googleCredentials';
import { getLatestActivityByRequestId } from '@/utils/gcloud/getUserActivityByRequestId';

const datastore = new Datastore({
  projectId: google_app_creds.projectId,
  credentials: google_app_creds
});

async function checkExists() {
  const testKey = datastore.key([
    `UserActivity`,
    `cfd04719-410a-487c-950e-6d00a0b9d14b`
  ]);
  const [entity] = await datastore.get(testKey);
  console.log(`Test entity:`, entity);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.status(405).end(); // Method Not Allowed
    console.error('Method Not Allowed on /api/falimageresult');
    return;
  }

  console.log('Image webhook request body:', req.body);

  // console.log('req.body.status: ' + req.body.status);

  // Get the status from the request body
  const status = req.body.status;
  console.log('Status:', status);

  if (status === 'ERROR') {
    const userQueueRecord = await getLatestActivityByRequestId(
      req.body.request_id
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
  } else if (
    req.body.request_id &&
    req.body.status === 'OK' &&
    req.body.error === null
  ) {
    console.log('Request ID:', req.body.request_id);
    console.log('Status:', req.body.status);
    console.log('Incoming Payload: ', JSON.stringify(req.body.payload));

    const userQueueRecord = await getLatestActivityByRequestId(
      req.body.request_id
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
          userActivity.CreatedAssetUrl = req.body.payload.images[0].url;
          userActivity.AssetType = 'img';
          transaction.save({
            key: userActivityKey,
            data: userActivity
          });
          await transaction.commit();
          console.log('UserActivity updated successfully');
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
    res.status(400).json({ message: 'Invalid data received' });
    return;
  }

  res.status(200).json({ message: 'Data received successfully' });
}
