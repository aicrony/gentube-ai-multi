import { fal, InProgressQueueStatus, QueueStatus } from '@fal-ai/client';
require('dotenv').config();

const apiEndpoint = 'fal-ai/flux-pro/kontext/max';
const falApiWebhook =
  process.env.FAL_API_IMAGE_WEBHOOK ||
  process.env.FAL_API_WEBHOOK?.replace('falvideoresult', 'falimageresult') ||
  'https://gentube.ai/api/falimageresult';
const defaultSafetyTolerance = process.env.DEFAULT_SAFETY_TOLERANCE as string;

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
      console.log('- safety_tolerance:', defaultSafetyTolerance);

      // Use fal.subscribe for Flux Pro Kontext endpoint
      result = await fal.subscribe(apiEndpoint, {
        input: {
          prompt: editPrompt,
          image_url: imageUrl,
          safety_tolerance: defaultSafetyTolerance
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
      // Use the original request ID from the API response
      const requestId = result.requestId || `completed-${Date.now()}`;
      const imageUrl = result.data.images[0].url;
      const completedResult = {
        url: imageUrl,
        request_id: requestId,
        status: 'COMPLETED'
      };

      // Log the completed result for debugging
      console.log('Completed image edit result:', completedResult);

      // Make callback include the completed response
      callback.response = completedResult;
      
      // NOTE: We're no longer trying to update the datastore here
      // Instead, we're letting processUserImageEditRequest.ts handle the data saving
      // since it has the correct context for when to save the data
      
      return callback;
    } else {
      // If we don't get expected result structure, handle as an error
      const requestId = result.requestId || 
                      `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      
      // Create an error result - we're not going to use queues anymore
      const errorResult = {
        status: 'ERROR',
        request_id: requestId,
        error: 'Invalid response format from image edit API'
      };
      
      console.error('Failed to get proper response from image edit API:', result);
      
      // NOTE: We're no longer trying to update the datastore here
      // The processUserImageEditRequest.ts will handle setting the correct status

      callback.response = errorResult;
      return callback;
    }
  } catch (error) {
    console.error('An error occurred while editing the image:', error);
    
    // Create a unique request ID for this error
    const errorRequestId = `error-${Date.now()}`;
    
    // Create an error result to return
    const errorResult = {
      status: 'ERROR',
      request_id: errorRequestId,
      error: error instanceof Error ? error.message : 'Unknown error during image edit'
    };
    
    // We won't try to update the datastore here since we likely don't have a valid requestId
    // from the initial creation step that we could use to find the record
    
    // Create a new callback object since the original one may be undefined in this context
    return {
      webhook: falApiWebhook,
      response: errorResult
    };
  }
}
