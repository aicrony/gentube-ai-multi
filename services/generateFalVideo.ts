import { fal, InProgressQueueStatus, QueueStatus } from '@fal-ai/client';
require('dotenv').config();

let apiEndpoint = process.env.KLING_API_ENDPOINT as string;
const apiTextToVideoEndpoint = process.env.KLING_API_TTV_ENDPOINT as string;
const falApiWebhook = process.env.FAL_API_WEBHOOK as string;
let result: any = null;
const callback = {
  webhook: falApiWebhook,
  response: result
};

export default async function generateFalVideo(
  imageUrl: string | undefined,
  description: string | undefined,
  loop?: boolean,
  duration?: string,
  aspectRatio?: string,
  motion?: string
) {
  try {
    if (
      process.env.FAL_VIDEO_TEST_MODE &&
      process.env.FAL_VIDEO_TEST_MODE === 'true'
    ) {
      console.log('Looping is: ' + loop);
      console.log('Motion is: ' + motion);
      console.log('Duration is: ' + duration);
      console.log('Aspect Ratio is: ' + aspectRatio);
      result = {
        status: 'IN_QUEUE',
        request_id: 'f3cdc601-9c51-4cc7-a961-23d3280599c2',
        response_url:
          'https://queue.fal.run/fal-ai/kling-video/requests/f3cdc601-9c51-4cc7-a961-23d3280599c2',
        status_url:
          'https://queue.fal.run/fal-ai/kling-video/requests/f3cdc601-9c51-4cc7-a961-23d3280599c2/status',
        cancel_url:
          'https://queue.fal.run/fal-ai/kling-video/requests/f3cdc601-9c51-4cc7-a961-23d3280599c2/cancel',
        logs: null,
        metrics: {},
        queue_position: 0
      };
    } else {
      // If motion is provided and not "Static", include it in the prompt
      let enhancedPrompt = description || '';
      if (motion && motion !== 'Static') {
        enhancedPrompt = `Camera will ${motion.toLowerCase()}. ${enhancedPrompt}`;
      }

      console.log('Enhanced prompt with motion:', enhancedPrompt);

      if (imageUrl == 'none') {
        apiEndpoint = apiTextToVideoEndpoint;
      }

      console.log('Input parameters:');
      console.log('- imageUrl:', imageUrl);
      console.log('- description:', description);
      console.log('- loop:', loop);
      console.log('- duration:', duration);
      console.log('- aspectRatio:', aspectRatio);
      console.log('- motion:', motion);
      console.log('- apiEndpoint:', apiEndpoint);

      if (
        process.env.FAL_VIDEO_TEST_MODE &&
        process.env.FAL_VIDEO_TEST_MODE == 'true'
      ) {
        callback.webhook = 'http://localhost:3000/testOnly';
        result = 'TEST ONLY';
      }

      result = await fal.queue.submit(apiEndpoint, {
        input: {
          prompt: enhancedPrompt,
          ...(imageUrl && imageUrl !== 'none' && { image_url: imageUrl }),
          duration: duration ? duration : '5', // 5,10 for Kling; 4,6 for Haiper
          aspect_ratio: aspectRatio ? aspectRatio : '16:9',
          ...(loop && { tail_image_url: imageUrl })
        },
        webhookUrl: falApiWebhook
      });
    }

    console.log('Webhook set: ', callback.webhook);
    console.log('Result: ', result);

    // Ensure result has necessary structure for tracking
    callback.response = result;

    // If result doesn't include a request_id in an expected format,
    // ensure we have one for tracking purposes
    if (result && typeof result === 'object') {
      if (!result.request_id) {
        // Try to extract request_id from response if nested structure
        if (result.status === 'IN_QUEUE' && !result.request_id) {
          // Generate a fallback if none exists at all
          console.log('Adding fallback request_id to result');
          result.request_id = `generated-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        }
      }
    }

    return callback;
  } catch (error) {
    console.error('An error occurred while generating the video:', error);
  }
}
