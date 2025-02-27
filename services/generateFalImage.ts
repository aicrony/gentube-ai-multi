import { fal, InProgressQueueStatus, QueueStatus } from '@fal-ai/client';
require('dotenv').config();

const apiEndpoint = process.env.FLUX_API_ENDPOINT as string;
const falApiWebhook = process.env.FAL_IMAGE_API_WEBHOOK as string;
let result: any = null;
const callback = {
  webhook: falApiWebhook,
  response: result
};

interface GenerateFalImageParams {
  loop: boolean;
  description: string | undefined;
}
//   num_images?: 1;
//   enable_safety_checker?: true;
//   safety_tolerance?: '2';
//   output_format?: 'png';
//   aspect_ratio?: '16:9';

export default async function generateFalImage(
  loop: string,
  imagePrompt: string | undefined
) {
  try {
    if (
      process.env.FAL_VIDEO_TEST_MODE &&
      process.env.FAL_VIDEO_TEST_MODE === 'true'
    ) {
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
      result = await fal.queue.submit(apiEndpoint, {
        input: {
          prompt: imagePrompt,
          safety_tolerance: 3,
          output_format: 'png',
          aspect_ratio: '16:9'
        },
        webhookUrl: falApiWebhook
      });
    }

    console.log('Webhook set: ', callback.webhook);
    console.log('Result: ', result);
    callback.response = result;
    return callback;
  } catch (error) {
    console.error('An error occurred while generating the video:', error);
  }
}
