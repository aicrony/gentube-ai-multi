import { fal, InProgressQueueStatus, QueueStatus } from '@fal-ai/client';
require('dotenv').config();

const apiEndpoint = process.env.KLING_API_ENDPOINT as string;
const falApiWebhook = process.env.FAL_API_WEBHOOK as string;
let result: any = null;
const callback = {
  webhook: falApiWebhook,
  response: result
};

export default async function generateFalVideo(
  url: string,
  description: string,
  // no looping capabilities in Kling as of 2/16/25
  duration: string,
  aspectRatio: string
) {
  try {
    result = await fal.queue.submit(apiEndpoint, {
      input: {
        prompt: description,
        image_url: url,
        duration: duration, // 5,10 for Kling; 4,6 for Haiper
        aspect_ratio: aspectRatio
      },
      webhookUrl: falApiWebhook
    });
    // console.log(result.data);
    // console.log(result.requestId);
    console.log('Webhook set: ', callback.webhook);
    console.log('Result: ', result);
    callback.response = result;
    return callback;
  } catch (error) {
    console.error('An error occurred while generating the video:', error);
  }
}
