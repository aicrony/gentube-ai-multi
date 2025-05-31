import { fal, InProgressQueueStatus, QueueStatus } from '@fal-ai/client';
require('dotenv').config();

const apiEndpoint = 'fal-ai/flux-pro/kontext';
const falApiWebhook =
  process.env.FAL_API_IMAGE_WEBHOOK ||
  process.env.FAL_API_WEBHOOK?.replace('falvideoresult', 'falimageresult') ||
  'https://gentube.ai/api/falimageresult';

export default async function generateFalImageEdit(
  imageUrl: string,
  editPrompt: string
) {
  try {
    let result: any = null;
    const callback = {
      webhook: falApiWebhook,
      response: result
    };

    if (
      process.env.FAL_IMAGE_EDIT_TEST_MODE &&
      process.env.FAL_IMAGE_EDIT_TEST_MODE === 'true'
    ) {
      console.log('Running in test mode for image editing');
      result = {
        status: 'IN_QUEUE',
        request_id: 'test-edit-' + Date.now(),
        response_url: 'https://queue.fal.run/test-edit-response',
        status_url: 'https://queue.fal.run/test-edit-status',
        cancel_url: 'https://queue.fal.run/test-edit-cancel',
        logs: null,
        metrics: {},
        queue_position: 0
      };
    } else {
      console.log('Input parameters:');
      console.log('- imageUrl:', imageUrl);
      console.log('- editPrompt:', editPrompt);
      console.log('- apiEndpoint:', apiEndpoint);
      console.log('- webhook:', falApiWebhook);

      // Use fal.subscribe for Flux Pro Kontext endpoint
      result = await fal.subscribe(apiEndpoint, {
        input: {
          prompt: editPrompt,
          image_url: imageUrl
        },
        logs: true,
        onQueueUpdate: (update: QueueStatus) => {
          if (update.status === 'IN_PROGRESS') {
            (update as InProgressQueueStatus).logs
              .map((log: { message: string }) => log.message)
              .forEach(console.log);
          }
        }
      });
    }

    console.log('Webhook set: ', callback.webhook);
    console.log('Image edit result: ', result);

    // fal.subscribe returns the completed result directly, not a queue object
    // We need to structure this for compatibility with the processing function
    if (
      result &&
      result.data &&
      result.data.images &&
      result.data.images.length > 0
    ) {
      // Successful result - create a completed response structure
      const completedResult = {
        url: result.data.images[0].url,
        request_id: result.requestId || `completed-edit-${Date.now()}`,
        status: 'COMPLETED'
      };

      callback.response = completedResult;
      return callback;
    } else {
      // If we don't get expected result structure, create a queue-like response
      const queueResult = {
        status: 'IN_QUEUE',
        request_id:
          result.requestId ||
          `generated-edit-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        response_url: `https://queue.fal.run/${apiEndpoint}/requests/${result.requestId || 'unknown'}`,
        webhook: falApiWebhook
      };

      callback.response = queueResult;
      return callback;
    }
  } catch (error) {
    console.error('An error occurred while editing the image:', error);
    throw error;
  }
}
